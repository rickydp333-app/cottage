const spotifyUrlPattern=/^https:\/\/open\.spotify\.com\/(track|album|playlist)\/([A-Za-z0-9]+)(?:\?.*)?$/;

function openSpotifyEmbed(song){
 const match=spotifyUrlPattern.exec(song.url);
 if(!match)return notice('This Spotify link is not supported.');
 let dialog=$('#spotifyEmbedDialog');
 if(!dialog){
  dialog=document.createElement('dialog');
  dialog.id='spotifyEmbedDialog';
  dialog.innerHTML='<form method="dialog" style="width:min(520px,90vw);padding:20px"><button class="close" aria-label="Close">×</button><h2 id="spotifyEmbedTitle">Spotify</h2><iframe id="spotifyEmbedFrame" title="Spotify player" style="display:block;width:100%;height:352px;border:0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe><button type="button" id="spotifyCastButton" class="primary" style="margin-top:12px;width:100%">Open in Spotify to cast</button><p>Google speaker selection is handled by Spotify Connect.</p></form>';
  document.body.append(dialog);
 }
 $('#spotifyEmbedTitle').textContent=song.title;
 $('#spotifyEmbedFrame').src='https://open.spotify.com/embed/'+match[1]+'/'+match[2]+'?utm_source=generator';
 $('#spotifyCastButton').onclick=()=>window.open(song.url,'_blank','noopener,noreferrer');
 dialog.showModal();
}

const spotifySection=document.createElement('section');
spotifySection.innerHTML='<hr><h3>Spotify link</h3><p>Save a Spotify track, album or playlist. It opens in Spotify when selected.</p><label>Title<input id="spotifyTitle" maxlength="160" placeholder="Song or playlist title"></label><label>Spotify URL<input id="spotifyUrl" type="url" placeholder="https://open.spotify.com/track/..."></label><button type="button" id="addSpotifyButton">Add Spotify link</button><p id="spotifyStatus" role="status"></p>';
$('#addForm').insertBefore(spotifySection,$('#addForm').querySelector('hr'));

const renderWithSpotify=render;
render=function renderWithSpotifyLinks(...args){
 for(const song of spotifySongs)if(!state.songs.some(item=>item.id===song.id))state.songs.push(song);
 return renderWithSpotify(...args);
};

$('#addSpotifyButton').addEventListener('click',()=>{
 const title=$('#spotifyTitle').value.trim();
 const url=$('#spotifyUrl').value.trim();
 const match=spotifyUrlPattern.exec(url);
 if(!title||!match){$('#spotifyStatus').textContent='Enter a title and a Spotify track, album, or playlist URL.';return;}
 const song={id:'spotify-'+crypto.randomUUID(),title,genre:'Spotify',version:'Open in Spotify',url,spotify:true,art:'art-0.svg'};
 const nextSongs=[...spotifySongs,song];
 try{localStorage.setItem('grove:spotify-songs',JSON.stringify(nextSongs));}
 catch{$('#spotifyStatus').textContent='Browser storage is full or unavailable. The Spotify link was not added.';return;}
 spotifySongs.push(song);
 state.songs.push(song);
 $('#spotifyTitle').value='';
 $('#spotifyUrl').value='';
 $('#spotifyStatus').textContent='Spotify link added.';
 render();
});