create table if not exists public.confessions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 content text not null check (char_length(content) between 1 and 2000),
 created_at timestamptz not null default now()
);
create table if not exists public.likes (
 id uuid primary key default gen_random_uuid(),
 confession_id uuid not null references public.confessions(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 unique(confession_id,user_id)
);
create table if not exists public.comments (
 id uuid primary key default gen_random_uuid(),
 confession_id uuid not null references public.confessions(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 content text not null check (char_length(content) between 1 and 1000),
 created_at timestamptz not null default now()
);
create table if not exists public.reports (
 id uuid primary key default gen_random_uuid(),
 confession_id uuid not null references public.confessions(id) on delete cascade,
 reporter_id uuid not null references auth.users(id) on delete cascade,
 reason text not null,
 created_at timestamptz not null default now()
);
alter table public.confessions enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.reports enable row level security;
drop policy if exists "Anyone can read confessions" on public.confessions;
drop policy if exists "Users can post confessions" on public.confessions;
drop policy if exists "Users can delete own confessions" on public.confessions;
drop policy if exists "Anyone can read likes" on public.likes;
drop policy if exists "Users can like" on public.likes;
drop policy if exists "Users can unlike" on public.likes;
drop policy if exists "Anyone can read comments" on public.comments;
drop policy if exists "Users can comment" on public.comments;
drop policy if exists "Users can delete own comments" on public.comments;
drop policy if exists "Users can submit reports" on public.reports;
drop policy if exists "Users can read own reports" on public.reports;
create policy "Anyone can read confessions" on public.confessions for select to authenticated using (true);
create policy "Users can post confessions" on public.confessions for insert to authenticated with check (auth.uid()=user_id);
create policy "Users can delete own confessions" on public.confessions for delete to authenticated using (auth.uid()=user_id);
create policy "Anyone can read likes" on public.likes for select to authenticated using (true);
create policy "Users can like" on public.likes for insert to authenticated with check (auth.uid()=user_id);
create policy "Users can unlike" on public.likes for delete to authenticated using (auth.uid()=user_id);
create policy "Anyone can read comments" on public.comments for select to authenticated using (true);
create policy "Users can comment" on public.comments for insert to authenticated with check (auth.uid()=user_id);
create policy "Users can delete own comments" on public.comments for delete to authenticated using (auth.uid()=user_id);
create policy "Users can submit reports" on public.reports for insert to authenticated with check (auth.uid()=reporter_id);
create policy "Users can read own reports" on public.reports for select to authenticated using (auth.uid()=reporter_id);
