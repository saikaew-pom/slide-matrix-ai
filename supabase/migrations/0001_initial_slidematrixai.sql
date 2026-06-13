create extension if not exists "pgcrypto";

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  deck_type text not null check (deck_type in ('report', 'sales', 'pitch')),
  audience_role text not null,
  communication_style text not null,
  key_message text not null,
  request_payload jsonb not null,
  blueprint jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_materials (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind text not null,
  size bigint not null default 0,
  provider text,
  url text,
  public_id text,
  extraction_status text,
  extracted_text text,
  created_at timestamptz not null default now()
);

create index projects_user_updated_idx on public.projects(user_id, updated_at desc);
create index project_materials_project_idx on public.project_materials(project_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_touch_updated_at
before update on public.projects
for each row
execute function public.touch_updated_at();

alter table public.projects enable row level security;
alter table public.project_materials enable row level security;

create policy "Users can read their own projects"
on public.projects
for select
to authenticated
using (auth.uid() is not null and auth.uid() = user_id);

create policy "Users can create their own projects"
on public.projects
for insert
to authenticated
with check (auth.uid() is not null and auth.uid() = user_id);

create policy "Users can update their own projects"
on public.projects
for update
to authenticated
using (auth.uid() is not null and auth.uid() = user_id)
with check (auth.uid() is not null and auth.uid() = user_id);

create policy "Users can delete their own projects"
on public.projects
for delete
to authenticated
using (auth.uid() is not null and auth.uid() = user_id);

create policy "Users can read their own project materials"
on public.project_materials
for select
to authenticated
using (auth.uid() is not null and auth.uid() = user_id);

create policy "Users can create their own project materials"
on public.project_materials
for insert
to authenticated
with check (
  auth.uid() is not null
  and auth.uid() = user_id
  and exists (
    select 1
    from public.projects
    where projects.id = project_materials.project_id
      and projects.user_id = auth.uid()
  )
);

create policy "Users can delete their own project materials"
on public.project_materials
for delete
to authenticated
using (auth.uid() is not null and auth.uid() = user_id);
