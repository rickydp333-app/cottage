(function(root){
  'use strict';
  const theory=typeof module!=='undefined'?require('./chord-theory.js'):root.GroveTheory;
  const tuning=[40,45,50,55,59,64],cache=new Map();
  // Four adjacent strings, at most four fingers, no hidden or partial barres.
  // Every chord tone and the requested bass must be present.
  function shape(label){
    if(cache.has(label))return cache.get(label);
    const chord=theory.parse(label);if(!chord)return null;
    const required=[...new Set([...chord.pitches,chord.bass])];let best=null,bestScore=Infinity;
    for(let start=0;start<=2;start++)for(let count=3;count<=4&&start+count<=6;count++)for(let base=0;base<=12;base++){
      const options=Array.from({length:count},(_,i)=>Array.from({length:5},(_,f)=>base+f).filter(f=>required.includes((tuning[start+i]+f)%12)));
      function visit(frets,i){if(i<count){for(const f of options[i])visit([...frets,f],i+1);return;}
        const midi=frets.map((f,j)=>tuning[start+j]+f),pitches=midi.map(n=>n%12);
        if(Math.min(...midi)!==midi[0]||pitches[0]!==chord.bass||required.some(n=>!pitches.includes(n)))return;
        const pressed=frets.filter(f=>f>0),span=pressed.length?Math.max(...pressed)-Math.min(...pressed):0;
        if(span>3)return;
        const score=Math.max(...frets)+span*2+pressed.length*.2+start*.15-count*.1;
        if(score>=bestScore)return;bestScore=score;
        const all=Array(6).fill(-1),fingers=Array(6).fill(0);frets.forEach((f,j)=>all[start+j]=f);
        let finger=0;frets.map((f,j)=>({f,j})).filter(x=>x.f>0).sort((a,b)=>a.f-b.f||a.j-b.j).forEach(x=>fingers[start+x.j]=++finger);
        best={frets:all,fingers,base:Math.max(1,Math.min(...pressed)),compact:true};
      }visit([],0);
    }
    cache.set(label,best);return best;
  }
  const api={shape};if(typeof module!=='undefined')module.exports=api;else root.GroveVoicings=api;
})(typeof window!=='undefined'?window:globalThis);
