/* Free, local major/minor chord estimation. No network or model downloads. */
(function (root) {
  'use strict';
  const names = ['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
  const size = 8192;
  const windowing = Float64Array.from({length:size}, (_,i)=>0.5-0.5*Math.cos(2*Math.PI*i/(size-1)));
  function spectrum(samples) {
    const re = new Float64Array(size), im = new Float64Array(size);
    let energy=0;
    for(let i=0;i<size;i++){const v=samples[i]||0;re[i]=v*windowing[i];energy+=v*v;}
    for(let i=1,j=0;i<size;i++){let bit=size>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;if(i<j){const v=re[i];re[i]=re[j];re[j]=v;}}
    for(let n=2;n<=size;n<<=1){const angle=-2*Math.PI/n, cr=Math.cos(angle),ci=Math.sin(angle);
      for(let start=0;start<size;start+=n){let wr=1,wi=0;for(let j=0;j<n/2;j++){
        const a=start+j,b=a+n/2, tr=wr*re[b]-wi*im[b],ti=wr*im[b]+wi*re[b];
        re[b]=re[a]-tr;im[b]=im[a]-ti;re[a]+=tr;im[a]+=ti;
        const next=wr*cr-wi*ci;wi=wr*ci+wi*cr;wr=next;
      }}
    }
    return {mag:Float64Array.from(re.slice(0,size/2), (v,i)=>Math.hypot(v,im[i])),rms:Math.sqrt(energy/size)};
  }
  function detect(samples, sampleRate) {
    const {mag,rms}=spectrum(samples), chroma=new Float64Array(12);
    if(rms<0.002)return {chord:null,strength:0,rms};
    let max=0;for(const v of mag)max=Math.max(max,v);
    for(let k=2;k<mag.length-1;k++){
      if(mag[k]<max*0.04||mag[k]<=mag[k-1]||mag[k]<mag[k+1])continue;
      const l=Math.log(mag[k-1]+1e-10),c=Math.log(mag[k]+1e-10),r=Math.log(mag[k+1]+1e-10);
      const offset=Math.max(-.5,Math.min(.5,.5*(l-r)/(l-2*c+r||1)));
      const hz=(k+offset)*sampleRate/size;
      if(hz<75||hz>1600)continue;
      const midi=69+12*Math.log2(hz/440), note=Math.round(midi);
      if(Math.abs(midi-note)>.42)continue;
      // Low fundamentals count more than upper harmonics, without treating loudness as certainty.
      chroma[(note%12+12)%12]+=Math.pow(mag[k],1.4)/Math.pow(hz/110,.45);
    }
    // Remove the broad pitch-class floor contributed by drums and unpitched sound.
    const floor=[...chroma].sort((a,b)=>a-b)[3]*.85;
    for(let i=0;i<12;i++)chroma[i]=Math.max(0,chroma[i]-floor);
    let total=0;for(const v of chroma)total+=v;
    if(!total)return {chord:null,strength:0,rms};
    for(let i=0;i<12;i++)chroma[i]/=total;
    const candidates=[];
    for(let root=0;root<12;root++)for(const minor of [false,true]){
      const triad=[chroma[root],chroma[(root+(minor?3:4))%12],chroma[(root+7)%12]];
      const coverage=triad.reduce((a,b)=>a+b,0),balance=Math.min(...triad);
      const score=coverage+balance*.8;
      candidates.push({chord:names[root]+(minor?'m':''),score,coverage,balance});
    }
    candidates.sort((a,b)=>b.score-a.score);
    const best=candidates[0],gap=best.score-candidates[1].score;
    const strength=Math.min(1,Math.max(0,(best.coverage-.45)*1.4+gap*2));
    const chord=best.coverage>=.52&&best.balance>=.025&&gap>=.035?best.chord:null;
    return {chord,strength,rms};
  }
  function analyze(samples,sampleRate,progress=()=>{}) {
    const hop=Math.round(sampleRate*.25),frames=[];
    for(let start=0;start<samples.length;start+=hop){
      // Center the analysis window on each timeline point.
      const block=new Float32Array(size),offset=start-size/2;
      block.set(samples.subarray(Math.max(0,offset),Math.min(samples.length,offset+size)),Math.max(0,-offset));
      frames.push(detect(block,sampleRate));
      if(frames.length%24===0)progress(start/samples.length);
    }
    const smoothed=frames.map((frame,i)=>{
      const votes=new Map();
      for(let j=Math.max(0,i-2);j<=Math.min(frames.length-1,i+2);j++){const c=frames[j].chord;votes.set(c,(votes.get(c)||0)+1);}
      const winner=[...votes].sort((a,b)=>b[1]-a[1])[0];
      return {...frame,chord:winner[1]>=Math.min(3,i+1,frames.length-i)?winner[0]:null};
    });
    const segments=[];
    smoothed.forEach((f,i)=>{const start=i*hop/sampleRate,end=Math.min(samples.length/sampleRate,(i+1)*hop/sampleRate),prev=segments.at(-1);
      if(prev&&prev.chord===f.chord){prev.end=end;prev.strength=(prev.strength*prev.frames+f.strength)/(prev.frames+1);prev.frames++;}
      else segments.push({start,end,chord:f.chord,strength:f.strength,frames:1});
    });
    return segments;
  }
  const api={detect,analyze,names,size};
  if(typeof module!=='undefined')module.exports=api;else root.GroveChords=api;
})(typeof self!=='undefined'?self:globalThis);
