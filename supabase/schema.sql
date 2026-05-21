-- =========================================================================
-- FormWhats MVP - Supabase schema
-- =========================================================================
-- Run this whole file in the Supabase SQL Editor:
--   Dashboard -> SQL Editor -> New query -> paste -> Run
--
-- It is idempotent enough for local development:
--   * "create table if not exists" so reruns won't error
--   * "create or replace function" for the trigger function
--   * Policies are dropped before being recreated to avoid duplicates
-- =========================================================================

-- gen_random_uuid() lives in pgcrypto on Supabase.
create extension if not exists pgcrypto;

-- -------------------------------------------------------------------------
-- Tables
-- -------------------------------------------------------------------------

create table if not exists public.forms (
    id              uuid primary key default gen_random_uuid(),
    title           text not null,
    slug            text not null unique,
    description     text,
    whatsapp_number text not null,
    is_active       boolean default true,
    created_at      timestamptz default now(),
    updated_at      timestamptz default now()
);

create table if not exists public.form_fields (
    id          uuid primary key default gen_random_uuid(),
    form_id     uuid references public.forms(id) on delete cascade,
    label       text not null,
    field_key   text not null,
    field_type  text not null,
    required    boolean default false,
    sort_order  integer default 0,
    created_at  timestamptz default now()
);

create table if not exists public.responses (
    id               uuid primary key default gen_random_uuid(),
    form_id          uuid references public.forms(id) on delete cascade,
    data_json        jsonb not null,
    whatsapp_message text,
    submitted_at     timestamptz default now()
);

-- -------------------------------------------------------------------------
-- Indexes
-- -------------------------------------------------------------------------

create index if not exists forms_slug_idx         on public.forms (slug);
create index if not exists form_fields_form_idx   on public.form_fields (form_id);
create index if not exists responses_form_idx     on public.responses (form_id);

-- -------------------------------------------------------------------------
-- updated_at trigger for forms
-- -------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists set_forms_updated_at on public.forms;

create trigger set_forms_updated_at
before update on public.forms
for each row
execute function public.set_updated_at();

-- -------------------------------------------------------------------------
-- Row Level Security
-- -------------------------------------------------------------------------
-- WARNING: The policies below are OPEN (allow all) and exist only to make
-- local MVP development easier. They MUST be tightened before production:
--   * lock writes behind authenticated business owners,
--   * lock reads of `responses` to the form owner,
--   * keep a public read on `forms` + `form_fields` for the public form page.
-- =========================================================================

alter table public.forms       enable row level security;
alter table public.form_fields enable row level security;
alter table public.responses   enable row level security;

-- forms ------------------------------------------------------------------

drop policy if exists "mvp_forms_select" on public.forms;
drop policy if exists "mvp_forms_insert" on public.forms;
drop policy if exists "mvp_forms_update" on public.forms;
drop policy if exists "mvp_forms_delete" on public.forms;

create policy "mvp_forms_select" on public.forms for select using (true);
create policy "mvp_forms_insert" on public.forms for insert with check (true);
create policy "mvp_forms_update" on public.forms for update using (true) with check (true);
create policy "mvp_forms_delete" on public.forms for delete using (true);

-- form_fields ------------------------------------------------------------

drop policy if exists "mvp_form_fields_select" on public.form_fields;
drop policy if exists "mvp_form_fields_insert" on public.form_fields;
drop policy if exists "mvp_form_fields_update" on public.form_fields;
drop policy if exists "mvp_form_fields_delete" on public.form_fields;

create policy "mvp_form_fields_select" on public.form_fields for select using (true);
create policy "mvp_form_fields_insert" on public.form_fields for insert with check (true);
create policy "mvp_form_fields_update" on public.form_fields for update using (true) with check (true);
create policy "mvp_form_fields_delete" on public.form_fields for delete using (true);

-- responses --------------------------------------------------------------

drop policy if exists "mvp_responses_select" on public.responses;
drop policy if exists "mvp_responses_insert" on public.responses;
drop policy if exists "mvp_responses_update" on public.responses;
drop policy if exists "mvp_responses_delete" on public.responses;

create policy "mvp_responses_select" on public.responses for select using (true);
create policy "mvp_responses_insert" on public.responses for insert with check (true);
create policy "mvp_responses_update" on public.responses for update using (true) with check (true);
create policy "mvp_responses_delete" on public.responses for delete using (true);
