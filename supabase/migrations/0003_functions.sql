-- =====================================================================
-- MSME POS — RPC Functions
-- =====================================================================

-- ---------- next_reference_number --------------------------------------
-- Returns the next reference number for (business, date, type).
-- Atomic upsert + increment. Format: TXN-YYYYMMDD-00001 (zero-padded to 5).
create or replace function public.next_reference_number(
  p_business_id uuid,
  p_type        text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today  date := (now() at time zone 'utc')::date;
  v_counter int;
  v_prefix text  := upper(p_type);
begin
  if not public.is_member(p_business_id) then
    raise exception 'not a member of this business';
  end if;
  if v_prefix not in ('TXN','EXP','ADJ','REC') then
    raise exception 'invalid reference type: %', p_type;
  end if;

  insert into public.reference_sequences(business_id, seq_date, seq_type, last_counter)
  values (p_business_id, v_today, v_prefix, 1)
  on conflict (business_id, seq_date, seq_type)
  do update set last_counter = public.reference_sequences.last_counter + 1
  returning last_counter into v_counter;

  return v_prefix || '-' || to_char(v_today, 'YYYYMMDD') || '-' || lpad(v_counter::text, 5, '0');
end$$;

-- ---------- create_sale -----------------------------------------------
-- Atomic sale: insert transaction, items, deduct stock, log movements.
-- Called from /lib/services/transactions.ts.
-- p_items json: [{product_id, quantity, unit_price, unit_cost, line_discount}]
create or replace function public.create_sale(
  p_business_id         uuid,
  p_payment_method      public.payment_method,
  p_external_ref        text,
  p_destination_account text,
  p_amount_tendered     numeric,
  p_discount_amount     numeric,
  p_discount_type       text,
  p_gross_total         numeric,
  p_net_total           numeric,
  p_notes               text,
  p_items               jsonb
)
returns public.transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ref text;
  v_tx  public.transactions;
  v_item jsonb;
  v_product_id uuid;
  v_qty numeric;
  v_change numeric := null;
begin
  if not public.is_member(p_business_id) then
    raise exception 'not a member of this business';
  end if;

  v_ref := public.next_reference_number(p_business_id, 'TXN');

  if p_payment_method = 'cash' and p_amount_tendered is not null then
    v_change := p_amount_tendered - p_net_total;
  end if;

  insert into public.transactions (
    business_id, ref_no, cashier_id, payment_method, external_ref,
    destination_account, amount_tendered, change_due, discount_amount,
    discount_type, gross_total, net_total, notes
  ) values (
    p_business_id, v_ref, auth.uid(), p_payment_method, nullif(p_external_ref,''),
    nullif(p_destination_account,''), p_amount_tendered, v_change, coalesce(p_discount_amount,0),
    coalesce(p_discount_type,'amount'), p_gross_total, p_net_total, nullif(p_notes,'')
  ) returning * into v_tx;

  -- Line items + stock deduction + movements
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty        := (v_item->>'quantity')::numeric;

    insert into public.transaction_items (
      transaction_id, product_id, product_name, quantity,
      unit_price, unit_cost, line_discount, line_total
    )
    select
      v_tx.id, p.id, p.name, v_qty,
      (v_item->>'unit_price')::numeric,
      coalesce(p.cost, 0),
      coalesce((v_item->>'line_discount')::numeric, 0),
      (v_qty * (v_item->>'unit_price')::numeric) - coalesce((v_item->>'line_discount')::numeric, 0)
    from public.products p where p.id = v_product_id;

    update public.products
      set stock = stock - v_qty
      where id = v_product_id and business_id = p_business_id;

    insert into public.stock_movements (
      business_id, product_id, delta, reason, source_type, source_id, ref_no, created_by
    ) values (
      p_business_id, v_product_id, -v_qty, 'sale', 'sale', v_tx.id, v_ref, auth.uid()
    );
  end loop;

  return v_tx;
end$$;

-- ---------- adjust_stock ----------------------------------------------
create or replace function public.adjust_stock(
  p_business_id uuid,
  p_product_id  uuid,
  p_delta       numeric,
  p_reason      text,
  p_source_type public.movement_source
)
returns public.stock_movements
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mov public.stock_movements;
  v_ref text := public.next_reference_number(p_business_id, 'ADJ');
begin
  if not public.has_role(p_business_id, array['owner','admin']::public.user_role[]) then
    raise exception 'insufficient role';
  end if;

  update public.products
    set stock = stock + p_delta
    where id = p_product_id and business_id = p_business_id;

  insert into public.stock_movements (
    business_id, product_id, delta, reason, source_type, ref_no, created_by
  ) values (
    p_business_id, p_product_id, p_delta, p_reason, p_source_type, v_ref, auth.uid()
  ) returning * into v_mov;

  return v_mov;
end$$;

-- ---------- create_reconciliation -------------------------------------
-- Persists a physical-count snapshot with computed expected quantities.
-- p_counts jsonb: [{product_id, actual_qty, note}]
create or replace function public.create_reconciliation(
  p_business_id uuid,
  p_note        text,
  p_counts      jsonb
)
returns public.reconciliation_snapshots
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ref text := public.next_reference_number(p_business_id, 'REC');
  v_snap public.reconciliation_snapshots;
  v_c jsonb;
begin
  if not public.has_role(p_business_id, array['owner','admin']::public.user_role[]) then
    raise exception 'insufficient role';
  end if;

  insert into public.reconciliation_snapshots (business_id, ref_no, note, created_by)
  values (p_business_id, v_ref, nullif(p_note,''), auth.uid())
  returning * into v_snap;

  for v_c in select * from jsonb_array_elements(p_counts) loop
    insert into public.reconciliation_items (
      snapshot_id, product_id, expected_qty, actual_qty, note
    )
    select
      v_snap.id,
      p.id,
      p.stock,
      (v_c->>'actual_qty')::numeric,
      nullif(v_c->>'note','')
    from public.products p
    where p.id = (v_c->>'product_id')::uuid
      and p.business_id = p_business_id;
  end loop;

  return v_snap;
end$$;
