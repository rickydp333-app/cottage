# NickVector

A standalone, iPad-friendly raster-to-vector artwork workspace. Built independently of GymKioskApp.

## Open the app

- Online: https://rdpsplace.me/nickvector/ (works without this computer or shared Wi-Fi).
- On this computer: http://localhost:5187/
- On an iPad connected to the same Wi-Fi: http://192.168.4.73:5187/
- After restarting the computer, double-click **Start NickVector.cmd** in this folder. Keep its server window open.

The local network address was detected during setup and can change. For the local version only, the server prints its current Network URL and the computer must remain awake. A guest Wi-Fi network or Windows Firewall may block local connections from other devices. Do not disable the firewall; allow only trusted/private-network access if Windows asks. No firewall or system security settings were changed during setup. The online version does not require a local server.

## Procreate workflow

1. In Procreate, export the drawing as PNG and save it to Files. Prefer the original artwork rather than a screenshot or a photograph of a tattoo.
2. Open NickVector in Safari and select **Import artwork**. PNG, JPG, and WebP are accepted. The first import replaces the generated sample.
3. Crop away reference photos if needed. Draw a rectangle with a finger, Pencil, or mouse, then select **Apply**. The crop applies to every layer to preserve alignment.
4. Choose **Color** for color shapes, or **Stencil** to trace dark pixels into black filled shapes. Select a preset and adjust settings.
5. Select **Vectorize artwork**. Compare the original and vector, adjust settings, and retrace as needed.
6. Set the output width in millimeters and select **Export SVG**. Save the download to Files, then open it in an SVG-compatible vector editor such as Affinity Designer or Illustrator.

For separate layers, export Procreate layers as individual PNG files (Actions > Share > Share Layers > PNG Files, where available). Keep the full canvas dimensions and transparent background; do not trim each layer differently. Select the PNGs together. NickVector preserves filenames as named SVG groups with nested color groups. Layer controls select, hide, remove, and reorder them. Layers listed later render above earlier layers.

The palette edits traced colors or excludes them from the SVG. The preview background swatches do not add a background to the exported file. A white region in the source is still traced unless **Remove near-white** is enabled or its palette color is excluded. Removing near-white also removes white highlights, not just the outer background.

## Limits and privacy

- Images and tracing stay on the device in browser memory. No uploads, accounts, analytics, or external font requests are used.
- Work is not saved across reloads or closing the tab. Keep original PNGs and export your SVG before closing.
- Procreate remains raster-based. Reimporting the SVG into a raster workflow will not preserve editable vector paths. NickVector is a tracing/export tool, not a vector path editor.
- Tracing creates new filled paths, not original brush strokes, centerline strokes, or recovered original layers. A flattened PNG cannot reveal its former layers.
- Shading becomes discrete color regions; soft gradients and low-resolution photos require cleanup in a vector editor. The sample is generated rose-and-dagger artwork, not the reference image from the conversation.
- Stencil mode is luminance thresholding, not automatic anatomical or linework interpretation. Dark shaded regions may become solid shapes. Export isolated linework from Procreate for cleaner stencil results.
- Alpha below roughly 12.5% is omitted; other semitransparent pixels are composited over white before tracing. Soft transparency is approximated rather than preserved exactly.
- Up to 12 layers, 20 MB per file, 24 megapixels per image, and 10,000 pixels on either side. All layers must have matching canvas dimensions. For a new document of a different size, remove existing layers first.
- Tracing resolution is capped at 800, 1200, or 1800 pixels on the longest side to limit iPad memory use. SVG output remains scalable, but resizing cannot recover missing source detail.
- Physical SVG dimensions preserve aspect ratio. Verify actual printed scale in the application and printer used for the stencil.

## Development and verification

Requires Node.js 20.19+ or 22.12+ compatible with Vite. Setup was tested with Node 24.19.0.

```powershell
npm ci
npm run dev -- --host 0.0.0.0 --port 5187 --strictPort
npm test
npx playwright install chromium webkit
npm run test:browser
npm run build
npm start
```

ImageTracer handles the tracing; deterministic sampled palettes and a Web Worker are used for stable results and responsive controls. Lucide provides interface icons. The browser suite covers desktop Chromium, touch iPad-sized WebKit, and phone Chromium, including rendered pixel checks and screenshots. WebKit emulation is not a physical iPad test; actual Safari downloads and local-network reachability still need device confirmation.

Build output is in `dist/`. The cottage repository's DreamHost GitHub Actions workflow builds and tests this app, then deploys only `dist/` to `/nickvector/`. Image processing still runs in the browser, not on DreamHost. Existing website pages and the gym app are separate.

For browser verification against the live deployment, set `NICKVECTOR_URL=https://rdpsplace.me/nickvector/` and run `npm run test:browser`. No images are uploaded by these tests.