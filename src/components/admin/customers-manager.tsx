"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Search, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { formatCurrency, formatDate } from "@/lib/utils";
import { CUSTOMER_TYPE_LABELS, ENQUIRY_STATUS_LABELS } from "@/lib/constants";
import { CustomerDTO, Pagination } from "@/types";

export function CustomersManager() {
  const [customers, setCustomers] = useState<CustomerDTO[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<CustomerDTO | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("search", search);
    if (typeFilter) params.set("type", typeFilter);
    const res = await fetch(`/api/admin/customers?${params}`);
    const json = await res.json();
    if (json.success) {
      setCustomers(json.data.customers);
      setPagination(json.data.pagination);
    }
    setLoading(false);
  }, [page, search, typeFilter]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  async function viewHistory(id: string) {
    setLoadingDetail(true);
    setDetail({} as CustomerDTO);
    const res = await fetch(`/api/admin/customers/${id}`);
    const json = await res.json();
    if (json.success) setDetail(json.data);
    setLoadingDetail(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Customers</h1>
        <a href="/api/admin/customers/export" download>
          <Button variant="outline">
            <Download className="h-5 w-5" /> Export CSV
          </Button>
        </a>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[14rem] flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search name, mobile, shop"
            className="pl-11"
          />
        </div>
        <Select
          value={typeFilter || "all"}
          onValueChange={(v) => {
            setTypeFilter(v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[11rem]">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {Object.entries(CUSTOMER_TYPE_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                <TableHead>Name</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Shop</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead className="text-right">History</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    No customers found.
                  </TableCell>
                </TableRow>
              )}
              {customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.mobile}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.shopName || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{CUSTOMER_TYPE_LABELS[c.type]}</Badge>
                  </TableCell>
                  <TableCell>{c._count?.enquiries ?? 0}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => viewHistory(c.id)} aria-label="View history">
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

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{detail?.name || "Customer"}</DialogTitle>
          </DialogHeader>
          {loadingDetail ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : detail?.id ? (
            <div className="space-y-3 text-sm">
              <div className="rounded-lg bg-muted/50 p-3">
                <p><span className="text-muted-foreground">Mobile:</span> {detail.mobile}</p>
                {detail.shopName && <p><span className="text-muted-foreground">Shop:</span> {detail.shopName}</p>}
                <p><span className="text-muted-foreground">Type:</span> {CUSTOMER_TYPE_LABELS[detail.type]}</p>
                <p><span className="text-muted-foreground">Since:</span> {formatDate(detail.createdAt)}</p>
              </div>
              <div>
                <p className="mb-1 font-semibold">Order history ({detail.enquiries?.length ?? 0})</p>
                <div className="space-y-2">
                  {detail.enquiries?.map((e) => (
                    <div key={e.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{e.enquiryCode}</span>
                        <Badge variant="outline">{ENQUIRY_STATUS_LABELS[e.status]}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(e.createdAt)} · {e.items.length} items · {formatCurrency(e.grandTotal)}
                      </p>
                    </div>
                  ))}
                  {detail.enquiries?.length === 0 && (
                    <p className="text-muted-foreground">No orders yet.</p>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
