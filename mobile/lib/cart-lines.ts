import { CartMode, ProductDTO } from "./types";
import { UNIT_LABELS } from "./constants";
import { formatCurrency } from "./api";

export type LineVariant = "RETAIL" | "WHOLESALE_LOOSE" | "WHOLESALE_PACK1" | "WHOLESALE_PACK2";

export interface CartLineInput {
  key: string; // `${productId}__${variant}`
  productId: string;
  variant: LineVariant;
  name: string;
  displayName: string;
  slug: string;
  sku: string;
  imageUrl?: string | null;
  unitLabel: string;
  unitPrice: number;
  quantity?: number;
  minQty: number;
  packSize?: number | null;
}

export interface ProductCartOption {
  input: CartLineInput;
  buttonLabel: string;
  priceLabel: string;
  packInfo?: string;
  subLabel?: string;
}

function baseLine(p: ProductDTO) {
  return {
    productId: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    imageUrl: p.imageUrl,
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
    priceLabel: `${formatCurrency(price)} / ${label}`,
    packInfo: `1 ${label} = ${size} ${baseUnit}`,
    subLabel: `${formatCurrency(price / size)} / ${baseUnit}`,
  };
}

/** Buy options for a product in the current mode (ported from the web app). */
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
        priceLabel: `${formatCurrency(product.retailPrice)} / ${baseUnit}`,
      },
    ];
  }

  // WHOLESALE
  const hasPack1 = !!product.pack1Label && !!product.pack1Size && product.pack1Price != null;
  const hasPack2 = !!product.pack2Label && !!product.pack2Size && product.pack2Price != null;

  // Biscuit / box type: no loose — Outer + Box only.
  if (!product.wholesaleLooseEnabled && hasPack1) {
    const opts = [
      packOption(product, "WHOLESALE_PACK1", product.pack1Label!, product.pack1Size!, product.pack1Price!),
    ];
    if (hasPack2) {
      const opt = packOption(product, "WHOLESALE_PACK2", product.pack2Label!, product.pack2Size!, product.pack2Price!);
      if (product.pack2Size! % product.pack1Size! === 0) {
        const outers = product.pack2Size! / product.pack1Size!;
        opt.packInfo += ` · ${outers} ${product.pack1Label!.toLowerCase()}s`;
        opt.subLabel = `${formatCurrency(product.pack2Price! / outers)} / ${product.pack1Label!.toLowerCase()} · ${formatCurrency(product.pack2Price! / product.pack2Size!)} / ${baseUnit}`;
      }
      opts.push(opt);
    }
    return opts;
  }

  // Standard: loose (with min) + optional sack
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
      priceLabel: `${formatCurrency(product.wholesalePrice)} / ${baseUnit}`,
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

/** Lead (cheapest entry) unit price for showing a "from" price on cards. */
export function leadPrice(product: ProductDTO, mode: CartMode): number {
  return getCartOptions(product, mode)[0].input.unitPrice;
}
