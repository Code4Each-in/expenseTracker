"use client";

import { formatCurrency, percentOf } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface MonthSummaryProps {
  totalSpent: number;
  budgetAmount: number | null;
  expenseCount: number;
}

export function MonthSummary({
  totalSpent,
  budgetAmount,
  expenseCount,
}: MonthSummaryProps) {
  const remaining = budgetAmount ? budgetAmount - totalSpent : null;
  const usedPercent = budgetAmount ? percentOf(totalSpent, budgetAmount) : 0;
  const isOverBudget = remaining !== null && remaining < 0;

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-5">
        <div className="flex items-center gap-2 mb-1">
          <Wallet className="h-4 w-4 opacity-80" />
          <span className="text-sm font-medium opacity-80">This Month</span>
        </div>
        <p className="text-4xl font-bold tracking-tight">
          {formatCurrency(totalSpent)}
        </p>
        <p className="mt-1 text-sm opacity-70">
          {expenseCount} {expenseCount === 1 ? "expense" : "expenses"}
        </p>
      </div>

      <CardContent className="pt-4 space-y-3">
        {budgetAmount ? (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Budget</span>
              <span className="font-semibold">{formatCurrency(budgetAmount)}</span>
            </div>

            <Progress
              value={Math.min(usedPercent, 100)}
              className={cn(isOverBudget ? "[&>div]:bg-destructive" : "")}
            />

            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "flex items-center gap-1 text-sm font-semibold",
                  isOverBudget ? "text-destructive" : "text-green-600"
                )}
              >
                {isOverBudget ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {isOverBudget ? "Over by " : "Remaining "}
                {formatCurrency(Math.abs(remaining!))}
              </span>
              <span className="text-sm text-muted-foreground">
                {usedPercent}% used
              </span>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-1">
            No budget set for this month
          </p>
        )}
      </CardContent>
    </Card>
  );
}
