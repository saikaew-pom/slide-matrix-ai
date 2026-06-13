# SlideMatrixAI Deployment

## Production URLs

- App: https://slide-matrix-ai.vercel.app
- Vercel project: `psk-s-projects2/slide-matrix-ai`
- GitHub repo: https://github.com/saikaew-pom/slide-matrix-ai

## Current Vercel Environment Variables

Configured for Production and Development:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `MINIMAX_MODEL`
- `SLIDEMATRIX_ENABLE_DEV_AUTH=false`
- `CLOUDINARY_UPLOAD_FOLDER`

Not configured yet:

- `MINIMAX_API_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Without `MINIMAX_API_KEY`, blueprint generation uses the mock fallback. Without Cloudinary credentials, uploads fall back to local browser-only material handling.

## Supabase Production Auth Settings

In Supabase, set the production app URL before testing magic-link sign-in:

- Site URL: `https://slide-matrix-ai.vercel.app`
- Redirect URL: `https://slide-matrix-ai.vercel.app/auth/callback`

For local development, keep:

- Redirect URL: `http://localhost:3002/auth/callback`

## Deploy Commands

```bash
npm test
npm run lint
npm run build
npx vercel deploy --prod --yes
```

## Git Flow

The app folder is its own Git repo:

```bash
cd /Users/watcharapongsaikaew/Documents/SlideMatrixAI/slidematrixai-app
git status
git push
```
