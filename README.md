# EduQuery

EduQuery is a demo AI-powered student Q&A single-page application. This repository currently serves a static frontend (HTML/CSS/JS) with a tiny Node.js static server (server.js). Data and auth are mocked using localStorage for demo purposes.

## Getting started (development)

1. Install Node.js (LTS) from https://nodejs.org/
2. From the project folder:

   npm install

3. Development server (auto-restart):

   npm run dev

4. Open http://localhost:3000 in your browser.

## Helpful scripts

- npm run start  — run the bundled Node static server (server.js)
- npm run dev    — run nodemon to restart server on changes
- npm run bundle — bundle the JS with esbuild (config-free; single entry) and produce js/bundle.mjs
- npm run serve  — serve the current folder (requires `serve` package)

Build for production

1. npm install
2. npm run bundle
3. Serve the folder (or use the included Express server)

Environment

- Copy `.env.example` to `.env` and provide values for LLM_API_KEY and PORT if needed.
- The Express server implements POST /api/llm-proxy and supports the `gemini` provider by default. Set LLM_PROVIDER=gemini and GEMINI_MODEL to choose a model (example: `models/text-bison-001` or other available generative models).
- The server supports multiple providers. By default it uses the Hugging Face Inference API (LLM_PROVIDER=hf). It can also use Google Gemini (LLM_PROVIDER=gemini) if configured.

- Hugging Face: set HF_API_TOKEN in your .env (get a free token at https://huggingface.co/settings/tokens). Choose a model via HF_MODEL (default: gpt2). Note model capabilities and access vary — some larger models may require paid access.

- Gemini: the server includes an example Gemini integration but Gemini requires a Google Cloud project and billing enabled. For free testing use Hugging Face.

- Keep API keys and secrets out of source control. Use environment variables in your deployment platform.

Proxy usage

- The /api/llm-proxy endpoint is protected by a token. Set PROXY_API_TOKEN in your .env and make requests with an Authorization header:

  Authorization: Bearer <PROXY_API_TOKEN>

  For local testing you can also set the token in your browser console (not for production):

  localStorage.setItem('eduquery_proxy_token', '<PROXY_API_TOKEN>')

- You can tune rate limits via LLM_RATE_WINDOW_MS and LLM_RATE_MAX in the .env file.

## Next steps to make this production-ready

- Replace localStorage mocks with a real backend (Firestore, Postgres, etc.)
- Integrate real authentication (Firebase Auth / OAuth)
- Replace the demo AI engine with a secure server-side LLM proxy (do not call LLM APIs from the browser)
- Add bundling and static asset fingerprinting (esbuild/webpack/rollup) and update index.html to use built assets
- Add CI (GitHub Actions) and deploy to a static host (Netlify/Vercel) or a Node host, and enable HTTPS
- Add security headers, CSP, and sanitize user content (DOMPurify) before rendering

---

CI & Deployment

This repository includes two GitHub Actions workflow files at the repo root (`ci.yml` and `deploy.yml`). To activate CI on GitHub, move them into `.github/workflows/` in your local clone (see MOVE_WORKFLOW_INSTRUCTIONS.md for commands).

CI behavior (what the workflow does):
- Installs dependencies (npm ci) and runs the production build (npm run build).
- Starts the Node server (server.js) and performs a smoke-test to confirm the site responds on http://localhost:3000/.
- Optionally tests the /api/llm-proxy endpoint if a `PROXY_API_TOKEN` secret is configured in the repository secrets (the workflow reads `${{ secrets.PROXY_API_TOKEN }}`).

Repository secrets and environment variables used by the workflows and deployment:
- PROXY_API_TOKEN (optional for CI proxy smoke test; required by runtime/proxy in production)
- HF_API_TOKEN (optional — required if using Hugging Face provider in production)
- VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID (only required if using the Vercel GitHub Action; not required when using the GitHub App integration)

Deploy to Vercel (recommended)

A detailed step-by-step guide to enable the Vercel ↔ GitHub integration is provided in DEPLOY_VERCEL.md. In short:
1. Push the repository to GitHub.
2. In the Vercel dashboard, import the project and authorize the Vercel GitHub App to access your repository (this allows Vercel to deploy commits automatically — no token required).
3. Set Build Command: `npm run build` and Output Directory: `dist` during import.
4. Configure Environment Variables in the Vercel Project Settings: `PROXY_API_TOKEN`, `HF_API_TOKEN`, `HF_MODEL`, `LLM_PROVIDER`.

Why use the GitHub App integration?
- Easier setup: no need to store Vercel tokens as GitHub secrets.
- Automatic deploys on push: Vercel receives webhook events and starts builds when you push to the configured branch.
- Simpler secret handling: manage runtime env vars in the Vercel UI rather than in Actions secrets.

Notes:
- The CI proxy smoke test will only run if PROXY_API_TOKEN is set as a repository secret — this avoids leaking your local token in CI logs.
- The CI uses a short-lived local server instance to perform smoke tests; it does not expose secrets to external services.

Deployment troubleshooting checklist

- Build fails on Vercel: ensure Build Command is `npm run build` and Output Directory is `dist`.
- Private repo import fails: reconnect the Vercel GitHub App and grant access to the repository.
- AI responses fail: verify `PROXY_API_TOKEN`, `HF_API_TOKEN`, and the selected `HF_MODEL` exist in the Vercel project environment.
- First requests are slow: expect a cold start on free-tier serverless deployments; use short prompts and a smaller model.
- API rate limits trigger unexpectedly: lower `LLM_RATE_MAX` for testing and use a shared Redis/Upstash store for production-grade limits.

---

This project was prepared for local development. If you want, I can:
- extend CI to run additional checks (linting, unit tests), or
- add a Pull Request template and branch protection rules recommendation, or
- prepare a minimal deployment runbook for Vercel and GitHub integration.

Say which you'd like to do next and I'll implement it.