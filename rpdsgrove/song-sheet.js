(function(root){
  'use strict';
  const theory=typeof module!=='undefined'?require('./chord-theory.js'):root.GroveTheory;
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const time=t=>{const n=Math.round(t*10);return Math.floor(n/600)+':'+String(Math.floor(n/10)%60).padStart(2,'0')+'.'+n%10;};
  const printStyle=`body{font:15px/1.55 Arial,sans-serif;color:#172923;background:white;margin:0;padding:30px;max-width:900px}h1{font:32px Georgia,serif;margin:0 0 8px;overflow-wrap:anywhere}h2{font-size:20px;margin:28px 0 12px}p{margin:8px 0}.muted{color:#53635d;font-size:12px}.lyric-line{white-space:pre-wrap;overflow-wrap:anywhere;min-height:1.6em;margin:0 0 8px;break-inside:avoid}.phrase{display:inline-grid;grid-template-rows:1.25em auto;vertical-align:bottom;white-space:pre-wrap;max-width:100%}.phrase b{font-size:12px;color:#165b42}.phrase span{min-width:1ch}.timeline{width:100%;border-collapse:collapse;font-size:12px}th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #d8dfda;vertical-align:top;overflow-wrap:anywhere}thead{display:table-header-group}tr{break-inside:avoid}h2{break-after:avoid}@page{margin:16mm}@media print{body{padding:0;max-width:none}.no-print{display:none!important}}`;
  function lyricMarkup(text){
    return text.split(/\r?\n/).map(line=>{
      const re=/\[([^\]\n]{1,20})\]/g;let match,last=0,chord='',pieces=[];
      while((match=re.exec(line))){if(!theory.parse(match[1]))continue;pieces.push({chord,text:line.slice(last,match.index)});chord=match[1];last=re.lastIndex;}
      pieces.push({chord,text:line.slice(last)});
      if(!pieces.some(p=>p.chord))return '<p class="lyric-line">'+(escape(line)||'&nbsp;')+'</p>';
      return '<p class="lyric-line">'+pieces.filter(p=>p.text||p.chord).map(p=>'<span class="phrase"><b>'+escape(p.chord)+'</b><span>'+escape(p.text||' ')+'</span></span>').join('')+'</p>';
    }).join('');
  }
  function body(data,lyrics){
    const source=data.source,segments=data.segments;
    const rows=segments.map(s=>{const c=theory.parse(s.chord);return '<tr><td>'+time(s.start)+'–'+time(s.end)+'</td><td>'+escape(s.chord||'Uncertain / no chord')+'</td><td>'+escape(c?c.name+' · '+c.notes.join(', '):'')+'</td><td>'+(s.corrected?'Your correction':s.imported?'Imported chart':'Estimate')+'</td></tr>';}).join('');
    return '<h1>'+escape(source.title||'Song sheet')+'</h1><p>'+escape([source.genre,source.version].filter(Boolean).join(' · '))+'</p><p class="muted">RPDsGrove · '+time(segments.at(-1)?.end||0)+' · Standard tuning · No capo</p><p class="muted">Chord estimates may contain mistakes. Check by ear or against a trusted chart. Lyrics and any chords placed above words are supplied by you; their timing is not automatically matched.</p><h2>Lyrics'+(lyrics.trim()?'':' (not added)')+'</h2>'+(lyrics.trim()?lyricMarkup(lyrics):'<p>Add lyrics in the song sheet editor to include them here.</p>')+'<h2>Complete chord timeline</h2><table class="timeline"><thead><tr><th>Time</th><th>Chord</th><th>Name and notes</th><th>Source</th></tr></thead><tbody>'+rows+'</tbody></table>';
  }
  function documentHtml(data,lyrics){return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escape(data.source.title||'Song sheet')+'</title><style>'+printStyle+'</style></head><body>'+body(data,lyrics)+'</body></html>';}
  const api={body,documentHtml,lyricMarkup};
  if(typeof module!=='undefined'){module.exports=api;return;}
  const $=id=>document.getElementById(id),dialog=document.createElement('dialog');dialog.id='songSheet';dialog.setAttribute('aria-labelledby','ssHeading');
  dialog.innerHTML=`<button id="ssClose" class="close" aria-label="Close song sheet">×</button><p class="eyebrow">KEEP THE WHOLE SONG</p><h2 id="ssHeading">Lyrics &amp; chord sheet</h2><p id="ssTitle"></p><label for="ssLyrics">Lyrics</label><p id="ssHelp">Paste or type the song’s lyrics here. Lyrics are not automatically transcribed. To place a chord above a word, type it in brackets, for example: [C]Down by the [Am]water. Plain lyrics are kept separate from the timed chord list below.</p><textarea id="ssLyrics" rows="9" maxlength="50000" aria-describedby="ssHelp" placeholder="Paste lyrics here…"></textarea><p id="ssSaved" role="status" aria-live="polite"></p><div class="ss-actions"><button id="ssPreviewButton">Update preview</button><button id="ssDownload">Download document</button><button id="ssPrint">Print / Save as PDF</button></div><p class="ss-help">Download creates a complete HTML document you can open in a browser. For PDF, choose Save as PDF in your print options. No audio or lyrics are sent to a server.</p><iframe id="ssPreview" title="Song sheet document preview" sandbox="allow-same-origin allow-modals"></iframe>`;
  document.body.append(dialog);let data=null,storageKey='',previewText=null,saveTimer=null,previewReady=false,printPending=false;
  function save(){clearTimeout(saveTimer);if(!data)return;try{localStorage.setItem(storageKey,$('ssLyrics').value);$('ssSaved').textContent='Lyrics saved on this device.';}catch{$('ssSaved').textContent='Storage unavailable. Download your document to keep these lyrics.';}}
  function preview(){previewReady=false;const text=$('ssLyrics').value;$('ssPreview').srcdoc=documentHtml(data,text);previewText=text;}
  function printPreview(){printPending=false;try{$('ssPreview').contentWindow.focus();$('ssPreview').contentWindow.print();}catch{$('ssSaved').textContent='Printing is unavailable here. Download the document, open it in your browser, and choose Print.';}}
  $('ssPreview').onload=()=>{previewReady=true;if(printPending)printPreview();};
  function download(){save();const url=URL.createObjectURL(new Blob([documentHtml(data,$('ssLyrics').value)],{type:'text/html;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=(data.source.title||'song').replace(/[^a-z0-9 _-]/gi,'').slice(0,80)+'-lyrics-and-chords.html';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('ssSaved').textContent='Document download requested. Check your browser’s downloads.';}
  api.open=input=>{
    if(dialog.open)save();printPending=false;
    data={source:{...input.source},segments:input.segments.map(s=>({...s}))};
    storageKey='grove:lyrics:v1:'+JSON.stringify(data.source.id?[data.source.id,data.source.url]:[data.source.title,data.segments.at(-1)?.end]);
    let lyrics=typeof data.source.lyrics==='string'?data.source.lyrics:'';try{lyrics=localStorage.getItem(storageKey)??lyrics;}catch{}
    $('ssLyrics').value=lyrics.slice(0,50000);$('ssTitle').textContent=[data.source.title,data.source.genre,data.source.version].filter(Boolean).join(' · ');$('ssSaved').textContent='Add lyrics, then download or print your whole-song sheet.';preview();dialog.showModal();
  };
  $('ssLyrics').addEventListener('input',()=>{clearTimeout(saveTimer);saveTimer=setTimeout(save,500);});
  $('ssPreviewButton').onclick=()=>{save();preview();};$('ssDownload').onclick=download;
  $('ssPrint').onclick=()=>{
    save();printPending=true;if(previewText!==$('ssLyrics').value)preview();else if(previewReady)printPreview();
  };
  $('ssClose').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{printPending=false;save();});window.addEventListener('pagehide',save);
  root.GroveSongSheet=api;
})(typeof window!=='undefined'?window:globalThis);
