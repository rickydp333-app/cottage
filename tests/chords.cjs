/* Run: node tests/chords.cjs. Synthetic tests do not measure real-song accuracy. */
const assert=require('node:assert/strict');
const engine=require('../rpdsgrove/chord-engine');
const guitar=require('../rpdsgrove/guitar');
function tone(notes,seconds=1,rate=11025){return Float32Array.from({length:Math.round(seconds*rate)},(_,i)=>notes.reduce((sum,n)=>{let v=0;for(let h=1;h<=5;h++)v+=Math.sin(2*Math.PI*440*2**((n-69)/12)*h*i/rate+h*.4)/(h*h);return sum+v;},0)*.12/notes.length);}
for(let pc=0;pc<12;pc++)for(const minor of [false,true]){
 const name=engine.names[pc]+(minor?'m':'');
 const notes=[48+pc,48+pc+(minor?3:4),55+pc,60+pc];
 assert.equal(engine.detect(tone(notes),11025).chord,name);
 for(const rate of [44100,48000]){const raw=tone(notes,32768/rate,rate),samples=new Float32Array(8192);for(let i=0;i<8192;i++)samples[i]=(raw[i*4]+raw[i*4+1]+raw[i*4+2]+raw[i*4+3])/4;assert.equal(engine.detect(samples,rate/4).chord,name+'',name+' live '+rate);}
 const s=guitar.shape(name);assert(s);
 for(const [i,f] of s.frets.entries())if(f>=0){const note=([40,45,50,55,59,64][i]+f)%12;assert([pc,(pc+(minor?3:4))%12,(pc+7)%12].includes(note),name+' fingering');if(f>0)assert(f>=s.base&&f<=s.base+4);}
 assert(guitar.svg(name,true).includes('suggested guitar fingering'));
}
assert.equal(engine.detect(new Float32Array(8192),11025).chord,null);
assert.equal(engine.detect(tone([60]),11025).chord,null);
let seed=17;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296-.5;};
for(let j=0;j<40;j++)assert.equal(engine.detect(Float32Array.from({length:8192},random),11025).chord,null,'noise');
const notes=[[48,52,55,60],[43,47,50,55],[45,48,52,57],[41,45,48,53]],parts=notes.map(n=>tone(n,3));
const samples=new Float32Array(4*3*11025);parts.forEach((p,i)=>samples.set(p,i*p.length));
const segments=engine.analyze(samples,11025);assert.deepEqual(segments.filter(s=>s.end-s.start>1).map(s=>s.chord),['C','G','Am','F']);
assert.equal(segments[0].start,0);assert.equal(segments.at(-1).end,12);for(let i=1;i<segments.length;i++)assert.equal(segments[i-1].end,segments[i].start);
console.log('PASS: 24 chords at offline/44.1k/48k live rates; guitar notes and frets; silence, single note, 40 noise frames; timed progression.');
