# Developer Guide

## Setup

### Prereqs

- Node.js 20+ (the project works on 18 but Supabase prints deprecation warnings)
- npm 9+
- A Supabase project (cloud or local via `supabase start`)

### Environment

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### Migrations

Apply in order:

1. `supabase/migrations/0001_schema.sql` — tables, enums, indexes, extensions.
2. `supabase/migrations/0002_rls.sql` — RLS policies and helper functions.
3. `supabase/migrations/0003_functions.sql` — RPC functions (`next_reference_number`, `create_sale`, `adjust_stock`, `create_reconciliation`).
4. `supabase/migrations/0004_bootstrap.sql` — `bootstrap_business` RPC + default seed.

Apply via `supabase db push`, the SQL editor, or the Supabase MCP.

### Regenerate TS types

After schema changes:

```bash
npm run db:types
```

This updates `lib/supabase/database.types.ts`. `lib/types.ts` derives from it, so app types stay in sync.

## Adding a feature — the recipe

1. **Schema** → Add a migration in `supabase/migrations/`. If you join, remember to add RLS.
2. **Types** → `npm run db:types`.
3. **Service** → Add a typed function in `lib/services/<domain>.ts` that takes `sb: SB, businessId: string, ...`.
4. **Hook** → Add `useXxx()` in `hooks/use-<domain>.ts` — wrap services with `useAsync`.
5. **Business logic (if any)** → Pure functions in `lib/business-logic/`. Unit-testable.
6. **UI** → Components in `components/<domain>/`, wired via hooks only.
7. **Page** → `app/(app)/<route>/page.tsx` — keep it thin; compose components.

Do **not** import `@supabase/*` from `components/**` or `app/**`. The ESLint rule will stop you.

## Reference numbers

Format: `<TYPE>-YYYYMMDD-NNNNN`, where `TYPE ∈ {TXN, EXP, ADJ, REC}` and `NNNNN` is a per-day zero-padded counter. Generated atomically by the `next_reference_number(business_id, type)` RPC:

```ts
const { data: ref } = await sb.rpc("next_reference_number", {
  p_business_id: businessId,
  p_type: "EXP",
});
```

## Creating a sale (atomic)

```ts
await transactionService.createSale(sb, {
  businessId,
  items: cart,                // CartItem[]
  paymentMethod: "gcash",
  externalRef: "ref-0001",
  destinationAccount: "09171234567",
  discountAmount: 0,
  discountType: "amount",
  grossTotal,
  netTotal,
});
```

Under the hood this calls `create_sale` which:

1. Generates a reference number.
2. Inserts the transaction.
3. Inserts all `transaction_items` (capturing current `unit_price` and `unit_cost`).
4. Decrements `products.stock`.
5. Appends `stock_movements` entries with `source_type='sale'` and negative deltas.

All in a single DB transaction.

## Reconciliation

Use `create_reconciliation(p_business_id, p_note, p_counts)` where `p_counts` is a JSON array like:

```json
[
  {"product_id": "<uuid>", "actual_qty": 42},
  ...
]
```

The RPC:

1. Creates a snapshot with a `REC-*` ref.
2. For each entry, computes `expected_qty = current stock`, inserts a `reconciliation_items` row (generated `variance = actual - expected`), and writes a `stock_movements` adjustment for the delta with `reason='reconciliation'`.
3. Updates `products.stock` to match `actual_qty`.

`variance_threshold` on `businesses` is the flag threshold the UI uses to visually highlight rows.

## Exports

- XLSX: `lib/exports/xlsx.ts` — uses SheetJS `aoa_to_sheet` + `sheet_add_json` to write a title/subtitle header and then the data.
- PDF: `lib/exports/pdf.ts` — uses jsPDF + `jspdf-autotable`. See `exportReceiptPDF(...)` for the receipt printer-friendly layout (A6).

## Testing strategy

Minimal by spec. Recommended additions (all opt-in):

- **Unit tests** for `lib/business-logic/*` with Vitest — pure functions, no mocks.
- **RLS tests** with `supabase db test` — verify that user A in business X cannot read business Y's rows.
- **Playwright smoke** for critical flows: login → setup → create product → run a sale → view transaction.

## Linting and formatting

```bash
npm run lint        # ESLint incl. architectural rule
npm run typecheck   # tsc --noEmit
npm run format      # Prettier + prettier-plugin-tailwindcss
```

## Troubleshooting

**"useSearchParams should be wrapped in Suspense"** — any client page using `useSearchParams` during prerendering must be wrapped in `<Suspense>`. We do this in `app/(auth)/login/page.tsx`. Apply the same pattern if you add more.

**"Relation not found"** errors on `.select("*, foo(*)")` — Supabase typegen fills `Relationships: []` when it can't introspect the FK; our services narrow return types with `as unknown as T[]`. If you add joins, keep the pattern or populate the Relationships yourself.

**Node.js 18 deprecation warnings from supabase-js** — upgrade to Node 20+ in production.
