Vercel deployment (quick guide)

This repo includes a `vercel.json` and a serverless proxy at `api/llm-proxy.js` to make deploying to Vercel (free tier) straightforward.

Quick steps (summary)

1. Push your repository to GitHub.
2. In Vercel, import the GitHub repo (or enable the GitHub integration) and set Build Command: `npm run build`, Output Directory: `dist`.
3. Configure environment variables in Vercel (PROXY_API_TOKEN, HF_API_TOKEN, HF_MODEL, LLM_PROVIDER).
4. Deploy — Vercel will automatically build and publish the site and the serverless function at `/api/llm-proxy`.

Detailed step-by-step: Enable Vercel ↔ GitHub integration (with UI walkthrough)

1. Sign in to Vercel
   - Open https://vercel.com and sign in with your account (or create one).

2. Connect your Git provider
   - From the Vercel dashboard, click "New Project" or "Import Project".
   - Choose "Import from Git Repository" and select GitHub as the provider.
   - If Vercel prompts to connect your GitHub account or install the Vercel app on your GitHub account/organization, click the button to continue. You will be redirected to GitHub to authorize the Vercel app. Choose the repository (or organization) you want to give Vercel access to.

3. Select the repository
   - After authorization, Vercel shows a list of repositories. Select the repository that contains this project.
   - Click "Import" or "Continue" when ready.

4. Configure build & output settings
   - On the import settings page, set:
     - Framework Preset: Other
     - Build Command: npm run build
     - Output Directory: dist
   - Leave other settings as default unless you need a custom domain or path rewrites.

5. Set environment variables
   - Before the first deploy, add environment variables in the Vercel UI (Project Settings → Environment Variables) for both Preview and Production:
     - PROXY_API_TOKEN = <a secure random token>
     - HF_API_TOKEN = <your Hugging Face token> (optional for HF provider)
     - HF_MODEL = e.g., gpt2 (optional)
     - LLM_PROVIDER = hf (optional; defaults to 'hf')
     - LLM_RATE_WINDOW_MS / LLM_RATE_MAX = (optional)

   - Example: click "Environment Variables" → "Add"
     - Key: PROXY_API_TOKEN
     - Value: paste a secure token (do not commit this to Git)
     - Environment: both Preview & Production
     - Click "Save"

6. Deploy
   - Click "Deploy" on the import screen (or Vercel will deploy automatically after import). Vercel will run `npm run build` and publish the static assets in `dist/`.
   - After deployment, the site will be available at https://<your-project>.vercel.app and the serverless function at https://<your-project>.vercel.app/api/llm-proxy

7. Verify runtime behavior
   - Open the deployed site in a browser and test a sample question. For client-side testing of the proxy, you can store the local test token in your browser's console (for local dev only):
     localStorage.setItem('eduquery_proxy_token','<PROXY_API_TOKEN>')
   - For serverless deployment, the client must not expose HF_API_TOKEN; all requests to the provider happen server-side via the /api/llm-proxy endpoint.

Notes & tips

- No token in Actions: When Vercel is connected via the GitHub application integration, it will automatically deploy commits pushed to the selected branch without requiring a Vercel token or project IDs in GitHub Actions.
- For private repositories: ensure the Vercel GitHub App has access to the private repo or add the repository during the app installation process.
- If you want GitHub Actions to also trigger deployments, use the Vercel GitHub Action and provide VERCEL_TOKEN/ORG/PROJECT secrets (not required with the GitHub integration).
- For production-grade rate-limiting, use a shared store like Upstash (Redis) or Vercel KV.

Example environment values

These are example values you can copy into the Vercel UI for local testing or a small free-tier deployment. Replace them with your own real secrets.

- PROXY_API_TOKEN = eduquery-dev-7f29fef3-c718-4d4d-a57c-a5b18d5f5f8e
- HF_API_TOKEN = hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
- HF_MODEL = gpt2
- LLM_PROVIDER = hf
- LLM_RATE_WINDOW_MS = 60000
- LLM_RATE_MAX = 20

A few important notes:
- `PROXY_API_TOKEN` should be a strong random value; do not reuse a public or weak token.
- `HF_API_TOKEN` must be a valid token from Hugging Face. If your chosen model is rate-limited or not accessible, switch to another public model or a different provider.
- `HF_MODEL` can be changed to a public model that supports text generation and is available to your account.
- Keep `LLM_RATE_MAX` low at first for free-tier testing and raise it only after testing usage patterns.

FAQ: Common issues and fixes

Q: The build fails on Vercel with "missing package" or "npm install failed"
- Check the package.json and ensure the project has a valid `scripts` section and dependencies listed under `dependencies` or `devDependencies`.
- Ensure Node version is compatible. This project is designed for Node 18+.
- In the Vercel build settings, make sure the Build Command is `npm run build` and Output Directory is `dist`.
- If the repo includes `.env` files or machine-specific config, verify they are not required during the build.

Q: The app deploys, but the AI answer is not working
- Verify the Vercel environment variables are present in the correct environment (Production or Preview).
- Check that `PROXY_API_TOKEN` matches the one used by the frontend or by the call to `/api/llm-proxy`.
- Confirm that `HF_API_TOKEN` is valid and the selected `HF_MODEL` is accessible to the account.
- If the model is rate-limited or blocked, switch to a smaller public model or test with a different provider.

Q: The project is private in GitHub, but Vercel cannot import it
- Re-authorize the Vercel GitHub App or install it on the GitHub organization that owns the repo.
- Ensure the chosen repository is visible to the GitHub account used by Vercel.
- If the repo is private, Vercel must have access to it through the GitHub integration.

Q: The first request is slow or times out
- Serverless platforms can have cold starts; the first request may be slower as the function spins up.
- Keep prompts short and model requests modest while testing on free-tier accounts.
- Use a smaller model or fewer generated tokens to reduce latency.
- For heavier traffic or strict latency requirements, move to a dedicated server or use a managed platform with warm instances.

Q: The site is live, but the API proxy is rate-limiting too aggressively
- Reduce the request rate for testing by lowering `LLM_RATE_MAX` or widening the `LLM_RATE_WINDOW_MS`.
- If using serverless hosting, remember that in-memory rate limiting is best-effort only; a shared Redis/Upstash tier is better for production.
- Consider applying platform-level rate limits or using a queue for heavy workloads.

Q: Why does the deploy process require a Build Command and Output Directory?
- Vercel needs to know how to build the app and which folder contains the deployable static files.
- For this project, the build step produces `dist/`, so `npm run build` and `dist` are the correct values.

Integrating with GitHub Actions (optional)

This repository includes CI and deploy workflow files (ci.yml, deploy.yml) at the repo root in this distribution. Move them into `.github/workflows/` to enable them on your GitHub repo (see MOVE_WORKFLOW_INSTRUCTIONS.md).

- CI (ci.yml) runs on pushes and PRs to main/master and will:
  - install deps and run `npm run build`
  - start `server.js` locally and perform a smoke test against `http://localhost:3000/`
  - optionally test `/api/llm-proxy` if you add `PROXY_API_TOKEN` as a repository secret

- Deploy (deploy.yml) runs on pushes to main and only executes a build to surface a GitHub status before Vercel deploys via the GitHub App integration.

Security notes

- Never commit API tokens to the repository. Use GitHub repository secrets and Vercel Environment Variables for production keys.
- The CI proxy smoke-test uses the repository secret only within the Actions environment and will not print the token to logs. However, provider responses may include sensitive content — review logs before sharing.

Final deployment checklist (copy/paste)

Before you click Deploy on Vercel, confirm all of the following:

1. GitHub repository is pushed and visible to your Vercel account.
2. Vercel GitHub App is connected to the repository (or repo is imported manually).
3. Build settings are:
   - Framework Preset: Other
   - Build Command: npm run build
   - Output Directory: dist
4. Project environment variables are configured:
   - PROXY_API_TOKEN
   - HF_API_TOKEN
   - HF_MODEL
   - LLM_PROVIDER
5. The repository does not contain a committed `.env` file with real secrets.
6. You have tested the app locally with `npm run build` and `node server.js`.
7. You are ready to use a free-tier model and small prompts for validation.
8. If the AI response is still failing in production, check the Vercel function logs and confirm the provider token and model access.

Post-deploy verification checklist

- Open the live site URL from the Vercel dashboard.
- Confirm the homepage renders without 500 errors.
- Test the ask flow with a simple question.
- Open the browser dev tools and verify there are no blocked API calls or CORS errors.
- Confirm the `/api/llm-proxy` route is returning valid JSON and not a 401/429/500 error.
- Verify the function logs show the correct environment values are loaded.

If you want, I can:
- Move the workflows into `.github/workflows` in this repo and commit them (requires permission to create dot-folders here), or
- Add step-by-step screenshots (annotated) to this guide — provide an image upload destination or allow me to create images in the repo.
