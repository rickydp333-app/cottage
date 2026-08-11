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

## What Gets Deployed

The workflow deploys only the live website files:

- `index.html`
- `app.js`
- `data.js`
- `styles.css`
- `service-worker.js`
- `manifest.webmanifest`
- `assets/`

## How Updates Work

1. Make changes locally
2. Commit them
3. Push to `main`
4. GitHub Actions deploys the updated site to DreamHost automatically

## Manual Trigger

You can also run the workflow manually from GitHub:

- `Actions` > `Deploy to DreamHost` > `Run workflow`
