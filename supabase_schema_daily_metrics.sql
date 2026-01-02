-- Table for storing daily financial metrics
create table if not exists daily_metrics (
  id bigint generated always as identity primary key,
  date date not null unique,
  revenue numeric default 0, -- Chiffre d'affaires
  margin numeric default 0, -- Marge
  receivables numeric default 0, -- Balance clients
  payables numeric default 0, -- Balance fournisseurs
  cash numeric default 0, -- Trésorerie disponible
  stock numeric default 0, -- Stocks
  financial_debts numeric default 0, -- Dettes financières
  created_at timestamp with time zone default now()
);

-- Enable RLS (Row Level Security)
alter table daily_metrics enable row level security;

-- Policy to allow all access for authenticated users (adjust as needed)
create policy "Allow all access for authenticated users" on daily_metrics
  for all using (true) with check (true);
