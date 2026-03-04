create table apiaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  created_at timestamp default now()
);

create table hives (
  id uuid primary key default gen_random_uuid(),
  apiary_id uuid references apiaries(id) not null,
  name text not null,
  created_at timestamp default now()
);

create table inspections (
  id uuid primary key default gen_random_uuid(),
  hive_id uuid references hives(id) not null,
  user_id uuid not null,
  queen_seen boolean,
  queen_color text,
  brood_frames integer,
  colony_strength text,
  treatment text,
  notes text,
  transcript text,
  audio_url text,
  created_at timestamp default now()
);

alter table apiaries enable row level security;
alter table hives enable row level security;
alter table inspections enable row level security;

create policy "Users can access their own apiaries" on apiaries for all using (auth.uid() = user_id);
create policy "Users can access their own hives" on hives for all using (
  auth.uid() = (select user_id from apiaries where id = hives.apiary_id)
);
create policy "Users can access their own inspections" on inspections for all using (auth.uid() = user_id);

insert into storage.buckets (id, name, public) values ('inspection-audio', 'inspection-audio', false);

create policy "Users can access their own audio" on storage.objects for all using (
  bucket_id = 'inspection-audio' and auth.uid()::text = (string_to_array(name, '/'))[1]
);
