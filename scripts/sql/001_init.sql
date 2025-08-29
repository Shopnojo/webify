begin;

create table if not exists organizers (
  id uuid primary key,
  name text not null,
  created_at timestamp with time zone default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid references organizers(id) on delete cascade,
  title text not null,
  venue text not null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  created_at timestamptz default now()
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  title text not null,
  room text,
  start_time timestamptz,
  end_time timestamptz,
  duration_minutes int,
  track text,
  created_at timestamptz default now()
);

create table if not exists attendees (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  created_at timestamptz default now()
);

create table if not exists registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  attendee_id uuid references attendees(id) on delete cascade,
  checked_in boolean default false,
  checked_in_at timestamptz
);

create table if not exists tickets (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid references registrations(id) on delete cascade,
  qr_payload jsonb not null,
  qr_signature text not null,
  created_at timestamptz default now()
);

-- Engagement (realtime is via channels; still persist as needed)
create table if not exists qa_questions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  attendee_id uuid,
  content text not null,
  created_at timestamptz default now()
);

create table if not exists polls (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  question text not null,
  created_at timestamptz default now()
);
create table if not exists poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid references polls(id) on delete cascade,
  text text not null
);
create table if not exists poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid references polls(id) on delete cascade,
  option_id uuid references poll_options(id) on delete cascade,
  attendee_id uuid,
  created_at timestamptz default now(),
  unique (poll_id, attendee_id)
);

create table if not exists leaderboard_points (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  attendee_id uuid,
  points int not null default 0,
  updated_at timestamptz default now(),
  unique (event_id, attendee_id)
);

-- Analytics & Recommendations
create table if not exists analytics_events (
  id bigserial primary key,
  name text not null,
  payload jsonb,
  ts timestamptz default now()
);
create table if not exists event_categories (
  event_id uuid primary key references events(id) on delete cascade,
  categories text[] default '{}'
);
create table if not exists interests (
  id uuid primary key default gen_random_uuid(),
  name text unique not null
);
create table if not exists user_interests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  interest_id uuid references interests(id) on delete cascade
);

-- Basic RLS
alter table organizers enable row level security;
alter table events enable row level security;
alter table sessions enable row level security;
alter table registrations enable row level security;
alter table tickets enable row level security;

-- Organizers can see their stuff
create policy if not exists organizer_events_select on events for select using (auth.uid() = organizer_id);
create policy if not exists organizer_events_ins on events for insert with check (auth.uid() = organizer_id);
create policy if not exists organizer_events_upd on events for update using (auth.uid() = organizer_id);

create policy if not exists organizer_sessions on sessions for all using (
  exists(select 1 from events e where e.id = sessions.event_id and e.organizer_id = auth.uid())
) with check (
  exists(select 1 from events e where e.id = sessions.event_id and e.organizer_id = auth.uid())
);

-- Registrations/tickets: organizers can see their event rows
create policy if not exists org_regs_select on registrations for select using (
  exists(select 1 from events e where e.id = registrations.event_id and e.organizer_id = auth.uid())
);
create policy if not exists org_tickets_select on tickets for select using (
  exists(select 1 from registrations r join events e on e.id = r.event_id where r.id = tickets.registration_id and e.organizer_id = auth.uid())
);

commit;
