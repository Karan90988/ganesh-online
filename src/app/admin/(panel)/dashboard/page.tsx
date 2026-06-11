import Link from "next/link";
import {
  Package,
  Users,
  ClipboardList,
  IndianRupee,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { getDashboardStats } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { ENQUIRY_STATUS_COLORS, ENQUIRY_STATUS_LABELS, UNIT_LABELS } from "@/lib/constants";
import { DashboardDateFilter } from "@/components/admin/dashboard-date-filter";

export const dynamic = "force-dynamic";

/** Resolves the selected range into concrete from/to dates + a label. */
function resolveRange(sp: { range?: string; from?: string; to?: string }) {
  const now = new Date();
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);
  const from = new Date(now);
  from.setHours(0, 0, 0, 0);
  const range = sp.range || "month";

  switch (range) {
    case "today":
      return { from, to, label: "Today", range };
    case "week":
      from.setDate(from.getDate() - 6);
      return { from, to, label: "This week", range };
    case "quarter":
      from.setDate(from.getDate() - 89);
      return { from, to, label: "Last 90 days", range };
    case "custom": {
      const cf = sp.from ? new Date(`${sp.from}T00:00:00`) : from;
      const ct = sp.to ? new Date(`${sp.to}T23:59:59`) : to;
      return { from: cf, to: ct, label: `${sp.from ?? "…"} → ${sp.to ?? "…"}`, range };
    }
    case "month":
    default:
      from.setDate(from.getDate() - 29);
      return { from, to, label: "This month", range: "month" };
  }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const { from, to, label } = resolveRange(sp);
  const stats = await getDashboardStats({ from, to });

  const kpis = [
    {
      label: "Sales",
      value: formatCurrency(stats.salesTotal),
      icon: IndianRupee,
      hint: label,
    },
    {
      label: "Orders",
      value: stats.totalEnquiries,
      icon: ClipboardList,
      hint: `${stats.newEnquiries} new`,
    },
    {
      label: "Avg Order Value",
      value: formatCurrency(stats.avgOrderValue),
      icon: Receipt,
    },
    {
      label: "Customers",
      value: stats.totalCustomers,
      icon: Users,
      hint: `+${stats.newCustomersInRange} in range`,
    },
    {
      label: "Products",
      value: stats.totalProducts,
      icon: Package,
      hint: `${stats.activeProducts} active`,
    },
    {
      label: "Out of Stock",
      value: stats.outOfStock,
      icon: AlertTriangle,
    },
  ];

  const maxOrders = Math.max(1, ...stats.trend.map((t: any) => t.orders));
  const trendTotalOrders = stats.trend.reduce((s: number, t: any) => s + t.orders, 0);
  const trendTotalValue = stats.trend.reduce((s: number, t: any) => s + t.value, 0);
  const maxStatus = Math.max(1, ...stats.statusBreakdown.map((s: any) => s.count));
  const channelTotal = Math.max(1, stats.wholesaleValue + stats.retailValue);
  const maxTopValue = Math.max(1, ...stats.topProducts.map((p: any) => p.value));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <DashboardDateFilter />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {kpis.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label}>
              <CardContent className="p-4">
                <Icon className="h-6 w-6 text-primary" />
                <p className="mt-2 text-xl font-extrabold">{c.value}</p>
                <p className="text-xs text-muted-foreground">{c.label}</p>
                {c.hint && <p className="mt-0.5 text-xs text-primary">{c.hint}</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Trend + breakdowns */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* 14-day orders trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Orders — {label}
              <span className="text-xs font-normal text-muted-foreground">
                (by {stats.trendUnit})
              </span>
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {trendTotalOrders} orders · {formatCurrency(trendTotalValue)}
            </span>
          </CardHeader>
          <CardContent>
            <div className="flex h-40 items-end gap-1">
              {stats.trend.map((t: any) => (
                <div key={t.date} className="flex flex-1 flex-col items-center gap-1" title={`${t.label}: ${t.orders} orders · ${formatCurrency(t.value)}`}>
                  <span className="text-[10px] font-semibold text-muted-foreground">
                    {t.orders || ""}
                  </span>
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t bg-primary/80"
                      style={{ height: `${(t.orders / maxOrders) * 100}%`, minHeight: t.orders ? 4 : 0 }}
                    />
                  </div>
                  <span className="text-[9px] text-muted-foreground">{t.label.split(" ")[0]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Order status breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.statusBreakdown.length === 0 && (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            )}
            {stats.statusBreakdown.map((s: any) => (
              <div key={s.status}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{ENQUIRY_STATUS_LABELS[s.status as keyof typeof ENQUIRY_STATUS_LABELS]}</span>
                  <span className="font-semibold">{s.count}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${(s.count / maxStatus) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Channel split + top products */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Wholesale vs Retail value */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by Channel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Wholesale", value: stats.wholesaleValue, count: stats.wholesaleEnquiries },
              { label: "Retail", value: stats.retailValue, count: stats.retailEnquiries },
            ].map((c) => (
              <div key={c.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {c.label} <span className="text-muted-foreground">({c.count})</span>
                  </span>
                  <span className="font-semibold">{formatCurrency(c.value)}</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-muted">
                  <div
                    className="h-2.5 rounded-full bg-primary"
                    style={{ width: `${(c.value / channelTotal) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top products */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top Products (by sales)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.topProducts.length === 0 && (
              <p className="text-sm text-muted-foreground">No sales yet.</p>
            )}
            {stats.topProducts.map((p: any, i: number) => (
              <div key={p.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex-1 truncate">
                    {i + 1}. {p.name}{" "}
                    <span className="text-muted-foreground">· {p.quantity} sold</span>
                  </span>
                  <span className="ml-2 font-semibold">{formatCurrency(p.value)}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted">
                  <div
                    className="h-1.5 rounded-full bg-primary/70"
                    style={{ width: `${(p.value / maxTopValue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent orders + low stock */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Link href="/admin/orders" className="text-sm font-semibold text-primary">
              View all →
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.recentEnquiries.length === 0 && (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
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
