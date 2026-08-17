Deployment runbook — Vercel (GitHub App integration)

Purpose: step-by-step deployment and verification for EduQuery using Vercel's GitHub integration (no tokens required for Vercel itself).

A. Preparation (locally)
1. Ensure your repo is up-to-date and pushed to GitHub (main branch recommended):
   git add -A && git commit -m "Prepare for Vercel deploy" && git push origin main

2. Confirm build works locally:
   npm install
   npm run build
   # Inspect dist/
   ls -la dist
   # Optional: run server locally
   node server.js
   # Open http://localhost:3000 to sanity-check

B. Vercel import (GitHub App integration)
1. Sign in to Vercel (https://vercel.com).
2. Click "New Project" → "Import from Git Repository" → select GitHub.
3. If prompted, install/authorize the Vercel GitHub App. Grant access to this repository (or repo list) so Vercel can read it.
4. Select the repository and click "Import".
5. On the import settings page set:
   - Framework Preset: Other
   - Build Command: npm run build
   - Output Directory: dist
6. Before deploying, go to Project Settings → Environment Variables and add variables from vercel.env.example.
   - Use the same names and copy values (PROXY_API_TOKEN should be a random token you generate).
   - Set environment to both Preview and Production unless you want different values per environment.
7. Click Deploy. Vercel will build and publish the site.

C. Post-deploy verification (manual)
1. From the Vercel dashboard, open the deployed URL (https://<your-project>.vercel.app).
2. Confirm the homepage loads without 500 errors.
3. Test the UI ask flow with a small question.
4. Open browser dev tools (Network tab) and watch calls to /api/llm-proxy — confirm they return 200 and JSON.

D. Automatic verification (scripts)
- Use one of the included scripts to automate smoke tests against the live URL:
  - PowerShell: scripts/test-deploy.ps1
  - Bash: scripts/test-deploy.sh

Usage examples:
  # PowerShell
  .\scripts\test-deploy.ps1 -BaseUrl "https://your-project.vercel.app" -ProxyToken "<PROXY_API_TOKEN>"

  # Bash
  ./scripts/test-deploy.sh https://your-project.vercel.app <PROXY_API_TOKEN>

E. Troubleshooting checklist
- Build fails: ensure node >=18 and Build Command/Output Directory are correct.
- Private repo import: re-authorize Vercel GitHub App and confirm repository access.
- /api/llm-proxy returns 401: ensure PROXY_API_TOKEN matches the token set in Vercel and that client sends Authorization: Bearer <token>.
- API returns 429: reduce LLM_RATE_MAX or set a higher LLM_RATE_WINDOW_MS; consider adding Upstash/Redis for production.
- Slow or timeout: serverless cold-start; reduce model size or move to a dedicated server if latency is critical.

F. Post-deploy security reminders
- Do NOT commit tokens or .env to the repository.
- Keep PROXY_API_TOKEN rotated if shared.
- Monitor function logs in Vercel for errors or excessive usage.

G. Next automation options (optional)
- Add a GitHub Action that triggers a curl smoke test and fails the build if the site or API does not respond.
- Add branch protections so main only accepts PRs that pass CI (recommended).

If you want, I can:
- generate a PR template and branch-protection suggestion
- add a GitHub Action step to run scripts/test-deploy.sh against the live preview URL after deploy (requires storing PROXY_API_TOKEN as a repo secret)
