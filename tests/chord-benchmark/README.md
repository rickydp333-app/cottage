# Small real-recording regression benchmark

Source: GuitarSet, https://zenodo.org/records/3371780 and https://github.com/marl/GuitarSet.
Citation: Xi et al., GuitarSet: A Dataset for Guitar Transcription, ISMIR 2018.
Audio is not redistributed here. See the dataset's terms at the source.

Selection was fixed before scoring: alphabetically first accompaniment recording for each of BN, Funk, Jazz, Rock and SS, for players 00 and 01. Ten microphone recordings, roughly four minutes total. This intentionally small sample is limited to the first major-chord progression in each style. It is neither a held-out representative benchmark nor evidence of accuracy on commercial mixes.

Ground truth: first JAMS chord annotation (published chord sheet). GuitarSet also provides refined performance annotations; those were not used. A player can deviate from the sheet. Score is duration-weighted interval overlap after reducing predicted and reference chords to root plus major/minor quality; extensions and slash bass are ignored. Diminished/augmented/half-diminished predictions count as mismatches. Silence/unknown counts as mismatch against the chart. This does not evaluate exact extensions, bass, original voicing, or boundary tolerance.

Results: old detector **53.6165%**, bundled Chordino **84.3715%**. Chordino improved on all ten recordings, but one Funk recording scored only 41.4%. No parameters were tuned against these examples. Per-recording scores, exact predictions, reference annotations and selection are included.

Reproduction: download the named WAVs and JAMS from GuitarSet. `download.py` and `prepare.py` preserve the original task scripts (their paths expect a `work/benchmark` folder and local Python dependencies). Preparation uses soundfile/numpy, a 129-tap Hann-windowed sinc low-pass and decimation from 44.1 kHz to 11.025/22.05 kHz. Put generated `*-11025.f32` and `*-22050.f32` beside this file and run `node compare.cjs`. The old detector receives 11.025 kHz; Chordino receives 22.05 kHz, matching their respective app versions. Synthetic tests independently cover minor and seventh labels but do not supply real-world accuracy numbers.
