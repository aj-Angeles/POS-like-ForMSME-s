# Theming

Theming is stored as data on each business, not compiled into the bundle. That means:

- Each tenant has its own brand.
- Owners can change colors live from `Settings → Theme`.
- No rebuild or redeploy required.

## How it works

1. `businesses.theme` is a JSONB column shaped like:

   ```json
   { "primary": "172 66% 42%", "accent": "172 66% 95%", "radius": "0.6rem" }
   ```

   Values are **HSL triplets without the `hsl()` wrapper**. Tailwind wraps them via its CSS variable config (see `tailwind.config.ts`).

2. When the user logs in and picks a business, `session-store` saves it. `components/theme/theme-provider.tsx` reads the theme and writes variables to `document.documentElement` (`:root`) using `style.setProperty`:

   ```tsx
   root.style.setProperty("--primary", theme.primary);
   root.style.setProperty("--accent", theme.accent);
   root.style.setProperty("--radius", theme.radius);
   root.style.setProperty("--ring", theme.primary);
   ```

3. Every shadcn/ui primitive references these variables (`bg-primary`, `text-primary-foreground`, `rounded-md`, etc.), so it rebrands automatically.

## Changing the theme

### For an owner (no code)

- Go to **Settings → Theme**.
- Click a preset (Aquamarine, Indigo, Rose, Emerald, Amber, Slate) or edit HSL triplets directly.
- Preview updates instantly. **Save theme** persists to Supabase and pushes the update to the session store.

### For a developer (change defaults)

Edit the defaults in two places:

1. `app/globals.css` — the static fallback for `:root`. Change `--primary`, `--accent`, `--radius`.
2. `lib/constants.ts → DEFAULT_THEME` — the programmatic fallback used when a business has no persisted theme.

Keep the HSL-triplet form (H S% L%). Never wrap with `hsl()` — Tailwind does that.

### Adding a preset

Edit `PRESETS` in `app/(app)/settings/page.tsx`:

```ts
{ label: "Ocean", value: { primary: "210 80% 45%", accent: "210 80% 94%", radius: "0.6rem" } }
```

No schema change needed.

### Dark mode

`app/globals.css` already defines a `.dark` block that rebalances the neutrals for dark mode. Wire a toggle by adding/removing the `dark` class on `<html>`:

```ts
document.documentElement.classList.toggle("dark");
```

The per-business `--primary`/`--accent` overrides still apply in dark mode; only the neutrals switch.

## CSS variables catalog

| Variable                 | Where it's used                              |
| ------------------------ | -------------------------------------------- |
| `--primary`              | `bg-primary`, `text-primary`, `ring-primary` |
| `--primary-foreground`   | Text on primary surfaces                     |
| `--accent`               | Subtle highlights (chips, hover backgrounds) |
| `--accent-foreground`    | Text on accent surfaces                      |
| `--secondary`            | Secondary buttons                            |
| `--muted`                | Muted backgrounds                            |
| `--muted-foreground`     | Secondary text                               |
| `--destructive`          | Danger / delete                              |
| `--success`              | Positive states                              |
| `--warning`              | Warnings                                     |
| `--border`, `--input`    | Borders and input outlines                   |
| `--radius`               | Base border radius (shadcn derives `rounded-lg`, `rounded-md`, `rounded-sm`) |

## Swapping the whole UI kit

Because every feature component consumes these tokens (and the rest of `shadcn/ui` primitives in `components/ui/`), you can:

1. Re-implement `components/ui/*.tsx` with a different library (Mantine, MUI, Ariakit, etc.).
2. Keep `components/pos/`, `components/inventory/`, `components/dashboard/` — they use the primitives.
3. Update `tailwind.config.ts` color tokens if your replacement kit uses a different variable naming scheme.

The data layer (`hooks/`, `lib/services/`, `lib/business-logic/`) is unchanged.
