'use strict';
importScripts('chord-engine.js?v=1');
self.onmessage=({data})=>{
  try {
    if(data.type==='live')postMessage({type:'live',result:GroveChords.detect(data.samples,data.sampleRate)});
    else {
      const segments=GroveChords.analyze(data.samples,data.sampleRate,value=>postMessage({type:'progress',value}));
      postMessage({type:'done',segments});
    }
  } catch {postMessage({type:'error',message:'This recording could not be analyzed. Try a shorter MP3 or WAV file.'});}
};
