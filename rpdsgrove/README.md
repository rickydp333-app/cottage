# RPDsGrove

Public music app at /rpdsgrove/, deployed through the existing DreamHost workflow. Eight ready-to-share SoundBreak songs are included. Artwork is original SVG artwork generated for this app. MP3s stream from SoundBreak; no account-connect links, generation prompts or credentials are published.

Features: search, local playlists (create/rename/delete and add/remove tracks), favorites, listening history, queue, shuffle, repeat one/all, seek, volume, media-session controls, installable PWA, theme color, Google Cast default receiver, Safari AirPlay picker and remote listening rooms. Browser-local state is labeled in the UI. The shell is cached; music still requires internet.

A player starts a room and shares its fragment link. Remote controls require the 96-bit room code. Receiver heartbeat/end require an additional 256-bit secret held only in the player tab. Rooms are temporary files outside the web root with a 24-hour inactivity lifetime, bounded creation count, bounded command queue, and command rate limit. Commands expire after 30 seconds and require an online heartbeat. Song URL validation permits only HTTPS MP3 files on audio.soundbreak.ai; the PHP endpoint does not proxy or fetch arbitrary URLs. Refreshing/closing the player ends its connection; start and share a new room afterward. Room codes are capabilities: anyone given a link can control that player.

Pair speakers on the local network using Chrome Cast or Apple Safari AirPlay. Keep the player tab awake for remote controls and automatic queue progression. Google Home can create/manage Nest groups; HomePods use AirPlay 2. This does not register RPDsGrove as a Google voice music provider and does not synchronize Google and Apple speaker ecosystems. Browser autoplay/device pairing still require an initial gesture. Real speaker hardware was unavailable during development.

SoundBreak's connected tool supplies a capped recent-song list, not a website API token or a library-sync API. Further direct MP3 URLs can be added in the app on that device. No automatic import of future tracks is claimed.

Validation: PHP syntax; JavaScript syntax; actual SoundBreak MP3 playback; browser search/favorite/playlist persistence; repeat/skip behavior; two-browser room creation, song change, pause and ending; rejected unauthorized heartbeat and invalid media origin; responsive mobile layout and accessible settings. Cast/AirPlay hardware validation remains required on site.
