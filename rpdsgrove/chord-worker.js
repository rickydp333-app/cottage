'use strict';
importScripts('chord-engine.js?v=1');
self.onmessage=async({data})=>{
  try {
    if(data.type==='live')postMessage({type:'live',result:GroveChords.detect(data.samples,data.sampleRate)});
    else {
      importScripts('vendor/chordino/chordino.js?v=2','chordino-analyzer.js?v=2');
      const segments=await GroveDetailed.analyze(data.samples,data.sampleRate,(value,phase)=>postMessage({type:'progress',value,phase}));
      postMessage({type:'done',segments});
    }
  } catch {postMessage({type:'error',message:'This recording could not be analyzed. Try a shorter MP3 or WAV file.'});}
};
