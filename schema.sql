-- Enable RLS
alter table public.jobs enable row level security;

-- Create Jobs Table
create table public.jobs (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  title text not null,
  description text null,
  price numeric not null,
  location text not null,
  status text not null default 'pending'::text,
  is_urgent boolean not null default false,
  constraint jobs_pkey primary key (id)
);

-- Enable Realtime
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table public.jobs;

-- Policies (Simple for MVP)
create policy "Enable read access for all users" on public.jobs as permissive for select to public using (true);
create policy "Enable insert for all users" on public.jobs as permissive for insert to public with check (true);

-- Mock Data
insert into public.jobs (title, description, price, location, is_urgent)
values 
('Fuga en Cocina', 'Tubería rota bajo tarja', 850.00, 'Col. Roma Norte', true),
('Instalación Ventilador', 'Techo alto, requiere escalera', 450.00, 'Narvarte Poniente', false),
('Revisión Gas', 'Olor a gas en patio', 1200.00, 'Del Valle', true);
