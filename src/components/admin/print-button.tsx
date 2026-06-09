"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Triggers the browser print dialog (where the user picks "Save as PDF"). */
export function PrintButton() {
  return (
    <Button onClick={() => window.print()} size="lg">
      <Printer className="h-5 w-5" /> Print / Save as PDF
    </Button>
  );
}
