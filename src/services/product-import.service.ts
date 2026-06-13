import "server-only";
import * as XLSX from "xlsx";
import { Prisma, ProductStatus, Unit } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export interface ImportRowError {
  row: number;
  message: string;
}

export interface ImportSummary {
  totalRows: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: ImportRowError[];
}

interface ParsedRow {
  name: string;
  category: string;
  mrp: number;
  wholesalePrice: number;
  imageUrl?: string;
}

/**
 * Product Import Service
 * ----------------------
 * Parses an uploaded Excel/CSV buffer and creates/updates products.
 * Expected columns (header row, case-insensitive):
 *   - Product Name
 *   - Category
 *   - MRP
 *   - Wholesale Price
 *   - Image URL (optional — a public https link to the product photo)
 *
 * Behaviour (per the business spec):
 *   - Creates products that don't exist (SKU derived from name).
 *   - Updates MRP + Wholesale Price for products that already exist.
 *   - Skips exact duplicate rows within the same file and rows with no changes.
 *   - Retail price defaults to MRP on create and is left for manual admin edit.
 *   - Produces a full import summary and persists an audit ImportLog.
 */
export async function importProductsFromBuffer(
  buffer: Buffer,
  fileName?: string
): Promise<ImportSummary> {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("The uploaded file has no sheets");
  }
  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  const summary: ImportSummary = {
    totalRows: rawRows.length,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  const seenSkus = new Set<string>();

  for (let i = 0; i < rawRows.length; i++) {
    const rowNum = i + 2; // +1 for header, +1 for 1-based
    const raw = rawRows[i];
    try {
      const parsed = parseRow(raw);
      if (!parsed) {
        summary.skipped++;
        continue;
      }

      const sku = deriveSku(parsed.name);
      const slug = slugify(parsed.name) || sku.toLowerCase();

      // Duplicate within this file → skip (sku & slug derive from the name)
      if (seenSkus.has(sku) || seenSkus.has(slug)) {
        summary.skipped++;
        continue;
      }
      seenSkus.add(sku);
      seenSkus.add(slug);

      const category = await findOrCreateCategory(parsed.category);

      // Match an existing product by SKU OR slug. Seeded/manual products may
      // have a custom SKU but a name-based slug, so matching by both avoids a
      // unique-constraint crash on slug when "creating" a product that exists.
      const existing = await prisma.product.findFirst({
        where: { OR: [{ sku }, { slug }] },
      });

      if (existing) {
        // Skip if nothing actually changed (price or image)
        const imageChanged = !!parsed.imageUrl && parsed.imageUrl !== existing.imageUrl;
        const unchanged =
          Number(existing.mrp) === parsed.mrp &&
          Number(existing.wholesalePrice) === parsed.wholesalePrice &&
          !imageChanged;
        if (unchanged) {
          summary.skipped++;
          continue;
        }
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            mrp: parsed.mrp,
            wholesalePrice: parsed.wholesalePrice,
            categoryId: category.id,
            // Only overwrite the image when a URL is given in the file
            ...(parsed.imageUrl ? { imageUrl: parsed.imageUrl } : {}),
          },
        });
        summary.updated++;
      } else {
        const baseData = {
          name: parsed.name,
          mrp: parsed.mrp,
          wholesalePrice: parsed.wholesalePrice,
          // Retail price defaults to MRP, set manually later by admin
          retailPrice: parsed.mrp,
          stockQuantity: 0,
          unit: Unit.PIECE,
          status: ProductStatus.ACTIVE, // active by default; admin can deactivate
          categoryId: category.id,
          imageUrl:
            parsed.imageUrl ||
            `https://placehold.co/400x400/16a34a/ffffff?text=${encodeURIComponent(parsed.name)}`,
        };
        try {
          await prisma.product.create({ data: { ...baseData, slug, sku } });
        } catch (e) {
          // Safety net: if slug/sku still collide, retry once with a unique suffix
          if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
            const suffix = Math.random().toString(36).slice(2, 6);
            await prisma.product.create({
              data: { ...baseData, slug: `${slug}-${suffix}`, sku: `${sku}-${suffix.toUpperCase()}` },
            });
          } else {
            throw e;
          }
        }
        summary.created++;
      }
    } catch (err) {
      summary.failed++;
      summary.errors.push({
        row: rowNum,
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  await prisma.importLog.create({
    data: {
      source: "EXCEL",
      fileName: fileName ?? null,
      totalRows: summary.totalRows,
      created: summary.created,
      updated: summary.updated,
      skipped: summary.skipped,
      failed: summary.failed,
      errors: summary.errors.length
        ? (summary.errors as unknown as Prisma.InputJsonValue)
        : undefined,
    },
  });

  return summary;
}

/** Reads a value from a row by trying several header spellings. */
function pick(row: Record<string, unknown>, keys: string[]): string {
  const lowerMap = new Map<string, unknown>();
  for (const [k, v] of Object.entries(row)) {
    lowerMap.set(k.toLowerCase().trim(), v);
  }
  for (const key of keys) {
    const v = lowerMap.get(key.toLowerCase());
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      return String(v).trim();
    }
  }
  return "";
}

function parseRow(row: Record<string, unknown>): ParsedRow | null {
  const name = pick(row, ["Product Name", "name", "product", "item"]);
  const category = pick(row, ["Category", "category", "cat"]) || "Uncategorised";
  const mrpStr = pick(row, ["MRP", "mrp", "price"]);
  const wholesaleStr = pick(row, [
    "Wholesale Price",
    "wholesale price",
    "wholesale",
    "wholesalePrice",
  ]);
  const imageRaw = pick(row, [
    "Image URL",
    "image url",
    "image",
    "imageurl",
    "image link",
    "photo",
    "picture",
  ]);

  if (!name) return null; // empty row → skip

  const mrp = parseFloat(mrpStr.replace(/[^\d.]/g, ""));
  const wholesalePrice = parseFloat(wholesaleStr.replace(/[^\d.]/g, ""));

  if (Number.isNaN(mrp) || Number.isNaN(wholesalePrice)) {
    throw new Error(`Invalid MRP/Wholesale Price for "${name}"`);
  }

  // Only accept proper http(s) image links; ignore anything else silently.
  const imageUrl = /^https?:\/\//i.test(imageRaw) ? imageRaw : undefined;

  return { name, category, mrp, wholesalePrice, imageUrl };
}

function deriveSku(name: string): string {
  return slugify(name).toUpperCase().replace(/-/g, "-").slice(0, 60) || name.slice(0, 60);
}

async function findOrCreateCategory(name: string) {
  const cleanName = name.trim() || "Uncategorised";
  const existing = await prisma.category.findUnique({ where: { name: cleanName } });
  if (existing) return existing;
  return prisma.category.create({
    data: { name: cleanName, slug: slugify(cleanName) || "uncategorised" },
  });
}
