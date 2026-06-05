-- Levity Check-In Agent — Database Schema
-- Run this in your Supabase SQL editor

create table if not exists founders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text not null,
  context text,
  created_at timestamptz default now()
);

create table if not exists checkins (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid references founders(id) on delete cascade not null,
  week_number integer not null,
  conversation_transcript jsonb default '[]'::jsonb,
  summary jsonb,
  scores jsonb,
  flags jsonb default '[]'::jsonb,
  commitment text,
  status text default 'in_progress' check (status in ('in_progress', 'completed')),
  created_at timestamptz default now()
);

create index if not exists checkins_founder_id_idx on checkins(founder_id);
create index if not exists checkins_created_at_idx on checkins(created_at desc);

-- Enable Row Level Security (public read since no per-user auth on founder side)
alter table founders enable row level security;
alter table checkins enable row level security;

-- Allow all reads/writes via anon key (we handle auth at the app layer)
create policy "Allow all" on founders for all using (true) with check (true);
create policy "Allow all" on checkins for all using (true) with check (true);

-- Seed founders — Cohort 3, Phase 1
insert into founders (name, short_name, context) values
  (
    'Shaibu Abigail Modupeoluwa',
    'Abigail',
    'Retail business selling original perfume, shoes, and vintage shirts bundled together at an affordable price. Sees high demand and few competitors combining all three.'
  ),
  (
    'Pamela Abari',
    'Pamela',
    '"Jellof by P" — Food business targeting the gap of evening food vendors in the school environment. Plans to do daily food sales, cater events (birthdays, hangouts), and make soup bowls on order.'
  ),
  (
    'Princess Bonkat',
    'Princess',
    'Livestock business, rearing chickens for a short period. Market is not very saturated. Has an existing customer base and plans to expand through social media.'
  ),
  (
    'Miracle',
    'Miracle',
    'Graphic designer who wants to start a printing and branding business. Sees demand for branded clothes in school and locality but few reliable options. Goal is quality design and printing services for students, events, and businesses.'
  ),
  (
    'Daniel Lawson',
    'Daniel',
    'Entrepreneur in Levity Cohort 3 validation period.'
  )
on conflict do nothing;
