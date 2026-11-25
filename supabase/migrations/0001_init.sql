-- ═════════════════════════════════════════════════════════════
-- AAHBank initial schema — run this in the Supabase SQL Editor
-- (Dashboard → SQL Editor → New query → paste → Run)
-- ═════════════════════════════════════════════════════════════

-- 1. Profiles (one row per auth account)
create table if not exists public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  display_name    text,
  hide_leaderboard boolean not null default false,
  created_at      timestamptz not null default now()
);

-- 2. Questions (the class bank)
create table if not exists public.questions (
  id          uuid primary key default gen_random_uuid(),
  question    text not null,
  answers     jsonb not null,               -- {"A": "...", "B": "...", "C": "...", "D": "..."}
  correct     char(1) not null check (correct in ('A','B','C','D')),
  category    text not null default 'General',
  difficulty  text not null default 'Medium' check (difficulty in ('Easy','Medium','Hard')),
  author_id   uuid references auth.users (id) on delete set null,
  author_name text,
  created_at  timestamptz not null default now()
);
create index if not exists questions_created_idx on public.questions (created_at desc);
create index if not exists questions_author_idx  on public.questions (author_id);
create index if not exists questions_category_idx on public.questions (category);

-- 3. Quiz sessions (one per started quiz)
create table if not exists public.quiz_sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  total      integer not null default 0,
  answered   integer not null default 0,
  correct    integer not null default 0,
  finished   boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists sessions_user_idx on public.quiz_sessions (user_id, created_at desc);

-- 4. Attempts (one per graded answer)
create table if not exists public.attempts (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.quiz_sessions (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  chosen      char(1) check (chosen in ('A','B','C','D')),
  is_correct  boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists attempts_user_idx      on public.attempts (user_id, created_at desc);
create index if not exists attempts_question_idx  on public.attempts (question_id);
create index if not exists attempts_session_idx   on public.attempts (session_id);

-- ═════════════════════════════════════════════════════════════
-- Row Level Security
-- The Next.js API routes use the service-role key and always scope
-- queries by the authenticated user id; these policies protect the
-- tables from direct anon/authenticated access via the public key.
-- ═════════════════════════════════════════════════════════════

alter table public.profiles      enable row level security;
alter table public.questions     enable row level security;
alter table public.quiz_sessions enable row level security;
alter table public.attempts      enable row level security;

-- Profiles: public read (leaderboard needs it), self write.
drop policy if exists "profiles are public" on public.profiles;
create policy "profiles are public" on public.profiles for select using (true);
drop policy if exists "own profile upsert" on public.profiles;
create policy "own profile upsert" on public.profiles for insert to authenticated with check (auth.uid () = id);
drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid () = id);

-- Questions: everyone can read the bank; signed-in users add; authors edit/delete.
drop policy if exists "bank is public" on public.questions;
create policy "bank is public" on public.questions for select using (true);
drop policy if exists "signed-in can add" on public.questions;
create policy "signed-in can add" on public.questions for insert to authenticated with check (auth.uid () = author_id);
drop policy if exists "authors delete" on public.questions;
create policy "authors delete" on public.questions for delete to authenticated using (auth.uid () = author_id);
drop policy if exists "authors update" on public.questions;
create policy "authors update" on public.questions for update to authenticated using (auth.uid () = author_id);

-- Sessions & attempts: strictly owner-only.
drop policy if exists "own sessions select" on public.quiz_sessions;
create policy "own sessions select" on public.quiz_sessions for select to authenticated using (auth.uid () = user_id);
drop policy if exists "own sessions insert" on public.quiz_sessions;
create policy "own sessions insert" on public.quiz_sessions for insert to authenticated with check (auth.uid () = user_id);
drop policy if exists "own sessions update" on public.quiz_sessions;
create policy "own sessions update" on public.quiz_sessions for update to authenticated using (auth.uid () = user_id);
drop policy if exists "own sessions delete" on public.quiz_sessions;
create policy "own sessions delete" on public.quiz_sessions for delete to authenticated using (auth.uid () = user_id);

drop policy if exists "own attempts select" on public.attempts;
create policy "own attempts select" on public.attempts for select to authenticated using (auth.uid () = user_id);
drop policy if exists "own attempts insert" on public.attempts;
create policy "own attempts insert" on public.attempts for insert to authenticated with check (auth.uid () = user_id);
drop policy if exists "own attempts delete" on public.attempts;
create policy "own attempts delete" on public.attempts for delete to authenticated using (auth.uid () = user_id);

-- ═════════════════════════════════════════════════════════════
-- Auto-create a profile whenever someone signs up
-- ═════════════════════════════════════════════════════════════
create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user ();

-- ═════════════════════════════════════════════════════════════
-- (Optional) Starter questions — delete this block if you want an
-- empty bank. These match the Demo Mode samples.
-- ═════════════════════════════════════════════════════════════
insert into public.questions (question, answers, correct, category, difficulty, author_name) values
  ('Which document declared that “all men are created equal” and later became a touchstone for civil rights arguments?',
   '{"A":"The Constitution","B":"The Declaration of Independence","C":"The Emancipation Proclamation","D":"The Gettysburg Address"}',
   'B', 'General', 'Easy', 'Sample'),
  ('The 13th Amendment, ratified in 1865, accomplished which of the following?',
   '{"A":"Granted Black men the right to vote","B":"Abolished slavery in the United States","C":"Established the Freedmen’s Bureau","D":"Ended Reconstruction"}',
   'B', 'Unit 1', 'Easy', 'Sample'),
  ('What was the primary purpose of the Freedmen’s Bureau?',
   '{"A":"To enforce Black Codes in the South","B":"To negotiate peace with Confederate states","C":"To help formerly enslaved people with food, housing, education, and legal matters","D":"To oversee the first transcontinental railroad"}',
   'C', 'Unit 1', 'Medium', 'Sample'),
  ('Which case did the Supreme Court use to establish the “separate but equal” doctrine in 1896?',
   '{"A":"Brown v. Board of Education","B":"Plessy v. Ferguson","C":"Dred Scott v. Sandford","D":"Loving v. Virginia"}',
   'B', 'Unit 2', 'Easy', 'Sample'),
  ('Roughly how long did Reconstruction last before federal troops withdrew from the South?',
   '{"A":"About 3 years (1865–1868)","B":"About 12 years (1865–1877)","C":"About 30 years (1865–1895)","D":"About 45 years (1865–1910)"}',
   'B', 'Unit 1', 'Hard', 'Sample'),
  ('Booker T. Washington and W. E. B. Du Bois disagreed most famously over which issue?',
   '{"A":"Whether to pursue industrial education or immediate higher education and civil rights","B":"Whether slavery should be abolished","C":"Whether to support the Republican Party","D":"Whether to move West to homestead"}',
   'A', 'Unit 2', 'Medium', 'Sample'),
  ('The Great Migration refers to which movement of people?',
   '{"A":"Enslaved people escaping to Northern states via the Underground Railroad","B":"African Americans moving from the rural South to Northern and Western cities","C":"Settlers traveling the Oregon Trail","D":"Immigrants arriving through Ellis Island"}',
   'B', 'Unit 3', 'Medium', 'Sample'),
  ('Which organization, founded in 1909, fought segregation through the courts and remains active today?',
   '{"A":"The NAACP","B":"The Southern Christian Leadership Conference","C":"The Congress of Racial Equality","D":"The Universal Negro Improvement Association"}',
   'A', 'Unit 3', 'Easy', 'Sample');
