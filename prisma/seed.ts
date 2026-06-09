/* eslint-disable no-console */
import { PrismaClient, Unit, ProductStatus, CustomerType, EnquiryStatus, DeliveryArea, AdminRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  console.log("🌱 Seeding Ganesh Trading Company database...");

  // --- Admin user ---
  const adminEmail = process.env.ADMIN_EMAIL || "admin@ganeshtrading.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@12345";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: {
      name: "Shop Owner",
      email: adminEmail,
      passwordHash,
      role: AdminRole.OWNER,
    },
  });
  console.log(`✅ Admin user ready: ${adminEmail}`);

  // --- Categories ---
  const categoryData = [
    { name: "Rice", description: "Basmati, sona masoori and daily rice" },
    { name: "Pulses", description: "Dal, beans and lentils" },
    { name: "Oil", description: "Cooking oils and ghee" },
    { name: "Snacks", description: "Namkeen, biscuits and chips" },
    { name: "Beverages", description: "Tea, coffee and soft drinks" },
    { name: "Household Items", description: "Cleaning and daily essentials" },
    { name: "Sugar & Salt", description: "Sugar, salt and sweeteners" },
    { name: "Atta & Flour", description: "Wheat flour, maida and besan" },
  ];

  const categories: Record<string, string> = {};
  for (let i = 0; i < categoryData.length; i++) {
    const c = categoryData[i];
    const cat = await prisma.category.upsert({
      where: { name: c.name },
      update: { description: c.description, sortOrder: i },
      create: {
        name: c.name,
        slug: slugify(c.name),
        description: c.description,
        sortOrder: i,
      },
    });
    categories[c.name] = cat.id;
  }
  console.log(`✅ ${categoryData.length} categories ready`);

  // --- Products ---
  type SeedProduct = {
    name: string;
    sku: string;
    category: string;
    mrp: number;
    wholesalePrice: number; // wholesale LOOSE price per base unit
    retailPrice: number;
    stock: number;
    unit: Unit;
    description: string;
    status?: ProductStatus;
    image?: string;
    bulk?: {
      looseEnabled: boolean;
      minQty: number;
      pack1: { label: string; size: number; price: number };
      pack2?: { label: string; size: number; price: number };
    };
  };

  const products: SeedProduct[] = [
    { name: "Sugar", sku: "SUG-1KG", category: "Sugar & Salt", mrp: 60, wholesalePrice: 52, retailPrice: 58, stock: 3000, unit: Unit.KG, description: "Refined white sugar. Loose per kg (min 5 kg) or a full 50kg sack at a better rate.", bulk: { looseEnabled: true, minQty: 5, pack1: { label: "Sack", size: 50, price: 2500 } } },
    { name: "Tata Salt", sku: "SALT-TATA-1KG", category: "Sugar & Salt", mrp: 28, wholesalePrice: 22, retailPrice: 26, stock: 2000, unit: Unit.KG, description: "Iodised salt. Loose per kg (min 5 kg) or a full 50kg bag.", bulk: { looseEnabled: true, minQty: 5, pack1: { label: "Bag", size: 50, price: 1000 } } },
    { name: "Basmati Rice", sku: "RICE-BAS-25KG", category: "Rice", mrp: 100, wholesalePrice: 80, retailPrice: 94, stock: 1500, unit: Unit.KG, description: "Long grain basmati rice. Buy loose per kg or a full 25kg sack at a better rate.", bulk: { looseEnabled: true, minQty: 5, pack1: { label: "Sack", size: 25, price: 2000 } } },
    { name: "Sona Masoori Rice", sku: "RICE-SONA-25KG", category: "Rice", mrp: 60, wholesalePrice: 52, retailPrice: 58, stock: 2000, unit: Unit.KG, description: "Everyday sona masoori rice. Loose per kg (min 5 kg) or a full 26kg sack.", bulk: { looseEnabled: true, minQty: 5, pack1: { label: "Sack", size: 26, price: 1250 } } },
    { name: "Toor Dal", sku: "DAL-TOOR-1KG", category: "Pulses", mrp: 160, wholesalePrice: 130, retailPrice: 150, stock: 600, unit: Unit.KG, description: "Premium toor (arhar) dal. Loose per kg (min 5 kg) or a full 30kg sack.", bulk: { looseEnabled: true, minQty: 5, pack1: { label: "Sack", size: 30, price: 3600 } } },
    { name: "Moong Dal", sku: "DAL-MOONG-1KG", category: "Pulses", mrp: 140, wholesalePrice: 115, retailPrice: 132, stock: 500, unit: Unit.KG, description: "Yellow moong dal. Loose per kg (min 5 kg) or a full 30kg sack.", bulk: { looseEnabled: true, minQty: 5, pack1: { label: "Sack", size: 30, price: 3300 } } },
    { name: "Chana Dal", sku: "DAL-CHANA-1KG", category: "Pulses", mrp: 110, wholesalePrice: 88, retailPrice: 102, stock: 500, unit: Unit.KG, description: "Split chana dal. Loose per kg (min 5 kg) or a full 30kg sack.", bulk: { looseEnabled: true, minQty: 5, pack1: { label: "Sack", size: 30, price: 2400 } } },
    { name: "Fortune Sunflower Oil 1L", sku: "OIL-SUN-1L", category: "Oil", mrp: 180, wholesalePrice: 150, retailPrice: 170, stock: 200, unit: Unit.LITRE, description: "Refined sunflower oil, 1 litre pouch." },
    { name: "Fortune Sunflower Oil 15L Tin", sku: "OIL-SUN-15L", category: "Oil", mrp: 2400, wholesalePrice: 2050, retailPrice: 2300, stock: 35, unit: Unit.BOX, description: "Refined sunflower oil, 15 litre tin." },
    { name: "Maggi Noodles", sku: "MAGGI-70G", category: "Snacks", mrp: 14, wholesalePrice: 11, retailPrice: 13, stock: 500, unit: Unit.PACKET, description: "Maggi 2-minute masala noodles, 70g." },
    { name: "Parle-G Biscuits (5 Rs)", sku: "BISC-PARLEG", category: "Snacks", mrp: 5, wholesalePrice: 4.5, retailPrice: 5, stock: 5000, unit: Unit.PACKET, description: "Parle-G glucose biscuits, ₹5 pack. Wholesale: order by Outer (12 packets) or Box (48 packets).", bulk: { looseEnabled: false, minQty: 12, pack1: { label: "Outer", size: 12, price: 54 }, pack2: { label: "Box", size: 48, price: 210 } } },
    { name: "Good Day Biscuits (10 Rs)", sku: "BISC-GOODDAY", category: "Snacks", mrp: 10, wholesalePrice: 9, retailPrice: 10, stock: 3000, unit: Unit.PACKET, description: "Good Day cashew biscuits, ₹10 pack. Wholesale: order by Outer (12 packets) or Box (60 packets).", bulk: { looseEnabled: false, minQty: 12, pack1: { label: "Outer", size: 12, price: 108 }, pack2: { label: "Box", size: 60, price: 525 } } },
    { name: "Lay's Chips Family Pack", sku: "CHIPS-LAYS-FAM", category: "Snacks", mrp: 50, wholesalePrice: 40, retailPrice: 47, stock: 250, unit: Unit.PACKET, description: "Lay's classic salted, family pack." },
    { name: "Tata Tea Gold 1kg", sku: "TEA-TATA-1KG", category: "Beverages", mrp: 540, wholesalePrice: 470, retailPrice: 520, stock: 90, unit: Unit.PACKET, description: "Tata Tea Gold, 1kg pack." },
    { name: "Bru Coffee 200g", sku: "COFFEE-BRU-200G", category: "Beverages", mrp: 320, wholesalePrice: 270, retailPrice: 305, stock: 70, unit: Unit.PACKET, description: "Bru instant coffee, 200g jar." },
    { name: "Surf Excel 1kg", sku: "DET-SURF-1KG", category: "Household Items", mrp: 130, wholesalePrice: 105, retailPrice: 122, stock: 180, unit: Unit.PACKET, description: "Surf Excel detergent powder, 1kg." },
    { name: "Vim Dishwash Bar", sku: "VIM-BAR", category: "Household Items", mrp: 20, wholesalePrice: 15, retailPrice: 18, stock: 400, unit: Unit.PIECE, description: "Vim dishwash bar, 300g." },
    { name: "Aashirvaad Atta 10kg", sku: "ATTA-AASH-10KG", category: "Atta & Flour", mrp: 520, wholesalePrice: 450, retailPrice: 500, stock: 100, unit: Unit.SACK, description: "Whole wheat atta, 10kg bag." },
    { name: "Besan 1kg", sku: "BESAN-1KG", category: "Atta & Flour", mrp: 90, wholesalePrice: 72, retailPrice: 84, stock: 140, unit: Unit.KG, description: "Gram flour (besan), 1kg." },
  ];

  for (const p of products) {
    const status = p.status ?? (p.stock <= 0 ? ProductStatus.OUT_OF_STOCK : ProductStatus.ACTIVE);
    const bulkData = {
      hasBulkPricing: !!p.bulk,
      wholesaleLooseEnabled: p.bulk ? p.bulk.looseEnabled : true,
      wholesaleMinQty: p.bulk?.minQty ?? 1,
      pack1Label: p.bulk?.pack1.label ?? null,
      pack1Size: p.bulk?.pack1.size ?? null,
      pack1Price: p.bulk?.pack1.price ?? null,
      pack2Label: p.bulk?.pack2?.label ?? null,
      pack2Size: p.bulk?.pack2?.size ?? null,
      pack2Price: p.bulk?.pack2?.price ?? null,
    };
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        name: p.name,
        mrp: p.mrp,
        wholesalePrice: p.wholesalePrice,
        retailPrice: p.retailPrice,
        stockQuantity: p.stock,
        unit: p.unit,
        status,
        description: p.description,
        categoryId: categories[p.category],
        ...bulkData,
      },
      create: {
        name: p.name,
        slug: slugify(p.name),
        sku: p.sku,
        description: p.description,
        imageUrl: p.image ?? `https://placehold.co/400x400/16a34a/ffffff?text=${encodeURIComponent(p.name)}`,
        mrp: p.mrp,
        wholesalePrice: p.wholesalePrice,
        retailPrice: p.retailPrice,
        stockQuantity: p.stock,
        unit: p.unit,
        status,
        categoryId: categories[p.category],
        ...bulkData,
      },
    });
  }
  console.log(`✅ ${products.length} products ready`);

  // The old standalone "Sugar 50kg Sack" is now merged into "Sugar" (loose +
  // 50kg sack), so retire it if it exists from an earlier seed.
  await prisma.product
    .update({ where: { sku: "SUG-50KG" }, data: { status: ProductStatus.INACTIVE } })
    .catch(() => {});

  // --- Sample customers + enquiries ---
  const wholesaleCustomer = await prisma.customer.upsert({
    where: { mobile: "9876543210" },
    update: {},
    create: { name: "John Doe", mobile: "9876543210", shopName: "ABC Stores", type: CustomerType.WHOLESALE },
  });

  const sugar = await prisma.product.findUnique({ where: { sku: "SUG-1KG" } });
  const riceBag = await prisma.product.findUnique({ where: { sku: "RICE-SONA-25KG" } });

  if (sugar && riceBag) {
    const existing = await prisma.enquiry.findFirst({ where: { enquiryCode: "GTC-000001" } });
    if (!existing) {
      await prisma.enquiry.create({
        data: {
          enquiryCode: "GTC-000001",
          type: CustomerType.WHOLESALE,
          status: EnquiryStatus.NEW,
          customerName: "John Doe",
          mobile: "9876543210",
          shopName: "ABC Stores",
          grandTotal: 7500,
          customerId: wholesaleCustomer.id,
          items: {
            create: [
              { productId: sugar.id, productName: `${sugar.name} (Sack 50 Kg)`, unit: sugar.unit, unitPrice: 2500, quantity: 2, lineTotal: 5000 },
              { productId: riceBag.id, productName: `${riceBag.name} (Sack 26 Kg)`, unit: riceBag.unit, unitPrice: 1250, quantity: 2, lineTotal: 2500 },
            ],
          },
        },
      });
      console.log("✅ Sample wholesale enquiry GTC-000001 created");
    }
  }

  const retailCustomer = await prisma.customer.upsert({
    where: { mobile: "9123456780" },
    update: {},
    create: { name: "Asha Patil", mobile: "9123456780", type: CustomerType.RETAIL },
  });

  const maggi = await prisma.product.findUnique({ where: { sku: "MAGGI-70G" } });
  const oil = await prisma.product.findUnique({ where: { sku: "OIL-SUN-1L" } });

  if (maggi && oil) {
    const existing = await prisma.enquiry.findFirst({ where: { enquiryCode: "GTC-000002" } });
    if (!existing) {
      await prisma.enquiry.create({
        data: {
          enquiryCode: "GTC-000002",
          type: CustomerType.RETAIL,
          status: EnquiryStatus.CONTACTED,
          customerName: "Asha Patil",
          mobile: "9123456780",
          deliveryArea: DeliveryArea.VIRAR_WEST,
          deliveryAddress: "12 MG Road, near Hanuman Temple, Virar West 401303",
          grandTotal: 405,
          customerId: retailCustomer.id,
          items: {
            create: [
              { productId: maggi.id, productName: maggi.name, unit: maggi.unit, unitPrice: 13, quantity: 5, lineTotal: 65 },
              { productId: oil.id, productName: oil.name, unit: oil.unit, unitPrice: 170, quantity: 2, lineTotal: 340 },
            ],
          },
        },
      });
      console.log("✅ Sample retail enquiry GTC-000002 created");
    }
  }

  console.log("🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
