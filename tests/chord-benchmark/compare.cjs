const fs=require('fs'),path=require('path');
const base=__dirname;
const old=require('../../rpdsgrove/chord-engine.js'),modern=require('../../rpdsgrove/chordino-analyzer.js');
const pc={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
function reduce(s){if(!s)return null;const m=s.match(/^([A-G])([#b]?)([^/]*)/);if(!m)return null;let q=m[3].replace(':','');if(['dim','aug','m7b5'].includes(q))return null;return ((pc[m[1]]+(m[2]==='#'?1:m[2]==='b'?-1:0)+12)%12)+(/^(min|m(?!aj))/.test(q)?'m':'M');}
function score(pred,ref){let hit=0,total=0;for(const r of ref){total+=r.duration;for(const p of pred){const d=Math.max(0,Math.min(p.end,r.time+r.duration)-Math.max(p.start,r.time));if(reduce(p.chord)===reduce(r.value))hit+=d;}}return {hit,total,percent:100*hit/total};}
function audio(file,rate){const b=fs.readFileSync(path.join(base,file+'-'+rate+'.f32'));return new Float32Array(b.buffer,b.byteOffset,b.length/4);}
(async()=>{const out=[];for(const r of JSON.parse(fs.readFileSync(path.join(base,'reference.json')))){const previous=old.analyze(audio(r.file,11025),11025),detailed=await modern.analyze(audio(r.file,22050),22050);const row={file:r.file,previous:score(previous,r.reference),detailed:score(detailed,r.reference)};out.push(row);fs.writeFileSync(path.join(base,r.file+'-predictions.json'),JSON.stringify({previous,detailed},null,2));console.log(row.file,row.previous.percent.toFixed(1),row.detailed.percent.toFixed(1));}fs.writeFileSync(path.join(base,'results.json'),JSON.stringify(out,null,2));})();
