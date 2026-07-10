"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Search, Eye, Pencil, Trash2, Printer, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ENQUIRY_STATUS_LABELS,
  ENQUIRY_STATUS_COLORS,
  DELIVERY_AREA_LABELS,
} from "@/lib/constants";
import { buildInvoiceMessage, toWaNumber } from "@/lib/whatsapp";
import { EnquiryDTO, Pagination } from "@/types";

/** WhatsApp message to send order + location details to a delivery boy. */
function deliveryShareUrl(e: EnquiryDTO): string {
  const items = e.items
    .map((it, i) => `${i + 1}. ${it.productName} × ${it.quantity} ${it.unit.toLowerCase()} — ₹${Number(it.lineTotal).toLocaleString("en-IN")}`)
    .join("\n");

  const address = e.deliveryAddress || e.shopName || "—";

  const mapsLink =
    e.latitude && e.longitude
      ? `Location: https://www.google.com/maps?q=${e.latitude},${e.longitude}`
      : `Location: https://maps.google.com/?q=${encodeURIComponent(address)}`;

  const msg = [
    `*DELIVERY — ${e.enquiryCode}*`,
    ``,
    `Customer: ${e.customerName}`,
    `Mobile: ${e.mobile}`,
    ``,
    `Items:`,
    items,
    ``,
    `Grand Total: ₹${Number(e.grandTotal).toLocaleString("en-IN")}`,
    ``,
    `Address: ${address}`,
    mapsLink,
  ].join("\n");

  return `https://wa.me/?text=${encodeURIComponent(msg)}`;
}

/** WhatsApp share link to the customer with the (updated) invoice text. */
function invoiceShareUrl(e: EnquiryDTO): string {
  const text = buildInvoiceMessage({
    businessName: process.env.NEXT_PUBLIC_BUSINESS_NAME || "Ganesh Trading Company",
    enquiryCode: e.enquiryCode,
    customerName: e.customerName,
    items: e.items.map((it) => ({
      productName: it.productName,
      quantity: it.quantity,
      unit: it.unit,
      unitPrice: it.unitPrice,
      lineTotal: it.lineTotal,
    })),
    grandTotal: e.grandTotal,
    deliveryCharge: e.deliveryCharge,
  });
  return `https://wa.me/${toWaNumber(e.mobile)}?text=${encodeURIComponent(text)}`;
}

export function OrdersManager() {
  const toast = useToast();
  const [enquiries, setEnquiries] = useState<EnquiryDTO[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<EnquiryDTO | null>(null);
  const [editing, setEditing] = useState(false);
  const [draftItems, setDraftItems] = useState<
    { id: string; productName: string; unit: string; quantity: number; unitPrice: number }[]
  >([]);
  const [savingItems, setSavingItems] = useState(false);

  function openDetail(e: EnquiryDTO) {
    setSelected(e);
    setEditing(false);
    setDraftItems(
      e.items.map((it) => ({
        id: it.id,
        productName: it.productName,
        unit: it.unit,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
      }))
    );
  }

  const draftTotal = draftItems.reduce((s, it) => s + it.unitPrice * it.quantity, 0);

  async function saveItems() {
    if (!selected) return;
    if (draftItems.length === 0) {
      toast.error("Keep at least one item", "Cancel the order instead to remove all items.");
      return;
    }
    setSavingItems(true);
    const res = await fetch(`/api/admin/enquiries/${selected.id}/items`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: draftItems.map((it) => ({
          id: it.id,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
        })),
      }),
    });
    const json = await res.json();
    if (json.success) {
      toast.success("Order updated");
      const updated = json.data as EnquiryDTO;
      setSelected(updated);
      setDraftItems(
        updated.items.map((it) => ({
          id: it.id,
          productName: it.productName,
          unit: it.unit,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
        }))
      );
      setEditing(false);
      setEnquiries((list) => list.map((e) => (e.id === updated.id ? updated : e)));
    } else {
      toast.error("Update failed", json.error);
    }
    setSavingItems(false);
  }

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("search", search);
    if (type) params.set("type", type);
    if (status) params.set("status", status);
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    const res = await fetch(`/api/admin/enquiries?${params}`);
    const json = await res.json();
    if (json.success) {
      setEnquiries(json.data.enquiries);
      setPagination(json.data.pagination);
    }
    setLoading(false);
  }, [page, search, type, status, fromDate, toDate]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  async function updateStatus(id: string, newStatus: string) {
    const res = await fetch(`/api/admin/enquiries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const json = await res.json();
    if (json.success) {
      toast.success("Status updated");
      setEnquiries((list) => list.map((e) => (e.id === id ? { ...e, status: newStatus as EnquiryDTO["status"] } : e)));
      if (selected?.id === id) setSelected({ ...selected, status: newStatus as EnquiryDTO["status"] });
    } else {
      toast.error("Update failed", json.error);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Orders</h1>

      <Tabs
        value={type || "all"}
        onValueChange={(v) => {
          setType(v === "all" ? "" : v);
          setPage(1);
        }}
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="WHOLESALE">Wholesale</TabsTrigger>
          <TabsTrigger value="RETAIL">Retail</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search ID, name, mobile"
            className="pl-11"
          />
        </div>
        <Select
          value={status || "ALL"}
          onValueChange={(v) => {
            setStatus(v === "ALL" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {Object.entries(ENQUIRY_STATUS_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date range */}
        <div className="flex items-center gap-2">
          <Input
            type="date"
            aria-label="From date"
            value={fromDate}
            max={toDate || undefined}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(1);
            }}
            className="w-40"
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="date"
            aria-label="To date"
            value={toDate}
            min={fromDate || undefined}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(1);
            }}
            className="w-40"
          />
          {(fromDate || toDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFromDate("");
                setToDate("");
                setPage(1);
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enquiries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    No orders found.
                  </TableCell>
                </TableRow>
              )}
              {enquiries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-semibold">{e.enquiryCode}</TableCell>
                  <TableCell>
                    <p className="font-medium">{e.customerName}</p>
                    <p className="text-xs text-muted-foreground">{e.mobile}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{e.type}</Badge>
                  </TableCell>
                  <TableCell className="font-semibold">{formatCurrency(e.grandTotal)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(e.createdAt)}</TableCell>
                  <TableCell>
                    <Select value={e.status} onValueChange={(v) => updateStatus(e.id, v)}>
                      <SelectTrigger className="h-9 w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ENQUIRY_STATUS_LABELS).map(([v, l]) => (
                          <SelectItem key={v} value={v}>
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openDetail(e)} aria-label="View">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Prev
          </Button>
          <span className="text-sm">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}

      {/* Detail dialog */}
      <Dialog
        open={!!selected}
        onOpenChange={(o) => {
          if (!o) {
            setSelected(null);
            setEditing(false);
          }
        }}
      >
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.enquiryCode}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <Badge className={ENQUIRY_STATUS_COLORS[selected.status]}>
                    {ENQUIRY_STATUS_LABELS[selected.status]}
                  </Badge>
                  <Badge variant="secondary">{selected.type}</Badge>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p><span className="text-muted-foreground">Customer:</span> {selected.customerName}</p>
                  <p><span className="text-muted-foreground">Mobile:</span> {selected.mobile}</p>
                  {selected.shopName && <p><span className="text-muted-foreground">Shop:</span> {selected.shopName}</p>}
                  {selected.deliveryAddress && (
                    <p><span className="text-muted-foreground">Address:</span> {selected.deliveryAddress}</p>
                  )}
                  {!selected.deliveryAddress && selected.deliveryArea && (
                    <p><span className="text-muted-foreground">Area:</span> {DELIVERY_AREA_LABELS[selected.deliveryArea]}</p>
                  )}
                  <p><span className="text-muted-foreground">Date:</span> {formatDate(selected.createdAt)}</p>
                  <p><span className="text-muted-foreground">WhatsApp sent:</span> {selected.whatsappSent ? "Yes" : "No"}</p>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <p className="font-semibold">Items</p>
                    {!editing ? (
                      <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                        <Pencil className="h-4 w-4" /> Edit / remove
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Remove unavailable items, then save
                      </span>
                    )}
                  </div>

                  {!editing ? (
                    <>
                      <ul className="space-y-1">
                        {selected.items.map((it, i) => (
                          <li key={it.id} className="flex justify-between">
                            <span>
                              {i + 1}. {it.productName} × {it.quantity} {it.unit.toLowerCase()}
                            </span>
                            <span className="font-medium">{formatCurrency(it.lineTotal)}</span>
                          </li>
                        ))}
                      </ul>
                      {selected.deliveryCharge > 0 && (
                        <div className="mt-2 flex justify-between border-t pt-2 text-muted-foreground">
                          <span>Delivery</span>
                          <span>{formatCurrency(selected.deliveryCharge)}</span>
                        </div>
                      )}
                      <div className={`mt-2 flex justify-between font-bold ${selected.deliveryCharge > 0 ? "" : "border-t pt-2"}`}>
                        <span>Grand Total</span>
                        <span>{formatCurrency(selected.grandTotal)}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {draftItems.map((it, idx) => (
                          <div key={it.id} className="flex items-center gap-2">
                            <span className="flex-1 truncate text-sm">{it.productName}</span>
                            <Input
                              type="number"
                              aria-label="Quantity"
                              className="h-9 w-16"
                              value={it.quantity}
                              onChange={(e) =>
                                setDraftItems((arr) =>
                                  arr.map((x, i) =>
                                    i === idx ? { ...x, quantity: parseInt(e.target.value || "0", 10) || 0 } : x
                                  )
                                )
                              }
                            />
                            <Input
                              type="number"
                              aria-label="Unit price"
                              className="h-9 w-20"
                              value={it.unitPrice}
                              onChange={(e) =>
                                setDraftItems((arr) =>
                                  arr.map((x, i) =>
                                    i === idx ? { ...x, unitPrice: parseFloat(e.target.value || "0") || 0 } : x
                                  )
                                )
                              }
                            />
                            <button
                              aria-label="Remove item"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => setDraftItems((arr) => arr.filter((_, i) => i !== idx))}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 flex justify-between border-t pt-2 font-bold">
                        <span>New Total</span>
                        <span>{formatCurrency(draftTotal)}</span>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openDetail(selected)}>
                          Cancel
                        </Button>
                        <Button size="sm" onClick={saveItems} disabled={savingItems}>
                          {savingItems ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save items"}
                        </Button>
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <p className="mb-1 font-semibold">Update status</p>
                  <Select value={selected.status} onValueChange={(v) => updateStatus(selected.id, v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ENQUIRY_STATUS_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <a href={`/admin/invoice/${selected.id}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="w-full">
                      <Printer className="h-5 w-5" /> Print Invoice
                    </Button>
                  </a>
                  <a href={invoiceShareUrl(selected)} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full bg-[#25D366] hover:bg-[#1ebe5d]">
                      <MessageCircle className="h-5 w-5" /> Send on WhatsApp
                    </Button>
                  </a>
                </div>
                {(selected.deliveryAddress || selected.shopName) && (
                  <>
                    <div className="border-t" />
                    <a href={deliveryShareUrl(selected)} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="w-full gap-2 border-blue-200 text-blue-700 hover:bg-blue-50">
                        <MessageCircle className="h-4 w-4" />
                        Share Delivery Address
                        {selected.latitude && selected.longitude && (
                          <span className="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold">📍 GPS</span>
                        )}
                      </Button>
                    </a>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
