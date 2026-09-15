-- Game State Model: core schema for Civilization Simulation MMO
-- Catalog tables use their `key` as primary key.
-- Run with: supabase db push  (or apply via SQL editor)

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type era as enum (
  'ancient', 'classical', 'medieval', 'renaissance', 'industrial',
  'modern', 'atomic', 'information', 'future'
);

create type unit_kind as enum ('military', 'civilian', 'siege', 'naval', 'air');

create type army_status as enum ('garrison', 'field', 'training');

create type diplomacy_status as enum (
  'neutral', 'peace', 'allied', 'war', 'trade_agreement'
);

create type event_category as enum (
  'news', 'economic', 'military', 'diplomacy', 'disaster', 'science', 'trade', 'social'
);

create type knowledge_status as enum ('proposed', 'accepted', 'completed', 'rejected');

-- ---------------------------------------------------------------------------
-- Nations
-- ---------------------------------------------------------------------------
create table public.nations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  banner text not null default '#b45309',
  slogan text,
  founded_at timestamptz not null default now(),
  last_tick timestamptz not null default now(),
  era era not null default 'ancient',
  population int not null default 1,
  stats jsonb not null default '{"food":0,"production":0,"gold":100,"science":0,"culture":0,"happiness":70,"stability":70,"corruption":0}'
);

-- ---------------------------------------------------------------------------
-- Catalog: resource categories
-- ---------------------------------------------------------------------------
create table public.resource_categories (
  key text primary key,
  name text not null,
  color text not null
);

-- Catalog: resources
create table public.resources (
  key text primary key,
  name text not null,
  category_key text not null references public.resource_categories (key),
  tier smallint not null default 1,
  value numeric not null default 1,
  weight numeric not null default 1,
  unlock_tech_key text
);

-- Catalog: technologies
create table public.technologies (
  key text primary key,
  name text not null,
  era era not null default 'ancient',
  cost numeric not null default 25,
  description text,
  prerequisites text[] not null default '{}',
  unlocks_resources text[] not null default '{}',
  unlocks_buildings text[] not null default '{}',
  unlocks_units text[] not null default '{}',
  unlocks_recipes text[] not null default '{}'
);

-- Catalog: buildings
create table public.buildings (
  key text primary key,
  name text not null,
  era era not null default 'ancient',
  cost_gold numeric not null default 50,
  cost_resources jsonb not null default '[]',
  maintenance numeric not null default 0,
  effects jsonb not null default '{}',
  outputs jsonb not null default '[]',
  unlock_tech_key text
);

-- Catalog: units
create table public.units (
  key text primary key,
  name text not null,
  kind unit_kind not null default 'military',
  era era not null default 'ancient',
  cost_gold numeric not null default 40,
  cost_resources jsonb not null default '[]',
  maintenance numeric not null default 1,
  stats jsonb not null default '{"combat":1,"movement":1,"defense":1}',
  unlock_tech_key text
);

-- Catalog: production recipes
create table public.recipes (
  key text primary key,
  name text not null,
  output_resource_key text not null references public.resources (key),
  output_qty numeric not null default 1,
  inputs jsonb not null default '[]',
  building_key text,
  unlock_tech_key text
);

-- ---------------------------------------------------------------------------
-- Nation-owned state
-- ---------------------------------------------------------------------------
create table public.nation_resources (
  nation_id uuid not null references public.nations (id) on delete cascade,
  resource_id text not null references public.resources (key) on delete cascade,
  amount numeric not null default 0,
  rate numeric not null default 0,
  unlocked boolean not null default true,
  discovered_at timestamptz,
  primary key (nation_id, resource_id)
);

create table public.nation_technologies (
  nation_id uuid not null references public.nations (id) on delete cascade,
  tech_id text not null references public.technologies (key) on delete cascade,
  researched_at timestamptz not null default now(),
  primary key (nation_id, tech_id)
);

create table public.tech_research (
  nation_id uuid not null references public.nations (id) on delete cascade,
  tech_id text not null references public.technologies (key) on delete cascade,
  invested numeric not null default 0,
  started_at timestamptz not null default now(),
  primary key (nation_id, tech_id)
);

create table public.cities (
  id uuid primary key default gen_random_uuid(),
  nation_id uuid not null references public.nations (id) on delete cascade,
  name text not null,
  founded_at timestamptz not null default now(),
  population int not null default 1,
  happiness numeric not null default 70,
  production_queue text[] not null default '{}'
);

create table public.city_buildings (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities (id) on delete cascade,
  building_id text not null references public.buildings (key) on delete cascade,
  level int not null default 1,
  constructed_at timestamptz not null default now()
);

create table public.armies (
  id uuid primary key default gen_random_uuid(),
  nation_id uuid not null references public.nations (id) on delete cascade,
  unit_id text not null references public.units (key) on delete cascade,
  name text not null,
  strength numeric not null default 1,
  stationed_city_id uuid references public.cities (id) on delete set null,
  status army_status not null default 'garrison'
);

-- ---------------------------------------------------------------------------
-- Diplomacy, knowledge transfer, events
-- ---------------------------------------------------------------------------
create table public.diplomacy (
  id uuid primary key default gen_random_uuid(),
  nation_a uuid not null references public.nations (id) on delete cascade,
  nation_b uuid not null references public.nations (id) on delete cascade,
  status diplomacy_status not null default 'neutral',
  updated_at timestamptz not null default now(),
  unique (nation_a, nation_b)
);

create table public.knowledge_transfers (
  id uuid primary key default gen_random_uuid(),
  from_nation uuid not null references public.nations (id) on delete cascade,
  to_nation uuid not null references public.nations (id) on delete cascade,
  tech_id text references public.technologies (key) on delete set null,
  resource_category text,
  status knowledge_status not null default 'proposed',
  created_at timestamptz not null default now()
);

create table public.game_events (
  id uuid primary key default gen_random_uuid(),
  nation_id uuid references public.nations (id) on delete cascade,
  category event_category not null default 'news',
  title text not null,
  description text,
  payload jsonb not null default '{}',
  occurs_at timestamptz not null default now(),
  expires_at timestamptz
);

create table public.event_choices (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.game_events (id) on delete cascade,
  key text not null,
  label text not null,
  description text,
  effects jsonb not null default '{}'
);

create table public.event_responses (
  nation_id uuid not null references public.nations (id) on delete cascade,
  event_id uuid not null references public.game_events (id) on delete cascade,
  choice_id uuid not null references public.event_choices (id) on delete cascade,
  responded_at timestamptz not null default now(),
  primary key (nation_id, event_id)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index nations_owner_idx on public.nations (owner_id);
create index nation_resources_nation_idx on public.nation_resources (nation_id);
create index cities_nation_idx on public.cities (nation_id);
create index city_buildings_city_idx on public.city_buildings (city_id);
create index armies_nation_idx on public.armies (nation_id);
create index game_events_nation_idx on public.game_events (nation_id);
create index knowledge_transfers_to_nation_idx on public.knowledge_transfers (to_nation);
create index knowledge_transfers_from_nation_idx on public.knowledge_transfers (from_nation);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.resource_categories enable row level security;
alter table public.resources enable row level security;
alter table public.technologies enable row level security;
alter table public.buildings enable row level security;
alter table public.units enable row level security;
alter table public.recipes enable row level security;
alter table public.nations enable row level security;
alter table public.nation_resources enable row level security;
alter table public.nation_technologies enable row level security;
alter table public.tech_research enable row level security;
alter table public.cities enable row level security;
alter table public.city_buildings enable row level security;
alter table public.armies enable row level security;
alter table public.diplomacy enable row level security;
alter table public.knowledge_transfers enable row level security;
alter table public.game_events enable row level security;
alter table public.event_choices enable row level security;
alter table public.event_responses enable row level security;

-- Catalog tables are publicly readable
create policy "catalog readable by all" on public.resource_categories for select using (true);
create policy "catalog readable by all" on public.resources for select using (true);
create policy "catalog readable by all" on public.technologies for select using (true);
create policy "catalog readable by all" on public.buildings for select using (true);
create policy "catalog readable by all" on public.units for select using (true);
create policy "catalog readable by all" on public.recipes for select using (true);

-- Nations: owner manages own nation
create policy "own nation select" on public.nations for select using (owner_id = auth.uid());
create policy "own nation insert" on public.nations for insert with check (owner_id = auth.uid());
create policy "own nation update" on public.nations for update using (owner_id = auth.uid());

-- Nation-owned tables: matching nation owned by the current user
create policy "own nation resources" on public.nation_resources
  for all using (exists (select 1 from nations n where n.id = nation_id and n.owner_id = auth.uid()));
create policy "own nation technologies" on public.nation_technologies
  for all using (exists (select 1 from nations n where n.id = nation_id and n.owner_id = auth.uid()));
create policy "own tech research" on public.tech_research
  for all using (exists (select 1 from nations n where n.id = nation_id and n.owner_id = auth.uid()));
create policy "own cities" on public.cities
  for all using (exists (select 1 from nations n where n.id = nation_id and n.owner_id = auth.uid()));
create policy "own city buildings" on public.city_buildings
  for all using (exists (select 1 from cities c join nations n on n.id = c.nation_id where c.id = city_buildings.city_id and n.owner_id = auth.uid()));
create policy "own armies" on public.armies
  for all using (exists (select 1 from nations n where n.id = nation_id and n.owner_id = auth.uid()));

-- Diplomacy: participants see and edit their relationships
create policy "diplomacy visible" on public.diplomacy
  for all using (exists (select 1 from nations n where (n.id = nation_a or n.id = nation_b) and n.owner_id = auth.uid()));

-- Knowledge transfers: sender or receiver
create policy "transfers visible" on public.knowledge_transfers
  for all using (exists (select 1 from nations n where (n.id = from_nation or n.id = to_nation) and n.owner_id = auth.uid()));

-- Events: targeted to own nation, or global (nation_id null)
create policy "events visible" on public.game_events
  for select using (nation_id is null or exists (select 1 from nations n where n.id = game_events.nation_id and n.owner_id = auth.uid()));

-- Event choices public (read by all who can see the event)
create policy "choices visible" on public.event_choices for select
  using (exists (select 1 from game_events ge where ge.id = event_id and (ge.nation_id is null or exists (select 1 from nations n where n.id = ge.nation_id and n.owner_id = auth.uid()))));

-- Event responses: own nation responds to its events
create policy "own event responses" on public.event_responses
  for all using (exists (select 1 from nations n where n.id = nation_id and n.owner_id = auth.uid()))
  with check (exists (select 1 from nations n where n.id = nation_id and n.owner_id = auth.uid()));