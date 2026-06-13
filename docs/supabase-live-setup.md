# SlideMatrixAI Supabase Live Setup

Use this checklist when connecting the local app to a real Supabase project.

## 1. Create the Supabase Project

1. Go to the Supabase dashboard and create a new project.
2. Open the project Connect dialog.
3. Copy the Project URL.
4. Copy the Publishable key. Supabase now recommends the publishable key format for browser-safe client operations.

## 2. Add Local Environment Variables

Create `.env.local` from `.env.local.example` and fill these values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here
```

Keep service-role or secret keys out of the browser. This app only needs the publishable key for the current auth and project-save flow.

## 3. Run the Database Migration

In the Supabase dashboard:

1. Open SQL Editor.
2. Paste the full contents of `supabase/migrations/0001_initial_slidematrixai.sql`.
3. Run the SQL.
4. Confirm these tables exist:
   - `public.projects`
   - `public.project_materials`

The migration enables row-level security. Authenticated users can only read, create, update, or delete their own projects.

## 4. Configure Auth Redirect URLs

In Supabase Auth URL settings, add the local callback URL:

```text
http://localhost:3002/auth/callback
```

When deploying to Vercel, also add the production callback URL:

```text
https://your-domain.com/auth/callback
```

## 5. Verify the Connection

Run:

```bash
npm run check:supabase
```

Expected result after keys are configured:

```text
Supabase environment looks reachable.
```

## 6. Test the Product Flow

1. Start the app:

```bash
npm run build
npm run start -- -p 3002
```

2. Open `http://localhost:3002/#generator`.
3. Enter your email in the Supabase sign-in box.
4. Click `Send magic link`.
5. Open the magic link from your email.
6. Generate a blueprint.
7. Click `Save blueprint`.
8. Confirm a row appears in the `projects` table.

## Current Limits

- The app uses email magic links only.
- Project list UI is not built yet, but `/api/projects` can already list the authenticated user's saved projects.
- Cloudinary uploads and MiniMax generation still require their own environment keys.
