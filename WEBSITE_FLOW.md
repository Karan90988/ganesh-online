# Ganesh Trading Company — Website Flow

End-to-end documentation of how the whole website works: every route, the customer
journey, the pricing model, the order → invoice lifecycle, the admin workflows, and the
cross-cutting systems (languages, caching, auth).

---

## 1. Site map (all routes)

### Storefront (public, no login)
| Route | Purpose |
|-------|---------|
| `/` | Home — brand, language switcher, hero, Shop Retail / Shop Wholesale cards, categories, **Popular products** (featured + best-sellers), contact section |
| `/retail` | Retail product listing (search, category chips, pagination) |
| `/wholesale` | Wholesale product listing |
| `/retail/product/[slug]` | Retail product detail + buy options |
| `/wholesale/product/[slug]` | Wholesale product detail + buy options |
| `/retail/cart`, `/wholesale/cart` | Cart for that mode |
| `/retail/checkout`, `/wholesale/checkout` | Checkout form + WhatsApp submit |
| `/categories` | All categories |
| `/contact` | Phone, address (Google Maps link), hours, WhatsApp chat |
| `/products`, `/cart`, `/checkout` | Redirect → retail equivalents |

### Admin (login required)
| Route | Purpose |
|-------|---------|
| `/admin/login` | Email + password login |
| `/admin/dashboard` | Analytics (KPIs, trend chart, status, channel split, top products) + date-range filter |
| `/admin/products` | Product CRUD + category/status filters |
| `/admin/featured` | **Home Page** — hand-pick products for the home "Popular products" section |
| `/admin/categories` | Category CRUD |
| `/admin/inventory` | Stock edits, status, low-stock filter, sort by stock, billing sync |
| `/admin/customers` | Customer list, type filter, order history, CSV export |
| `/admin/orders` | Orders list (all / wholesale / retail), status workflow, **edit items**, invoice |
| `/admin/invoice/[id]` | Printable invoice (Save as PDF) + Share on WhatsApp |
| `/admin/import` | Excel/CSV product import |

### API (route handlers)
- Public: `POST /api/enquiries` (place order), `POST /api/enquiries/[id]/sent`, `GET /api/products`, `GET /api/categories`.
- Auth: `POST /api/auth/login`, `POST /api/auth/logout`.
- Admin: `/api/admin/products` (+ `/[id]`, `/[id]/stock`, `/[id]/featured`), `/api/admin/categories`, `/api/admin/enquiries` (+ `/[id]`, `/[id]/items`), `/api/admin/customers` (+ export), `/api/admin/import`, `/api/admin/inventory/sync`.

---

## 2. Customer journey

```
                ┌─────────────────────────── HOME ( / ) ───────────────────────────┐
                │  Pick language (EN / हिंदी / मराठी)                                │
                │  Choose:  [ Shop Retail ]            [ Shop Wholesale ]           │
                └───────────┬───────────────────────────────────┬──────────────────┘
                            ▼                                   ▼
                  /retail (listing)                    /wholesale (listing)
                  search · category chips              search · category chips
                            │                                   │
                            ▼                                   ▼
                  product detail  ──── Add ────►  CART (per mode, saved on device)
                            │                                   │
                            │  (quantity stepper: tap +/- or type exact number)
                            ▼                                   ▼
                        CHECKOUT  (name, mobile, address/shop — auto-filled if returning)
                            │
                            ▼  validate (incl. minimum order value) + save to DB
                   ┌────────────────────────────────────────────┐
                   │ Order saved → code GTC-000007 generated     │
                   │ → opens WhatsApp with a formatted message   │
                   └────────────────────────────────────────────┘
```

Key behaviours:
- **Two independent storefronts.** Retail and wholesale have separate carts and prices.
  The mode toggle is in the header.
- **Cart is per device** (localStorage, Zustand). No login.
- **Quantity** can be typed directly (e.g. `36`) or stepped with +/-, everywhere.
- **Minimum order value** is enforced before checkout: **Retail ₹109**, **Wholesale ₹1499**
  (configurable in `src/lib/constants.ts`). Below it, checkout is blocked with a "add ₹X more" hint.
- **Remember me:** on first order, the customer's name/mobile/shop/address are saved on
  their device; next time the checkout form is pre-filled ("Welcome back, …", "Not you?" to clear).

---

## 3. Pricing model

Every product has **MRP**, **Retail price**, **Wholesale price**. The wholesale buying
options depend on the product's "Wholesale buying type":

### Retail (always)
- One option: **retail price per base unit** (e.g. ₹94 / Kg). MRP is shown struck-through
  when higher, with a **% OFF** badge.

### Wholesale — type "Standard" (rice, dal, sugar, oil, salt, …)
- **Loose** at the wholesale price per unit, with a **minimum quantity** (e.g. min 5 kg).
- Optional **one Box/Sack** (e.g. Sack 26 kg @ ₹1,250) at a better rate.
- The admin form shows the effective rate live, e.g. *"Buying the full sack = ₹8.75 / kg"*.

### Wholesale — type "Biscuit" (Outer + Box, no loose)
- **Outer** (e.g. 12 packets) and optional **Box** (e.g. 12 outers = 144 packets).
- Customer orders a **minimum of 1 outer**; the box price applies if they take a full box.
- The card shows the breakdown: *"₹53.75 / outer · ₹4.48 / packet"*.

See [`src/lib/cart-lines.ts`](src/lib/cart-lines.ts) (buy-option builder) and
[`src/components/admin/products-manager.tsx`](src/components/admin/products-manager.tsx) (admin form).

---

## 4. Order → Invoice lifecycle

```
Customer checkout
   │  POST /api/enquiries  →  createEnquiry()
   ▼
[Enquiry saved]  status = NEW   (code GTC-000007, prices re-read from DB)
   │
   ▼  customer taps "Send on WhatsApp"  (whatsappSent = true)
[Shop owner notified on WhatsApp + sees it in Admin → Orders]
   │
   ▼  Shop calls customer if an item is unavailable
[Admin → Orders → Edit / remove items]   (quantities/prices adjusted, total recomputed)
   │
   ▼  status workflow:  NEW → CONTACTED → DELIVERED  (or CANCELLED)
   │
   ▼  Admin → "Print Invoice" (Save as PDF)  and/or  "Send on WhatsApp"
[Final invoice delivered to customer]
```

- **Authoritative pricing:** `createEnquiry()` re-reads prices from the DB — the client's
  prices are never trusted.
- **Saved before WhatsApp:** the order exists in the DB even if the customer never sends
  the WhatsApp message, so no lead is lost.
- **Editable orders:** `PATCH /api/admin/enquiries/[id]/items` lets the admin remove the
  unavailable product / change quantities; the grand total recomputes in a transaction.
- **Invoice:** `/admin/invoice/[id]` renders a clean, print-optimised invoice (browser
  "Save as PDF"). "Send on WhatsApp" opens a chat with the customer pre-filled with the
  itemised invoice text.

### WhatsApp message format
Built in [`src/lib/whatsapp.ts`](src/lib/whatsapp.ts). Header/labels use WhatsApp **bold**
(`*text*`); the items sit in an **aligned monospace block** (WhatsApp ` ``` ` fence) so the
Qty × Rate = Amount columns and the grand total line up on every phone. Example rendered:

> **Hello Ganesh Trading Company**
> ━━━━━━━━━━━━━━━━━━━━
> **Wholesale Order** · Order ID: GTC-000007
> ━━━━━━━━━━━━━━━━━━━━
> **Customer Name:** Karan Choudhary · **Mobile:** 8104337239 · **Shop:** pooja provision stores
> ━━━━━━━━━━━━━━━━━━━━
> **Products** (Qty x Rate = Amount)
>
>     1. Basmati Rice (Loose)
>         7 x    ₹80 =   ₹560
>     2. Basmati Rice (Sack 26 Kg)
>         1 x ₹2,000 = ₹2,000
>     ───────────────────────
>     GRAND TOTAL    = ₹3,325
>
> ━━━━━━━━━━━━━━━━━━━━
> Please contact me regarding delivery. Thank You.

The same aligned format is reused for the **invoice** the shop sends back to the customer.

---

## 5. Admin journey

```
/admin/login ──► (JWT cookie) ──► /admin/dashboard
                                      │
   ┌──────────────────────────────────┼─────────────────────────────────────────┐
   ▼              ▼            ▼        ▼          ▼            ▼          ▼
Dashboard     Products    Home Page  Inventory  Customers    Orders    Excel Import
(analytics)   (CRUD)      (featured) (stock)    (history)   (workflow) (bulk add)
```

- **Dashboard** — KPIs (sales, orders, avg order value, customers, products, out-of-stock),
  a 14-day-style **orders trend chart**, order-status breakdown, wholesale/retail split,
  top products. A **date-range filter** (Today / This Week / This Month / Last 90 days /
  Custom) recomputes all order analytics.
- **Products** — add/edit/delete; image (Cloudinary upload or paste any image URL); MRP /
  wholesale / retail; wholesale buying type; filters by category & status.
- **Home Page** — curate the home "Popular products" section for festivals/seasons. Picked
  products show first; the rest fill with automatic best-sellers.
- **Inventory** — inline stock edits, mark out-of-stock/active/inactive, **status filter**,
  **low-stock filter**, **sort by stock (low↔high)**, and **Sync from Billing**.
- **Customers** — search, **type filter**, order history, CSV export.
- **Orders** — all/wholesale/retail, search, status updates, **edit items**, invoice.
- **Excel Import** — upload `.xlsx`/`.csv`; new products are created **Active**.

---

## 6. Languages (i18n)

- **English (default), Hindi, Marathi**, switchable from the 🌐 selector in the header.
- Choice is stored in a cookie (works for both server and client components) and applied
  site-wide; `<html lang>` updates too.
- All UI strings live in one file: [`src/i18n/dictionaries.ts`](src/i18n/dictionaries.ts).
- **Note:** product names/descriptions come from the database and are shown as entered
  (not auto-translated). The admin panel is English.

---

## 7. Home "Popular products" logic

[`getHomeProducts()`](src/lib/queries.ts) builds the list in order, up to 12:
1. **Featured** products (admin-curated in `/admin/featured`),
2. then **best-sellers** by quantity sold (skipping duplicates),
3. then **latest** active products to fill remaining slots.

So curated festival items appear alongside (in front of) the automatic best-sellers.

---

## 8. Inventory, Excel import & future billing

- **Excel import** → `services/product-import.service.ts`. Columns: *Product Name,
  Category, MRP, Wholesale Price, Image URL (optional)*. Creates Active products, updates
  existing (matched by derived SKU), records an `ImportLog`.
- **Inventory sync** → `services/inventory-sync.service.ts` + `services/billing/` adapter
  layer. Implement one adapter + set env vars to connect existing billing software later;
  trigger via Admin → Inventory → **Sync from Billing** or `POST /api/admin/inventory/sync`.

---

## 9. Performance & caching

- Public read queries (`getCategories`, `getPublicProducts`, `getProductBySlug`,
  `getRelatedProducts`, `getHomeProducts`) are wrapped in Next's data cache and **tagged**.
- Admin writes call `revalidateTag("products" / "categories")`, so storefront changes
  (price, stock, featured, new product) appear **immediately** while normal reads stay fast.
- Dev uses **Turbopack** (`npm run dev`). Images use AVIF/WebP with a 1-day cache.

---

## 10. Auth & security

- Admin login issues a signed **JWT in an httpOnly cookie** (`jose` + `bcryptjs`).
- `middleware.ts` guards every `/admin/*` route (except `/admin/login`); the `(panel)`
  layout re-checks the session server-side.
- Order prices are always recomputed server-side; minimum-order rules are enforced on the
  server as well as the client.

---

## 11. Data model (summary)

`Category 1—* Product 1—* EnquiryItem *—1 Enquiry *—1 Customer`, plus `AdminUser` and
`ImportLog`. `EnquiryItem` stores a **name/price snapshot** so historical orders stay
accurate even if a product is later edited or deleted. Full schema:
[`prisma/schema.prisma`](prisma/schema.prisma).
