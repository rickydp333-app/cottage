# Deployment

This site is configured for GitHub-to-DreamHost deployment.

## Automatic Updates To DreamHost

The repository includes a GitHub Actions workflow at `.github/workflows/deploy-dreamhost.yml`.

Every push to `main` can automatically deploy the live website files to DreamHost.

## One-Time Setup In GitHub

Open your GitHub repository:

- `Settings` > `Secrets and variables` > `Actions`

Add these repository secrets:

1. `DREAMHOST_HOST`
	- Your DreamHost SSH host name.
	- Example format: `iad1-shared-b8-xx.dreamhost.com`

2. `DREAMHOST_PORT`
	- Usually `22`

3. `DREAMHOST_USER`
	- Your DreamHost SSH username

4. `DREAMHOST_WEB_ROOT`
	- The full server path for the live site
	- Example: `/home/username/rdpsplace.me`

5. `DREAMHOST_SSH_KEY`
	- A private SSH key with access to that DreamHost account

6. `DREAMHOST_OPENAI_KEY` (Optional, only if deploying whats-it-worth app)
	- Your OpenAI API key for the AI appraisal feature
	- Note: This should also be set on the server in `~/.openai_key`

## What Gets Deployed

The workflow deploys the live website files:

- Main site files: `index.html`, `app.js`, `data.js`, `styles.css`, `service-worker.js`, `manifest.webmanifest`, `assets/`
- renterscottage calendar app (all files)
- whats-it-worth app (built dist/ and api.php)

## How Updates Work

1. Make changes locally
2. Commit them
3. Push to `main`
4. GitHub Actions deploys the updated site to DreamHost automatically

## Spotify Speaker Control Setup

The main site includes `spotify-api.php`, which keeps Spotify credentials on DreamHost and exposes only speaker names and playback actions to guests. Create `~/.spotify_cottage_config.php` on DreamHost with PHP-readable permissions:

```php
<?php
return [
	'client_id' => 'SPOTIFY_CLIENT_ID',
	'client_secret' => 'SPOTIFY_CLIENT_SECRET',
	'redirect_uri' => 'https://rdpsplace.me/spotify-api.php?action=callback',
	'playlist_uri' => 'spotify:playlist:4pVircYHKLwc4f5mhZgadW'
];
```

Then visit `https://rdpsplace.me/spotify-api.php?action=authorize` while signed in as the dedicated Spotify Premium account. The callback stores the refresh token in the same private file. The client secret and refresh token must never be committed or placed in the website assets.

## Manual Trigger

You can also run the workflow manually from GitHub:

- `Actions` > `Deploy to DreamHost` > `Run workflow`

## whats-it-worth App Setup

The whats-it-worth app at `/wiw/` is a React app that provides AI-powered item appraisals.

### Server Configuration

The app requires an OpenAI API key on the DreamHost server:

1. SSH into your DreamHost account
2. Create a file `~/.openai_key` containing your OpenAI API key
3. Ensure it's readable by your web server user

The app will automatically detect and use this key when handling appraisal requests at `/wiw/api.php`.

## Full-screen / PWA kiosk

Install RDPs Place using Install App (or the browser's Install/Add to Home Screen menu), then launch its icon. The manifest requests fullscreen with standalone fallback. Home, Back, and Full Screen controls are shared by the guide, `/renterscottage/`, and `/wiw/`. The existing route is `/renterscottage/`, not `/rentercottage/`.

Internal links stay in the app. External HTTP(S) links open a separate popup with its opener removed; the original page provides Close / Back to RDPs Place and explains blocked popups. Closing that prompt attempts to close the external window; browsers may require closing the external window manually. Telephone, email, downloads, and embedded Spotify controls retain their existing behavior. Cross-origin redirects and content inside external frames remain controlled by that site's browser context. Browser security may show the external address, and a Close control cannot be inserted into someone else's page.

For a locked device, configure Windows Assigned Access/Edge kiosk or Samsung Knox's web kiosk with `https://rdpsplace.me/` as the start URL and an appropriate destination allowlist. Fullscreen/PWA alone does not disable OS shortcuts or prevent exiting. Device policies must be configured on the actual kiosk; this repository change does not change device settings.

The service worker caches only public guide assets. Booking/appraisal pages show an offline notice when unreachable; API responses and private configuration are not stored by the worker. Deployment includes the shared controls, offline page, and correctly sized PNG icons. No Android packaged assets are changed by this website release.

Validation: JavaScript syntax checks, production Vite build, and browser checks for mobile layout, same-window internal links, install guidance, blocked popups, return controls, offline guide/subpage behavior, and cache exclusions.
