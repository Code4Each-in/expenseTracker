import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { MonthSummary } from "@/components/dashboard/month-summary";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { ExpenseCard } from "@/components/expenses/expense-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCurrentMonthRange, getCurrentMonthYear } from "@/lib/utils";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import type { ExpenseWithDetails, MonthlyCategoryTotal } from "@/lib/types";

export const metadata = { title: "Dashboard – Family Expense Tracker" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { start, end } = getCurrentMonthRange();
  const { month, year } = getCurrentMonthYear();

  // Run queries in parallel
  const [expensesResult, categoryTotalsResult, budgetResult] =
    await Promise.all([
      supabase
        .from("expenses_with_details")
        .select("*")
        .gte("expense_date", start)
        .lte("expense_date", end)
        .order("expense_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(5),

      supabase
        .from("monthly_category_totals")
        .select("*")
        .gte("month", start)
        .lte("month", end),

      supabase
        .from("monthly_budgets")
        .select("budget_amount")
        .eq("month", month)
        .eq("year", year)
        .maybeSingle(),
    ]);

  const recentExpenses = (expensesResult.data as ExpenseWithDetails[]) ?? [];
  const categoryTotals = (
    categoryTotalsResult.data as MonthlyCategoryTotal[]
  ) ?? [];
  const budgetAmount = budgetResult.data?.budget_amount ?? null;

  const totalSpent = categoryTotals.reduce(
    (sum, cat) => sum + Number(cat.total_amount),
    0
  );

  return (
    <>
      <Header />
      <div className="px-4 py-4 space-y-4">
        {/* Monthly budget summary */}
        <MonthSummary
          totalSpent={totalSpent}
          budgetAmount={budgetAmount ? Number(budgetAmount) : null}
          expenseCount={recentExpenses.length}
        />

        {/* Quick add CTA */}
        <Button asChild size="lg" className="w-full h-14 text-base shadow-md">
          <Link href="/add">
            <PlusCircle className="mr-2 h-5 w-5" />
            Add Expense
          </Link>
        </Button>

        {/* Category breakdown */}
        {categoryTotals.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Spending by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryBreakdown
                totals={categoryTotals}
                totalSpent={totalSpent}
              />
            </CardContent>
          </Card>
        )}

        {/* Recent expenses */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Expenses</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/expenses" className="text-primary text-sm">
                  See all
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentExpenses.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-muted-foreground text-sm mb-3">
                  No expenses this month
                </p>
                <Button asChild size="sm" variant="outline">
                  <Link href="/add">Add your first expense</Link>
                </Button>
              </div>
            ) : (
              <div>
                {recentExpenses.map((expense) => (
                  <ExpenseCard key={expense.id} expense={expense} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
