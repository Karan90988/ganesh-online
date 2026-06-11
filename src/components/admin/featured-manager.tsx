"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Search, X, Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils";
import { ProductDTO } from "@/types";

function Row({
  p,
  featured,
  busyId,
  onToggle,
}: {
  p: ProductDTO;
  featured: boolean;
  busyId: string | null;
  onToggle: (p: ProductDTO, value: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={p.imageUrl || ""}
        alt=""
        className="h-12 w-12 shrink-0 rounded-md border object-cover"
        onError={(e) => (e.currentTarget.style.visibility = "hidden")}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{p.name}</p>
        <p className="text-xs text-muted-foreground">
          {p.sku} · {formatCurrency(p.retailPrice)}
        </p>
      </div>
      {featured ? (
        <Button variant="outline" size="sm" disabled={busyId === p.id} onClick={() => onToggle(p, false)}>
          {busyId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />} Remove
        </Button>
      ) : (
        <Button size="sm" disabled={busyId === p.id} onClick={() => onToggle(p, true)}>
          {busyId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add to Home
        </Button>
      )}
    </div>
  );
}

export function FeaturedManager() {
  const toast = useToast();
  const [featured, setFeatured] = useState<ProductDTO[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<ProductDTO[]>([]);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadFeatured = useCallback(async () => {
    setLoadingFeatured(true);
    const res = await fetch("/api/admin/products?featured=1");
    const json = await res.json();
    if (json.success) setFeatured(json.data.products);
    setLoadingFeatured(false);
  }, []);

  useEffect(() => {
    loadFeatured();
  }, [loadFeatured]);

  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    const tmr = setTimeout(async () => {
      const res = await fetch(`/api/admin/products?search=${encodeURIComponent(search)}`);
      const json = await res.json();
      if (json.success) setResults(json.data.products);
      setSearching(false);
    }, 300);
    return () => clearTimeout(tmr);
  }, [search]);

  const toggle = useCallback(
    async (p: ProductDTO, value: boolean) => {
      setBusyId(p.id);
      const res = await fetch(`/api/admin/products/${p.id}/featured`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: value }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(value ? "Added to Home Page" : "Removed from Home Page");
        setResults((r) => r.map((x) => (x.id === p.id ? { ...x, isFeatured: value } : x)));
        loadFeatured();
      } else {
        toast.error("Update failed", json.error);
      }
      setBusyId(null);
    },
    [toast, loadFeatured]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Home Page Products</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Hand-pick the products shown in the home page &quot;Popular products&quot; section — great
          for festival or seasonal items. If you select none, your best-selling products are shown
          automatically.
        </p>
      </div>

      {/* Currently on home page */}
      <div className="rounded-xl border bg-card p-4">
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <Star className="h-4 w-4 text-primary" /> On the Home Page ({featured.length})
        </h2>
        {loadingFeatured ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : featured.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            None selected — best-sellers are shown automatically. Use the search below to add
            specific products.
          </p>
        ) : (
          <div className="space-y-2">
            {featured.map((p) => (
              <Row key={p.id} p={p} featured busyId={busyId} onToggle={toggle} />
            ))}
          </div>
        )}
      </div>

      {/* Search to add */}
      <div className="rounded-xl border bg-card p-4">
        <h2 className="mb-3 font-semibold">Add products</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or SKU"
            className="pl-11"
          />
        </div>
        <div className="mt-3 space-y-2">
          {searching && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!searching && search.trim() && results.length === 0 && (
            <p className="text-sm text-muted-foreground">No products found.</p>
          )}
          {results.map((p) => (
            <Row key={p.id} p={p} featured={!!p.isFeatured} busyId={busyId} onToggle={toggle} />
          ))}
        </div>
      </div>
    </div>
  );
}
