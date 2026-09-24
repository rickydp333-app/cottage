(function(root){
  'use strict';
  const open={
    C:{frets:[-1,3,2,0,1,0],fingers:[0,3,2,0,1,0]},
    D:{frets:[-1,-1,0,2,3,2],fingers:[0,0,0,1,3,2]},
    E:{frets:[0,2,2,1,0,0],fingers:[0,2,3,1,0,0]},
    G:{frets:[3,2,0,0,0,3],fingers:[2,1,0,0,0,3]},
    A:{frets:[-1,0,2,2,2,0],fingers:[0,0,1,2,3,0]},
    Am:{frets:[-1,0,2,2,1,0],fingers:[0,0,2,3,1,0]},
    Dm:{frets:[-1,-1,0,2,3,1],fingers:[0,0,0,2,3,1]},
    Em:{frets:[0,2,2,0,0,0],fingers:[0,2,3,0,0,0]}
  };
  const names=['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
  function shape(chord){
    if(open[chord])return {...open[chord],base:1};
    const minor=chord?.endsWith('m'),note=minor?chord.slice(0,-1):chord,pc=names.indexOf(note);
    if(pc<0)return null;
    const e=(pc-4+12)%12,a=(pc-9+12)%12;
    if(e<=a){return {base:e,frets:[e,e+2,e+2,e+(minor?0:1),e,e],fingers:[1,3,4,minor?1:2,1,1],barre:[0,5,e]};}
    return {base:a,frets:[-1,a,a+2,a+2,a+(minor?1:2),a],fingers:minor?[0,1,3,4,2,1]:[0,1,3,3,3,1],barre:[1,5,a],upperBarre:minor?null:[2,4,a+2]};
  }
  function svg(chord,left=false){
    const s=shape(chord),base=s?.base||1,x=i=>left?195-i*22:85+i*22;
    let out='<svg viewBox="0 0 280 550" role="img" aria-label="'+(chord?chord+' suggested guitar fingering':'Guitar awaiting a chord')+'"><defs><linearGradient id="groveWood" x2="1" y2="1"><stop stop-color="#dca66c"/><stop offset="1" stop-color="#9b5d36"/></linearGradient></defs>';
    out+='<path d="M83 334 C37 311 12 351 28 389 C48 427 12 437 27 493 C40 544 240 544 253 493 C268 437 232 427 252 389 C268 351 243 311 197 334 Z" fill="url(#groveWood)" stroke="#edd0a6" stroke-width="3"/><circle cx="140" cy="407" r="39" fill="#352a23" stroke="#f0c58c" stroke-width="5"/><rect x="88" y="487" width="104" height="13" rx="3" fill="#372b23"/><path d="M77 66 L72 16 Q140 0 208 16 L203 66Z" fill="#b77b49"/><rect x="76" y="77" width="128" height="282" rx="3" fill="#352b26" stroke="#b88a60"/>';
    for(let f=0;f<=5;f++){let y=85+f*43;out+='<line x1="76" x2="204" y1="'+y+'" y2="'+y+'" stroke="'+(f===0&&base===1?'#eee4ce':'#a9967e')+'" stroke-width="'+(f===0?5:2)+'"/>';if(f<5)out+='<text x="56" y="'+(y+28)+'" fill="#bed0c8" text-anchor="middle" font-size="13">'+(base+f)+'</text>';}
    for(let i=0;i<6;i++){
      out+='<line x1="'+x(i)+'" x2="'+x(i)+'" y1="39" y2="494" stroke="#e2d7c3" stroke-width="'+(2-i*.22)+'"/><text x="'+x(i)+'" y="32" text-anchor="middle" fill="#251f1b" font-size="12" font-weight="bold">'+['E','A','D','G','B','e'][i]+'</text>';
      if(s&&(s.frets[i]===0||s.frets[i]<0))out+='<text x="'+x(i)+'" y="72" text-anchor="middle" fill="#ffffff" font-size="19">'+(s.frets[i]===0?'○':'×')+'</text>';
    }
    for(const bar of [s?.barre,s?.upperBarre].filter(Boolean)){const [a,b,f]=bar,y=85+(f-base+.5)*43;out+='<line x1="'+x(a)+'" x2="'+x(b)+'" y1="'+y+'" y2="'+y+'" stroke="#b6e8ad" stroke-width="20" stroke-linecap="round"/>';}
    if(s)for(let i=0;i<6;i++)if(s.frets[i]>0){const y=85+(s.frets[i]-base+.5)*43;out+='<circle cx="'+x(i)+'" cy="'+y+'" r="12" fill="#b6e8ad"/><text x="'+x(i)+'" y="'+(y+4.5)+'" text-anchor="middle" font-size="13" font-weight="bold" fill="#102b2b">'+s.fingers[i]+'</text>';}
    return out+'</svg>';
  }
  const api={shape,svg,names};if(typeof module!=='undefined')module.exports=api;else root.GroveGuitar=api;
})(typeof window!=='undefined'?window:globalThis);
