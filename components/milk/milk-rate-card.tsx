"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Pencil } from "lucide-react";
import type { MilkConfig } from "@/lib/types";

interface MilkRateCardProps {
  currentRate: MilkConfig | null;
  onUpdateRate: (rate: number) => Promise<{ error: unknown }>;
}

export function MilkRateCard({ currentRate, onUpdateRate }: MilkRateCardProps) {
  const [editing, setEditing] = useState(false);
  const [newRate, setNewRate] = useState(
    currentRate ? String(currentRate.rate_per_liter) : "75"
  );
  const [saving, setSaving] = useState(false);

  const rateValue = parseFloat(newRate);
  const valid = !isNaN(rateValue) && rateValue > 0;

  const handleSave = async () => {
    if (!valid) return;
    setSaving(true);
    const { error } = await onUpdateRate(rateValue);
    setSaving(false);
    if (!error) {
      setEditing(false);
    }
  };

  const displayRate = currentRate
    ? Number(currentRate.rate_per_liter).toFixed(2)
    : "75.00";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Milk Rate</span>
          {!editing && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                ₹
              </span>
              <Input
                type="number"
                inputMode="decimal"
                step="0.5"
                min="0"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                className="pl-7 pr-8 h-10"
                autoFocus
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                /L
              </span>
            </div>
            <Button onClick={handleSave} disabled={saving || !valid} className="h-10">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setEditing(false)}
              className="h-10"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div>
            <p className="text-2xl font-bold">
              ₹{displayRate}
              <span className="text-base font-normal text-muted-foreground">
                {" "}
                per liter
              </span>
            </p>
            {currentRate?.effective_from && (
              <p className="text-xs text-muted-foreground mt-1">
                Effective from {currentRate.effective_from} · Saving a new rate
                creates history automatically
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
