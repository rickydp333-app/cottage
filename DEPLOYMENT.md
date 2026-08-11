# Deployment

This site can be deployed to Netlify or any static host.

## Netlify
1. Create a Netlify site and connect this repository.
2. Set the publish directory to the project root.
3. Deploy.

The site entry point is index.html.

## Automatic Updates (Recommended)

Use Git + Netlify continuous deployment:

1. Create a GitHub repository for this project.
2. Add that repository as this local git remote.
3. Connect the GitHub repository to Netlify.
4. Enable production deploys from your main branch.

After that, each push to main automatically updates the live website.

## Direct Deploy From This Folder

If you prefer direct deploy without Git pushes, this project includes `deploy_website.cmd`.

One-time setup:

1. Create a Netlify personal access token.
2. Copy your Netlify site ID.
3. Set user environment variables:
	- `NETLIFY_AUTH_TOKEN`
	- `NETLIFY_SITE_ID`

Then run:

- VS Code task: `Deploy Website (Netlify Production)`
- Or command: `deploy_website.cmd`
