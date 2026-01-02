-- 1. Table des utilisateurs (pour l'admin)
create table if not exists users (
  id bigint generated always as identity primary key,
  username text not null unique,
  password text not null, -- Stockage simple (idéalement haché, mais simple pour la restauration)
  role text default 'admin',
  created_at timestamp with time zone default now()
);

-- Fonction de vérification (utilisée par /api/login)
create or replace function verify_user(p_username text, p_password text)
returns table(id bigint, role text) as $$
begin
  return query
  select u.id, u.role
  from users u
  where lower(u.username) = lower(p_username)
  and u.password = p_password;
end;
$$ language plpgsql security definer;

-- 2. Table sales_clean (Ventes nettoyées)
create table if not exists sales_clean (
  id bigint generated always as identity primary key,
  code_client text,
  client text,
  objet text,
  num_facture text,
  num_document_client text,
  date_facture date,
  total_ht numeric,
  total_ttc numeric,
  valide boolean,
  imp boolean,
  mail boolean,
  etat text,
  created_at timestamp with time zone default now()
);

-- 3. Table sales (Ventes brutes / autre format)
create table if not exists sales (
  id bigint generated always as identity primary key,
  date date,
  code_postal text,
  ville text,
  code_client text,
  nom_du_client text,
  quantite numeric,
  total_ventes numeric,
  marge_brute numeric,
  famille_des_clients text,
  vendeur_nom text,
  created_at timestamp with time zone default now()
);

-- 4. Table factures (Factures importées)
create table if not exists factures (
  id bigint generated always as identity primary key,
  code_client text,
  client text,
  client_normalized text generated always as (lower(trim(client))) stored,
  objet text,
  facture text,
  date_facture date,
  total_ht numeric,
  total_ttc numeric,
  created_at timestamp with time zone default now()
);

-- 5. Table client_vendeur (Lien Clients <-> Vendeurs)
create table if not exists client_vendeur (
  id bigint generated always as identity primary key,
  code_client text,
  societe text,
  nom text,
  prenom text,
  groupe text,
  code_postal text,
  ville text,
  vendeur text,
  created_at timestamp with time zone default now()
);

-- 6. Table imports (Historique des imports)
create table if not exists imports (
  id bigint generated always as identity primary key,
  file_name text,
  rows jsonb,
  created_at timestamp with time zone default now()
);

-- 7. Table daily_metrics (Saisie journalière pour le nouvel utilisateur)
create table if not exists daily_metrics (
  id bigint generated always as identity primary key,
  date date not null unique,
  revenue numeric default 0,
  margin numeric default 0,
  receivables numeric default 0,
  payables numeric default 0,
  cash numeric default 0,
  stock numeric default 0,
  financial_debts numeric default 0,
  created_at timestamp with time zone default now()
);

-- 8. Table vente_vendeur (Table consolidée pour le dashboard Icham)
create table if not exists vente_vendeur (
  id bigint generated always as identity primary key,
  date_facture date,
  code_client text,
  client text,
  ville text,
  vendeur text,
  total_ht numeric,
  total_ttc numeric,
  num_facture text,
  created_at timestamp with time zone default now()
);

-- Fonction de rafraîchissement (utilisée par /api/refresh-vente-vendeur)
-- Cette fonction joint sales_clean et client_vendeur pour remplir vente_vendeur
create or replace function refresh_vente_vendeur()
returns integer as $$
declare
  inserted_count integer;
begin
  -- Vider la table existante
  truncate table vente_vendeur;

  -- Insérer les nouvelles données consolidées
  insert into vente_vendeur (date_facture, code_client, client, ville, vendeur, total_ht, total_ttc, num_facture)
  select
    s.date_facture,
    s.code_client,
    s.client,
    cv.ville,
    cv.vendeur,
    s.total_ht,
    s.total_ttc,
    s.num_facture
  from sales_clean s
  left join client_vendeur cv on lower(trim(s.code_client)) = lower(trim(cv.code_client));

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$ language plpgsql security definer;

-- Active la sécurité Row Level Security (RLS) sur toutes les tables
alter table users enable row level security;
alter table sales_clean enable row level security;
alter table sales enable row level security;
alter table factures enable row level security;
alter table client_vendeur enable row level security;
alter table imports enable row level security;
alter table daily_metrics enable row level security;
alter table vente_vendeur enable row level security;

-- Politiques d'accès par défaut (Tout ouvert pour les utilisateurs authentifiés pour simplifier)
-- Vous pouvez restreindre cela plus tard si nécessaire.
create policy "Enable all access for authenticated users" on users for all using (true) with check (true);
create policy "Enable all access for authenticated users" on sales_clean for all using (true) with check (true);
create policy "Enable all access for authenticated users" on sales for all using (true) with check (true);
create policy "Enable all access for authenticated users" on factures for all using (true) with check (true);
create policy "Enable all access for authenticated users" on client_vendeur for all using (true) with check (true);
create policy "Enable all access for authenticated users" on imports for all using (true) with check (true);
create policy "Enable all access for authenticated users" on daily_metrics for all using (true) with check (true);
create policy "Enable all access for authenticated users" on vente_vendeur for all using (true) with check (true);

-- Insertion d'un admin par défaut (optionnel, à modifier)
-- insert into users (username, password, role) values ('admin', 'admin123', 'admin') on conflict do nothing;
