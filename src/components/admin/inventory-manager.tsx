"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Search, RefreshCw, Save } from "lucide-react";
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
import { useToast } from "@/components/ui/toast";
import { PRODUCT_STATUS_LABELS, UNIT_LABELS } from "@/lib/constants";
import { ProductDTO, Pagination } from "@/types";

export function InventoryManager() {
  const toast = useToast();
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/products?${params}`);
    const json = await res.json();
    if (json.success) {
      setProducts(json.data.products);
      setPagination(json.data.pagination);
    }
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  async function updateStock(id: string, stockQuantity: number, status?: string) {
    setSavingId(id);
    const res = await fetch(`/api/admin/products/${id}/stock`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stockQuantity, status }),
    });
    const json = await res.json();
    if (json.success) {
      toast.success("Stock updated");
      setDrafts((d) => {
        const next = { ...d };
        delete next[id];
        return next;
      });
      load();
    } else {
      toast.error("Update failed", json.error);
    }
    setSavingId(null);
  }

  async function sync() {
    setSyncing(true);
    const res = await fetch("/api/admin/inventory/sync", { method: "POST" });
    const json = await res.json();
    if (json.success) {
      if (!json.data.configured) {
        toast.info("No billing software connected", "Configure the billing adapter to sync.");
      } else {
        toast.success("Sync complete", `${json.data.updated} products updated`);
        load();
      }
    } else {
      toast.error("Sync failed", json.error);
    }
    setSyncing(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <Button variant="outline" onClick={sync} disabled={syncing}>
          {syncing ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
          Sync from Billing
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search products"
          className="pl-11"
        />
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
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">Quick actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => {
                const draft = drafts[p.id] ?? String(p.stockQuantity);
                const changed = draft !== String(p.stockQuantity);
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.sku} · per {UNIT_LABELS[p.unit]}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          p.status === "ACTIVE" ? "default" : p.status === "OUT_OF_STOCK" ? "destructive" : "secondary"
                        }
                      >
                        {PRODUCT_STATUS_LABELS[p.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={draft}
                          onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
                          className="h-10 w-24"
                        />
                        {changed && (
                          <Button
                            size="sm"
                            onClick={() => updateStock(p.id, parseInt(draft || "0", 10))}
                            disabled={savingId === p.id}
                          >
                            {savingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {p.status !== "OUT_OF_STOCK" && (
                          <Button variant="outline" size="sm" onClick={() => updateStock(p.id, 0, "OUT_OF_STOCK")}>
                            Out of stock
                          </Button>
                        )}
                        {p.status === "OUT_OF_STOCK" && (
                          <Button variant="outline" size="sm" onClick={() => updateStock(p.id, Math.max(1, p.stockQuantity), "ACTIVE")}>
                            Mark active
                          </Button>
                        )}
                        {p.status === "INACTIVE" && (
                          <Button variant="outline" size="sm" onClick={() => updateStock(p.id, p.stockQuantity, "ACTIVE")}>
                            Activate
                          </Button>
                        )}
                        {p.status === "ACTIVE" && (
                          <Button variant="outline" size="sm" onClick={() => updateStock(p.id, p.stockQuantity, "INACTIVE")}>
                            Deactivate
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
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
    </div>
  );
}
