# Ganesh Trading Company — Wholesale & Retail Ordering Platform

A production-ready, mobile-first web app for a kirana (grocery) wholesale + retail
business. Customers browse products, build a cart, and place an order that is **saved
to the database first** and then opened in **WhatsApp Business** with a pre-filled
message. No online payment, no customer login — minimum friction, optimised for mobile.

Built with **Next.js 15 (App Router) · TypeScript · Tailwind · shadcn-style UI ·
PostgreSQL · Prisma · Zustand · Zod · XLSX · Cloudinary**.

---

## Table of contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Quick start](#quick-start)
4. [Environment variables](#environment-variables)
5. [Database & ER diagram](#database--er-diagram)
6. [Project structure](#project-structure)
7. [Order flow (WhatsApp)](#order-flow-whatsapp)
8. [Excel import](#excel-import)
9. [Modular services & future billing integration](#modular-services--future-billing-integration)
10. [Admin panel](#admin-panel)
11. [Deployment guide](#deployment-guide)
12. [Scripts](#scripts)

---

## Features

**Customer (no login required)**
- Separate **Retail** and **Wholesale** storefronts with independent pricing.
- Browse, **search**, **filter by category**, product detail pages.
- Sticky Blinkit/Zepto-style cart bar, +/- quantity steppers, large touch targets.
- Checkout collects: Name, Mobile, (Shop Name for wholesale) / (Delivery Area for retail).
- On submit: enquiry **saved to PostgreSQL** → unique ID `GTC-000001` generated →
  redirect to WhatsApp with a clean pre-filled message.

**Admin (email + password login)**
- Dashboard with totals (products, customers, enquiries, wholesale/retail), recent
  orders and low-stock alerts.
- Full product CRUD, image upload (Cloudinary), separate MRP / Wholesale / Retail prices.
- Category CRUD, inventory management (stock + status), customer history + CSV export.
- Order enquiries with status workflow (New → Contacted → Delivered → Cancelled).
- **Excel import** of products with a full create/update/skip/fail summary.
- Inventory-sync trigger ready for **future billing-software integration**.

**Platform**
- Mobile-first, large fonts/buttons, one-hand operation.
- SEO: per-product metadata, Open Graph, **Product JSON-LD**, sitemap, robots, PWA manifest.
- Server components, pagination, optimised images, lazy loading.

---

## Tech stack

| Layer | Choice |
|------|--------|
| Framework | Next.js 15 (App Router, Server Components, Route Handlers) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn-style primitives (Radix UI) |
| Database | PostgreSQL |
| ORM | Prisma |
| State | Zustand (persisted cart) |
| Validation | Zod |
| Auth | Admin-only JWT session cookie (`jose` + `bcryptjs`) |
| Excel | `xlsx` |
| Images | Cloudinary (unsigned upload) |

---

## Quick start

> Prerequisites: **Node 18.18+** (Node 20/22 recommended) and a **PostgreSQL** database.

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env          # then edit .env (see below)

# 3. Create the schema and seed sample data
npm run db:push               # pushes the Prisma schema to PostgreSQL
npm run db:seed               # categories, products, admin user, sample enquiries

# 4. Run the dev server
npm run dev
```

Open:
- Storefront → http://localhost:3000
- Admin → http://localhost:3000/admin  (default login from `.env`:
  `admin@ganeshtrading.com` / `Admin@12345`)

---

## Environment variables

All variables live in `.env` (see `.env.example`).

| Variable | Required | Description |
|---------|:--------:|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `AUTH_SECRET` | ✅ | Long random string used to sign the admin session JWT |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | ✅ | Default admin created by the seed script |
| `WHATSAPP_NUMBER` | ✅ | Country code + number, digits only, e.g. `919999999999` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | ⬜ | Cloudinary cloud name (image upload) |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | ⬜ | Unsigned upload preset |
| `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | ⬜ | For server-side Cloudinary operations |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Public base URL (sitemap / OG / canonical) |
| `NEXT_PUBLIC_BUSINESS_NAME/PHONE/ADDRESS` | ⬜ | Shown on contact page & footer |

> Without Cloudinary configured, the admin image field falls back to **pasting an
> image URL**, so the app remains fully functional.

---

## Database & ER diagram

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│  Category   │1       *│   Product    │*       1│   (Category) │
│─────────────│─────────│──────────────│         └──────────────┘
│ id (PK)     │         │ id (PK)      │
│ name        │         │ name, slug   │         ┌──────────────┐
│ slug        │         │ sku (unique) │        *│ EnquiryItem  │
│ isActive    │         │ mrp          │◀────────│──────────────│
│ sortOrder   │         │ wholesalePr. │ product │ id (PK)      │
└─────────────┘         │ retailPrice  │ (Set    │ productName  │ (snapshot)
                        │ stockQty     │  Null)  │ unit         │
                        │ unit, status │         │ unitPrice    │
                        │ externalRef  │         │ quantity     │
                        └──────────────┘         │ lineTotal    │
                                                 │ enquiryId(FK)│
┌─────────────┐         ┌──────────────┐         └──────┬───────┘
│  Customer   │1       *│   Enquiry    │1               │*
│─────────────│─────────│──────────────│────────────────┘
│ id (PK)     │ customer│ id (PK)      │ items
│ name        │         │ enquiryCode  │ (GTC-000001)
│ mobile (uq) │         │ sequence (uq)│
│ shopName    │         │ type         │ WHOLESALE | RETAIL
│ type        │         │ status       │ NEW | CONTACTED | DELIVERED | CANCELLED
└─────────────┘         │ customerName │ (snapshot)
                        │ mobile       │
┌─────────────┐         │ shopName     │ (wholesale)
│  AdminUser  │         │ deliveryArea │ (retail)
│─────────────│         │ grandTotal   │
│ id (PK)     │         │ whatsappSent │
│ email (uq)  │         │ customerId FK│
│ passwordHash│         └──────────────┘
│ role        │
└─────────────┘         ┌──────────────┐
                        │  ImportLog   │  audit log for Excel imports
                        │──────────────│  & future billing syncs
                        │ source       │  EXCEL | BILLING_SOFTWARE | API
                        │ created/upd. │
                        │ skipped/fail │
                        │ errors (JSON)│
                        └──────────────┘
```

**Relationships**
- `Category 1—* Product` (restrict delete while products exist).
- `Customer 1—* Enquiry` (set null on customer delete).
- `Enquiry 1—* EnquiryItem` (cascade delete).
- `Product 1—* EnquiryItem` (set null; item keeps a **name/price snapshot** so order
  history survives product edits/deletes).

The full schema is in [`prisma/schema.prisma`](prisma/schema.prisma).

---

## Project structure

```
src/
├─ app/
│  ├─ (shop)/                 # public storefront (route group)
│  │  ├─ retail/ wholesale/   # listings, /product/[slug], /cart, /checkout
│  │  ├─ categories/ contact/
│  │  └─ products|cart|checkout  (redirect to retail)
│  ├─ admin/
│  │  ├─ login/
│  │  └─ (panel)/             # protected layout + sidebar
│  │     ├─ dashboard products categories inventory customers orders import
│  ├─ api/                    # route handlers
│  │  ├─ products categories enquiries auth
│  │  └─ admin/{products,categories,enquiries,customers,import,inventory}
│  ├─ sitemap.ts robots.ts manifest.ts icon.svg layout.tsx page.tsx
├─ components/
│  ├─ ui/                     # button, input, dialog, select, table, tabs, toast...
│  ├─ shop/                   # header, footer, cart, product card/grid, checkout...
│  ├─ admin/                  # managers for products/categories/inventory/orders...
│  └─ seo/product-jsonld.tsx
├─ lib/                       # prisma, auth, validations(zod), whatsapp, queries...
├─ services/                  # ProductImport, InventorySync, Enquiry, billing adapter
├─ store/cart.ts              # Zustand cart (persisted)
├─ types/                     # shared DTOs
└─ middleware.ts              # protects /admin
```

---

## Order flow (WhatsApp)

1. Customer fills the checkout form (Zod-validated on client and server).
2. `POST /api/enquiries` → `createEnquiry()`:
   - Re-reads **authoritative prices from the DB** (never trusts the client) and picks
     wholesale vs retail price by enquiry type.
   - Upserts the customer (by mobile), creates the `Enquiry` + `EnquiryItem`s in a
     **single transaction**, and generates a sequential code `GTC-000001`.
3. The API returns the enquiry code + a `wa.me` deep link with the pre-filled message.
4. The browser opens WhatsApp. Because the enquiry is **already saved**, the shop owner
   sees it in the Admin Panel even if the customer never sends the message.

Message format is implemented exactly to spec in
[`src/lib/whatsapp.ts`](src/lib/whatsapp.ts) (wholesale shows line totals; retail shows
the delivery area).

---

## Excel import

Admin → **Excel Import**. Upload `.xlsx` / `.csv` with columns:

| Product Name | Category | MRP | Wholesale Price |
|--------------|----------|-----|-----------------|

- Creates new products (as **Inactive**, retail price defaults to MRP — set retail
  price + stock afterwards), updates existing ones (matched by derived SKU), skips
  duplicates/no-change rows, and returns a **summary** (created / updated / skipped /
  failed + row errors). Every run is recorded in `ImportLog`.
- A sample file is provided at [`public/sample-product-import.csv`](public/sample-product-import.csv).

Logic: [`src/services/product-import.service.ts`](src/services/product-import.service.ts).

---

## Modular services & future billing integration

The app is intentionally modular so the shop's existing **billing software** can be
connected later **without rewrites**:

- **`services/product-import.service.ts`** — Excel/CSV → products.
- **`services/inventory-sync.service.ts`** — pulls stock from the active billing
  adapter into the catalogue (and flips OUT_OF_STOCK/ACTIVE). Safe no-op until configured.
- **`services/billing/`** — the **Billing Software Adapter Layer**:
  - `billing-adapter.ts` — the single `BillingAdapter` interface the app depends on.
  - `rest-billing-adapter.ts` — a ready REST template (map vendor fields here).
  - `noop-billing-adapter.ts` — default; reports "not configured".
  - `index.ts` — factory that selects the adapter from env (`BILLING_API_URL` +
    `BILLING_API_KEY`).

To integrate billing software in the future: implement/adjust one adapter and set its
env vars — nothing else changes. Trigger a sync from Admin → Inventory → **Sync from
Billing**, or call `POST /api/admin/inventory/sync` on a schedule.

---

## Admin panel

- **Dashboard** — totals, recent orders, low-stock alerts.
- **Products** — add/edit/delete, image, separate MRP/wholesale/retail, stock, status.
- **Categories** — add/edit/delete (delete blocked if products still use it).
- **Inventory** — inline stock edits, mark out-of-stock/active/inactive, billing sync.
- **Customers** — search, order history, CSV export.
- **Orders** — all/wholesale/retail tabs, search, status updates, item detail.
- **Excel Import** — upload + summary.

Auth: admin session is a signed JWT in an httpOnly cookie; `middleware.ts` guards all
`/admin/*` routes and the `(panel)` layout double-checks the session server-side.

---

## Deployment guide

### Option A — Vercel + managed Postgres (recommended)

1. Create a PostgreSQL database (Neon, Supabase, Railway, or Vercel Postgres) and copy
   its connection string (use the **pooled** URL for serverless).
2. Push the repo to GitHub and **Import** it in Vercel.
3. In Vercel → Project → Settings → **Environment Variables**, add everything from
   `.env.example` (`DATABASE_URL`, `AUTH_SECRET`, `WHATSAPP_NUMBER`, Cloudinary keys,
   `NEXT_PUBLIC_SITE_URL`, …).
4. The build runs `prisma generate && next build` automatically (see `package.json`).
5. After the first deploy, apply the schema and seed once:
   ```bash
   # locally, pointing DATABASE_URL at production:
   npx prisma db push
   npm run db:seed          # optional: seed admin + sample catalogue
   ```
   (For real migrations use `npx prisma migrate deploy`.)
6. Set up a Cloudinary **unsigned upload preset** and add the Cloudinary env vars.

### Option B — Any Node host / Docker

```bash
npm ci
npm run build
npm run start            # serves on PORT (default 3000)
```
Ensure `DATABASE_URL` is reachable and run `prisma migrate deploy` (or `db push`) plus
`npm run db:seed` against the production database before first use.

### Post-deploy checklist
- [ ] `WHATSAPP_NUMBER` is the business WhatsApp number (digits only, with country code).
- [ ] `AUTH_SECRET` is a strong random value; change the seeded admin password.
- [ ] `NEXT_PUBLIC_SITE_URL` matches the live domain (sitemap/OG correctness).
- [ ] Cloudinary preset created (or rely on URL-paste fallback).

---

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start the dev server |
| `npm run build` | `prisma generate` + production build |
| `npm run start` | Start the production server |
| `npm run db:push` | Push Prisma schema to the database |
| `npm run db:migrate` | Create/apply a dev migration |
| `npm run db:seed` | Seed categories, products, admin, sample enquiries |
| `npm run db:studio` | Open Prisma Studio |
| `npm run lint` | Lint |

---

### Notes / Version 1 scope
- No online payment, no customer registration/login (by design).
- Prices are stored as `Decimal` in the DB and serialised to numbers for the client.
- Enquiry items snapshot product name/price/unit so historical orders stay accurate.
