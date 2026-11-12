# Confessly
Anonymous public confession feed built with React, Vite and Supabase.

## Setup
1. In Supabase, enable **Anonymous Sign-Ins** under Authentication providers.
2. Open SQL Editor and run `supabase/schema.sql`.
3. Copy `.env.example` to `.env` and fill in your Supabase Project URL and publishable key:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Run `npm install` then `npm run dev`.

## Deploy
Push this folder to GitHub, import the repository into Vercel, and add the same two environment variables in Vercel project settings. Deploy.

Never put a Supabase `service_role` or `sb_secret_...` key in frontend code. Before a public launch, add moderation review, rate limits, abuse handling, privacy terms, and a process to remove harmful posts. Anonymous authentication does not guarantee users cannot be identified by infrastructure logs.
