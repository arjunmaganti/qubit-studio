# Hosting Qubit Studio

The production UI is [qubit-studio-indol.vercel.app](https://qubit-studio-indol.vercel.app). Its same-origin API routes forward numerical requests to the separate [Railway simulation service](https://qubit-studio-simulation-production.up.railway.app).

## Vercel

The existing **qubit-studio** project follows the connected GitHub repository’s **main** branch. A push to main triggers a frontend production deployment.

- Root Directory: `ui`
- Framework: Next.js
- Node.js: 22.x, matching `ui/package.json`
- Install: `npm ci`
- Build: `npm run build`

`ui/vercel.json` preserves the framework and commands. Root Directory, Node version, Git integration, and environment variables remain Vercel project settings. This application needs Next.js server routes; do not use a static export.

Set these **server-side** variables in the Vercel production environment:

| Variable | Purpose |
| --- | --- |
| `QUBIT_API_URL` | `https://qubit-studio-simulation-production.up.railway.app` |
| `GEMINI_API_KEY` | Provider credential for explicit Gemini explanations; store its secret value only in Vercel. |
| `INSIGHTS_USE_LLM` | `1` enables the configured LLM insight path. |

Never add these credentials to source files or prefix them with `NEXT_PUBLIC_`. Redeploy the frontend after changing its environment variables. Local Myla teaching notes remain available without a provider credential.

## Railway

The **qubit-studio-simulation** service uses Docker with Python 3.12. Its source/build root is `simulation`; the Dockerfile starts Uvicorn on Railway’s `PORT`. The health endpoint is [`/health`](https://qubit-studio-simulation-production.up.railway.app/health). `simulation/railway.toml` records the Docker builder, health check, and restart policy; `.dockerignore` restricts the image context to the runtime files.

The current Railway service was deployed through the CLI and is not connected to GitHub autodeploy. Pushing main updates Vercel; backend changes require this separate deployment command, run from the repository root:

```bash
railway up simulation --path-as-root \
  --project 609aeeb0-d070-459a-b73f-027f3a8f02f8 \
  --environment 52acc3b0-a6b5-4673-82fc-3124486f5a10 \
  --service 27be103f-13d1-4dbc-a37b-94a472d21631 \
  --detach
```

These IDs scope the command to the existing production project and service. `--path-as-root` gives Docker the expected `simulation` directory contents. The command uploads local files, so run it from the intended main checkout. Detached submission does not prove success: check Railway deployment status and `/health` afterward.

## Verify a release

Confirm Vercel reports Ready, then load the production page and `/docs`. Exercise a numerical calculation and design search through the frontend’s `/api` routes, including baseline comparison. Open Myla to check immediate local notes; request Gemini separately to verify the provider configuration. A healthy frontend alone does not prove the numerical backend works.

Saved designs remain in the browser’s local storage; they are not account-synchronized.
