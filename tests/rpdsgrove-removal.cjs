// Run with: node --test tests/rpdsgrove-removal.cjs (requires playwright and Chrome).
const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
let server,browser,origin;
before(async()=>{
 const root=path.resolve(__dirname,'..');
 server=http.createServer(async(req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const file=path.join(root,pathname.endsWith('/')?pathname+'index.html':pathname);
  try{const content=await fs.readFile(file);res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':'text/html');res.end(content)}catch{res.writeHead(404);res.end()}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 origin='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({channel:'chrome',headless:true});
});
after(async()=>{await browser?.close();await new Promise(resolve=>server.close(resolve))});
async function setup(t,mobile=false){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:900},serviceWorkers:'block'});
 t.after(()=>context.close());
 const page=await context.newPage();
 await page.route('https://**/*',route=>route.abort());
 await page.goto(origin+'/rpdsgrove/');
 await page.waitForFunction(()=>state.songs.length===8);
 return page;
}
async function seed(page,local=false){
 return page.evaluate(async local=>{
  const s=local?localSong({id:'local-test',name:'Local test.wav',file:new Blob(['audio'],{type:'audio/wav'})}):state.songs[0];
  if(local){await fileStore('put',{id:s.id,name:'Local test.wav',file:new Blob(['audio'])});state.songs.push(s)}
  state.favorites=[s.id];state.history=[s.id];state.queue=[s.id,s.id,state.songs[1].id];state.playlists=[{id:'test',name:'Test',songs:[s.id,s.id,state.songs[1].id]}];
  for(const key of ['favorites','history','playlists'])save(key,state[key]);render();return {id:s.id,title:s.title};
 },local);
}
async function confirm(page,s){await page.getByRole('button',{name:'Remove '+s.title+' from library',exact:true}).first().click();await page.locator('#confirmRemoveSong').click();await page.waitForFunction(()=>!document.querySelector('#removeSongDialog').open)}
test('Cancel and Escape preserve the library; confirmation removes bundled song and references after reload',async t=>{
 const page=await setup(t);const s=await seed(page);
 await page.getByRole('button',{name:'Remove '+s.title+' from library',exact:true}).first().click();
 assert.ok((await page.locator('#removeSongName').textContent()).startsWith(s.title));
 assert.equal(await page.locator('#cancelRemoveSong').evaluate(n=>n===document.activeElement),true);
 await page.locator('#cancelRemoveSong').click();assert.equal(await page.evaluate(id=>!!getSong(id),s.id),true);
 await page.getByRole('button',{name:'Remove '+s.title+' from library',exact:true}).first().click();await page.keyboard.press('Escape');
 assert.equal(await page.evaluate(id=>state.favorites.includes(id),s.id),true);
 await confirm(page,s);
 assert.equal(await page.evaluate(id=>[state.songs.map(s=>s.id),state.favorites,state.history,state.queue,...state.playlists.map(p=>p.songs)].some(a=>a.includes(id)),s.id),false);
 await page.reload();await page.waitForFunction(()=>state.songs.length===7);
 assert.equal(await page.evaluate(id=>!!getSong(id)||state.playlists.some(p=>p.songs.includes(id)),s.id),false);
});
test('local removal deletes only browser copy, revokes URL and stops current playback',async t=>{
 const page=await setup(t);const s=await seed(page,true);
 await page.evaluate(id=>{state.current=getSong(id);audio.src=state.current.url;stopped=false;render();updatePlayer()},s.id);
 await confirm(page,s);
 assert.deepEqual(await page.evaluate(async()=>({rows:(await fileStore('getAll')).length,current:state.current,src:audio.getAttribute('src'),urls:localUrls.size,stopped})),{rows:0,current:null,src:null,urls:0,stopped:true});
 assert.equal(await page.locator('#playingSong').textContent(),'No song playing');
 await page.evaluate(()=>importFiles([new File(['replacement'],'Again.wav',{type:'audio/wav'})]));
 assert.equal(await page.evaluate(()=>state.songs.filter(s=>s.local).length),1);
});
test('added SoundBreak link is removed from persistent added catalog',async t=>{
 const page=await setup(t);
 const s=await page.evaluate(()=>{const song={...state.songs[0],id:'added-test',title:'Added test',version:'Added song'};state.songs.push(song);save('added',[song]);render();return song});
 await confirm(page,s);assert.deepEqual(await page.evaluate(()=>read('added',[])),[]);
 await page.reload();await page.waitForFunction(()=>state.songs.length===8);
});
test('storage failures keep song, references and playback intact',async t=>{
 const page=await setup(t);const s=await seed(page,true);
 await page.evaluate(()=>{fileStore=async()=>{throw Error('IDB failure')}});
 await page.getByRole('button',{name:'Remove '+s.title+' from library',exact:true}).first().click();await page.locator('#confirmRemoveSong').click();
 await page.waitForFunction(()=>document.querySelector('#removeSongError').textContent.includes('Could not'));
 assert.equal(await page.evaluate(id=>!!getSong(id)&&state.favorites.includes(id)&&!read('removed',[]).includes(id),s.id),true);
 await page.locator('#cancelRemoveSong').click();
 await page.evaluate(()=>{Storage.prototype.setItem=function(){throw Error('Quota')}});
 await page.getByRole('button',{name:'Remove '+s.title+' from library',exact:true}).first().click();await page.locator('#confirmRemoveSong').click();
 await page.waitForFunction(()=>document.querySelector('#removeSongError').textContent.includes('Could not'));
 assert.equal(await page.evaluate(id=>!!getSong(id),s.id),true);
});
test('removal during Cast load cannot restore history or metadata when load completes',async t=>{
 const page=await setup(t);const s=await seed(page);
 await page.evaluate(id=>{
  window.chrome={cast:{media:{MediaInfo:function(){},MusicTrackMediaMetadata:function(){},LoadRequest:function(){}},Image:function(){}}};
  window.stopCalls=0;castController={stop:()=>window.stopCalls++};
  state.cast={loadMedia:()=>new Promise(resolve=>window.finishLoad=resolve),getCastDevice:()=>({friendlyName:'Test speaker'})};
  window.playDone=play(getSong(id));
 },s.id);
 await confirm(page,s);await page.evaluate(async()=>{finishLoad();await playDone});
 assert.equal(await page.evaluate(id=>state.current===null&&!state.history.includes(id)&&stopCalls>=1&&stopped,s.id),true);
});
test('remote commands cannot delete or resurrect a removed host song',async t=>{
 const page=await setup(t);const s=await seed(page);const song=await page.evaluate(id=>getSong(id),s.id);
 await confirm(page,s);
 await page.evaluate(async song=>{state.host={code:'test',token:'test'};api=async()=>({commands:[{id:1,type:'enqueue',song},{id:2,type:'play',song},{id:3,type:'removeSong',song:state.songs[0]}]});await poll()},song);
 assert.equal(await page.evaluate(id=>!getSong(id)&&!state.queue.includes(id)&&state.songs.length===7,s.id),true);
 await page.evaluate(()=>{state.host=null;state.remote={code:'test'};render()});
 assert.equal(await page.locator('.remove-song').count(),0);
});
test('mobile Remove target is touch sized and dialog stays within viewport',async t=>{
 const page=await setup(t,true);const s=await seed(page);
 const target=page.getByRole('button',{name:'Remove '+s.title+' from library',exact:true}).first();
 const box=await target.boundingBox();assert.ok(box.width>=44&&box.height>=44);
 await target.click();const dialog=await page.locator('#removeSongDialog').boundingBox();assert.ok(dialog.x>=0&&dialog.x+dialog.width<=390);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
});
test('Spotify links persist, open an embed and are removed from the local catalog',async t=>{
 const page=await setup(t);
 await page.locator('#addButton').click();
 await page.locator('#spotifyTitle').fill('Test track');
 await page.locator('#spotifyUrl').fill('https://open.spotify.com/track/abc123');
 await page.locator('#addSpotifyButton').click();
 await page.waitForFunction(()=>state.songs.length===9);
 await page.reload();
 await page.waitForFunction(()=>state.songs.length===9);
 const song=await page.evaluate(()=>state.songs.find(item=>item.spotify));
 await page.getByRole('button',{name:'Play Test track Spotify Open in Spotify',exact:true}).click();
 assert.equal(await page.locator('#spotifyEmbedFrame').getAttribute('src'),'https://open.spotify.com/embed/track/abc123?utm_source=generator');
 await page.locator('#spotifyEmbedDialog button.close').click();
 await page.getByRole('button',{name:'Remove Test track from library',exact:true}).click();
 await page.locator('#confirmRemoveSong').click();
 await page.waitForFunction(()=>!document.querySelector('#removeSongDialog').open);
 assert.equal(await page.evaluate(id=>read('spotify-songs',[]).some(item=>item.id===id),song.id),false);
});
test('local audio remains in browser storage until a remote command needs a server copy',async t=>{
 const page=await setup(t);let uploads=0;
 const mediaUrl=await page.evaluate(()=>location.origin+'/rpdsgrove/api.php?action=media&id='+'ab'.repeat(24));
 await page.route('**/api.php',async route=>{uploads++;await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,url:mediaUrl,mime:'audio/wav',expires:Math.floor(Date.now()/1000)+86400})})});
 await page.evaluate(()=>importFiles([new File(['local recording'],'practice.wav',{type:'audio/wav'})]));
 assert.equal(uploads,0,'import must stay local');
 const id=await page.evaluate(()=>state.songs.find(song=>song.local).id);
 await page.evaluate(async id=>{state.remote={code:'a'.repeat(24)};api=async(_action,data)=>{window.remoteSong=data.song;return {ok:true}};await command('play',{song:getSong(id),queue:[]})},id);
 assert.equal(uploads,1);
 assert.equal(await page.evaluate(async id=>(await fileStore('get',id)).remoteUrl, id),mediaUrl);
 assert.equal(await page.evaluate(()=>window.remoteSong.remoteUrl),mediaUrl);
 assert.equal(await page.evaluate(()=>window.remoteSong.mime),'audio/wav');
 await page.evaluate(id=>{state.remote={code:'a'.repeat(24)};window.remoteCommands=[];api=async(action,data)=>{window.remoteCommands.push({action,data});return {ok:true}};render()},id);
 await page.getByRole('button',{name:'Add practice to queue',exact:true}).click();
 assert.equal(await page.evaluate(()=>window.remoteCommands.at(-1).data.type),'enqueue');
 assert.equal(await page.evaluate(()=>window.remoteCommands.at(-1).data.song.remoteUrl),mediaUrl);
});
