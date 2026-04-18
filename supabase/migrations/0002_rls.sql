-- =====================================================================
-- MSME POS — Row-Level Security
-- Rule of thumb: all reads require a membership for the same business_id;
-- destructive writes require owner/admin; cashier is limited.
-- =====================================================================

-- --------- helper: is the caller a member of this business? ------------
create or replace function public.is_member(b_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.memberships
    where business_id = b_id and user_id = auth.uid()
  );
$$;

create or replace function public.has_role(b_id uuid, allowed public.user_role[])
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.memberships
    where business_id = b_id
      and user_id = auth.uid()
      and role = any(allowed)
  );
$$;

-- Enable RLS on every table
alter table public.businesses enable row level security;
alter table public.memberships enable row level security;
alter table public.product_categories enable row level security;
alter table public.expense_categories enable row level security;
alter table public.products enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_items enable row level security;
alter table public.stock_movements enable row level security;
alter table public.expenses enable row level security;
alter table public.reconciliation_snapshots enable row level security;
alter table public.reconciliation_items enable row level security;
alter table public.reference_sequences enable row level security;
alter table public.user_invites enable row level security;

-- ---------------- businesses -------------------------------------------
create policy "businesses_select_member"
  on public.businesses for select
  using (public.is_member(id));

create policy "businesses_insert_self_owner"
  on public.businesses for insert
  with check (owner_id = auth.uid());

create policy "businesses_update_owner"
  on public.businesses for update
  using (public.has_role(id, array['owner']::public.user_role[]))
  with check (public.has_role(id, array['owner']::public.user_role[]));

create policy "businesses_delete_owner"
  on public.businesses for delete
  using (public.has_role(id, array['owner']::public.user_role[]));

-- ---------------- memberships ------------------------------------------
create policy "memberships_select_self_or_admin"
  on public.memberships for select
  using (
    user_id = auth.uid()
    or public.has_role(business_id, array['owner','admin']::public.user_role[])
  );

create policy "memberships_insert_owner_or_self_first"
  on public.memberships for insert
  with check (
    public.has_role(business_id, array['owner']::public.user_role[])
    or (
      -- Allow the business owner to bootstrap their own membership
      user_id = auth.uid()
      and exists (
        select 1 from public.businesses b
        where b.id = business_id and b.owner_id = auth.uid()
      )
    )
  );

create policy "memberships_update_owner"
  on public.memberships for update
  using (public.has_role(business_id, array['owner']::public.user_role[]))
  with check (public.has_role(business_id, array['owner']::public.user_role[]));

create policy "memberships_delete_owner"
  on public.memberships for delete
  using (public.has_role(business_id, array['owner']::public.user_role[]));

-- ---------------- categories -------------------------------------------
create policy "pcat_all_member"
  on public.product_categories for select using (public.is_member(business_id));
create policy "pcat_write_staff"
  on public.product_categories for all
  using (public.has_role(business_id, array['owner','admin']::public.user_role[]))
  with check (public.has_role(business_id, array['owner','admin']::public.user_role[]));

create policy "ecat_select_member"
  on public.expense_categories for select using (public.is_member(business_id));
create policy "ecat_write_staff"
  on public.expense_categories for all
  using (public.has_role(business_id, array['owner','admin']::public.user_role[]))
  with check (public.has_role(business_id, array['owner','admin']::public.user_role[]));

-- ---------------- products ---------------------------------------------
create policy "products_select_member"
  on public.products for select using (public.is_member(business_id));
create policy "products_write_staff"
  on public.products for all
  using (public.has_role(business_id, array['owner','admin']::public.user_role[]))
  with check (public.has_role(business_id, array['owner','admin']::public.user_role[]));

-- ---------------- transactions ----------------------------------------
-- Cashiers CAN insert sales, CAN read their own day's sales; owner/admin
-- can read all. Updates/deletes are forbidden from the client.
create policy "tx_select_staff"
  on public.transactions for select
  using (
    public.has_role(business_id, array['owner','admin']::public.user_role[])
    or (public.is_member(business_id) and cashier_id = auth.uid())
  );
create policy "tx_insert_member"
  on public.transactions for insert
  with check (public.is_member(business_id));
create policy "tx_update_admin"
  on public.transactions for update
  using (public.has_role(business_id, array['owner','admin']::public.user_role[]));

create policy "tx_items_select_parent"
  on public.transaction_items for select
  using (exists (
    select 1 from public.transactions t
    where t.id = transaction_id
      and (
        public.has_role(t.business_id, array['owner','admin']::public.user_role[])
        or (public.is_member(t.business_id) and t.cashier_id = auth.uid())
      )
  ));
create policy "tx_items_insert_parent"
  on public.transaction_items for insert
  with check (exists (
    select 1 from public.transactions t
    where t.id = transaction_id and public.is_member(t.business_id)
  ));

-- ---------------- stock_movements -------------------------------------
create policy "mov_select_staff"
  on public.stock_movements for select
  using (public.has_role(business_id, array['owner','admin']::public.user_role[]));
create policy "mov_insert_member"
  on public.stock_movements for insert
  with check (public.is_member(business_id));

-- ---------------- expenses --------------------------------------------
create policy "exp_select_staff"
  on public.expenses for select
  using (public.has_role(business_id, array['owner','admin']::public.user_role[]));
create policy "exp_write_staff"
  on public.expenses for all
  using (public.has_role(business_id, array['owner','admin']::public.user_role[]))
  with check (public.has_role(business_id, array['owner','admin']::public.user_role[]));

-- ---------------- reconciliation --------------------------------------
create policy "rec_select_staff"
  on public.reconciliation_snapshots for select
  using (public.has_role(business_id, array['owner','admin']::public.user_role[]));
create policy "rec_write_staff"
  on public.reconciliation_snapshots for all
  using (public.has_role(business_id, array['owner','admin']::public.user_role[]))
  with check (public.has_role(business_id, array['owner','admin']::public.user_role[]));

create policy "rec_items_select_parent"
  on public.reconciliation_items for select
  using (exists (
    select 1 from public.reconciliation_snapshots s
    where s.id = snapshot_id
      and public.has_role(s.business_id, array['owner','admin']::public.user_role[])
  ));
create policy "rec_items_write_parent"
  on public.reconciliation_items for all
  using (exists (
    select 1 from public.reconciliation_snapshots s
    where s.id = snapshot_id
      and public.has_role(s.business_id, array['owner','admin']::public.user_role[])
  ))
  with check (exists (
    select 1 from public.reconciliation_snapshots s
    where s.id = snapshot_id
      and public.has_role(s.business_id, array['owner','admin']::public.user_role[])
  ));

-- ---------------- reference_sequences ---------------------------------
-- Read-only to members; writes happen through the SECURITY DEFINER function
-- next_reference_number() so we don't have to grant direct update.
create policy "refseq_select_member"
  on public.reference_sequences for select using (public.is_member(business_id));

-- ---------------- invites ---------------------------------------------
create policy "invites_select_owner"
  on public.user_invites for select
  using (public.has_role(business_id, array['owner']::public.user_role[]));
create policy "invites_write_owner"
  on public.user_invites for all
  using (public.has_role(business_id, array['owner']::public.user_role[]))
  with check (public.has_role(business_id, array['owner']::public.user_role[]));
