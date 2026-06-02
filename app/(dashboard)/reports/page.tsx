"use client";

import { useState, useMemo } from "react";
import { useExpenses } from "@/lib/hooks/use-expenses";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { Download } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import toast from "react-hot-toast";

const MONTHS_BACK = 3;

export default function ReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const startDate = format(startOfMonth(selectedMonth), "yyyy-MM-dd");
  const endDate = format(endOfMonth(selectedMonth), "yyyy-MM-dd");

  const { expenses, loading } = useExpenses({ startDate, endDate });

  // Category totals for selected month
  const categoryTotals = useMemo(() => {
    const map: Record<
      string,
      { name: string; icon: string; color: string; total: number }
    > = {};
    expenses.forEach((e) => {
      if (!map[e.category_id]) {
        map[e.category_id] = {
          name: e.category_name,
          icon: e.category_icon,
          color: e.category_color,
          total: 0,
        };
      }
      map[e.category_id].total += Number(e.amount);
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [expenses]);

  const totalSpent = useMemo(
    () => expenses.reduce((s, e) => s + Number(e.amount), 0),
    [expenses]
  );

  // Month navigation
  const months = Array.from({ length: MONTHS_BACK + 1 }, (_, i) =>
    subMonths(new Date(), i)
  );

  const exportCSV = () => {
    if (expenses.length === 0) {
      toast.error("No expenses to export");
      return;
    }

    const rows = [
      ["Date", "Category", "Description", "Amount"],
      ...expenses.map((e) => [
        e.expense_date,
        e.category_name,
        e.description ?? "",
        e.amount.toString(),
      ]),
    ];

    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${format(selectedMonth, "yyyy-MM")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const chartData = categoryTotals.map((c) => ({
    name: `${c.icon} ${c.name}`,
    amount: c.total,
    color: c.color,
  }));

  return (
    <>
      <Header title="Reports" />
      <div className="px-4 py-4 space-y-4">
        {/* Month selector */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {months.map((m) => {
            const isSelected =
              format(m, "yyyy-MM") === format(selectedMonth, "yyyy-MM");
            return (
              <button
                key={m.toISOString()}
                onClick={() => setSelectedMonth(m)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-muted-foreground"
                }`}
              >
                {format(m, "MMM yyyy")}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        ) : (
          <>
            {/* Summary card */}
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Spent
                    </p>
                    <p className="text-3xl font-bold mt-1">
                      {formatCurrency(totalSpent)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {expenses.length} expenses ·{" "}
                      {format(selectedMonth, "MMMM yyyy")}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportCSV}
                    className="gap-1.5"
                  >
                    <Download className="h-4 w-4" />
                    CSV
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Bar chart */}
            {chartData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Spending by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={chartData}
                      margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                    >
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                      />
                      <Tooltip
                        formatter={(value: number) => [
                          formatCurrency(value),
                          "Amount",
                        ]}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Category list */}
            {categoryTotals.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-3xl mb-2">📊</p>
                <p className="text-muted-foreground">
                  No expenses in {format(selectedMonth, "MMMM yyyy")}
                </p>
              </div>
            ) : (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Category Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {categoryTotals.map((cat) => (
                    <div
                      key={cat.name}
                      className="flex items-center gap-3"
                    >
                      <span className="text-2xl w-8 text-center">
                        {cat.icon}
                      </span>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">
                            {cat.name}
                          </span>
                          <span className="text-sm font-semibold">
                            {formatCurrency(cat.total)}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.round((cat.total / totalSpent) * 100)}%`,
                              backgroundColor: cat.color,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </>
  );
}
