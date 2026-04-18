-- =====================================================================
-- MSME POS — Bootstrap helpers
-- RPC to atomically create the first business + owner membership + seed
-- default categories. Called from the onboarding page.
-- =====================================================================

create or replace function public.bootstrap_business(
  p_name      text,
  p_industry  text,
  p_currency  text,
  p_symbol    text,
  p_full_name text
)
returns public.businesses
language plpgsql
security definer
set search_path = public
as $$
declare
  v_biz public.businesses;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  insert into public.businesses (owner_id, name, industry, currency, currency_symbol)
  values (auth.uid(), p_name, nullif(p_industry,''), coalesce(nullif(p_currency,''),'PHP'), coalesce(nullif(p_symbol,''),'₱'))
  returning * into v_biz;

  insert into public.memberships (user_id, business_id, role, full_name)
  values (auth.uid(), v_biz.id, 'owner', nullif(p_full_name,''));

  -- Default product categories (industry-agnostic)
  insert into public.product_categories (business_id, name)
  values (v_biz.id, 'General'), (v_biz.id, 'Uncategorized');

  -- Default expense categories (common MSME buckets)
  insert into public.expense_categories (business_id, name)
  values
    (v_biz.id, 'Supplies'),
    (v_biz.id, 'Utilities'),
    (v_biz.id, 'Rent'),
    (v_biz.id, 'Salaries'),
    (v_biz.id, 'Transportation'),
    (v_biz.id, 'Marketing'),
    (v_biz.id, 'Repairs & Maintenance'),
    (v_biz.id, 'Miscellaneous');

  return v_biz;
end$$;
