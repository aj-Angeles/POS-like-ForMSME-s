# Architecture

## Guiding principles

1. **Strict separation of concerns.** UI never touches Supabase. Business logic is pure. Data access is the only place that owns query mechanics.
2. **Multi-tenant safety by default.** `business_id` is on every row; RLS enforces scoping server-side so a bug in the app can't leak data between tenants.
3. **Atomic writes at the database.** Complex operations (sale, reconciliation, bootstrap) live in SQL functions. The client calls one RPC; all-or-nothing.
4. **Theming is data, not code.** Per-business theme JSON drives CSS variables at `:root`. Rebranding a tenant requires no redeploy.

## Layers

```
┌──────────────────────────────┐
│  components/ + app/          │  UI layer (presentational)
│  - reads from hooks          │  - never imports @supabase/*
│  - no business logic         │  - enforced by ESLint rule
├──────────────────────────────┤
│  hooks/                      │  React glue
│  - useAsync(service.fn)      │  - thin; owns loading/error state
├──────────────────────────────┤
│  lib/services/               │  Data access (ONLY place that touches Supabase)
│  - named functions           │  - typed Row/Insert/Update from generated types
│  - returns plain domain data │
├──────────────────────────────┤
│  lib/business-logic/         │  Pure functions
│  - cart / inventory / etc.   │  - zero deps, easy to unit-test
├──────────────────────────────┤
│  Supabase (Postgres + RLS)   │  Database + RPC
└──────────────────────────────┘
```

## Dependency rules

- `app/**` and `components/**` may import from `hooks/`, `lib/business-logic/`, `lib/types`, `lib/utils`, `lib/constants`, `stores/`. **Not** `lib/supabase/*` or `@supabase/*`.
- `hooks/**` may import from `lib/services/`, `lib/types`, `stores/`.
- `lib/services/**` is the only layer that may import `@supabase/supabase-js` types. Service fns take an `SB` client as their first arg — they never create one.

An ESLint rule (`no-restricted-imports`) enforces (1). See `.eslintrc.json`.

## Data model (summary)

| Table                       | Purpose                                              |
| --------------------------- | ---------------------------------------------------- |
| `businesses`                | Tenant root. Stores theme JSON.                      |
| `memberships`               | (user_id, business_id) + role (owner / admin / cashier). |
| `product_categories`        | Per-business product categories.                     |
| `expense_categories`        | Per-business expense categories.                     |
| `products`                  | SKU, price, cost, stock, low-stock threshold.        |
| `transactions`              | Sale header. ref_no unique per business.             |
| `transaction_items`         | Line items with captured `unit_price` and `unit_cost` (for accurate historical COGS). |
| `stock_movements`           | Append-only ledger of every stock delta.             |
| `expenses`                  | Business expenses with optional external_ref.        |
| `reconciliation_snapshots`  | Physical-count snapshots.                            |
| `reconciliation_items`      | Per-product expected vs actual + stored `variance`.  |
| `reference_sequences`       | Per (business, date, type) counter for ref numbers.  |
| `user_invites`              | Email-token invites; accepted via /setup.            |

### Key invariants

- `transactions.net_total = transactions.gross_total − transactions.discount_amount`
- `transaction_items.line_total = quantity × unit_price − line_discount`
- `stock_movements.delta` is **signed**: sales insert `-qty`, restocks insert `+qty`.
- `reference_sequences` is append-and-increment, guarded by the `next_reference_number` RPC.

## RLS (Row-Level Security)

Two helper functions, one gate per policy:

```sql
is_member(b_id)            -- current user has any membership in b_id
has_role(b_id, allowed[])  -- current user's role is in the allowed set
```

Policies read like:

```sql
create policy "owners & admins modify products"
  on public.products for all
  using (public.has_role(business_id, array['owner','admin']::public.user_role[]))
  with check (public.has_role(business_id, array['owner','admin']::public.user_role[]));
```

See `supabase/migrations/0002_rls.sql` for the complete set.

## RPC functions

- **`next_reference_number(business_id, type)`** — atomic `upsert` on `reference_sequences` to return the next counter, zero-padded to 5: `TXN-YYYYMMDD-00001`.
- **`create_sale(...)`** — inserts `transactions` + `transaction_items`, decrements `products.stock`, writes `stock_movements` with `source_type='sale'`, returns the transaction row. Single transaction, single atomic RPC.
- **`adjust_stock(...)`** — manual stock change with reason + movement log.
- **`create_reconciliation(...)`** — snapshot header + per-product items + movement entries for each non-zero variance.
- **`bootstrap_business(...)`** — first-run onboarding (business + owner membership + default categories).

## Middleware & routing

`middleware.ts` (via `lib/supabase/middleware.ts → updateSession`):

- Refreshes the Supabase auth cookie on every request so Server Components see a fresh user.
- Redirects unauthenticated users to `/login?redirect=<path>` for protected routes.
- Allows `/login`, `/signup`, `/invite/*`, static assets, and `/api/public/*`.

## State (Zustand)

- **`cart-store`** — the POS cart. Add/update/remove items, apply line/cart discounts, checkout helpers. Pure derived state via `business-logic/cart`.
- **`session-store`** — user id/email, active business, role, and available businesses (for switching). Persisted to `localStorage` under `msme-pos-session` so page reloads keep the active tenant.

## Frontend customization

Because UI only depends on hooks and pure logic:

- Swap a component (e.g. `components/ui/button.tsx`) without touching data.
- Rebrand via the Theme panel (no code).
- Replace the dashboard charts by editing `components/dashboard/charts.tsx` — the data pipeline (`useTransactions`, `dailySeries(...)`) stays.
- Replace the whole UI kit by re-implementing `components/ui/*.tsx` primitives; feature components are thin enough to carry over.
