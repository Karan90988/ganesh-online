"use client";

import { useState, useRef } from "react";
import { FileSpreadsheet, Upload, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

interface ImportSummary {
  totalRows: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: { row: number; message: string }[];
}

export function ImportManager() {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  async function upload() {
    if (!file) return;
    setUploading(true);
    setSummary(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/import", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Import failed");
      setSummary(json.data);
      toast.success("Import complete", `${json.data.created} created, ${json.data.updated} updated`);
    } catch (e) {
      toast.error("Import failed", e instanceof Error ? e.message : undefined);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Excel Import</h1>
      <p className="text-muted-foreground">
        Upload an Excel (.xlsx) or CSV file to bulk create / update products. Columns:{" "}
        <strong>Product Name</strong>, <strong>Category</strong>, <strong>MRP</strong>,{" "}
        <strong>Wholesale Price</strong>, and optionally <strong>Image URL</strong> (a
        public https link to the product photo). New products are created{" "}
        <em>active</em> with retail price defaulting to MRP — set retail price, stock and
        wholesale min/sack afterwards from the Products page. Re-importing updates price
        and image for existing products (matched by name).
      </p>

      <Card>
        <CardContent className="p-6">
          <div
            className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 text-center hover:bg-accent"
            onClick={() => inputRef.current?.click()}
          >
            <FileSpreadsheet className="h-10 w-10 text-primary" />
            {file ? (
              <p className="font-semibold">{file.name}</p>
            ) : (
              <p className="text-muted-foreground">Click to choose a .xlsx or .csv file</p>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setSummary(null);
              }}
            />
          </div>
          <Button className="mt-4 w-full" onClick={upload} disabled={!file || uploading}>
            {uploading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Importing...
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" /> Import Products
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" /> Import Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <Stat label="Total Rows" value={summary.totalRows} />
              <Stat label="Created" value={summary.created} className="text-green-600" />
              <Stat label="Updated" value={summary.updated} className="text-blue-600" />
              <Stat label="Skipped" value={summary.skipped} className="text-amber-600" />
              <Stat label="Failed" value={summary.failed} className="text-red-600" />
            </div>
            {summary.errors.length > 0 && (
              <div className="mt-4 rounded-lg bg-destructive/10 p-3">
                <p className="mb-1 flex items-center gap-2 font-semibold text-destructive">
                  <AlertTriangle className="h-4 w-4" /> Errors
                </p>
                <ul className="space-y-1 text-sm">
                  {summary.errors.map((e, i) => (
                    <li key={i}>
                      Row {e.row}: {e.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div className="rounded-lg border p-3 text-center">
      <p className={`text-2xl font-extrabold ${className ?? ""}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
