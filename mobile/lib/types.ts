export type Unit = "PIECE" | "KG" | "LITRE" | "PACKET" | "BOX" | "SACK";
export type CartMode = "RETAIL" | "WHOLESALE";

export interface ProductDTO {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string | null;
  imageUrl: string | null;
  mrp: number;
  wholesalePrice: number;
  retailPrice: number;
  hasBulkPricing: boolean;
  wholesaleLooseEnabled: boolean;
  wholesaleMinQty: number;
  pack1Label: string | null;
  pack1Size: number | null;
  pack1Price: number | null;
  pack2Label: string | null;
  pack2Size: number | null;
  pack2Price: number | null;
  stockQuantity: number;
  unit: Unit;
  status: "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK";
  isFeatured?: boolean;
  categoryId: string;
  category?: { name: string; slug: string };
}

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  _count?: { products: number };
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
