"use client";

import { useState } from "react";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { MilkEntryForm } from "./milk-entry-form";
import type { MilkEntry, MilkConfig } from "@/lib/types";

interface MilkDailyTableProps {
  entries: MilkEntry[];
  currentRate: MilkConfig | null;
  isAdmin: boolean;
  onUpdate: (
    id: string,
    data: { entry_date: string; quantity_liters: number; notes?: string }
  ) => Promise<{ error: unknown }>;
  onDelete: (id: string) => Promise<{ error: unknown }>;
}

export function MilkDailyTable({
  entries,
  currentRate,
  isAdmin,
  onUpdate,
  onDelete,
}: MilkDailyTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const rate = currentRate ? Number(currentRate.rate_per_liter) : 0;

  if (entries.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-3xl mb-2">🥛</p>
        <p className="text-muted-foreground text-sm">No entries this month</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {entries.map((entry) => {
        const cost = Number(entry.quantity_liters) * rate;

        if (editingId === entry.id) {
          return (
            <div key={entry.id} className="py-3">
              <MilkEntryForm
                entry={entry}
                onSubmit={async (data) => {
                  const result = await onUpdate(entry.id, data);
                  if (!result.error) setEditingId(null);
                  return result;
                }}
                onCancel={() => setEditingId(null)}
              />
            </div>
          );
        }

        return (
          <div key={entry.id} className="flex items-center gap-2 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                {formatDateShort(entry.entry_date)}
              </p>
              {entry.notes && (
                <p className="text-xs text-muted-foreground truncate">
                  {entry.notes}
                </p>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-semibold">
                {Number(entry.quantity_liters).toFixed(1)} L
              </p>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(cost)}
              </p>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                onClick={() => setEditingId(entry.id)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(entry.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
