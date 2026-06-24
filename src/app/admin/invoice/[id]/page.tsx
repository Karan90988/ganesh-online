import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DELIVERY_AREA_LABELS, ENQUIRY_STATUS_LABELS } from "@/lib/constants";
import { buildInvoiceMessage, toWaNumber } from "@/lib/whatsapp";
import { PrintButton } from "@/components/admin/print-button";
import { Button } from "@/components/ui/button";
import { EnquiryDTO } from "@/types";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export default async function InvoicePage({ params }: Params) {
  const { id } = await params;
  const raw = await prisma.enquiry.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!raw) notFound();
  const enquiry = serialize(raw) as unknown as EnquiryDTO;

  const businessName = process.env.NEXT_PUBLIC_BUSINESS_NAME || "Ganesh Trading Company";
  const phone = process.env.NEXT_PUBLIC_BUSINESS_PHONE || "";
  const address = process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || "";

  // WhatsApp share to the customer with the updated invoice (text).
  const invoiceText = buildInvoiceMessage({
    businessName,
    enquiryCode: enquiry.enquiryCode,
    customerName: enquiry.customerName,
    items: enquiry.items.map((it) => ({
      productName: it.productName,
      quantity: it.quantity,
      unit: it.unit,
      unitPrice: it.unitPrice,
      lineTotal: it.lineTotal,
    })),
    grandTotal: enquiry.grandTotal,
    deliveryCharge: enquiry.deliveryCharge,
  });
  const shareUrl = `https://wa.me/${toWaNumber(enquiry.mobile)}?text=${encodeURIComponent(invoiceText)}`;

  return (
    <div className="min-h-screen bg-muted/40 py-6">
      {/* Toolbar (hidden when printing) */}
      <div className="container mb-4 flex max-w-3xl items-center justify-between print:hidden">
        <Link href="/admin/orders" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to orders
        </Link>
        <div className="flex gap-2">
          <PrintButton />
          <a href={shareUrl} target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="bg-[#25D366] hover:bg-[#1ebe5d]">
              <MessageCircle className="h-5 w-5" /> Share on WhatsApp
            </Button>
          </a>
        </div>
      </div>

      <p className="container mb-4 max-w-3xl text-xs text-muted-foreground print:hidden">
        <strong>Print / Save as PDF</strong> to get a PDF file. <strong>Share on WhatsApp</strong>{" "}
        opens a chat with {enquiry.customerName} ({enquiry.mobile}) pre-filled with this invoice —
        you can also attach the saved PDF there.
      </p>

      {/* Invoice sheet */}
      <div className="container max-w-3xl">
        <div className="rounded-lg border bg-white p-8 shadow-sm print:border-0 print:shadow-none">
          {/* Header */}
          <div className="flex items-start justify-between border-b pb-4">
            <div>
              <h1 className="text-2xl font-extrabold text-primary">{businessName}</h1>
              {address && <p className="mt-1 max-w-xs text-sm text-gray-600">{address}</p>}
              {phone && <p className="text-sm text-gray-600">Phone: {phone}</p>}
            </div>
            <div className="text-right">
              <p className="text-xl font-bold tracking-wide text-gray-800">INVOICE</p>
              <p className="mt-1 text-sm text-gray-600">No: {enquiry.enquiryCode}</p>
              <p className="text-sm text-gray-600">Date: {formatDate(enquiry.createdAt)}</p>
              <p className="text-sm text-gray-600">
                {enquiry.type === "WHOLESALE" ? "Wholesale" : "Retail"} ·{" "}
                {ENQUIRY_STATUS_LABELS[enquiry.status]}
              </p>
            </div>
          </div>

          {/* Bill to */}
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Bill To</p>
            <p className="font-bold">{enquiry.customerName}</p>
            <p className="text-sm text-gray-700">Mobile: {enquiry.mobile}</p>
            {enquiry.shopName && <p className="text-sm text-gray-700">Shop: {enquiry.shopName}</p>}
            {enquiry.deliveryAddress && (
              <p className="text-sm text-gray-700">Address: {enquiry.deliveryAddress}</p>
            )}
            {!enquiry.deliveryAddress && enquiry.deliveryArea && (
              <p className="text-sm text-gray-700">Area: {DELIVERY_AREA_LABELS[enquiry.deliveryArea]}</p>
            )}
          </div>

          {/* Items table */}
          <table className="mt-6 w-full text-sm">
            <thead>
              <tr className="border-y bg-gray-50 text-left">
                <th className="py-2 pl-2 pr-1 font-semibold">#</th>
                <th className="px-1 py-2 font-semibold">Item</th>
                <th className="px-1 py-2 text-right font-semibold">Qty</th>
                <th className="px-1 py-2 text-right font-semibold">Rate</th>
                <th className="px-1 py-2 pr-2 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {enquiry.items.map((it, i) => (
                <tr key={it.id} className="border-b">
                  <td className="py-2 pl-2 pr-1 align-top text-gray-600">{i + 1}</td>
                  <td className="px-1 py-2 align-top">{it.productName}</td>
                  <td className="px-1 py-2 text-right align-top">
                    {it.quantity} {it.unit.toLowerCase()}
                  </td>
                  <td className="px-1 py-2 text-right align-top">{formatCurrency(it.unitPrice)}</td>
                  <td className="px-1 py-2 pr-2 text-right align-top font-medium">
                    {formatCurrency(it.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              {enquiry.deliveryCharge > 0 && (
                <>
                  <tr>
                    <td colSpan={4} className="px-1 pt-3 text-right text-sm">
                      Subtotal
                    </td>
                    <td className="px-1 pt-3 pr-2 text-right text-sm">
                      {formatCurrency(enquiry.grandTotal - enquiry.deliveryCharge)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="px-1 py-1 text-right text-sm">
                      Delivery
                    </td>
                    <td className="px-1 py-1 pr-2 text-right text-sm">
                      {formatCurrency(enquiry.deliveryCharge)}
                    </td>
                  </tr>
                </>
              )}
              <tr>
                <td colSpan={4} className="px-1 py-3 text-right text-base font-bold">
                  Grand Total
                </td>
                <td className="px-1 py-3 pr-2 text-right text-base font-extrabold">
                  {formatCurrency(enquiry.grandTotal)}
                </td>
              </tr>
            </tfoot>
          </table>

          {enquiry.notes && (
            <p className="mt-4 text-sm text-gray-700">
              <span className="font-semibold">Note:</span> {enquiry.notes}
            </p>
          )}

          {/* Footer */}
          <div className="mt-8 border-t pt-4 text-center text-xs text-gray-500">
            <p>Thank you for your business!</p>
            <p className="mt-1">
              No online payment — this is a delivery invoice from {businessName}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
