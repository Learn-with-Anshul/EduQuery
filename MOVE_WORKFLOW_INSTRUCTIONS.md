GitHub Actions workflow placement

This environment could not create the .github/workflows folder automatically. To activate CI and Deploy workflows on GitHub, move the generated workflow files into .github/workflows in your local clone.

From your project root (local machine):

# create folder
mkdir -p .github/workflows

# move the CI workflow into place
mv ci.yml .github/workflows/ci.yml

# move the Deploy workflow into place
mv deploy.yml .github/workflows/deploy.yml

# commit and push
git add .github/workflows/ci.yml .github/workflows/deploy.yml
git commit -m "Add CI and Vercel deploy workflows"
git push origin main

Notes:
- The CI workflow starts on pushes/PRs to main/master and will run the build and smoke-test.
- The Deploy workflow runs on pushes to main and uses the Vercel GitHub Action. Configure the following repository secrets in GitHub:
  - VERCEL_TOKEN
  - VERCEL_ORG_ID
  - VERCEL_PROJECT_ID

If you prefer, create the workflows directly in the GitHub UI when creating them.
