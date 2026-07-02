-- =========================================================================
--  Hennie & Jolinda — Eukalyptus Trouportaal — Supabase databasis
--  Plak hierdie HELE lêer in Supabase → SQL Editor → New query → Run.
--  Veilig om weer te hardloop (skep niks oor wat reeds bestaan nie).
-- =========================================================================

-- 1) TABELLE -------------------------------------------------------------

-- Redigeerbare werf-teks + instellings (sleutel → waarde). Gaste mag lees.
create table if not exists public.content (
  key        text primary key,
  value      text,
  updated_at timestamptz not null default now()
);

-- Gaste se RSVP's
create table if not exists public.rsvps (
  id          bigint generated always as identity primary key,
  lead_naam   text not null,            -- die persoon wat invul / eerste gas
  epos        text default '',          -- e-posadres (verpligtend op die werf wanneer hulle kom)
  gaste       jsonb not null default '[]'::jsonb,  -- ["Naam 1","Naam 2",...]
  aantal      integer not null default 0,
  kom         boolean not null default true,
  slaap       boolean not null default false,
  naweek      text default '',          -- 'naweek' | 'saterdag' | ''
  ontbyt      boolean not null default false,
  dieet       text default '',
  liedjies    jsonb not null default '[]'::jsonb,  -- ["lied 1","lied 2","lied 3"]
  boodskap    text default '',
  ekstra      jsonb not null default '{}'::jsonb,  -- antwoorde op eie/bygevoegde vrae {vraag: antwoord}
  created_at  timestamptz not null default now()
);
-- Maak seker die kolom bestaan ook op ouer tabelle (veilig om weer te hardloop):
alter table public.rsvps add column if not exists ekstra jsonb not null default '{}'::jsonb;
alter table public.rsvps add column if not exists epos text default '';
-- client_id: een ry per toestel, sodat 'n gas se RSVP-wysiging dieselfde ry opdateer (geen duplikate).
alter table public.rsvps add column if not exists client_id uuid;
create unique index if not exists rsvps_client_id_key on public.rsvps (client_id);
create index if not exists rsvps_created_at_idx on public.rsvps (created_at desc);

-- Funksie waardeur gaste hul RSVP stoor (voeg by OF dateer op volgens client_id).
create or replace function public.save_rsvp(p_client_id uuid, p_data jsonb)
returns void language plpgsql security definer set search_path = public as $func$
begin
  insert into public.rsvps
    (client_id, lead_naam, epos, gaste, aantal, kom, slaap, naweek, ontbyt, dieet, liedjies, boodskap, ekstra)
  values (
    p_client_id,
    coalesce(p_data->>'lead_naam',''), coalesce(p_data->>'epos',''), coalesce(p_data->'gaste','[]'::jsonb),
    coalesce((p_data->>'aantal')::int,0), coalesce((p_data->>'kom')::boolean,true),
    coalesce((p_data->>'slaap')::boolean,false), coalesce(p_data->>'naweek',''),
    coalesce((p_data->>'ontbyt')::boolean,false), coalesce(p_data->>'dieet',''),
    coalesce(p_data->'liedjies','[]'::jsonb), coalesce(p_data->>'boodskap',''),
    coalesce(p_data->'ekstra','{}'::jsonb)
  )
  on conflict (client_id) do update set
    lead_naam=excluded.lead_naam, epos=excluded.epos, gaste=excluded.gaste, aantal=excluded.aantal,
    kom=excluded.kom, slaap=excluded.slaap, naweek=excluded.naweek, ontbyt=excluded.ontbyt,
    dieet=excluded.dieet, liedjies=excluded.liedjies, boodskap=excluded.boodskap, ekstra=excluded.ekstra;
end;
$func$;
grant execute on function public.save_rsvp(uuid, jsonb) to anon, authenticated;

-- Privaat beplanner-data (begroting, verskaffers, ens.) — net die admin sien dit.
create table if not exists public.planner (
  key        text primary key,         -- bv. 'budget', 'suppliers'
  value      jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- 2) SEKURITEIT (Row Level Security) ------------------------------------

alter table public.content enable row level security;
alter table public.rsvps   enable row level security;
alter table public.planner enable row level security;

-- Inhoud: ENIGEEN mag lees (die werf het dit nodig) ...
drop policy if exists content_read_all on public.content;
create policy content_read_all on public.content for select using (true);
-- ... net die aangemelde admin mag dit verander.
drop policy if exists content_write_auth on public.content;
create policy content_write_auth on public.content
  for all to authenticated using (true) with check (true);

-- RSVP: ENIGEEN mag instuur ...
drop policy if exists rsvps_insert_anyone on public.rsvps;
create policy rsvps_insert_anyone on public.rsvps
  for insert to anon, authenticated with check (true);
-- ... net die admin mag die lys sien / wysig.
drop policy if exists rsvps_select_auth on public.rsvps;
create policy rsvps_select_auth on public.rsvps
  for select to authenticated using (true);
drop policy if exists rsvps_modify_auth on public.rsvps;
create policy rsvps_modify_auth on public.rsvps
  for update to authenticated using (true) with check (true);
drop policy if exists rsvps_delete_auth on public.rsvps;
create policy rsvps_delete_auth on public.rsvps
  for delete to authenticated using (true);

-- Beplanner: NET die admin (aangemeld) — gaste sien dit glad nie.
drop policy if exists planner_all_auth on public.planner;
create policy planner_all_auth on public.planner
  for all to authenticated using (true) with check (true);

-- 3) FOTO-BERGING (Supabase Storage) ------------------------------------
-- Publieke emmer 'foto' vir foto's wat jy in die admin oplaai.
-- Almal mag die foto's SIEN; net die aangemelde admin mag oplaai/verander/verwyder.
insert into storage.buckets (id, name, public)
values ('foto', 'foto', true)
on conflict (id) do nothing;

drop policy if exists foto_public_read on storage.objects;
create policy foto_public_read on storage.objects
  for select using (bucket_id = 'foto');

drop policy if exists foto_auth_insert on storage.objects;
create policy foto_auth_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'foto');

drop policy if exists foto_auth_update on storage.objects;
create policy foto_auth_update on storage.objects
  for update to authenticated using (bucket_id = 'foto') with check (bucket_id = 'foto');

drop policy if exists foto_auth_delete on storage.objects;
create policy foto_auth_delete on storage.objects
  for delete to authenticated using (bucket_id = 'foto');

-- Klaar! Die werf wys verstek-teks totdat jy dit in die Admin-bladsy verander.
