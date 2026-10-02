const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),{JSDOM}=require('jsdom');
const sheet=require('../rpdsgrove/song-sheet');
const input={source:{id:'one',title:'My <song>',genre:'Acoustic',version:'Take 1',url:'song.mp3'},segments:[{start:0,end:10,chord:'Cmaj7'},{start:10,end:22.5,chord:'G/B',corrected:true},{start:22.5,end:24,chord:null}]};
const sourceUrl='https://trusted.example/songs/my-song';
const html=sheet.documentHtml(input,'[Verse]\n[C]Down by the [Am]water\n<script>alert(1)</script>',sourceUrl);
const parsed=new JSDOM(html).window.document;
assert.equal(parsed.querySelectorAll('tbody tr').length,3);assert.match(parsed.body.textContent,/0:22.5–0:24.0/);assert.equal(parsed.querySelectorAll('script').length,0);assert.equal(parsed.querySelector('h1').textContent,'My <song>');assert.match(parsed.body.textContent,/Verse/);assert.deepEqual([...parsed.querySelectorAll('.phrase b')].map(x=>x.textContent),['C','Am']);assert.match(parsed.body.textContent,/G major over B bass/);assert.match(parsed.body.textContent,/Your correction/);
assert.equal(parsed.querySelector('.source-link').href,sourceUrl);assert.equal(sheet.safeSourceUrl('javascript:alert(1)'),'');assert.equal(new JSDOM(sheet.documentHtml(input,'','javascript:alert(1)')).window.document.querySelector('.source-link'),null);
const dom=new JSDOM('<body></body>',{url:'https://example.test',runScripts:'outside-only'}),w=dom.window;
w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
let downloaded=null,clicked=0;w.URL.createObjectURL=blob=>{downloaded=blob;return 'blob:test';};w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=function(){clicked++;assert.match(this.download,/lyrics-and-chords.html$/);};
for(const file of ['chord-theory.js','song-sheet.js'])w.eval(fs.readFileSync(path.join(__dirname,'../rpdsgrove',file),'utf8'));
const $=id=>w.document.getElementById(id);w.GroveSongSheet.open(input);const search=new URL($('ssSearchSources').href);assert.equal(search.hostname,'www.google.com');assert.match(search.searchParams.get('q'),/My <song>.*lyrics chords/);$('ssLyrics').value='[C]Original lyric';$('ssSourceUrl').value=sourceUrl;$('ssPreviewButton').click();assert.match($('ssPreview').srcdoc,/trusted\.example\/songs\/my-song/);$('ssDownload').click();assert(downloaded);assert.equal(clicked,1);assert.match($('ssSaved').textContent,/download requested/);$('ssClose').click();w.GroveSongSheet.open(input);assert.equal($('ssLyrics').value,'[C]Original lyric');assert.equal($('ssSourceUrl').value,sourceUrl);
const other={source:{...input.source,id:'two'},segments:input.segments};$('ssClose').click();w.GroveSongSheet.open(other);assert.equal($('ssLyrics').value,'','lyrics must not leak to another version');
assert.equal($('ssSourceUrl').value,'','source attribution must not leak to another recording');
// Snapshot remains tied to this recording when the player changes its data.
other.source.title='Next song';other.segments[0].chord='Dm';$('ssPreviewButton').click();assert.match($('ssPreview').srcdoc,/My &lt;song&gt;/);assert.match($('ssPreview').srcdoc,/Cmaj7/);
dom.window.close();console.log('PASS: full timeline, lyric/chord positioning, safe escaping, downloadable document, lyric persistence, separate versions and immutable sheet snapshot.');
