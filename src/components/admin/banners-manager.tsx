"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Loader2, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useToast } from "@/components/ui/toast";

interface Banner {
  id: string;
  text: string;
  sortOrder: number;
  isActive: boolean;
}

const EMPTY = { text: "", sortOrder: "0", isActive: true };

export function BannersManager() {
  const toast = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/banners");
    const json = await res.json();
    if (json.success) setBanners(json.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setEditingId(null);
    setForm({ ...EMPTY, sortOrder: String(banners.length) });
    setFormError("");
    setOpen(true);
  }
  function openEdit(b: Banner) {
    setEditingId(b.id);
    setForm({ text: b.text, sortOrder: String(b.sortOrder), isActive: b.isActive });
    setFormError("");
    setOpen(true);
  }

  async function save() {
    setSaving(true);
    setFormError("");
    try {
      const payload = { ...form, sortOrder: parseInt(form.sortOrder || "0", 10) };
      const url = editingId ? `/api/admin/banners/${editingId}` : "/api/admin/banners";
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Save failed");
      toast.success(editingId ? "Banner updated" : "Banner added");
      setOpen(false);
      load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove(b: Banner) {
    if (!confirm(`Delete this promotion message?\n\n"${b.text}"`)) return;
    const res = await fetch(`/api/admin/banners/${b.id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      toast.success("Banner deleted");
      load();
    } else {
      toast.error("Delete failed", json.error);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Promotions</h1>
          <p className="text-sm text-muted-foreground">
            Rotating messages shown at the top of the home page (website &amp; app).
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-5 w-5" /> Add Message
        </Button>
      </div>

      <div className="rounded-xl border bg-card">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : banners.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No promotion messages yet. The home page shows default messages until you add some.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Message</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {banners.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <span className="flex items-center gap-2 font-medium">
                      <Megaphone className="h-4 w-4 text-primary" /> {b.text}
                    </span>
                  </TableCell>
                  <TableCell>{b.sortOrder}</TableCell>
                  <TableCell>
                    <Badge variant={b.isActive ? "default" : "secondary"}>
                      {b.isActive ? "Showing" : "Hidden"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(b)} aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(b)} aria-label="Delete">
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Message" : "Add Message"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Message *</Label>
              <Input
                value={form.text}
                onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
                placeholder="🪔 Diwali Special Offers"
                maxLength={120}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Tip: you can add emojis (🪔 🚚 💰). Keep it short.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Order</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    className="h-5 w-5"
                  />
                  Show on home page
                </label>
              </div>
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
