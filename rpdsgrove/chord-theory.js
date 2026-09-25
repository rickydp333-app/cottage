(function(root){
  'use strict';
  const natural={C:0,D:2,E:4,F:5,G:7,A:9,B:11},letters='CDEFGAB';
  const qualities={
    '':['major',[0,4,7],[0,2,4]],m:['minor',[0,3,7],[0,2,4]],
    '7':['dominant seventh',[0,4,7,10],[0,2,4,6]],maj7:['major seventh',[0,4,7,11],[0,2,4,6]],m7:['minor seventh',[0,3,7,10],[0,2,4,6]],
    '6':['major sixth',[0,4,7,9],[0,2,4,5]],m6:['minor sixth',[0,3,7,9],[0,2,4,5]],
    dim:['diminished',[0,3,6],[0,2,4]],aug:['augmented',[0,4,8],[0,2,4]],m7b5:['half-diminished seventh',[0,3,6,10],[0,2,4,6]],
    sus2:['suspended second',[0,2,7],[0,1,4]],sus4:['suspended fourth',[0,5,7],[0,3,4]],dim7:['diminished seventh',[0,3,6,9],[0,2,4,6]]
  };
  const names=['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
  function pc(note){return (natural[note[0]]+(note[1]==='#'?1:note[1]==='b'?-1:0)+12)%12;}
  function parse(label){
    if(typeof label!=='string')return null;
    const m=label.match(/^([A-G][#b]?)(maj7|m7b5|m7|m6|dim7|dim|aug|sus2|sus4|m|7|6)?(?:\/([A-G][#b]?))?$/);if(!m)return null;
    const quality=m[2]||'',q=qualities[quality],r=pc(m[1]),bass=pc(m[3]||m[1]);
    const notes=q[1].map((n,i)=>{const letter=letters[(letters.indexOf(m[1][0])+q[2][i])%7];let accidental=(r+n-natural[letter]+18)%12-6;return letter+(accidental<0?'b'.repeat(-accidental):'#'.repeat(accidental));});
    return {label,root:m[1],quality,rootPc:r,bass,bassName:m[3]||m[1],notes,pitches:q[1].map(n=>(r+n)%12),name:m[1]+' '+q[0]+(m[3]?' over '+m[3]+' bass':'')};
  }
  const api={parse,names,qualities};if(typeof module!=='undefined')module.exports=api;else root.GroveTheory=api;
})(typeof window!=='undefined'?window:globalThis);
