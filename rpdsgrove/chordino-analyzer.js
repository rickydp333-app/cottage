// GPL-2.0-or-later: browser/Node host for the bundled Chordino worker.
(function(root){
  'use strict';
  const factory=typeof module!=='undefined'?require('./vendor/chordino/chordino.js'):root.createChordino;
  async function analyze(samples,sampleRate,progress=()=>{}){
    if(!(samples instanceof Float32Array)||!samples.length||samples.length/sampleRate>721)throw Error('Choose audio up to 12 minutes long.');
    const mod=await factory({print:()=>{},printErr:()=>{}});
    // Preserve the upstream 46 ms hop and 372 ms spectral window at 22.05 kHz.
    const size=sampleRate===22050?8192:16384,hop=sampleRate===22050?1024:2048;
    if(!mod._grove_begin(sampleRate,hop,size))throw Error('Could not initialize detailed chord analysis.');
    const ptr=mod._malloc(size*4);if(!ptr)throw Error('Not enough memory for this recording.');
    try{
      const block=new Float32Array(size);
      for(let center=0;center<samples.length;center+=hop){
        block.fill(0);const start=center-size/2;
        block.set(samples.subarray(Math.max(0,start),Math.min(samples.length,start+size)),Math.max(0,-start));
        mod.HEAPF32.set(block,ptr/4);mod._grove_frame(ptr,center);
        if(center%(hop*32)===0)progress(.4*center/samples.length,'Reading harmony');
      }
      progress(.45,'Refining the chord sequence');
      const count=mod._grove_finish(),duration=samples.length/sampleRate,points=[];
      for(let i=0;i<count;i++){
        const time=Math.max(0,Math.min(duration,mod._grove_time(i))),label=mod.UTF8ToString(mod._grove_label(i));
        const chord=label==='N'?null:label;
        if(points.length&&points.at(-1).start===time)points[points.length-1]={start:time,chord};
        else points.push({start:time,chord});
      }
      if(!points.length||points[0].start>0)points.unshift({start:0,chord:null});
      const segments=[];
      points.forEach((p,i)=>{const end=points[i+1]?.start??duration;if(end<=p.start)return;const prev=segments.at(-1);if(prev&&prev.chord===p.chord)prev.end=end;else segments.push({...p,end,engine:'chordino',strength:null});});
      progress(1,'Complete');return segments;
    }finally{mod._free(ptr);}
  }
  const api={analyze};if(typeof module!=='undefined')module.exports=api;else root.GroveDetailed=api;
})(typeof self!=='undefined'?self:globalThis);
