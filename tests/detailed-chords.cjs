const assert=require('node:assert/strict');
const theory=require('../rpdsgrove/chord-theory'),guitar=require('../rpdsgrove/guitar'),analyzer=require('../rpdsgrove/chordino-analyzer');
assert.deepEqual(theory.parse('C#maj7').notes,['C#','E#','G#','B#']);
assert.deepEqual(theory.parse('Cdim7').notes,['C','Eb','Gb','Bbb']);
assert.equal(theory.parse('C/E').bass,4);assert.equal(theory.parse('<script>'),null);assert.equal(theory.parse('C13'),null);
let checked=0,unavailable=0;
for(const root of theory.names)for(const quality of Object.keys(theory.qualities))for(const bass of ['',...theory.names.map(x=>'/'+x)]){
 const label=root+quality+bass,c=theory.parse(label),s=guitar.shape(label);assert(c);
 if(!s){unavailable++;continue;}
 const midi=s.frets.flatMap((f,i)=>f<0?[]:[([40,45,50,55,59,64][i]+f)]),allowed=[...c.pitches,c.bass];
 assert.equal(Math.min(...midi)%12,c.bass,label+' bass');
 assert(midi.every(n=>allowed.includes(n%12)),label+' extra notes');
 assert(c.pitches.every(n=>midi.some(m=>m%12===n)),label+' missing chord tone');
 assert(s.fingers.every(f=>f>=0&&f<=4),label+' fingers');
 assert(s.frets.every(f=>f<=0||f>=s.base&&f<=s.base+4),label+' visible frets');checked++;
}
(async()=>{
 const rate=22050,seconds=4,notes=[48,52,55,59];
 const samples=Float32Array.from({length:rate*seconds},(_,i)=>notes.reduce((sum,n)=>sum+Math.sin(2*Math.PI*440*2**((n-69)/12)*i/rate),0)*.04);
 const result=await analyzer.analyze(samples,rate);assert(result.some(x=>x.chord==='Cmaj7'&&x.end-x.start>2),JSON.stringify(result));
 assert.equal(result[0].start,0);assert.equal(result.at(-1).end,seconds);
 for(let i=0;i<result.length;i++){assert(result[i].chord===null||theory.parse(result[i].chord));if(i)assert.equal(result[i-1].end,result[i].start);}
 const silence=await analyzer.analyze(new Float32Array(rate),rate);assert(silence.every(x=>x.chord===null));
 console.log(`PASS: ${checked} guitar voicings with correct notes/bass/fingers; ${unavailable} safely unavailable; note spelling; actual WebAssembly major seventh and silence.`);
})().catch(e=>{console.error(e);process.exit(1)});
