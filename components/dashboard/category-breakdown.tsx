"use client";

import { formatCurrency, percentOf } from "@/lib/utils";
import type { MonthlyCategoryTotal } from "@/lib/types";

interface CategoryBreakdownProps {
  totals: MonthlyCategoryTotal[];
  totalSpent: number;
}

export function CategoryBreakdown({
  totals,
  totalSpent,
}: CategoryBreakdownProps) {
  if (totals.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-4 text-sm">
        No expenses this month
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {totals.map((cat) => {
        const pct = percentOf(cat.total_amount, totalSpent);
        return (
          <div key={cat.category_id} className="flex items-center gap-3">
            <span className="text-2xl w-8 text-center flex-shrink-0">
              {cat.category_icon}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium truncate">
                  {cat.category_name}
                </span>
                <span className="text-sm font-semibold ml-2 flex-shrink-0">
                  {formatCurrency(cat.total_amount)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: cat.category_color,
                  }}
                />
              </div>
            </div>
            <span className="text-xs text-muted-foreground w-8 text-right flex-shrink-0">
              {pct}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
