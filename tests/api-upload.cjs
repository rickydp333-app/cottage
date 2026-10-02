const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const net=require('node:net');
const {spawn}=require('node:child_process');

let tempRoot,origin,server,webRoot,privateRoot;

async function freePort(){
 const socket=net.createServer();
 await new Promise((resolve,reject)=>socket.once('error',reject).listen(0,'127.0.0.1',resolve));
 const {port}=socket.address();
 await new Promise(resolve=>socket.close(resolve));
 return port;
}

function wavFixture(){
 const pcm=Buffer.alloc(1600);
 const header=Buffer.alloc(44);
 header.write('RIFF',0);header.writeUInt32LE(36+pcm.length,4);header.write('WAVE',8);
 header.write('fmt ',12);header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);
 header.writeUInt16LE(1,22);header.writeUInt32LE(8000,24);header.writeUInt32LE(16000,28);
 header.writeUInt16LE(2,32);header.writeUInt16LE(16,34);header.write('data',36);
 header.writeUInt32LE(pcm.length,40);
 return Buffer.concat([header,pcm]);
}

before(async()=>{
 tempRoot=await fs.mkdtemp(path.join(os.tmpdir(),'grove-api-test-'));
 webRoot=path.join(tempRoot,'www');const appRoot=path.join(webRoot,'rpdsgrove');
 await fs.mkdir(appRoot,{recursive:true});
 await fs.mkdir(path.join(tempRoot,'private-tmp'));
 privateRoot=path.join(tempRoot,'persistent-private');
 await fs.copyFile(path.join(__dirname,'../rpdsgrove/api.php'),path.join(appRoot,'api.php'));
 const port=await freePort();origin='http://127.0.0.1:'+port;
 const php=process.env.PHP_CLI||'php';
 server=spawn(php,['-d','sys_temp_dir='+path.join(tempRoot,'private-tmp'),'-S','127.0.0.1:'+port,'-t',webRoot],{stdio:'ignore',env:{...process.env,RPDGROVE_PRIVATE_DIR:privateRoot}});
 for(let attempt=0;attempt<100;attempt++){
  if(server.exitCode!==null)throw Error('PHP server exited before startup. Set PHP_CLI to the PHP executable path.');
  try{await fetch(origin+'/rpdsgrove/api.php');break;}catch{await new Promise(resolve=>setTimeout(resolve,50));}
 }
});

after(async()=>{
 if(server&&!server.killed){server.kill();await new Promise(resolve=>server.once('exit',resolve));}
 if(tempRoot)await fs.rm(tempRoot,{recursive:true,force:true});
});

test('audio uploads return a same-origin URL that streams and supports byte ranges',async()=>{
 const form=new FormData();
 form.append('action','upload');
 form.append('file',new Blob([wavFixture()],{type:'audio/wav'}),'practice.wav');
 const response=await fetch(origin+'/rpdsgrove/api.php',{method:'POST',headers:{Origin:origin},body:form});
 assert.equal(response.status,200,await response.clone().text());
 const result=await response.json();
 assert.equal(result.ok,true);
 assert.match(result.url,new RegExp('^'+origin.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')+'/rpdsgrove/api\\.php\\?action=media&id=[a-f0-9]{48}$'));
 const media=await fetch(result.url);
 assert.equal(media.status,200);
 assert.equal(media.headers.get('content-type'),'audio/wav');
 assert.deepEqual(Buffer.from(await media.arrayBuffer()),wavFixture());
 const range=await fetch(result.url,{headers:{Range:'bytes=0-3'}});
 assert.equal(range.status,206);
 assert.equal(range.headers.get('content-range'),'bytes 0-3/'+wavFixture().length);
 assert.deepEqual(Buffer.from(await range.arrayBuffer()),wavFixture().subarray(0,4));
 assert.deepEqual(await fs.readdir(path.join(webRoot,'rpdsgrove')),['api.php'],'uploaded audio must not be written under the deployable web root');
});

test('unsupported files are rejected before they enter private storage',async()=>{
 const form=new FormData();
 form.append('action','upload');
 form.append('file',new Blob(['not audio'],{type:'application/octet-stream'}),'script.php');
 const response=await fetch(origin+'/rpdsgrove/api.php',{method:'POST',body:form});
 assert.equal(response.status,415);
 assert.match((await response.json()).error,/Use an MP3, WAV, M4A, OGG, FLAC, or AAC/);
});

test('listening rooms require owner tokens and accept only issued local media URLs',async()=>{
 const create=await fetch(origin+'/rpdsgrove/api.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'create'})});
 assert.equal(create.status,200);
 const room=await create.json();
 const unauth=await fetch(origin+'/rpdsgrove/api.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'heartbeat',room:room.room,token:'wrong'})});
 assert.equal(unauth.status,403);
 const form=new FormData();form.append('action','upload');form.append('file',new Blob([wavFixture()],{type:'audio/wav'}),'remote.wav');
 const upload=await fetch(origin+'/rpdsgrove/api.php',{method:'POST',body:form});const media=await upload.json();
 const song={id:'local-test',title:'Remote practice',genre:'Local file',version:'Available on speakers',remoteUrl:media.url,mime:media.mime};
 const heartbeat=await fetch(origin+'/rpdsgrove/api.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'heartbeat',room:room.room,token:room.token,status:{song,title:song.title}})});
 assert.equal(heartbeat.status,200);
 const status=await fetch(origin+'/rpdsgrove/api.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'status',room:room.room})});
 const current=(await status.json()).status.song;
 assert.equal(current.url,media.url);assert.equal(current.mime,'audio/wav');
 const invalid=await fetch(origin+'/rpdsgrove/api.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'command',room:room.room,type:'play',song:{...song,remoteUrl:'https://attacker.invalid/audio.mp3'}})});
 assert.equal(invalid.status,400);
 for(let index=1;index<10;index++){
  const allowed=await fetch(origin+'/rpdsgrove/api.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'create'})});
  assert.equal(allowed.status,200);
 }
 const limited=await fetch(origin+'/rpdsgrove/api.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'create'})});
 assert.equal(limited.status,429);
});