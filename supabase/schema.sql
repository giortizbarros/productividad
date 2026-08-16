-- Ejecutar una sola vez en el SQL Editor del proyecto de Supabase
-- (Supabase dashboard → SQL Editor → New query → pegar y correr).

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  hour smallint not null check (hour between 0 and 23),
  minute smallint not null default 0 check (minute in (0, 30)),
  title text not null,
  status text not null default 'pending' check (status in ('pending', 'done', 'skipped')),
  reason text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists tasks_user_date_idx on public.tasks (user_id, date);

alter table public.tasks enable row level security;

create policy "Users can view their own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own tasks"
  on public.tasks for update
  using (auth.uid() = user_id);

create policy "Users can delete their own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);
