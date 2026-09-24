# Play Along

Open RPDsGrove, select a song, then choose **Play Along** beside Stop.

- **Current song** analyzes the library recording and follows the existing player's clock. Chord maps and corrections are saved in this browser (the latest 12 recordings).
- **Upload a song** reads a local audio file without uploading it. Use its audio controls for playback. This temporary recording and its map are released when the panel closes or the source changes.
- **Listen live** uses the microphone only after a user gesture and browser permission. Audio is neither recorded nor transmitted. Stop, close, source change, backgrounding, disconnection, and page exit release microphone tracks.
- Tap timeline tiles to seek. Correct a section using the chord selector. Repeat chord is available for local playback. Right/left hand preferences persist on the device.

## Boundaries

This is an experimental, dependency-free pitch-class/template estimator for 24 major/minor chords. It does not identify exact original guitar voicings, seventh/extended chords, capo position, alternate tunings, or individual instrument parts. Full mixes can yield wrong or uncertain results. Confidence labels describe template strength, not calibrated probabilities. No professional transcription accuracy is claimed.

Analysis uses an 8192-sample Hann-window FFT, interpolated spectral peaks, pitch-class noise-floor subtraction, triad scoring and temporal voting. A worker keeps analysis off the UI thread. Library audio is fetched separately; the existing media element and Cast path are not rerouted through Web Audio. The SoundBreak host currently permits CORS. If a host blocks fetching, use a local recording instead.

Files are limited to 40 MB and decoded recordings to 12 minutes. Browser codec and memory support still apply. Uploaded audio stays in memory; existing library imports retain their original storage model. Microphone use requires HTTPS (or localhost) and a supported browser. Keep the page visible. Remote/Cast playback follows the existing reported position and can have additional timing lag; looping is restricted to local playback. Physical iPhone, Android, microphone hardware, Cast speakers and kiosk permission policies require device testing; responsive viewport tests do not substitute for these.

## Validation

Run `node tests/chords.cjs` for the dependency-free audio/fingering tests. For UI lifecycle tests, run `npm install --prefix tests`, then `npm test --prefix tests` (Node 24+, jsdom 30.1.1).

Tests cover all 24 chords, 44.1/48 kHz microphone conversion, guitar fingering pitches, silence, single notes, deterministic noise, a timed C/G/Am/F fixture, delayed microphone permission, denial, stream cleanup, saved corrections, handedness and source switching. These synthetic checks do not measure real-song accuracy. A real catalog MP3 was also exercised through browser download, decoding, worker analysis and timeline rendering. Desktop and 390-pixel phone layouts were visually checked.

No new production packages, paid services, API keys, server endpoints or uploads are needed. The existing DreamHost deployment includes these static files. Service-worker shell version 11 includes the new assets. Restore the previous versions of index.html, app.js and sw.js to remove the entry point if rollback is needed; stored chord maps do not affect normal playback.
