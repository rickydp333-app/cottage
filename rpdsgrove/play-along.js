(function(){
  'use strict';
  const $=id=>document.getElementById(id), player=window.grovePlayer;
  const dialog=document.createElement('dialog');dialog.id='playAlong';dialog.setAttribute('aria-labelledby','paHeading');
  dialog.innerHTML=`<button class="close pa-close" id="paClose" aria-label="Close Play Along">×</button>
    <p class="eyebrow">HEAR IT. PLAY IT.</p><h2 id="paHeading">Play Along</h2>
    <p class="pa-subtitle">Find the chords. Follow the guitar. Experimental chord estimates, free on this device.</p>
    <div class="pa-sources" aria-label="Audio source"><button id="paLibrary" aria-pressed="true">♫ Current song</button><button id="paUpload" aria-pressed="false">↑ Upload a song</button><button id="paLive" aria-pressed="false">● Listen live</button></div>
    <label id="paFileLabel" hidden>Choose a recording<input class="pa-file" id="paFile" type="file" accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac,.aac"><span class="pa-legend">Up to 40 MB and 12 minutes. Files stay on this device.</span></label>
    <p id="paStatus" class="pa-status" role="status" aria-live="polite"></p><progress id="paProgress" max="1" hidden aria-label="Chord analysis progress"></progress>
    <div class="pa-grid"><div class="pa-guitar"><div id="paGuitar"></div><label>Guitar view <select id="paHand"><option value="right">Right-handed</option><option value="left">Left-handed</option></select></label><p class="pa-legend">Standard tuning · no capo<br>1 index · 2 middle · 3 ring · 4 pinky<br>○ open string · × do not play<br>A joined line means a barre.</p></div>
    <div class="pa-detail"><div class="pa-current"><span class="eyebrow">CURRENT CHORD</span><strong id="paChord">—</strong><p id="paQuality">Choose a song to begin.</p><p id="paNext">Next: —</p></div>
    <p id="paSource"></p><div class="pa-controls"><button class="primary" id="paAnalyze">Analyze song</button><button id="paCancel" hidden>Cancel analysis</button><button id="paMic" hidden>Start microphone</button><button id="paPlay" hidden>Play / pause</button><button id="paLoop" aria-pressed="false" hidden>Repeat chord</button></div>
    <audio id="paAudio" controls hidden preload="metadata"></audio><meter id="paMicLevel" min="0" max="0.15" value="0" hidden aria-label="Microphone input level"></meter>
    <div class="pa-edit" id="paEdit" hidden><label for="paCorrection">Correct this section</label><select id="paCorrection"></select></div><p class="pa-legend" id="paSaving"></p>
    <div class="pa-timeline" id="paTimeline" aria-label="Chord timeline"></div></div></div>
    <details><summary>How it works & tips</summary><p>Estimates the 24 major and minor chords. Seventh chords, unusual tunings, distortion, vocals and overlapping instruments can cause mistakes. “Uncertain” means there is no clear match. This is a practice aid, not an exact transcription.</p><p>The guitar shows a suggested way to play the chord, which may differ from the original guitarist’s fingering. Listen live works best with one guitar in a quiet room. It reacts after a short delay and cannot predict the next chord.</p><p>For uploads, use the audio controls to play or seek. For library songs, the existing player stays in sync. Tap a chord tile to jump to its section. Corrections for library songs stay in this browser; standalone uploads last until you close or change the source. Microphone audio is never recorded or sent anywhere, and stops when you close this panel or leave the page.</p></details>`;
  document.body.append(dialog);
  const entry=document.createElement('button');entry.id='playAlongButton';entry.textContent='♫ Play Along';entry.type='button';
  const actions=document.createElement('div');actions.className='playing-actions';const stop=$('stopPlayback');stop.before(actions);actions.append(entry,stop);
  const LIMIT=40*1024*1024, MAX_SECONDS=720;
  let mode='library',segments=[],index=-1,source=null,worker=null,abort=null,job=0,busy=false,objectUrl=null,stream=null,ctx=null,micTimer=null,micPending=false,micStarting=false,liveCandidate=null,liveCount=0,loop=false,loopIndex=-1,viewChord=null;
  let hand='right';try{hand=localStorage.getItem('grove:chord-hand')||'right';}catch{}
  $('paHand').value=hand==='left'?'left':'right';
  const validChords=GroveGuitar.names.flatMap(n=>[n,n+'m']);
  $('paCorrection').append(new Option('Uncertain / no chord',''),...validChords.map(c=>new Option(c,c)));
  const time=t=>{const tenths=Math.round(t*10),seconds=Math.floor(tenths/10);return Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0')+'.'+tenths%10;};
  function status(message,error=false){$('paStatus').textContent=message;$('paStatus').dataset.error=String(error);}
  function draw(chord,quality){viewChord=chord;$('paChord').textContent=chord||'—';$('paQuality').textContent=quality;$('paGuitar').innerHTML=GroveGuitar.svg(chord,$('paHand').value==='left');}
  function killJob(){job++;worker?.terminate();worker=null;abort?.abort();abort=null;busy=false;$('paProgress').hidden=true;$('paCancel').hidden=true;}
  function stopMic(){micStarting=false;clearInterval(micTimer);micTimer=null;stream?.getTracks().forEach(t=>t.stop());stream=null;ctx?.close().catch(()=>{});ctx=null;micPending=false;liveCandidate=null;liveCount=0;$('paMic').textContent='Start microphone';$('paMicLevel').value=0;}
  function clearUpload(){$('paAudio').pause();$('paAudio').removeAttribute('src');$('paAudio').load();if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=null;$('paFile').value='';}
  function reset(){killJob();stopMic();clearUpload();segments=[];index=-1;source=null;loop=false;loopIndex=-1;$('paLoop').setAttribute('aria-pressed','false');$('paTimeline').replaceChildren();$('paNext').textContent='Next: —';$('paSaving').textContent='';draw(null,'Choose a song to begin.');}
  function controls(){
    $('paAnalyze').hidden=mode!=='library'||busy;$('paMic').hidden=mode!=='live';$('paFileLabel').hidden=mode!=='upload';$('paAudio').hidden=mode!=='upload'||!objectUrl;$('paMicLevel').hidden=mode!=='live';
    $('paPlay').hidden=mode!=='library'||!segments.length;$('paLoop').hidden=mode==='live'||!segments.length||(mode==='library'&&player.isRemote());$('paEdit').hidden=!segments.length||index<0;$('paCancel').hidden=!busy;
    for(const [id,m] of [['paLibrary','library'],['paUpload','upload'],['paLive','live']])$(id).setAttribute('aria-pressed',String(mode===m));
  }
  function current(){return player.current();}
  function key(s){return 'grove:chords:v1:'+s.id+':'+(s.local?'local':s.url);}
  function loadCache(s){try{const cached=JSON.parse(localStorage.getItem(key(s)));if(!Array.isArray(cached)||!cached.length||cached.length>4000)return null;let end=0;for(const x of cached){if(!Number.isFinite(x.start)||!Number.isFinite(x.end)||x.start<end-.001||x.end<=x.start||x.end>MAX_SECONDS+1||!Number.isFinite(x.strength)||(x.chord!==null&&!validChords.includes(x.chord)))return null;end=x.end;}return cached;}catch{return null;}}
  function persist(){if(mode!=='library'||!source)return;try{const k=key(source);let recent=JSON.parse(localStorage.getItem('grove:chord-cache-keys')||'[]');if(!Array.isArray(recent))recent=[];recent=[k,...recent.filter(x=>typeof x==='string'&&x!==k)];for(const old of recent.slice(12))if(old.startsWith('grove:chords:v1:'))localStorage.removeItem(old);localStorage.setItem(k,JSON.stringify(segments));localStorage.setItem('grove:chord-cache-keys',JSON.stringify(recent.slice(0,12)));$('paSaving').textContent='Chord map saved on this device.';}catch{$('paSaving').textContent='Storage unavailable. This chord map is available for this session.';}}
  function timeline(){
    $('paTimeline').replaceChildren(...segments.map((s,i)=>{const b=document.createElement('button');b.type='button';b.textContent=s.chord||'—';const small=document.createElement('small');small.textContent=time(s.start);b.append(small);b.setAttribute('aria-label',(s.chord||'Uncertain')+' at '+time(s.start));b.onclick=()=>{loopIndex=i;seekTo(s.start+.03);show(i);};return b;}));
  }
  function show(i){if(i<0||!segments[i])return;if(index===i)return;index=i;const s=segments[i];draw(s.chord,s.corrected?'Your correction':!s.chord?'Uncertain / no clear chord':s.strength>.65?'Estimated chord · clearer match':'Estimated chord · check by ear');$('paCorrection').value=s.chord||'';$('paNext').textContent='Next: '+(segments[i+1]?(segments[i+1].chord||'Uncertain')+' · '+time(segments[i+1].start):'—');const tiles=$('paTimeline').children;for(let j=0;j<tiles.length;j++)tiles[j].setAttribute('aria-current',String(j===i));const tile=tiles[i];if(tile){const box=$('paTimeline');if(tile.offsetLeft<box.scrollLeft||tile.offsetLeft+tile.offsetWidth>box.scrollLeft+box.clientWidth)box.scrollLeft=tile.offsetLeft-box.offsetLeft-20;}$('paEdit').hidden=false;}
  function seekTo(t){if(mode==='upload')$('paAudio').currentTime=t;else player.seek(t);}
  function useLibrary(){source=current();$('paSource').textContent=source?source.title+' · '+source.genre+' · '+source.version:'No song selected';if(!source){status('Choose a song in your library, then open Play Along.');return;}segments=loadCache(source)||[];if(segments.length){timeline();status('Saved chord map ready. Play the song or tap a chord.');show(0);$('paAnalyze').textContent='Analyze again';}else{status('Analyze this song to build its chord timeline.');$('paAnalyze').textContent='Analyze song';}}
  function switchMode(next){reset();mode=next;if(mode==='library')useLibrary();else if(mode==='upload'){$('paSource').textContent='Your recording';status('Choose an audio file. Nothing is uploaded to a server.');}else{$('paSource').textContent='Live microphone';status('Tap Start microphone, then allow microphone access.');draw(null,'Waiting for microphone');}controls();}
  async function readAudio(response,signal){if(!response.ok)throw Error('The song could not be downloaded. Try again, or use Upload a song.');if(Number(response.headers.get('content-length'))>LIMIT)throw Error('Choose a recording smaller than 40 MB.');const reader=response.body?.getReader();if(!reader){const b=await response.arrayBuffer();if(b.byteLength>LIMIT)throw Error('Choose a recording smaller than 40 MB.');return b;}const chunks=[];let total=0;while(true){const {done,value}=await reader.read();if(done)break;if(signal.aborted)throw new DOMException('Cancelled','AbortError');total+=value.length;if(total>LIMIT){await reader.cancel();throw Error('Choose a recording smaller than 40 MB.');}chunks.push(value);}const all=new Uint8Array(total);let pos=0;for(const chunk of chunks){all.set(chunk,pos);pos+=chunk.length;}return all.buffer;}
  async function analyze(file){
    killJob();stopMic();const id=job;segments=[];index=-1;timeline();draw(null,'Analyzing recording…');controls();
    if(!file){source=current();if(!source){status('Choose a library song first.',true);return;}}
    else source={title:file.name};
    busy=true;controls();$('paProgress').hidden=false;$('paProgress').removeAttribute('value');status('Reading audio…');abort=new AbortController();
    try{
      if(file&&(!file.size||file.size>LIMIT))throw Error('Choose a non-empty audio file smaller than 40 MB.');
      const bytes=file?await file.arrayBuffer():await readAudio(await fetch(source.url,{signal:abort.signal}),abort.signal);
      if(id!==job)return;
      const Offline=window.OfflineAudioContext||window.webkitOfflineAudioContext;
      if(!Offline)throw Error('Audio analysis is unavailable in this browser. Try an updated Chrome, Edge or Safari.');
      status('Decoding audio…');const decoder=new Offline(1,1,11025);let decoded;
      try{decoded=await decoder.decodeAudioData(bytes);}catch{throw Error('This audio format could not be read. Try MP3 or WAV.');}
      if(id!==job)return;if(decoded.duration>MAX_SECONDS)throw Error('Choose a recording no longer than 12 minutes.');
      const samples=new Float32Array(decoded.length);for(let c=0;c<decoded.numberOfChannels;c++){const channel=decoded.getChannelData(c);for(let i=0;i<samples.length;i++)samples[i]+=channel[i]/decoded.numberOfChannels;}
      worker=new Worker('chord-worker.js?v=1');worker.onerror=()=>fail('The audio analyzer could not start. Refresh and try again.');
      function fail(message){if(id!==job)return;killJob();controls();draw(null,'No analysis available');status(message,true);}
      worker.onmessage=({data})=>{if(id!==job)return;if(data.type==='progress'){$('paProgress').value=data.value;status('Finding chords… '+Math.round(data.value*100)+'%');}else if(data.type==='error')fail(data.message);else if(data.type==='done'){
        segments=data.segments;worker.terminate();worker=null;busy=false;abort=null;$('paProgress').hidden=true;timeline();index=-1;show(0);persist();controls();const known=segments.filter(s=>s.chord).reduce((n,s)=>n+s.end-s.start,0),total=segments.at(-1)?.end||1;status(known<total*.2?'Analysis complete, but few clear chords were found. Try a cleaner guitar recording or correct sections by ear.':'Ready. Chords are estimates; uncertain sections need checking by ear.');$('paAnalyze').textContent='Analyze again';
      }};
      worker.postMessage({type:'analyze',samples,sampleRate:decoded.sampleRate},[samples.buffer]);
    }catch(e){if(id!==job)return;killJob();controls();draw(null,'No analysis available');status(e.name==='AbortError'?'Analysis cancelled.':e.message||'Could not read this song. Try uploading its audio file.',true);}
  }
  async function startMic(){
    if(stream||micStarting){killJob();stopMic();draw(null,'Microphone stopped');status('Microphone stopped.');return;}
    if(player.isRemote()){status('Return playback to this device before starting the microphone.',true);return;}
    if(!navigator.mediaDevices?.getUserMedia){status('Microphone access is unavailable here. Open this HTTPS site in Chrome, Edge or Safari.',true);return;}
    killJob();const id=job;micStarting=true;$('paMic').textContent='Cancel microphone';status('Waiting for microphone permission…');
    try{
      const Audio=window.AudioContext||window.webkitAudioContext;ctx=new Audio();await ctx.resume();if(id!==job||!dialog.open)return;
      const acquired=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false},video:false});
      if(id!==job||!dialog.open){acquired.getTracks().forEach(t=>t.stop());return;}
      stream=acquired;micStarting=false;player.pauseLocal();$('paAudio').pause();const input=ctx.createMediaStreamSource(stream),analyzer=ctx.createAnalyser();analyzer.fftSize=32768;input.connect(analyzer);
      worker=new Worker('chord-worker.js?v=1');worker.onerror=()=>{if(id!==job)return;killJob();stopMic();status('Microphone analysis failed. Please try again.',true);};
      worker.onmessage=({data})=>{micPending=false;if(id!==job)return;if(data.type==='error'){killJob();stopMic();status(data.message,true);return;}if(data.type!=='live')return;const r=data.result;$('paMicLevel').value=r.rms;
        if(r.chord===liveCandidate)liveCount++;else{liveCandidate=r.chord;liveCount=1;}if(liveCount>=2||r.rms<.002)draw(r.rms<.002?null:r.chord,r.rms<.002?'Listening… play a chord':!r.chord?'Uncertain · try a clearer chord':r.strength>.65?'Estimated chord · clearer match':'Estimated chord · check by ear');
      };
      for(const track of stream.getTracks())track.onended=()=>{killJob();stopMic();draw(null,'Microphone disconnected');status('Microphone disconnected.');};
      micTimer=setInterval(()=>{if(micPending||!ctx||ctx.state!=='running')return;const raw=new Float32Array(32768);analyzer.getFloatTimeDomainData(raw);const samples=new Float32Array(8192);for(let i=0;i<8192;i++)samples[i]=(raw[i*4]+raw[i*4+1]+raw[i*4+2]+raw[i*4+3])/4;micPending=true;worker.postMessage({type:'live',samples,sampleRate:ctx.sampleRate/4},[samples.buffer]);},300);
      $('paMic').textContent='Stop microphone';status('Listening on this device. Play one chord at a time.');
    }catch(e){if(id!==job)return;killJob();stopMic();const denied=e.name==='NotAllowedError';status(denied?'Microphone permission was denied. Allow it in your browser’s site settings, then try again.':e.name==='NotFoundError'?'No microphone found. Connect one and try again.':'Microphone could not start. Check that another app is not using it.',true);}
  }
  entry.onclick=()=>{dialog.showModal();switchMode('library');};$('paClose').onclick=()=>dialog.close();dialog.addEventListener('close',()=>reset());
  $('paLibrary').onclick=()=>switchMode('library');$('paUpload').onclick=()=>switchMode('upload');$('paLive').onclick=()=>switchMode('live');$('paMic').onclick=startMic;
  $('paAnalyze').onclick=()=>analyze();$('paCancel').onclick=()=>{killJob();status('Analysis cancelled.');draw(null,'Analysis cancelled');controls();};
  $('paFile').onchange=()=>{const file=$('paFile').files[0];if(!file)return;if(player.isRemote()){status('Return playback to this device before playing an uploaded recording.',true);return;}clearUpload();objectUrl=URL.createObjectURL(file);$('paAudio').src=objectUrl;$('paSource').textContent=file.name;controls();analyze(file);};
  $('paAudio').addEventListener('play',()=>player.pauseLocal());$('paAudio').addEventListener('error',()=>status('This recording cannot play in this browser. Try MP3 or WAV.',true));
  $('paPlay').onclick=()=>player.toggle();$('paLoop').onclick=()=>{loop=!loop;loopIndex=index;$('paLoop').setAttribute('aria-pressed',String(loop));};
  $('paHand').onchange=()=>{try{localStorage.setItem('grove:chord-hand',$('paHand').value);}catch{}draw(viewChord,$('paQuality').textContent);};
  $('paCorrection').onchange=()=>{if(index<0)return;const i=index;segments[i].chord=$('paCorrection').value||null;segments[i].corrected=true;persist();timeline();index=-1;show(i);};
  setInterval(()=>{
    if(!dialog.open||mode==='live')return;
    if(mode==='library'&&source?.id!==current()?.id){switchMode('library');return;}
    if(!segments.length)return;
    const t=mode==='upload'?$('paAudio').currentTime:player.position();
    if(loop&&segments[loopIndex]&&t>=segments[loopIndex].end-.03){seekTo(segments[loopIndex].start+.03);show(loopIndex);return;}
    const i=segments.findIndex(s=>t>=s.start&&t<s.end);if(i>=0)show(i);
  },200);
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&(stream||micStarting)){killJob();stopMic();draw(null,'Microphone stopped');status('Microphone stopped while the page is in the background.');}});
  window.addEventListener('pagehide',()=>{killJob();stopMic();clearUpload();});
  draw(null,'Choose a song to begin.');
})();
