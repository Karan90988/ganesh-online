import { Unit, ProductStatus, EnquiryStatus, DeliveryArea, CustomerType } from "@prisma/client";

export const UNIT_LABELS: Record<Unit, string> = {
  PACKET: "Packet",
  BOX: "Box",
  CARTON: "Carton",
  KG: "Kg",
  GRAM: "Gram",
  LITRE: "Litre",
  PIECE: "Piece",
  SACK: "Sack",
};

export const UNIT_OPTIONS = Object.entries(UNIT_LABELS).map(([value, label]) => ({
  value: value as Unit,
  label,
}));

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  OUT_OF_STOCK: "Out of Stock",
};

export const ENQUIRY_STATUS_LABELS: Record<EnquiryStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export const ENQUIRY_STATUS_COLORS: Record<EnquiryStatus, string> = {
  NEW: "bg-blue-100 text-blue-800",
  CONTACTED: "bg-amber-100 text-amber-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export const DELIVERY_AREA_LABELS: Record<DeliveryArea, string> = {
  VIRAR_EAST: "Virar East",
  VIRAR_WEST: "Virar West",
  VASAI_EAST: "Vasai East",
  VASAI_WEST: "Vasai West",
  NALASOPARA_EAST: "Nalasopara East",
  NALASOPARA_WEST: "Nalasopara West",
  OTHER: "Other",
};

export const DELIVERY_AREA_OPTIONS = Object.entries(DELIVERY_AREA_LABELS).map(
  ([value, label]) => ({ value: value as DeliveryArea, label })
);

export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  WHOLESALE: "Wholesale",
  RETAIL: "Retail",
};

export const PAGE_SIZE = 12;
export const ADMIN_PAGE_SIZE = 20;

/** Minimum order value (grand total, in ₹) required to place an order. */
export const MIN_ORDER_VALUE: Record<CustomerType, number> = {
  RETAIL: 109,
  WHOLESALE: 1499,
};
