"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toTodayDateString } from "@/lib/utils";
import type { MilkEntry } from "@/lib/types";

interface MilkEntryFormProps {
  entry?: MilkEntry;
  onSubmit: (data: {
    entry_date: string;
    quantity_liters: number;
    notes?: string;
  }) => Promise<{ error: unknown }>;
  onCancel: () => void;
}

export function MilkEntryForm({ entry, onSubmit, onCancel }: MilkEntryFormProps) {
  const [date, setDate] = useState(entry?.entry_date ?? toTodayDateString());
  const [quantity, setQuantity] = useState(
    entry ? String(entry.quantity_liters) : ""
  );
  const [notes, setNotes] = useState(entry?.notes ?? "");
  const [saving, setSaving] = useState(false);

  const qty = parseFloat(quantity);
  const valid = !isNaN(qty) && qty > 0;

  const handleSubmit = async () => {
    if (!valid) return;
    setSaving(true);
    await onSubmit({
      entry_date: date,
      quantity_liters: qty,
      notes: notes.trim() || undefined,
    });
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="milk-date">Date</Label>
        <Input
          id="milk-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={toTodayDateString()}
          className="h-12"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="milk-qty">Quantity</Label>
        <div className="relative">
          <Input
            id="milk-qty"
            type="number"
            inputMode="decimal"
            step="0.5"
            min="0"
            placeholder="0.0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="pr-10 text-xl font-bold h-14"
            autoFocus={!entry}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
            L
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="milk-notes">
          Notes{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="milk-notes"
          placeholder="e.g. Extra delivery, morning only..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </div>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          className="flex-1"
          onClick={handleSubmit}
          disabled={saving || !valid}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : entry ? (
            "Save Changes"
          ) : (
            "Add Entry"
          )}
        </Button>
      </div>
    </div>
  );
}
