"use client";

import { useState, useMemo } from "react";
import { useExpenses } from "@/lib/hooks/use-expenses";
import { useProfile } from "@/lib/hooks/use-profile";
import { useProfiles } from "@/lib/hooks/use-profiles";
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
import { Download, Lock, ChevronDown, ChevronUp, Users } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import toast from "react-hot-toast";

const MONTHS_BACK = 3;

function buildCategoryTotals(expenses: { category_id: string; category_name: string; category_icon: string; category_color: string; amount: number }[]) {
  const map: Record<string, { name: string; icon: string; color: string; total: number }> = {};
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
}

export default function ReportsPage() {
  const { profile } = useProfile();
  const { profiles } = useProfiles();
  const isAdmin = profile?.role === "admin";

  const [selectedMonth, setSelectedMonth] = useState(new Date());
  // "all" only available to admins; members are locked to their own id
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  const [showPrivate, setShowPrivate] = useState(false);

  const startDate = format(startOfMonth(selectedMonth), "yyyy-MM-dd");
  const endDate = format(endOfMonth(selectedMonth), "yyyy-MM-dd");

  // Resolve the actual user-ID filter for queries
  const userIdFilter = useMemo(() => {
    if (!isAdmin) return profile?.id; // members always see their own
    return selectedUserId === "all" ? undefined : selectedUserId;
  }, [isAdmin, profile?.id, selectedUserId]);

  // Regular (non-private) expenses
  const { expenses: regularExpenses, loading: loadingRegular } = useExpenses({
    startDate,
    endDate,
    userId: userIdFilter,
    isPrivate: false,
  });

  // Private expenses — returns [] for non-admins via RLS
  const { expenses: privateExpenses, loading: loadingPrivate } = useExpenses({
    startDate,
    endDate,
    userId: userIdFilter,
    isPrivate: true,
  });

  const regularTotals = useMemo(
    () => buildCategoryTotals(regularExpenses),
    [regularExpenses]
  );
  const privateTotals = useMemo(
    () => buildCategoryTotals(privateExpenses),
    [privateExpenses]
  );

  const totalRegular = useMemo(
    () => regularExpenses.reduce((s, e) => s + Number(e.amount), 0),
    [regularExpenses]
  );
  const totalPrivate = useMemo(
    () => privateExpenses.reduce((s, e) => s + Number(e.amount), 0),
    [privateExpenses]
  );

  const months = Array.from({ length: MONTHS_BACK + 1 }, (_, i) =>
    subMonths(new Date(), i)
  );

  const exportCSV = (type: "regular" | "private") => {
    const data = type === "regular" ? regularExpenses : privateExpenses;
    if (data.length === 0) {
      toast.error("No expenses to export");
      return;
    }

    const rows = [
      ["Date", "Category", "Description", "Amount", "Member", "Private"],
      ...data.map((e) => [
        e.expense_date,
        e.category_name,
        e.description ?? "",
        e.amount.toString(),
        e.member_name,
        e.is_private ? "Yes" : "No",
      ]),
    ];

    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${type}-${format(selectedMonth, "yyyy-MM")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loading = loadingRegular || loadingPrivate;

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

        {/* User filter — admin only */}
        {isAdmin && profiles.length > 0 && (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex gap-2 overflow-x-auto pb-1 flex-1">
              <button
                onClick={() => setSelectedUserId("all")}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${
                  selectedUserId === "all"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-muted-foreground"
                }`}
              >
                All Members
              </button>
              {profiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedUserId(p.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${
                    selectedUserId === p.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-muted-foreground"
                  }`}
                >
                  {p.full_name.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        ) : (
          <>
            {/* ── REGULAR EXPENSES SECTION ── */}
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Spent</p>
                    <p className="text-3xl font-bold mt-1">
                      {formatCurrency(totalRegular)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {regularExpenses.length}{" "}
                      {regularExpenses.length === 1 ? "expense" : "expenses"} ·{" "}
                      {format(selectedMonth, "MMMM yyyy")}
                      {selectedUserId !== "all" &&
                        profiles.find((p) => p.id === selectedUserId) &&
                        ` · ${profiles.find((p) => p.id === selectedUserId)!.full_name}`}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportCSV("regular")}
                    className="gap-1.5"
                  >
                    <Download className="h-4 w-4" />
                    CSV
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Regular bar chart */}
            {regularTotals.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Spending by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CategoryChart totals={regularTotals} />
                </CardContent>
              </Card>
            )}

            {/* Regular category list */}
            {regularTotals.length === 0 ? (
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
                  <CategoryList totals={regularTotals} grandTotal={totalRegular} />
                </CardContent>
              </Card>
            )}

            {/* ── PRIVATE EXPENSES SECTION (admin only) ── */}
            {isAdmin && (
              <div>
                {/* Collapsible header */}
                <button
                  type="button"
                  onClick={() => setShowPrivate((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border-2 border-amber-200 bg-amber-50 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-amber-600" />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-amber-900">
                        Private Expenses
                      </p>
                      <p className="text-xs text-amber-700">
                        {privateExpenses.length === 0
                          ? "None this month"
                          : `${privateExpenses.length} expense${privateExpenses.length === 1 ? "" : "s"} · ${formatCurrency(totalPrivate)}`}
                      </p>
                    </div>
                  </div>
                  {showPrivate ? (
                    <ChevronUp className="h-4 w-4 text-amber-600" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-amber-600" />
                  )}
                </button>

                {showPrivate && (
                  <div className="mt-3 space-y-3">
                    {/* Private summary */}
                    <Card className="border-amber-200">
                      <CardContent className="pt-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Total Private
                            </p>
                            <p className="text-3xl font-bold mt-1 text-amber-700">
                              {formatCurrency(totalPrivate)}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {privateExpenses.length}{" "}
                              {privateExpenses.length === 1
                                ? "expense"
                                : "expenses"}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportCSV("private")}
                            className="gap-1.5 border-amber-300 text-amber-800 hover:bg-amber-50"
                            disabled={privateExpenses.length === 0}
                          >
                            <Download className="h-4 w-4" />
                            CSV
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Private bar chart */}
                    {privateTotals.length > 0 && (
                      <Card className="border-amber-200">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Lock className="h-4 w-4 text-amber-600" />
                            Private by Category
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CategoryChart totals={privateTotals} />
                        </CardContent>
                      </Card>
                    )}

                    {/* Private category list */}
                    {privateTotals.length === 0 ? (
                      <div className="py-6 text-center">
                        <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground text-sm">
                          No private expenses this month
                        </p>
                      </div>
                    ) : (
                      <Card className="border-amber-200">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">
                            Private Category Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <CategoryList
                            totals={privateTotals}
                            grandTotal={totalPrivate}
                          />
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

// ── Shared sub-components ──────────────────────────────────────

function CategoryChart({
  totals,
}: {
  totals: { name: string; icon: string; color: string; total: number }[];
}) {
  const data = totals.map((c) => ({
    name: `${c.icon} ${c.name}`,
    amount: c.total,
    color: c.color,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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
          tickFormatter={(v) =>
            `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
          }
        />
        <Tooltip
          formatter={(value: number) => [formatCurrency(value), "Amount"]}
          contentStyle={{
            borderRadius: "12px",
            border: "none",
            boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
          }}
        />
        <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function CategoryList({
  totals,
  grandTotal,
}: {
  totals: { name: string; icon: string; color: string; total: number }[];
  grandTotal: number;
}) {
  return (
    <>
      {totals.map((cat) => (
        <div key={cat.name} className="flex items-center gap-3">
          <span className="text-2xl w-8 text-center">{cat.icon}</span>
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">{cat.name}</span>
              <span className="text-sm font-semibold">
                {formatCurrency(cat.total)}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.round((cat.total / grandTotal) * 100)}%`,
                  backgroundColor: cat.color,
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
