import Link from "next/link";
import {
  Package,
  Users,
  ClipboardList,
  Truck,
  ShoppingBag,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { getDashboardStats } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { ENQUIRY_STATUS_COLORS, ENQUIRY_STATUS_LABELS, UNIT_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const cards = [
    { label: "Total Products", value: stats.totalProducts, icon: Package, hint: `${stats.activeProducts} active` },
    { label: "Total Customers", value: stats.totalCustomers, icon: Users },
    { label: "Total Enquiries", value: stats.totalEnquiries, icon: ClipboardList, hint: `${stats.newEnquiries} new` },
    { label: "Wholesale", value: stats.wholesaleEnquiries, icon: Truck },
    { label: "Retail", value: stats.retailEnquiries, icon: ShoppingBag },
    { label: "Out of Stock", value: stats.outOfStock, icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label}>
              <CardContent className="p-4">
                <Icon className="h-6 w-6 text-primary" />
                <p className="mt-2 text-2xl font-extrabold">{c.value}</p>
                <p className="text-xs text-muted-foreground">{c.label}</p>
                {c.hint && <p className="text-xs text-primary">{c.hint}</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent orders */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Link href="/admin/orders" className="text-sm font-semibold text-primary">
              View all →
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.recentEnquiries.length === 0 && (
              <p className="text-sm text-muted-foreground">No enquiries yet.</p>
            )}
            {stats.recentEnquiries.map((e: any) => (
              <Link
                key={e.id}
                href="/admin/orders"
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent"
              >
                <div>
                  <p className="font-semibold">{e.enquiryCode}</p>
                  <p className="text-sm text-muted-foreground">
                    {e.customerName} · {e.mobile} · {e.items.length} items
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(e.grandTotal)}</p>
                  <Badge className={ENQUIRY_STATUS_COLORS[e.status as keyof typeof ENQUIRY_STATUS_COLORS]}>
                    {ENQUIRY_STATUS_LABELS[e.status as keyof typeof ENQUIRY_STATUS_LABELS]}
                  </Badge>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Low stock */}
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alert</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.lowStock.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-600" /> All products well stocked.
              </p>
            ) : (
              stats.lowStock.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm font-medium">{p.name}</span>
                  <Badge variant={p.stockQuantity <= 0 ? "destructive" : "secondary"}>
                    {p.stockQuantity} {UNIT_LABELS[p.unit as keyof typeof UNIT_LABELS]}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
