# Cottage Information Touchscreen

A touch-friendly web app for a cottage information display. It is designed for an Android TV box, Android mini PC, or embedded ARM device connected to a touchscreen over HDMI.

## Features

- Large touch targets for kiosk usage
- Tabs for local businesses, cottage rules, tips, and checklists
- Search and category filters
- Local checklist progress saved in browser storage
- Optional large-text accessibility toggle
- Offline support via service worker cache

## Edit Content

Update guest content in data.js:

- Local businesses: `businesses`
- Cottage rules: `rules`
- Helpful tips: `tips`
- Wi-Fi details: `wifi`
- Arrival and departure tasks: `checklists`

## Run Locally

Because service workers need an HTTP context, use a local web server.

### Option A: Python

```bash
python -m http.server 8080
```

Open http://localhost:8080

### Option B: Node

```bash
npx serve .
```

## Android Touchscreen Deployment

1. Copy the app folder to device storage or microSD.
2. Install a kiosk browser app (for example, Fully Kiosk Browser).
3. Set startup URL to your hosted app URL (local server or LAN URL).
4. Enable auto-start on boot and hide browser UI in kiosk settings.
5. Keep Ethernet connected for stable loading and updates.

## APK Build Consistency

Use `android/build_android.cmd` to build the APK. It now copies the latest root web files (`index.html`, `app.js`, `data.js`, `styles.css`, `service-worker.js`, `manifest.webmanifest`, and `assets/logo.jpg`) into `android/app/src/main/assets/www` before Gradle runs.

This keeps APK content aligned with the hosted website changes.

## Website Deployment

The website is set up for GitHub Actions deployment to DreamHost.

After GitHub repository secrets are configured, each push to `main` can automatically update the live site.

See `DEPLOYMENT.md` for the required DreamHost SSH secrets.

## Monthly Content Maintenance

1. Verify business phone numbers, addresses, and hours in `data.js`.
2. Remove or update records marked with uncertain notes (for example, "Address not confirmed").
3. Test Airbnb and VRBO calendar feeds from the Availability tab.
4. Confirm live event feed cards load without errors.
5. Bump `?v=` asset versions and service worker cache name when deploying updates.

## Suggested Device Setup

- Use wired Ethernet for reliability.
- Disable sleep/screensaver in Android settings.
- Keep brightness moderate for burn-in reduction.
- If audio prompts are needed, use 3.5 mm audio out to powered speakers.
