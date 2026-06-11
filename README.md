# Ganesh Trading Company — Wholesale & Retail Ordering Platform

A production-ready, mobile-first web app for a kirana (grocery) wholesale + retail
business. Customers browse products, build a cart, and place an order that is **saved
to the database first** and then opened in **WhatsApp** with a pre-filled message. No
online payment, no customer login — minimum friction, optimised for mobile.

Built with **Next.js 15 (App Router) · TypeScript · Tailwind · shadcn-style UI ·
PostgreSQL · Prisma · Zustand · Zod · XLSX · Cloudinary**.

> 📘 **Full end-to-end flow** (site map, customer journey, pricing model, order →
> invoice lifecycle, admin workflows, i18n, caching, auth): see
> **[WEBSITE_FLOW.md](WEBSITE_FLOW.md)**.

---

## Table of contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Quick start](#quick-start)
4. [Environment variables](#environment-variables)
5. [Pricing model](#pricing-model)
6. [Languages (i18n)](#languages-i18n)
7. [Order flow & invoices](#order-flow--invoices)
8. [Admin panel](#admin-panel)
9. [Excel import](#excel-import)
10. [Modular services & future billing integration](#modular-services--future-billing-integration)
11. [Database & ER diagram](#database--er-diagram)
12. [Project structure](#project-structure)
13. [Deployment guide](#deployment-guide)
14. [Scripts](#scripts)

---

## Features

**Customer (no login required)**
- Separate **Retail** and **Wholesale** storefronts with independent pricing & carts.
- **3 languages** — English (default), हिंदी, मराठी — switchable from the header.
- Browse, **search**, **filter by category**, product detail pages.
- **MRP shown struck-through + "% OFF" badge** where there's a saving.
- Quantity steppers you can **type into** (enter `36` instead of tapping +).
- **Minimum order value** enforced: Retail **₹109**, Wholesale **₹1499**.
- **Remember-me on device** — name/mobile/address auto-fill on the next order (no login).
- On submit: order **saved to PostgreSQL** → unique code `GTC-000001` → WhatsApp opens
  with a clean, **column-aligned** pre-filled message.

**Wholesale buying types**
- **Standard** — loose price per unit with a **minimum quantity** + an optional whole
  **Box/Sack** at a better rate (rice, dal, sugar, oil, salt…).
- **Biscuit** — **Outer + Box** (no loose); order a minimum of 1 outer, box price for a
  full box. Cards show effective per-outer / per-packet rates.

**Admin (email + password login)**
- **Dashboard analytics** — sales, orders, avg order value, customers, out-of-stock;
  orders trend chart, status breakdown, wholesale/retail split, top products; with a
  **date-range filter** (Today / Week / Month / 90 days / Custom).
- **Products** CRUD with Cloudinary image upload (or paste any image URL); category &
  status **filters**.
- **Home Page** curation — hand-pick **featured products** for the home "Popular
  products" section (festival/seasonal), shown alongside automatic best-sellers.
- **Inventory** — stock edits, status, **low-stock filter**, **sort by stock**, billing sync.
- **Customers** — type filter, order history, CSV export.
- **Orders** — status workflow (New → Contacted → Delivered → Cancelled), **edit/remove
  items** (for unavailable products), and a **printable invoice** (Save as PDF) +
  **Send invoice on WhatsApp**.
- **Excel import** of products (created **Active**, optional image URL) with a full summary.

**Platform**
- Mobile-first, large fonts/buttons, one-hand operation.
- Cached data layer with **tag-based revalidation** (admin edits reflect immediately).
- SEO: per-product metadata, Open Graph, **Product JSON-LD**, sitemap, robots, manifest.

---

## Tech stack

| Layer | Choice |
|------|--------|
| Framework | Next.js 15 (App Router, Server Components, Route Handlers, Turbopack dev) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn-style primitives (Radix UI) |
| Database | PostgreSQL |
| ORM | Prisma |
| State | Zustand (persisted cart + remember-me profile) |
| Validation | Zod |
| i18n | Cookie-based locale + dictionaries (`src/i18n/`) |
| Auth | Admin-only JWT session cookie (`jose` + `bcryptjs`) |
| Excel | `xlsx` |
| Images | Cloudinary (unsigned upload) or any image URL |

---

## Quick start

> Prerequisites: **Node 18.18+** (Node 20/22 recommended) and a **PostgreSQL** database.

```bash
npm install                   # 1. install deps
cp .env.example .env          # 2. configure env (see below)
npm run db:push               # 3. create schema
npm run db:seed               # 4. seed categories, products, admin, sample orders
npm run dev                   # 5. start dev (Turbopack)
```

Open:
- Storefront → http://localhost:3000
- Admin → http://localhost:3000/admin  (default login: `admin@ganeshtrading.com` /
  `Admin@12345` — change after first login)

> Production: `npm run build` then `npm start`. Rebuild after code changes (production
> serves the last build).

---

## Environment variables

All variables live in `.env` (see `.env.example`).

| Variable | Required | Description |
|---------|:--------:|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `AUTH_SECRET` | ✅ | Long random string used to sign the admin session JWT |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | ✅ | Default admin created by the seed script |
| `WHATSAPP_NUMBER` | ✅ | Country code + number, digits only, e.g. `919999999999` |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Public base URL (sitemap / OG / canonical) |
| `NEXT_PUBLIC_BUSINESS_NAME` | ⬜ | Shown on invoices / metadata |
| `NEXT_PUBLIC_BUSINESS_PHONE` / `_ADDRESS` | ⬜ | Shown on contact page & footer |
| `NEXT_PUBLIC_BUSINESS_MAP_URL` | ⬜ | Google Maps link (tap-to-open directions) |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | ⬜ | Cloudinary cloud name (image upload) |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | ⬜ | Unsigned upload preset |
| `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | ⬜ | Server-side Cloudinary ops |
| `BILLING_API_URL` / `BILLING_API_KEY` | ⬜ | Future billing-software sync adapter |

> Without Cloudinary, the admin image field falls back to **pasting an image URL**
> (any `https` host is allowed), so the app remains fully functional.

Tunable in code (not env): minimum order values in
[`src/lib/constants.ts`](src/lib/constants.ts) (`MIN_ORDER_VALUE`); UI text in
[`src/i18n/dictionaries.ts`](src/i18n/dictionaries.ts).

---

## Pricing model

Each product has **MRP**, **Retail price**, **Wholesale price**, plus a wholesale buying
type that controls the buy options:

- **Retail:** one per-unit price; MRP struck-through + % OFF when discounted.
- **Wholesale · Standard:** loose price per unit + **minimum quantity** + optional whole
  **Box/Sack** at a better rate.
- **Wholesale · Biscuit:** **Outer + Box** (no loose); minimum 1 outer, box price for a box.

Details and examples: [WEBSITE_FLOW.md §3](WEBSITE_FLOW.md#3-pricing-model).

---

## Languages (i18n)

English (default), Hindi, Marathi — switchable from the 🌐 selector in the header. The
choice is stored in a cookie (so both server and client render the right language) and
applies site-wide. All UI strings live in
[`src/i18n/dictionaries.ts`](src/i18n/dictionaries.ts). Product names/descriptions come
from the database and are shown as entered; the admin panel is English.

---

## Order flow & invoices

1. Customer fills checkout (Zod-validated client + server; minimum-order enforced).
2. `POST /api/enquiries` → `createEnquiry()` re-reads **authoritative prices from the DB**,
   upserts the customer, and creates the `Enquiry` + items in one transaction with code
   `GTC-000001`.
3. The browser opens WhatsApp with the pre-filled message. The order is **already saved**,
   so the shop sees it even if the customer never sends it.
4. In **Admin → Orders**, the owner can **edit/remove items** (e.g. an out-of-stock
   product), advance the **status**, then **Print Invoice** (Save as PDF) and/or **Send on
   WhatsApp**.

Message + invoice formatting: [`src/lib/whatsapp.ts`](src/lib/whatsapp.ts). Full lifecycle:
[WEBSITE_FLOW.md §4](WEBSITE_FLOW.md#4-order--invoice-lifecycle).

---

## Admin panel

Dashboard · Products · **Home Page (featured)** · Categories · Inventory · Customers ·
Orders · Excel Import. Auth is a signed JWT in an httpOnly cookie; `middleware.ts` guards
all `/admin/*` routes and the `(panel)` layout re-checks the session server-side. See
[WEBSITE_FLOW.md §5](WEBSITE_FLOW.md#5-admin-journey).

---

## Excel import

Admin → **Excel Import**. Upload `.xlsx` / `.csv` with columns:

| Product Name | Category | MRP | Wholesale Price | Image URL (optional) |
|--------------|----------|-----|-----------------|----------------------|

- Creates new products as **Active** (retail price defaults to MRP — set stock/sack later),
  updates existing ones (matched by derived SKU), skips duplicates/no-change rows, and
  returns a **summary** (created / updated / skipped / failed + row errors). Every run is
  recorded in `ImportLog`. Sample: [`public/sample-product-import.csv`](public/sample-product-import.csv).

Logic: [`src/services/product-import.service.ts`](src/services/product-import.service.ts).

---

## Modular services & future billing integration

The app is modular so the shop's existing **billing software** can be connected later
without rewrites:

- **`services/product-import.service.ts`** — Excel/CSV → products.
- **`services/inventory-sync.service.ts`** — pulls stock from the active billing adapter.
- **`services/billing/`** — adapter layer (`billing-adapter.ts` interface,
  `rest-billing-adapter.ts` template, `noop-billing-adapter.ts` default, `index.ts`
  factory selecting by env). Implement one adapter + set `BILLING_API_URL` / `BILLING_API_KEY`,
  then trigger Admin → Inventory → **Sync from Billing** or `POST /api/admin/inventory/sync`.

---

## Database & ER diagram

```
┌─────────────┐        ┌──────────────┐        ┌──────────────┐
│  Category   │1      *│   Product    │*      1│  (Category)  │
│ id, name    │────────│ id, name     │        └──────────────┘
│ slug        │        │ sku (unique) │
│ isActive    │        │ mrp          │        ┌──────────────┐
│ sortOrder   │        │ wholesalePr. │*──────*│ EnquiryItem  │
└─────────────┘        │ retailPrice  │product │ productName  │ (snapshot)
                       │ buying type  │(SetNull│ unit         │
                       │ pack1/pack2  │        │ unitPrice    │
                       │ minQty       │        │ quantity     │
                       │ isFeatured   │        │ lineTotal    │
                       │ stock, status│        │ enquiryId FK │
                       └──────────────┘        └──────┬───────┘
┌─────────────┐        ┌──────────────┐               │*
│  Customer   │1      *│   Enquiry    │1──────────────┘ items
│ id, name    │────────│ enquiryCode  │ (GTC-000001)
│ mobile (uq) │customer│ type         │ WHOLESALE | RETAIL
│ shopName    │        │ status       │ NEW|CONTACTED|DELIVERED|CANCELLED
│ type        │        │ grandTotal   │
└─────────────┘        │ whatsappSent │
                       └──────────────┘
┌─────────────┐        ┌──────────────┐
│  AdminUser  │        │  ImportLog   │  audit log for Excel imports / billing syncs
└─────────────┘        └──────────────┘
```

- `Category 1—* Product` (restrict delete while products exist).
- `Customer 1—* Enquiry` (set null on customer delete).
- `Enquiry 1—* EnquiryItem` (cascade delete).
- `Product 1—* EnquiryItem` (set null; items keep a **name/price snapshot**).

Full schema: [`prisma/schema.prisma`](prisma/schema.prisma).

---

## Project structure

```
src/
├─ app/
│  ├─ (shop)/                 # storefront: retail/ wholesale/ (listing, product, cart, checkout), categories/ contact/
│  ├─ admin/
│  │  ├─ login/  invoice/[id]/
│  │  └─ (panel)/             # protected: dashboard products featured categories inventory customers orders import
│  ├─ api/                    # public + auth + admin route handlers
│  ├─ layout.tsx page.tsx sitemap.ts robots.ts manifest.ts
├─ components/ ui/ shop/ admin/ seo/
├─ i18n/                      # dictionaries (en/hi/mr) + context (client) + server reader
├─ lib/                       # prisma, auth, validations, whatsapp, queries, cart-lines, constants, revalidate
├─ services/                  # product-import, inventory-sync, enquiry, billing adapters
├─ store/                     # cart.ts, customer.ts (persisted)
├─ types/                     # shared DTOs
└─ middleware.ts              # protects /admin
```

---

## Deployment guide

### Option A — Vercel + managed Postgres (recommended)
1. Create a PostgreSQL DB (Neon / Supabase / Railway / Vercel Postgres); use the **pooled** URL.
2. Push to GitHub and **Import** in Vercel.
3. Add all env vars from `.env.example` in Project → Settings → Environment Variables.
4. Build runs `prisma generate && next build` automatically.
5. After first deploy, apply schema + seed once (locally with `DATABASE_URL` → prod):
   `npx prisma db push` then `npm run db:seed` (use `prisma migrate deploy` for real migrations).
6. Create a Cloudinary unsigned preset (optional).

### Option B — Any Node host / Docker
```bash
npm ci && npm run build && npm run start
```
Ensure `DATABASE_URL` is reachable; run `prisma migrate deploy` (or `db push`) + `npm run db:seed` first.

### Post-deploy checklist
- [ ] `WHATSAPP_NUMBER` is the business number (digits + country code).
- [ ] `AUTH_SECRET` is strong; seeded admin password changed.
- [ ] `NEXT_PUBLIC_SITE_URL` matches the live domain.
- [ ] Business name/phone/address/map URL set; Cloudinary preset created (or use URL paste).

---

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Dev server (Turbopack); `dev:webpack` for the Webpack fallback |
| `npm run build` | `prisma generate` + production build |
| `npm run start` | Production server |
| `npm run db:push` | Push Prisma schema to the database |
| `npm run db:migrate` | Create/apply a dev migration |
| `npm run db:seed` | Seed categories, products, admin, sample orders |
| `npm run db:studio` | Prisma Studio |
| `npm run lint` | Lint |

---

### Notes / scope
- No online payment, no customer registration/login (by design; "remember me" is device-local).
- Prices are stored as `Decimal` and serialised to numbers for the client.
- Enquiry items snapshot product name/price/unit so historical orders stay accurate.
- Internal code/DB names use "Enquiry"; the **UI says "Orders"**.
