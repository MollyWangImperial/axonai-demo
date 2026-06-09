-- AxonAI Rehab Supabase schema, RLS, and private video storage.
-- Run this in the Supabase SQL Editor after creating the Supabase project.
-- It assumes Supabase Auth is enabled and uses auth.users.id as the canonical
-- user id. Backend service-role requests can still bypass RLS when needed.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'axonai_user_role') then
    create type public.axonai_user_role as enum ('patient', 'therapist', 'admin');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'axonai_match_status') then
    create type public.axonai_match_status as enum ('waiting_for_therapist', 'accepted', 'declined', 'completed');
  end if;
end $$;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.axonai_user_role not null,
  display_name text,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.patient_profiles (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  full_name text,
  age_range text,
  gender text,
  language text default 'English',
  location text,
  stroke_type text,
  onset_time text,
  affected_side text,
  dominant_hand text,
  mobility_level text,
  upper_limb_ability text,
  safety_flags text[] not null default '{}',
  main_goal text,
  support_mode text,
  profile_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.therapist_profiles (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  full_name text,
  title text,
  profession text,
  location text,
  languages text,
  years_experience text,
  stroke_experience text,
  specialties text[] not null default '{}',
  assessments text[] not null default '{}',
  support_mode text,
  availability text,
  verified boolean not null default false,
  profile_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.uploaded_videos (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(user_id) on delete cascade,
  package_key text not null,
  action_id text not null,
  bucket_id text not null default 'axonai-rehab-videos',
  object_path text not null,
  mime_type text,
  size_bytes bigint,
  quality_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(bucket_id, object_path)
);

create table if not exists public.package_analyses (
  id uuid primary key default gen_random_uuid(),
  package_key text not null,
  patient_user_id uuid references public.patient_profiles(user_id) on delete set null,
  recorded_videos_json jsonb not null default '{}'::jsonb,
  result_json jsonb not null default '{}'::jsonb,
  algorithm_version text,
  status text not null default 'generated',
  created_at timestamptz not null default now()
);

create table if not exists public.exercise_plans (
  id uuid primary key default gen_random_uuid(),
  patient_user_id uuid references public.patient_profiles(user_id) on delete cascade,
  analysis_id uuid references public.package_analyses(id) on delete set null,
  package_key text not null,
  plan_json jsonb not null default '{}'::jsonb,
  status text not null default 'pending_therapist_review',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.care_matches (
  id uuid primary key default gen_random_uuid(),
  patient_user_id uuid references public.patient_profiles(user_id) on delete cascade,
  therapist_user_id uuid references public.therapist_profiles(user_id) on delete set null,
  analysis_id uuid references public.package_analyses(id) on delete set null,
  matched_person_json jsonb not null default '{}'::jsonb,
  status public.axonai_match_status not null default 'waiting_for_therapist',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clinician_reviews (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid references public.package_analyses(id) on delete cascade,
  patient_user_id uuid references public.patient_profiles(user_id) on delete cascade,
  therapist_user_id uuid references public.therapist_profiles(user_id) on delete set null,
  review_json jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists patient_profiles_set_updated_at on public.patient_profiles;
create trigger patient_profiles_set_updated_at
before update on public.patient_profiles
for each row execute function public.set_updated_at();

drop trigger if exists therapist_profiles_set_updated_at on public.therapist_profiles;
create trigger therapist_profiles_set_updated_at
before update on public.therapist_profiles
for each row execute function public.set_updated_at();

drop trigger if exists exercise_plans_set_updated_at on public.exercise_plans;
create trigger exercise_plans_set_updated_at
before update on public.exercise_plans
for each row execute function public.set_updated_at();

drop trigger if exists care_matches_set_updated_at on public.care_matches;
create trigger care_matches_set_updated_at
before update on public.care_matches
for each row execute function public.set_updated_at();

drop trigger if exists clinician_reviews_set_updated_at on public.clinician_reviews;
create trigger clinician_reviews_set_updated_at
before update on public.clinician_reviews
for each row execute function public.set_updated_at();

create or replace function public.is_assigned_therapist(patient_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.care_matches
    where care_matches.patient_user_id = patient_id
      and care_matches.therapist_user_id = auth.uid()
      and care_matches.status in ('waiting_for_therapist', 'accepted')
  );
$$;

alter table public.profiles enable row level security;
alter table public.patient_profiles enable row level security;
alter table public.therapist_profiles enable row level security;
alter table public.uploaded_videos enable row level security;
alter table public.package_analyses enable row level security;
alter table public.exercise_plans enable row level security;
alter table public.care_matches enable row level security;
alter table public.clinician_reviews enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create own profile" on public.profiles;
create policy "Users can create own profile"
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Patients read own patient profile" on public.patient_profiles;
create policy "Patients read own patient profile"
on public.patient_profiles for select
to authenticated
using ((select auth.uid()) = user_id or public.is_assigned_therapist(user_id));

drop policy if exists "Patients create own patient profile" on public.patient_profiles;
create policy "Patients create own patient profile"
on public.patient_profiles for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Patients update own patient profile" on public.patient_profiles;
create policy "Patients update own patient profile"
on public.patient_profiles for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Therapists are discoverable" on public.therapist_profiles;
create policy "Therapists are discoverable"
on public.therapist_profiles for select
to authenticated
using (true);

drop policy if exists "Therapists create own therapist profile" on public.therapist_profiles;
create policy "Therapists create own therapist profile"
on public.therapist_profiles for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Therapists update own therapist profile" on public.therapist_profiles;
create policy "Therapists update own therapist profile"
on public.therapist_profiles for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Patients manage own uploaded video records" on public.uploaded_videos;
create policy "Patients manage own uploaded video records"
on public.uploaded_videos for all
to authenticated
using ((select auth.uid()) = owner_user_id or public.is_assigned_therapist(owner_user_id))
with check ((select auth.uid()) = owner_user_id);

drop policy if exists "Patients and assigned therapists read analyses" on public.package_analyses;
create policy "Patients and assigned therapists read analyses"
on public.package_analyses for select
to authenticated
using ((select auth.uid()) = patient_user_id or public.is_assigned_therapist(patient_user_id));

drop policy if exists "Patients create own analyses" on public.package_analyses;
create policy "Patients create own analyses"
on public.package_analyses for insert
to authenticated
with check ((select auth.uid()) = patient_user_id);

drop policy if exists "Patients and assigned therapists read exercise plans" on public.exercise_plans;
create policy "Patients and assigned therapists read exercise plans"
on public.exercise_plans for select
to authenticated
using ((select auth.uid()) = patient_user_id or public.is_assigned_therapist(patient_user_id));

drop policy if exists "Patients create own exercise plans" on public.exercise_plans;
create policy "Patients create own exercise plans"
on public.exercise_plans for insert
to authenticated
with check ((select auth.uid()) = patient_user_id);

drop policy if exists "Assigned therapists update exercise plans" on public.exercise_plans;
create policy "Assigned therapists update exercise plans"
on public.exercise_plans for update
to authenticated
using (public.is_assigned_therapist(patient_user_id))
with check (public.is_assigned_therapist(patient_user_id));

drop policy if exists "Patients and matched therapists read care matches" on public.care_matches;
create policy "Patients and matched therapists read care matches"
on public.care_matches for select
to authenticated
using ((select auth.uid()) = patient_user_id or (select auth.uid()) = therapist_user_id);

drop policy if exists "Patients create own care matches" on public.care_matches;
create policy "Patients create own care matches"
on public.care_matches for insert
to authenticated
with check ((select auth.uid()) = patient_user_id);

drop policy if exists "Matched therapists update care matches" on public.care_matches;
create policy "Matched therapists update care matches"
on public.care_matches for update
to authenticated
using ((select auth.uid()) = therapist_user_id)
with check ((select auth.uid()) = therapist_user_id);

drop policy if exists "Patients and assigned therapists read reviews" on public.clinician_reviews;
create policy "Patients and assigned therapists read reviews"
on public.clinician_reviews for select
to authenticated
using ((select auth.uid()) = patient_user_id or (select auth.uid()) = therapist_user_id);

drop policy if exists "Assigned therapists create reviews" on public.clinician_reviews;
create policy "Assigned therapists create reviews"
on public.clinician_reviews for insert
to authenticated
with check ((select auth.uid()) = therapist_user_id and public.is_assigned_therapist(patient_user_id));

drop policy if exists "Assigned therapists update reviews" on public.clinician_reviews;
create policy "Assigned therapists update reviews"
on public.clinician_reviews for update
to authenticated
using ((select auth.uid()) = therapist_user_id)
with check ((select auth.uid()) = therapist_user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'axonai-rehab-videos',
  'axonai-rehab-videos',
  false,
  262144000,
  array['video/mp4', 'video/quicktime', 'video/x-m4v', 'video/webm']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Patients upload own rehab videos" on storage.objects;
create policy "Patients upload own rehab videos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'axonai-rehab-videos'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);

drop policy if exists "Patients and assigned therapists read rehab videos" on storage.objects;
create policy "Patients and assigned therapists read rehab videos"
on storage.objects for select
to authenticated
using (
  bucket_id = 'axonai-rehab-videos'
  and (
    (select auth.uid())::text = (storage.foldername(name))[1]
    or public.is_assigned_therapist(((storage.foldername(name))[1])::uuid)
  )
);

drop policy if exists "Patients update own rehab videos" on storage.objects;
create policy "Patients update own rehab videos"
on storage.objects for update
to authenticated
using (
  bucket_id = 'axonai-rehab-videos'
  and (select auth.uid())::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'axonai-rehab-videos'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);

drop policy if exists "Patients delete own rehab videos" on storage.objects;
create policy "Patients delete own rehab videos"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'axonai-rehab-videos'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);

grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to authenticated;
grant all on all sequences in schema public to authenticated;
