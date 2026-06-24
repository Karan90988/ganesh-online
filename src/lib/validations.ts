import { z } from "zod";
import { Unit, ProductStatus, EnquiryStatus, DeliveryArea, CustomerType } from "@prisma/client";

// ---------- Auth ----------
export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
export type LoginInput = z.infer<typeof loginSchema>;

// ---------- Category ----------
export const categorySchema = z.object({
  name: z.string().min(2, "Name is required").max(80),
  description: z.string().max(300).optional().or(z.literal("")),
  imageUrl: z.string().url().optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});
export type CategoryInput = z.infer<typeof categorySchema>;

// ---------- Banner (promotion message) ----------
export const bannerSchema = z.object({
  text: z.string().min(1, "Message is required").max(120),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});
export type BannerInput = z.infer<typeof bannerSchema>;

// ---------- Store settings (delivery + minimum order) ----------
export const settingsSchema = z.object({
  retailFreeDeliveryThreshold: z.coerce.number().int().min(0).max(1_000_000),
  retailDeliveryCharge: z.coerce.number().int().min(0).max(100_000),
  wholesaleMinOrderValue: z.coerce.number().int().min(0).max(10_000_000),
});
export type SettingsInput = z.infer<typeof settingsSchema>;

// ---------- Product ----------
export const productSchema = z.object({
  name: z.string().min(2, "Name is required").max(120),
  sku: z.string().min(1, "SKU is required").max(60),
  description: z.string().max(1000).optional().or(z.literal("")),
  imageUrl: z.string().url().optional().or(z.literal("")),
  categoryId: z.string().min(1, "Category is required"),
  mrp: z.coerce.number().nonnegative("MRP must be 0 or more"),
  wholesalePrice: z.coerce.number().nonnegative("Wholesale price must be 0 or more"),
  retailPrice: z.coerce.number().nonnegative("Retail price must be 0 or more"),
  stockQuantity: z.coerce.number().int().min(0, "Stock cannot be negative"),
  unit: z.nativeEnum(Unit),
  status: z.nativeEnum(ProductStatus),
  // Wholesale pack / bulk buying (optional)
  hasBulkPricing: z.boolean().default(false),
  wholesaleLooseEnabled: z.boolean().default(true),
  wholesaleMinQty: z.coerce.number().int().min(1).default(1),
  pack1Label: z.string().max(40).optional().nullable().or(z.literal("")),
  pack1Size: z.coerce.number().int().positive().optional().nullable(),
  pack1Price: z.coerce.number().nonnegative().optional().nullable(),
  pack2Label: z.string().max(40).optional().nullable().or(z.literal("")),
  pack2Size: z.coerce.number().int().positive().optional().nullable(),
  pack2Price: z.coerce.number().nonnegative().optional().nullable(),
})
  .refine(
    // When bulk is on, require pack tier 1 to be fully filled.
    (d) => !d.hasBulkPricing || (!!d.pack1Label && !!d.pack1Size && d.pack1Price != null),
    { message: "Pack 1 needs a label, size and price when bulk pricing is on", path: ["pack1Price"] }
  )
  .refine(
    // If loose is disabled, there must be at least one pack to buy.
    (d) => !d.hasBulkPricing || d.wholesaleLooseEnabled || (!!d.pack1Label && d.pack1Price != null),
    { message: "Add at least one pack, or enable loose ordering", path: ["pack1Price"] }
  )
  .refine(
    // Pack 2 is optional, but if any field is set, all must be set.
    (d) => {
      const any = !!d.pack2Label || d.pack2Size != null || d.pack2Price != null;
      const all = !!d.pack2Label && !!d.pack2Size && d.pack2Price != null;
      return !any || all;
    },
    { message: "Pack 2 needs a label, size and price (or leave all 3 empty)", path: ["pack2Price"] }
  );
export type ProductInput = z.infer<typeof productSchema>;

// ---------- Enquiry (checkout) ----------
export const lineVariantSchema = z.enum([
  "RETAIL",
  "WHOLESALE_LOOSE",
  "WHOLESALE_PACK1",
  "WHOLESALE_PACK2",
]);
export type LineVariant = z.infer<typeof lineVariantSchema>;

const enquiryItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().positive("Quantity must be at least 1"),
  variant: lineVariantSchema.default("RETAIL"),
});

export const checkoutSchema = z
  .object({
    type: z.nativeEnum(CustomerType),
    customerName: z.string().min(2, "Name is required").max(80),
    mobile: z
      .string()
      .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
    shopName: z.string().max(120).optional().or(z.literal("")),
    deliveryArea: z.nativeEnum(DeliveryArea).optional(),
    deliveryAddress: z.string().max(500).optional().or(z.literal("")),
    items: z.array(enquiryItemSchema).min(1, "Cart is empty"),
  })
  .refine(
    (data) => data.type !== "RETAIL" || (data.deliveryAddress ?? "").trim().length >= 10,
    {
      message: "Please enter your full delivery address (at least 10 characters)",
      path: ["deliveryAddress"],
    }
  );
export type CheckoutInput = z.infer<typeof checkoutSchema>;

// ---------- Enquiry status update ----------
export const enquiryStatusSchema = z.object({
  status: z.nativeEnum(EnquiryStatus),
  notes: z.string().max(500).optional().or(z.literal("")),
});

// ---------- Enquiry items edit (admin) ----------
export const enquiryItemsUpdateSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        quantity: z.coerce.number().int().positive("Quantity must be at least 1"),
        unitPrice: z.coerce.number().nonnegative().optional(),
      })
    )
    .min(1, "An order must have at least one item"),
});

// ---------- Inventory ----------
export const stockUpdateSchema = z.object({
  stockQuantity: z.coerce.number().int().min(0),
  status: z.nativeEnum(ProductStatus).optional(),
});
