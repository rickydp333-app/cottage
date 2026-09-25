# Chordino for RPDsGrove

Song analysis uses the Chordino algorithm by Matthias Mauch and Simon Dixon,
Queen Mary University of London. Copyright notices are preserved in `src`.
It uses NNLS note transcription, tuning estimation and sequence decoding.
It is an estimator, not a guaranteed transcription service.

## License and corresponding source

Chordino, this browser host, generated `chordino.js`, and the analyzer wrapper
are distributed under **GNU GPL version 2 or later**. See [COPYING](src/COPYING).
Vamp SDK files retain their BSD-style license: [VAMP-COPYING](src/VAMP-COPYING).
The generated file includes the compiled WebAssembly; it has no remote service.

Complete corresponding source and build instructions are included beside the
generated file in this public repository:
[RPDsGrove Chordino source](https://github.com/rickydp333-app/cottage/tree/main/rpdsgrove/vendor/chordino).
The JavaScript analyzer host is at [chordino-analyzer.js](../../chordino-analyzer.js).

Upstream sources:

- https://github.com/c4dm/nnls-chroma at `4c5f214a75cb354f8d8c933e161377c5b4d83713`
- https://github.com/vamp-plugins/vamp-plugin-sdk at `44c2487763eb248a933e9eff9169cfadee375009`

## Build

Install the official Emscripten SDK, version **4.0.22**, activate its environment,
then run `python build.py` in this directory. Alternatively set `EMXX` to the
absolute path of `em++` (`em++.bat` on Windows). Python 3 and Emscripten are the
only build prerequisites; all algorithm and SDK sources used are included.

Browser adaptations, September 24, 2026:

- `src/browser-host.cpp`: narrow C interface; centered Hann-window FFT; feature extraction.
- `src/chromamethods.cpp`: remove Boost/filesystem chord dictionary lookup; retain
  upstream's built-in dictionary unchanged. No custom chord dictionary is loaded.
- `build.py`: optimized single-file JS/WASM worker/Node build, growable memory capped at 512 MB.
- `../../chordino-analyzer.js`: 22.05 kHz mono host, 8192-sample window,
  1024-sample hop; padded centered frames; converts upstream labels to a timeline.

No neural model, API key, paid service, or audio upload is needed. Live microphone
mode uses a separate, simpler major/minor estimator and is labeled accordingly.
