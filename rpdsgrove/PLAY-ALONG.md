# Play Along

Select a song and open **Play Along** beside Stop. Choose **Analyze song**.
Old version-1 estimates are deliberately ignored; analyze again for the new engine.

- **Current song:** analyze the library recording, follow playback, and keep the most recent 12 chord maps and corrections in this browser.
- **Upload a song:** select a local recording; audio stays on this device.
- **Listen live:** quick major/minor estimates. This approximate mode does not use the detailed full-recording engine.
- Tap a section to seek, read the chord name and notes, and see a suggested standard-tuning guitar shape. Slash labels identify the bass.
- Correct a section from a trusted chart or by ear. **Save chord chart** exports JSON; **Load chord chart** restores it with the matching recording selected. Imported charts are labeled as supplied, never automatically called verified.
- Repeat chord works for local playback. Right/left-handed views are available.

## Accuracy and boundaries

Full-song analysis uses bundled **Chordino** NNLS at 22.05 kHz, with tuning estimation, bass/treble information and sequence decoding. The built-in dictionary includes major, minor, sixth, seventh, diminished, augmented and slash chords. Suspended and diminished-seventh labels are also available as corrections. See [license, source and build instructions](vendor/chordino/README.md).

Drums, vocals, distortion and overlapping instruments remain difficult. Labels are estimates, not calibrated probabilities. The guitar suggests a voicing, not the original player's exact fingering. If no supported shape contains every chord tone and requested bass, the app shows the notes without a fingering. It never substitutes a major triad for an unsupported extended chord.

Processing is free and on-device: no API key or audio-analysis service. Limits remain 40 MB and 12 minutes, subject to browser memory and codecs. A cancellable worker performs analysis. Playback and Cast are not rerouted. Microphone tracks stop on close, source change, backgrounding, disconnection and page exit. Physical phones, microphone hardware and Cast speakers still require device testing.

## Validation

- `node tests/chords.cjs`: legacy live estimator and basic guitar regressions.
- `node tests/detailed-chords.cjs`: actual compiled analyzer, silence, major seventh, note spelling, and 2,028 root/quality/bass combinations. 1,356 shapes validate; 672 safely show no simple shape. Every chord tone, bass note, finger count and displayed fret is checked.
- `npm install --prefix tests` then `npm test --prefix tests`: permission/stream cleanup, saved corrections, extended note display, chart import validation, invalid labels and source mismatch handling.
- [Fixed real-recording benchmark](https://github.com/rickydp333-app/cottage/tree/main/tests/chord-benchmark): old engine 53.6%, Chordino 84.4% duration-weighted agreement with reduced chord sheets on ten GuitarSet recordings. This small major-chord sample does not establish general full-song or seventh-chord accuracy.

Browser smoke testing covers actual decoding, worker/WASM, timeline and chord display. Desktop and phone-size layouts are checked; responsive emulation is not physical-device testing. Service-worker shell v12 includes the new assets.
