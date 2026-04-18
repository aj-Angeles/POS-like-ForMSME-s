-- =====================================================================
-- MSME POS — Schema
-- Multi-tenant: every row scoped by business_id. RLS in 0002_rls.sql.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------- businesses ---------------------------------------------------
create table public.businesses (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users(id) on delete restrict,
  name            text not null,
  industry        text,
  currency        text not null default 'PHP',
  currency_symbol text not null default '₱',
  low_stock_default int not null default 5,
  variance_threshold numeric(10,2) not null default 5,
  theme           jsonb not null default '{
    "primary": "172 66% 42%",
    "accent":  "172 66% 95%",
    "radius":  "0.6rem"
  }'::jsonb,
  created_at      timestamptz not null default now()
);
create index idx_businesses_owner on public.businesses(owner_id);

-- ---------- memberships (users ↔ businesses with role) -------------------
-- Profile / role per auth user per business. One person can belong to
-- several businesses (the "switch business" UX supports that).
create type public.user_role as enum ('owner', 'admin', 'cashier');

create table public.memberships (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  business_id  uuid not null references public.businesses(id) on delete cascade,
  role         public.user_role not null default 'cashier',
  full_name    text,
  created_at   timestamptz not null default now(),
  unique (user_id, business_id)
);
create index idx_memberships_user on public.memberships(user_id);
create index idx_memberships_business on public.memberships(business_id);

-- ---------- categories --------------------------------------------------
create table public.product_categories (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now(),
  unique (business_id, name)
);
create index idx_product_categories_business on public.product_categories(business_id);

create table public.expense_categories (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now(),
  unique (business_id, name)
);
create index idx_expense_categories_business on public.expense_categories(business_id);

-- ---------- products ----------------------------------------------------
create table public.products (
  id                   uuid primary key default gen_random_uuid(),
  business_id          uuid not null references public.businesses(id) on delete cascade,
  name                 text not null,
  sku                  text not null,
  category_id          uuid references public.product_categories(id) on delete set null,
  unit                 text not null default 'pcs',
  price                numeric(12,2) not null check (price >= 0),
  cost                 numeric(12,2) not null default 0 check (cost >= 0),
  stock                numeric(12,3) not null default 0,
  low_stock_threshold  numeric(12,3) not null default 5,
  is_active            boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (business_id, sku)
);
create index idx_products_business on public.products(business_id);
create index idx_products_category on public.products(category_id);
create index idx_products_name_trgm on public.products using gin (name gin_trgm_ops);

create extension if not exists pg_trgm;

-- ---------- reference_sequences ----------------------------------------
-- Per-business, per-day, per-type counter. See next_reference_number()
-- in 0003_functions.sql.
create table public.reference_sequences (
  business_id  uuid not null references public.businesses(id) on delete cascade,
  seq_date     date not null,
  seq_type     text not null check (seq_type in ('TXN','EXP','ADJ','REC')),
  last_counter int  not null default 0,
  primary key (business_id, seq_date, seq_type)
);

-- ---------- transactions ------------------------------------------------
create type public.payment_method as enum ('cash','gcash','maya','bank_transfer','card','other');

create table public.transactions (
  id                   uuid primary key default gen_random_uuid(),
  business_id          uuid not null references public.businesses(id) on delete cascade,
  ref_no               text not null,
  cashier_id           uuid references auth.users(id) on delete set null,
  payment_method       public.payment_method not null,
  external_ref         text,
  destination_account  text,
  amount_tendered      numeric(12,2),
  change_due           numeric(12,2),
  discount_amount      numeric(12,2) not null default 0,
  discount_type        text check (discount_type in ('amount','percent')) default 'amount',
  gross_total          numeric(12,2) not null default 0,
  net_total            numeric(12,2) not null default 0,
  notes                text,
  created_at           timestamptz not null default now(),
  unique (business_id, ref_no)
);
create index idx_transactions_business_date on public.transactions(business_id, created_at desc);
create index idx_transactions_ref on public.transactions(business_id, ref_no);
create index idx_transactions_external_ref on public.transactions(business_id, external_ref);
create index idx_transactions_cashier on public.transactions(cashier_id);

create table public.transaction_items (
  id             uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  product_id     uuid not null references public.products(id) on delete restrict,
  product_name   text not null,
  quantity       numeric(12,3) not null check (quantity > 0),
  unit_price     numeric(12,2) not null,
  unit_cost      numeric(12,2) not null,
  line_discount  numeric(12,2) not null default 0,
  line_total     numeric(12,2) not null
);
create index idx_transaction_items_tx on public.transaction_items(transaction_id);
create index idx_transaction_items_product on public.transaction_items(product_id);

-- ---------- stock_movements --------------------------------------------
-- Ledger of every stock change. source_type tells you what caused it.
create type public.movement_source as enum ('sale','adjustment','restock','initial');

create table public.stock_movements (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  product_id   uuid not null references public.products(id) on delete cascade,
  delta        numeric(12,3) not null,
  reason       text,
  source_type  public.movement_source not null,
  source_id    uuid,
  ref_no       text,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index idx_stock_movements_business_date on public.stock_movements(business_id, created_at desc);
create index idx_stock_movements_product on public.stock_movements(product_id, created_at desc);

-- ---------- expenses ----------------------------------------------------
create table public.expenses (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  ref_no       text not null,
  category_id  uuid references public.expense_categories(id) on delete set null,
  amount       numeric(12,2) not null check (amount >= 0),
  external_ref text,
  note         text,
  expense_date date not null default (now() at time zone 'utc')::date,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  unique (business_id, ref_no)
);
create index idx_expenses_business_date on public.expenses(business_id, expense_date desc);
create index idx_expenses_category on public.expenses(category_id);

-- ---------- reconciliation ---------------------------------------------
create table public.reconciliation_snapshots (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  ref_no      text not null,
  note        text,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (business_id, ref_no)
);
create index idx_recon_business_date on public.reconciliation_snapshots(business_id, created_at desc);

create table public.reconciliation_items (
  id            uuid primary key default gen_random_uuid(),
  snapshot_id   uuid not null references public.reconciliation_snapshots(id) on delete cascade,
  product_id    uuid not null references public.products(id) on delete cascade,
  expected_qty  numeric(12,3) not null,
  actual_qty    numeric(12,3) not null,
  variance      numeric(12,3) generated always as (actual_qty - expected_qty) stored,
  note          text
);
create index idx_recon_items_snapshot on public.reconciliation_items(snapshot_id);
create index idx_recon_items_product on public.reconciliation_items(product_id);

-- ---------- invites -----------------------------------------------------
create table public.user_invites (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  email       text not null,
  role        public.user_role not null default 'cashier',
  invited_by  uuid references auth.users(id) on delete set null,
  token       text not null unique default encode(gen_random_bytes(24), 'base64'),
  status      text not null default 'pending' check (status in ('pending','accepted','revoked','expired')),
  expires_at  timestamptz not null default (now() + interval '7 days'),
  created_at  timestamptz not null default now()
);
create index idx_invites_business on public.user_invites(business_id);
create index idx_invites_email on public.user_invites(email);

-- ---------- touch trigger for products.updated_at -----------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end$$;

create trigger trg_products_touch
  before update on public.products
  for each row execute function public.touch_updated_at();
