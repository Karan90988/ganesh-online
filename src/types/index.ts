import { ProductStatus, Unit, CustomerType, EnquiryStatus, DeliveryArea } from "@prisma/client";

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
  status: ProductStatus;
  isFeatured?: boolean;
  categoryId: string;
  category?: { name: string; slug: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  _count?: { products: number };
}

export interface EnquiryItemDTO {
  id: string;
  productName: string;
  unit: Unit;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface EnquiryDTO {
  id: string;
  enquiryCode: string;
  type: CustomerType;
  status: EnquiryStatus;
  customerName: string;
  mobile: string;
  shopName: string | null;
  deliveryArea: DeliveryArea | null;
  deliveryAddress: string | null;
  grandTotal: number;
  notes: string | null;
  whatsappSent: boolean;
  items: EnquiryItemDTO[];
  createdAt: string;
}

export interface CustomerDTO {
  id: string;
  name: string;
  mobile: string;
  shopName: string | null;
  type: CustomerType;
  createdAt: string;
  _count?: { enquiries: number };
  enquiries?: EnquiryDTO[];
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
