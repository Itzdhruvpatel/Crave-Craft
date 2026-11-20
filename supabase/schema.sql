-- Mummy Said So: Family Table schema for Supabase (free tier).
-- Paste into Supabase > SQL Editor > New query, then Run. Safe to run again.
-- Row level security keeps each family's data visible only to its own members.

create table if not exists families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique default upper(substr(md5(random()::text), 1, 6)),
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists members (
  family_id uuid not null references families (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null,
  -- hod = head of the kitchen; their decision is final
  role text not null default 'member' check (role in ('hod', 'member')),
  lang text not null default 'en' check (lang in ('en', 'hi', 'gu')),
  push_token text,
  joined_at timestamptz not null default now(),
  primary key (family_id, user_id)
);

-- The week plan the HOD shares. `hidden_until` powers surprise mode.
-- Members can't read a hidden menu row, so the reveal time is kept on the family for the countdown.
alter table families add column if not exists surprise_at timestamptz;

create table if not exists menus (
  family_id uuid not null references families (id) on delete cascade,
  day date not null,
  breakfast text[] not null default '{}',
  lunch text[] not null default '{}',
  dinner text[] not null default '{}',
  fast boolean not null default false,
  hidden_until timestamptz,
  updated_by uuid references auth.users (id),
  updated_at timestamptz not null default now(),
  primary key (family_id, day)
);

create table if not exists messages (
  id bigint generated always as identity primary key,
  family_id uuid not null references families (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text,
  voice_path text,
  dish_id text,
  created_at timestamptz not null default now(),
  check (body is not null or voice_path is not null or dish_id is not null)
);

create table if not exists polls (
  id bigint generated always as identity primary key,
  family_id uuid not null references families (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  question text not null,
  dish_ids text[] not null check (array_length(dish_ids, 1) between 2 and 4),
  closes_at timestamptz not null default now() + interval '3 hours',
  winner text,
  created_at timestamptz not null default now()
);

create table if not exists poll_votes (
  poll_id bigint not null references polls (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  dish_id text not null,
  primary key (poll_id, user_id)
);

-- "Petition to the HOD": a request for a dish, with a bribe attached.
create table if not exists petitions (
  id bigint generated always as identity primary key,
  family_id uuid not null references families (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  dish_id text not null,
  for_day date,
  meal text check (meal in ('breakfast', 'lunch', 'dinner')),
  bribe text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'later')),
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

-- Who is eating at home today, so portions match.
create table if not exists attendance (
  family_id uuid not null references families (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  meal text not null check (meal in ('breakfast', 'lunch', 'dinner')),
  eating boolean not null,
  primary key (family_id, user_id, day, meal)
);

-- Helpers used by the policies below.
create or replace function is_member(f uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from members where family_id = f and user_id = auth.uid());
$$;

create or replace function is_hod(f uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from members where family_id = f and user_id = auth.uid() and role = 'hod');
$$;

-- Join with the 6-letter code the HOD shares on WhatsApp.
create or replace function join_family(code text, name text, member_lang text default 'en') returns uuid
language plpgsql security definer set search_path = public as $$
declare f uuid;
begin
  select id into f from families where invite_code = upper(code);
  if f is null then raise exception 'No family with that code'; end if;
  insert into members (family_id, user_id, display_name, lang)
  values (f, auth.uid(), name, member_lang)
  on conflict (family_id, user_id) do update set display_name = excluded.display_name;
  return f;
end;
$$;

-- Creating a family makes you its HOD.
create or replace function create_family(family_name text, hod_name text, hod_lang text default 'en') returns uuid
language plpgsql security definer set search_path = public as $$
declare f uuid;
begin
  insert into families (name, created_by) values (family_name, auth.uid()) returning id into f;
  insert into members (family_id, user_id, display_name, role, lang) values (f, auth.uid(), hod_name, 'hod', hod_lang);
  return f;
end;
$$;

alter table families enable row level security;
alter table members enable row level security;
alter table menus enable row level security;
alter table messages enable row level security;
alter table polls enable row level security;
alter table poll_votes enable row level security;
alter table petitions enable row level security;
alter table attendance enable row level security;

drop policy if exists "members see their family" on families;
create policy "members see their family" on families for select using (is_member(id));
drop policy if exists "hod renames family" on families;
create policy "hod renames family" on families for update using (is_hod(id));

drop policy if exists "members see each other" on members;
create policy "members see each other" on members for select using (is_member(family_id));
drop policy if exists "members edit themselves" on members;
create policy "members edit themselves" on members for update using (user_id = auth.uid());
drop policy if exists "hod manages members" on members;
create policy "hod manages members" on members for delete using (is_hod(family_id) or user_id = auth.uid());

-- Surprise mode: members only see a hidden day after its reveal time; the HOD always sees it.
drop policy if exists "members read menu" on menus;
create policy "members read menu" on menus for select
  using (is_member(family_id) and (hidden_until is null or hidden_until <= now() or is_hod(family_id)));
drop policy if exists "hod writes menu" on menus;
create policy "hod writes menu" on menus for all using (is_hod(family_id)) with check (is_hod(family_id));

drop policy if exists "members read chat" on messages;
create policy "members read chat" on messages for select using (is_member(family_id));
drop policy if exists "members post chat" on messages;
create policy "members post chat" on messages for insert with check (is_member(family_id) and user_id = auth.uid());
drop policy if exists "authors delete own message" on messages;
create policy "authors delete own message" on messages for delete using (user_id = auth.uid());

drop policy if exists "members read polls" on polls;
create policy "members read polls" on polls for select using (is_member(family_id));
drop policy if exists "hod creates polls" on polls;
create policy "hod creates polls" on polls for insert with check (is_hod(family_id) and created_by = auth.uid());
drop policy if exists "hod closes polls" on polls;
create policy "hod closes polls" on polls for update using (is_hod(family_id));

drop policy if exists "members read votes" on poll_votes;
create policy "members read votes" on poll_votes for select
  using (exists (select 1 from polls p where p.id = poll_id and is_member(p.family_id)));
drop policy if exists "members vote once" on poll_votes;
create policy "members vote once" on poll_votes for insert
  with check (user_id = auth.uid() and exists (select 1 from polls p where p.id = poll_id and is_member(p.family_id) and p.closes_at > now()));
drop policy if exists "members change vote" on poll_votes;
create policy "members change vote" on poll_votes for update using (user_id = auth.uid());

drop policy if exists "members read petitions" on petitions;
create policy "members read petitions" on petitions for select using (is_member(family_id));
drop policy if exists "members file petitions" on petitions;
create policy "members file petitions" on petitions for insert with check (is_member(family_id) and user_id = auth.uid());
drop policy if exists "hod decides petitions" on petitions;
create policy "hod decides petitions" on petitions for update using (is_hod(family_id));

drop policy if exists "members read attendance" on attendance;
create policy "members read attendance" on attendance for select using (is_member(family_id));
drop policy if exists "members mark themselves" on attendance;
create policy "members mark themselves" on attendance for all using (user_id = auth.uid() and is_member(family_id))
  with check (user_id = auth.uid() and is_member(family_id));

-- Live updates for the chat, menu, polls and petitions screens.
-- Safe to run again: only adds tables not already in the realtime publication.
do $$
declare t text;
begin
  foreach t in array array['messages', 'menus', 'polls', 'poll_votes', 'petitions', 'attendance'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = t) then
      execute format('alter publication supabase_realtime add table %I', t);
    end if;
  end loop;
end $$;
