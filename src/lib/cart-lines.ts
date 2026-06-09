import { CartLineInput, CartMode, LineVariant } from "@/store/cart";
import { ProductDTO } from "@/types";
import { UNIT_LABELS } from "@/lib/constants";

export interface ProductCartOption {
  input: CartLineInput;
  buttonLabel: string; // e.g. "Add", "Add Outer", "Add Box"
  priceLabel: string; // e.g. "₹52 / Kg" or "₹120 / Outer"
  subLabel?: string; // e.g. "min 5 Kg"
  packInfo?: string; // e.g. "1 Outer = 12 Packet"
}

function money(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
}

function baseLine(product: ProductDTO) {
  return {
    productId: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    imageUrl: product.imageUrl,
  };
}

function packOption(
  product: ProductDTO,
  variant: LineVariant,
  label: string,
  size: number,
  price: number
): ProductCartOption {
  const baseUnit = UNIT_LABELS[product.unit];
  return {
    input: {
      ...baseLine(product),
      key: `${product.id}__${variant}`,
      variant,
      displayName: `${product.name} (${label} ${size} ${baseUnit})`,
      unitLabel: label,
      unitPrice: price,
      minQty: 1,
      packSize: size,
    },
    buttonLabel: `Add ${label}`,
    priceLabel: `${money(price)} / ${label}`,
    packInfo: `1 ${label} = ${size} ${baseUnit}`,
  };
}

/**
 * Builds the add-to-cart options for a product in the current store mode.
 *  - Retail: one option (retail price per base unit).
 *  - Wholesale, biscuit type (loose disabled + 2 packs): Outer + Box.
 *  - Wholesale, standard: loose (wholesale price, with min qty) + optional sack.
 */
export function getCartOptions(product: ProductDTO, mode: CartMode): ProductCartOption[] {
  const baseUnit = UNIT_LABELS[product.unit];

  if (mode === "RETAIL") {
    return [
      {
        input: {
          ...baseLine(product),
          key: `${product.id}__RETAIL`,
          variant: "RETAIL",
          displayName: product.name,
          unitLabel: baseUnit,
          unitPrice: product.retailPrice,
          minQty: 1,
          packSize: null,
        },
        buttonLabel: "Add",
        priceLabel: `${money(product.retailPrice)} / ${baseUnit}`,
      },
    ];
  }

  // ---- WHOLESALE ----
  const hasPack1 =
    !!product.pack1Label && !!product.pack1Size && product.pack1Price != null;
  const hasPack2 =
    !!product.pack2Label && !!product.pack2Size && product.pack2Price != null;

  // Biscuit / box type: no loose ordering — Outer + Box only.
  if (!product.wholesaleLooseEnabled && hasPack1) {
    const opts = [
      packOption(product, "WHOLESALE_PACK1", product.pack1Label!, product.pack1Size!, product.pack1Price!),
    ];
    if (hasPack2) {
      const opt = packOption(
        product,
        "WHOLESALE_PACK2",
        product.pack2Label!,
        product.pack2Size!,
        product.pack2Price!
      );
      if (product.pack2Size! % product.pack1Size! === 0) {
        opt.packInfo += ` · ${product.pack2Size! / product.pack1Size!} ${product.pack1Label!.toLowerCase()}s`;
      }
      opts.push(opt);
    }
    return opts;
  }

  // Standard type: loose (wholesale price, with min qty) + optional sack/box.
  const minQty = Math.max(1, product.wholesaleMinQty || 1);
  const options: ProductCartOption[] = [
    {
      input: {
        ...baseLine(product),
        key: `${product.id}__WHOLESALE_LOOSE`,
        variant: "WHOLESALE_LOOSE",
        displayName: hasPack1 ? `${product.name} (Loose)` : product.name,
        unitLabel: baseUnit,
        unitPrice: product.wholesalePrice,
        minQty,
        packSize: null,
      },
      buttonLabel: hasPack1 ? "Add Loose" : "Add",
      priceLabel: `${money(product.wholesalePrice)} / ${baseUnit}`,
      subLabel: minQty > 1 ? `min ${minQty} ${baseUnit}` : undefined,
    },
  ];

  if (hasPack1) {
    options.push(
      packOption(product, "WHOLESALE_PACK1", product.pack1Label!, product.pack1Size!, product.pack1Price!)
    );
  }

  return options;
}
