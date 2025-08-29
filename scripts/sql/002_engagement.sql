-- Initial engagement hub schema: chat, Q&A, polls, leaderboard event log
-- Enable extensions as needed
create extension if not exists "pgcrypto";

-- Chat messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  author_id text,
  author_name text,
  content text not null,
  created_at timestamptz not null default now()
);

-- Q&A
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  author_id text,
  author_name text,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.question_votes (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  voter_id text not null,
  created_at timestamptz not null default now(),
  unique (question_id, voter_id)
);

-- Polls
create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  question text not null,
  is_open boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  text text not null
);

create table if not exists public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  voter_id text not null,
  created_at timestamptz not null default now(),
  unique (poll_id, voter_id)
);

-- Leaderboard events (append-only; aggregate in UI)
create table if not exists public.leaderboard_events (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  actor_id text not null,
  actor_name text,
  delta integer not null default 0,
  reason text,
  created_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_messages_event_created on public.messages(event_id, created_at);
create index if not exists idx_questions_event_created on public.questions(event_id, created_at);
create index if not exists idx_polls_event on public.polls(event_id);
create index if not exists idx_poll_options_poll on public.poll_options(poll_id);
create index if not exists idx_poll_votes_poll on public.poll_votes(poll_id);
create index if not exists idx_leaderboard_events_event on public.leaderboard_events(event_id);

-- RLS
alter table public.messages enable row level security;
alter table public.questions enable row level security;
alter table public.question_votes enable row level security;
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;
alter table public.leaderboard_events enable row level security;

-- Simple permissive policies (adjust later as needed)
do $$
begin
  if not exists (select 1 from pg_policies where polname = 'messages_select_all') then
    create policy messages_select_all on public.messages for select using (true);
  end if;
  if not exists (select 1 from pg_policies where polname = 'messages_insert_all') then
    create policy messages_insert_all on public.messages for insert with check (true);
  end if;

  if not exists (select 1 from pg_policies where polname = 'questions_select_all') then
    create policy questions_select_all on public.questions for select using (true);
  end if;
  if not exists (select 1 from pg_policies where polname = 'questions_insert_all') then
    create policy questions_insert_all on public.questions for insert with check (true);
  end if;

  if not exists (select 1 from pg_policies where polname = 'qvotes_select_all') then
    create policy qvotes_select_all on public.question_votes for select using (true);
  end if;
  if not exists (select 1 from pg_policies where polname = 'qvotes_insert_all') then
    create policy qvotes_insert_all on public.question_votes for insert with check (true);
  end if;

  if not exists (select 1 from pg_policies where polname = 'polls_select_all') then
    create policy polls_select_all on public.polls for select using (true);
  end if;
  if not exists (select 1 from pg_policies where polname = 'polls_insert_all') then
    create policy polls_insert_all on public.polls for insert with check (true);
  end if;

  if not exists (select 1 from pg_policies where polname = 'pollopts_select_all') then
    create policy pollopts_select_all on public.poll_options for select using (true);
  end if;
  if not exists (select 1 from pg_policies where polname = 'pollopts_insert_all') then
    create policy pollopts_insert_all on public.poll_options for insert with check (true);
  end if;

  if not exists (select 1 from pg_policies where polname = 'pollvotes_select_all') then
    create policy pollvotes_select_all on public.poll_votes for select using (true);
  end if;
  if not exists (select 1 from pg_policies where polname = 'pollvotes_insert_all') then
    create policy pollvotes_insert_all on public.poll_votes for insert with check (true);
  end if;

  if not exists (select 1 from pg_policies where polname = 'lbevents_select_all') then
    create policy lbevents_select_all on public.leaderboard_events for select using (true);
  end if;
  if not exists (select 1 from pg_policies where polname = 'lbevents_insert_all') then
    create policy lbevents_insert_all on public.leaderboard_events for insert with check (true);
  end if;
end$$;
