const {JSDOM}=require('jsdom'),fs=require('fs'),assert=require('node:assert/strict');
const path=require('node:path');
const root=path.resolve(__dirname,'../rpdsgrove');
const tick=()=>new Promise(r=>setImmediate(r));
(async()=>{
const dom=new JSDOM('<body><div><button id="stopPlayback">Stop</button></div></body>',{url:'http://localhost/',runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window;
w.HTMLMediaElement.prototype.pause=function(){};w.HTMLMediaElement.prototype.load=function(){};
w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
let current={id:'test',url:'https://audio.soundbreak.ai/a/b.mp3',title:'Test',genre:'Fixture',version:'1'},pos=0;
w.grovePlayer={current:()=>current,position:()=>pos,seek:t=>pos=t,toggle:()=>{},isRemote:()=>false,pauseLocal:()=>{}};
let stopped=0,closed=0,pendingResolve,deny=false;
Object.defineProperty(w.navigator,'mediaDevices',{value:{getUserMedia:()=>deny?Promise.reject(Object.assign(Error(),{name:'NotAllowedError'})):new Promise(r=>pendingResolve=r)}});
class AudioContext {state='running';sampleRate=48000;async resume(){} async close(){closed++;}createMediaStreamSource(){return {connect(){}};}createAnalyser(){return {getFloatTimeDomainData(a){a.fill(0);}};}}
w.AudioContext=AudioContext;
class Worker {static all=[];constructor(){Worker.all.push(this);}postMessage(){}terminate(){this.dead=true;}}
w.Worker=Worker;
let openedSheet;w.GroveSongSheet={open:x=>{openedSheet=x;}};
for(const file of ['chord-theory.js','guitar-voicings.js','guitar.js'])w.eval(fs.readFileSync(path.join(root,file),'utf8'));w.eval(fs.readFileSync(path.join(root,'play-along.js'),'utf8'));
const $=id=>w.document.getElementById(id),click=id=>$(id).click();
click('playAlongButton');click('paLive');click('paMic');await tick();assert.match($('paStatus').textContent,/permission/);
click('paClose');pendingResolve({getTracks:()=>[{stop(){stopped++;}}]});await tick();assert.equal(stopped,1,'late permission must release microphone');assert.equal(closed,1);
click('playAlongButton');click('paLive');deny=true;click('paMic');await tick();assert.match($('paStatus').textContent,/denied/);assert.equal($('paMic').textContent,'Start microphone');
deny=false;click('paMic');await tick();const track={stop(){stopped++;}};pendingResolve({getTracks:()=>[track]});await tick();assert.match($('paStatus').textContent,/Listening on this device/);
const worker=Worker.all.at(-1);worker.onmessage({data:{type:'live',result:{chord:'C',rms:.1,strength:.8}}});worker.onmessage({data:{type:'live',result:{chord:'C',rms:.1,strength:.8}}});assert.equal($('paChord').textContent,'C');
click('paUpload');assert.equal(stopped,2);assert(worker.dead);assert.equal($('paChord').textContent,'—');
// Cache restore, correction, handedness, and source changes.
const key='grove:chords:v2:test:https://audio.soundbreak.ai/a/b.mp3';w.localStorage.setItem(key,JSON.stringify([{start:0,end:2,chord:'C',strength:.8},{start:2,end:4,chord:'G',strength:.8}]));
click('paLibrary');assert.equal($('paChord').textContent,'C');$('paTimeline').children[1].click();assert(pos>2);assert.equal($('paChord').textContent,'G');
$('paCorrection').value='Am';$('paCorrection').dispatchEvent(new w.Event('change'));assert.equal(JSON.parse(w.localStorage.getItem(key))[1].chord,'Am');
click('paSongSheet');assert.equal(openedSheet.segments[1].chord,'Am');assert.equal(openedSheet.segments.length,2);
$('paHand').value='left';$('paHand').dispatchEvent(new w.Event('change'));assert.equal(w.localStorage.getItem('grove:chord-hand'),'left');
click('paClose');click('playAlongButton');assert.equal($('paTimeline').children[1].firstChild.textContent,'Am');
// Detailed labels describe actual chord notes, and imported charts are validated.
$('paTimeline').children[1].click();$('paCorrection').value='Cmaj7';$('paCorrection').dispatchEvent(new w.Event('change'));assert.match($('paNotes').textContent,/C major seventh · Notes: C · E · G · B/);
const chart={format:'grove-chords',version:2,title:'Test',sourceKey:'test:https://audio.soundbreak.ai/a/b.mp3',duration:4,segments:[{start:0,end:2,chord:'C/E'},{start:2,end:4,chord:'G7'}]};
Object.defineProperty($('paChartFile'),'files',{configurable:true,value:[{size:200,text:async()=>JSON.stringify(chart)}]});await $('paChartFile').onchange();assert.match($('paStatus').textContent,/Imported chart ready/);assert.match($('paNotes').textContent,/Bass: E/);assert.equal($('paCorrection').value,'C/E');
chart.segments[1].chord='<img onerror=alert(1)>';await $('paChartFile').onchange();assert.match($('paStatus').textContent,/invalid/);assert.equal($('paTimeline').children[1].firstChild.textContent,'G7');
chart.segments[1].chord='G7';chart.sourceKey='other';await $('paChartFile').onchange();assert.match($('paStatus').textContent,/different recording/);
current={id:'new',url:'https://audio.soundbreak.ai/c/d.mp3',title:'New',genre:'Test',version:'2'};await new Promise(r=>setTimeout(r,250));assert.equal($('paTimeline').children.length,0);assert.match($('paSource').textContent,/New/);
click('paClose');click('songSheetShortcut');assert.equal(openedSheet.source.id,'test','finished song remains available after player advances');assert.equal(openedSheet.segments[1].chord,'G7');
dom.window.close();console.log('PASS: delayed microphone permission after close, permission denial, live detection, track/worker cleanup, cache restore, correction persistence, left-hand preference, source change.');
})().catch(e=>{console.error(e);process.exit(1)});
