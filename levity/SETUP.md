# Levity Check-In Agent — Setup Guide

## 1. Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Copy your **Project URL** and **anon/public key** from Project Settings → API

## 2. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
TEAM_PASSWORD=your-chosen-password
```

Get your Anthropic API key at [console.anthropic.com](https://console.anthropic.com).

## 3. Run locally

```bash
npm install
npm run dev
```

- Founder flow: http://localhost:3000
- Team dashboard: http://localhost:3000/dashboard (use TEAM_PASSWORD)

## 4. Deploy to Vercel

1. Push this repo to GitHub
2. Import to [vercel.com](https://vercel.com)
3. Add the 4 environment variables in Vercel project settings
4. Deploy

Share the Vercel URL with founders via WhatsApp each week.

## How the app works

**Founders** visit the URL, pick their name, and have a 5-10 minute conversation with the agent. The agent opens the conversation, probes their week across 5 dimensions (Action, Surprise, Belief Shift, Struggle, Commitment), and closes naturally. When done, it auto-generates a structured summary + scores via a second Claude API call.

**Team** visits `/dashboard` with the team password to see all founders, their latest scores, flags, and full conversation transcripts. Week-over-week sparklines show score trends.

## Adding founders

Run an INSERT in Supabase SQL editor:
```sql
insert into founders (name, short_name, context) values
  ('Full Name Here', 'Short Name', 'One sentence about what they are building.');
```
