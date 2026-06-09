"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ImageUpload } from "./image-upload";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils";
import { UNIT_OPTIONS, PRODUCT_STATUS_LABELS } from "@/lib/constants";
import { ProductDTO, CategoryDTO, Pagination } from "@/types";

const EMPTY_FORM = {
  name: "",
  sku: "",
  description: "",
  imageUrl: "",
  categoryId: "",
  mrp: "",
  wholesalePrice: "",
  retailPrice: "",
  stockQuantity: "0",
  unit: "PIECE",
  status: "ACTIVE",
  // Wholesale packaging type: "standard" (loose + optional sack) | "box" (biscuits)
  bulkType: "standard",
  wholesaleMinQty: "1",
  // Sack type fields
  sackLabel: "Sack",
  sackSize: "",
  sackPrice: "",
  // Box type fields (biscuits): outer + box
  outerSize: "",
  outerPrice: "",
  boxSize: "",
  boxPrice: "",
};

type FormState = typeof EMPTY_FORM;

export function ProductsManager() {
  const toast = useToast();
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

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

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((j) => j.success && setCategories(j.data));
  }, []);

  function openAdd() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, categoryId: categories[0]?.id ?? "" });
    setFormError("");
    setOpen(true);
  }

  function openEdit(p: ProductDTO) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      sku: p.sku,
      description: p.description ?? "",
      imageUrl: p.imageUrl ?? "",
      categoryId: p.categoryId,
      mrp: String(p.mrp),
      wholesalePrice: String(p.wholesalePrice),
      retailPrice: String(p.retailPrice),
      stockQuantity: String(p.stockQuantity),
      unit: p.unit,
      status: p.status,
      // Derive packaging type: box = biscuits (no loose + a 2nd pack); else standard.
      bulkType: !p.wholesaleLooseEnabled && p.pack2Label ? "box" : "standard",
      wholesaleMinQty: String(p.wholesaleMinQty ?? 1),
      sackLabel: p.pack1Label || "Sack",
      sackSize: p.pack1Size != null ? String(p.pack1Size) : "",
      sackPrice: p.pack1Price != null ? String(p.pack1Price) : "",
      outerSize: p.pack1Size != null ? String(p.pack1Size) : "",
      outerPrice: p.pack1Price != null ? String(p.pack1Price) : "",
      boxSize: p.pack2Size != null ? String(p.pack2Size) : "",
      boxPrice: p.pack2Price != null ? String(p.pack2Price) : "",
    });
    setFormError("");
    setOpen(true);
  }

  async function save() {
    setSaving(true);
    setFormError("");
    try {
      // Map the chosen packaging type to the underlying pack fields so that
      // a "sack" product can only have loose + 1 sack (2 options) and a "box"
      // product (biscuits) only outer + box (2 options).
      const num = (v: string) => (v ? parseFloat(v) : null);
      const int = (v: string) => (v ? parseInt(v, 10) : null);
      let bulk: Record<string, unknown>;
      if (form.bulkType === "box") {
        // Biscuit: Outer + Box, no loose ordering.
        bulk = {
          hasBulkPricing: true,
          wholesaleLooseEnabled: false,
          wholesaleMinQty: 1,
          pack1Label: "Outer",
          pack1Size: int(form.outerSize),
          pack1Price: num(form.outerPrice),
          pack2Label: "Box",
          pack2Size: int(form.boxSize),
          pack2Price: num(form.boxPrice),
        };
      } else {
        // Standard: wholesale per-unit (with min qty) + optional Box/Sack.
        const sackSet = !!form.sackSize && !!form.sackPrice;
        bulk = {
          hasBulkPricing: sackSet,
          wholesaleLooseEnabled: true,
          wholesaleMinQty: parseInt(form.wholesaleMinQty || "1", 10),
          pack1Label: sackSet ? form.sackLabel || "Sack" : null,
          pack1Size: sackSet ? int(form.sackSize) : null,
          pack1Price: sackSet ? num(form.sackPrice) : null,
          pack2Label: null,
          pack2Size: null,
          pack2Price: null,
        };
      }
      const payload = {
        ...form,
        mrp: parseFloat(form.mrp || "0"),
        wholesalePrice: parseFloat(form.wholesalePrice || "0"),
        retailPrice: parseFloat(form.retailPrice || "0"),
        stockQuantity: parseInt(form.stockQuantity || "0", 10),
        ...bulk,
      };
      const url = editingId ? `/api/admin/products/${editingId}` : "/api/admin/products";
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Save failed");
      toast.success(editingId ? "Product updated" : "Product created");
      setOpen(false);
      load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove(p: ProductDTO) {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/products/${p.id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      toast.success("Product deleted");
      load();
    } else {
      toast.error("Delete failed", json.error);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button onClick={openAdd}>
          <Plus className="h-5 w-5" /> Add Product
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
          placeholder="Search by name or SKU"
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
                <TableHead>Category</TableHead>
                <TableHead>MRP</TableHead>
                <TableHead>Wholesale</TableHead>
                <TableHead>Retail</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    No products found.
                  </TableCell>
                </TableRow>
              )}
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                        <Image
                          src={p.imageUrl || `https://placehold.co/80x80?text=${encodeURIComponent(p.name.charAt(0))}`}
                          alt={p.name}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.sku}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{p.category?.name}</TableCell>
                  <TableCell className="text-sm">{formatCurrency(p.mrp)}</TableCell>
                  <TableCell className="text-sm">{formatCurrency(p.wholesalePrice)}</TableCell>
                  <TableCell className="text-sm">{formatCurrency(p.retailPrice)}</TableCell>
                  <TableCell className="text-sm">{p.stockQuantity}</TableCell>
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
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)} aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(p)} aria-label="Delete">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
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

      {/* Add / Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label>Product Image</Label>
              <ImageUpload value={form.imageUrl} onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label>SKU *</Label>
                <Input value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} />
              </div>
              <div>
                <Label>Category *</Label>
                <Select value={form.categoryId} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>MRP *</Label>
                <Input type="number" value={form.mrp} onChange={(e) => setForm((f) => ({ ...f, mrp: e.target.value }))} />
              </div>
              <div>
                <Label>Wholesale * (per unit / loose)</Label>
                <Input type="number" value={form.wholesalePrice} onChange={(e) => setForm((f) => ({ ...f, wholesalePrice: e.target.value }))} />
              </div>
              <div>
                <Label>Retail *</Label>
                <Input type="number" value={form.retailPrice} onChange={(e) => setForm((f) => ({ ...f, retailPrice: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Stock</Label>
                <Input type="number" value={form.stockQuantity} onChange={(e) => setForm((f) => ({ ...f, stockQuantity: e.target.value }))} />
              </div>
              <div>
                <Label>Unit</Label>
                <Select value={form.unit} onValueChange={(v) => setForm((f) => ({ ...f, unit: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_OPTIONS.map((u) => (
                      <SelectItem key={u.value} value={u.value}>
                        {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRODUCT_STATUS_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Wholesale packaging type */}
            <div className="rounded-lg border bg-muted/30 p-3">
              <Label>Wholesale buying type</Label>
              <Select value={form.bulkType} onValueChange={(v) => setForm((f) => ({ ...f, bulkType: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard — wholesale (min qty) + optional sack</SelectItem>
                  <SelectItem value="box">Biscuit — outer + box (no loose)</SelectItem>
                </SelectContent>
              </Select>

              {form.bulkType === "standard" && (
                <div className="mt-3 space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Wholesale customers buy at the <strong>Wholesale</strong> price above (per{" "}
                    {form.unit.toLowerCase()}) once they reach the minimum quantity. Optionally
                    add one whole <strong>box / sack</strong> at a better price. Leave the
                    box/sack blank if the product has none.
                  </p>
                  <div className="max-w-[14rem]">
                    <Label>Wholesale min qty ({form.unit.toLowerCase()})</Label>
                    <Input
                      type="number"
                      placeholder="5"
                      value={form.wholesaleMinQty}
                      onChange={(e) => setForm((f) => ({ ...f, wholesaleMinQty: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>Box/Sack name</Label>
                      <Input
                        placeholder="Sack"
                        value={form.sackLabel}
                        onChange={(e) => setForm((f) => ({ ...f, sackLabel: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Box/Sack qty ({form.unit.toLowerCase()})</Label>
                      <Input
                        type="number"
                        placeholder="26"
                        value={form.sackSize}
                        onChange={(e) => setForm((f) => ({ ...f, sackSize: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Box/Sack price</Label>
                      <Input
                        type="number"
                        placeholder="1250"
                        value={form.sackPrice}
                        onChange={(e) => setForm((f) => ({ ...f, sackPrice: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              )}

              {form.bulkType === "box" && (
                <div className="mt-3 space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Two options for customers: <strong>Outer</strong> and <strong>Box</strong>.
                    No loose ordering. Sizes are in {form.unit.toLowerCase()}s.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Outer size ({form.unit.toLowerCase()})</Label>
                      <Input
                        type="number"
                        placeholder="12"
                        value={form.outerSize}
                        onChange={(e) => setForm((f) => ({ ...f, outerSize: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Outer price</Label>
                      <Input
                        type="number"
                        placeholder="54"
                        value={form.outerPrice}
                        onChange={(e) => setForm((f) => ({ ...f, outerPrice: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Box size ({form.unit.toLowerCase()})</Label>
                      <Input
                        type="number"
                        placeholder="48"
                        value={form.boxSize}
                        onChange={(e) => setForm((f) => ({ ...f, boxSize: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Box price</Label>
                      <Input
                        type="number"
                        placeholder="210"
                        value={form.boxPrice}
                        onChange={(e) => setForm((f) => ({ ...f, boxPrice: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {formError && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{formError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
