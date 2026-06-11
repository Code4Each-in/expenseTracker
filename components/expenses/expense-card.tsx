"use client";

import { formatCurrency, formatDateShort } from "@/lib/utils";
import type { ExpenseWithDetails } from "@/lib/types";
import { Trash2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ExpenseCardProps {
  expense: ExpenseWithDetails;
  onDelete?: (id: string) => void;
  showMember?: boolean;
  compact?: boolean;
}

export function ExpenseCard({
  expense,
  onDelete,
  showMember = false,
  compact = false,
}: ExpenseCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 py-3 px-1",
        !compact && "border-b border-border last:border-0"
      )}
    >
      {/* Category icon bubble */}
      <div
        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-xl"
        style={{ backgroundColor: expense.category_color + "20" }}
      >
        {expense.category_icon}
      </div>

      {/* Description + meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-medium truncate text-sm">
            {expense.description || expense.category_name}
          </p>
          {expense.is_private && (
            <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs text-muted-foreground">
            {formatDateShort(expense.expense_date)}
          </span>
          {showMember && (
            <>
              <span className="text-muted-foreground text-xs">·</span>
              <span className="text-xs text-muted-foreground truncate">
                {expense.member_name}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Amount + actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="font-bold text-base">
          {formatCurrency(expense.amount)}
        </span>
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(expense.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
