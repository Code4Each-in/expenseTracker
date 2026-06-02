"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCategories } from "@/lib/hooks/use-categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Check } from "lucide-react";
import { toTodayDateString } from "@/lib/utils";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { Category } from "@/lib/types";

interface QuickAddFormProps {
  prefilledCategoryId?: string;
  prefilledAmount?: string;
  prefilledDescription?: string;
}

export function QuickAddForm({
  prefilledCategoryId,
  prefilledAmount = "",
  prefilledDescription = "",
}: QuickAddFormProps) {
  const router = useRouter();
  const { categories, loading: loadingCats } = useCategories();
  const supabase = createClient();

  const [selectedCategoryId, setSelectedCategoryId] = useState(
    prefilledCategoryId ?? ""
  );
  const [amount, setAmount] = useState(prefilledAmount);
  const [description, setDescription] = useState(prefilledDescription);
  const [expenseDate, setExpenseDate] = useState(toTodayDateString());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!selectedCategoryId || !amount) {
      toast.error("Please select a category and enter an amount");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Please sign in");
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("expenses").insert({
      amount: numAmount,
      category_id: selectedCategoryId,
      description: description.trim() || null,
      expense_date: expenseDate,
      created_by: user.id,
    });

    setSaving(false);

    if (error) {
      toast.error("Failed to save expense");
      return;
    }

    setSaved(true);
    toast.success("Expense saved!");

    // Reset form after brief success state
    setTimeout(() => {
      setSaved(false);
      setAmount("");
      setDescription("");
      setSelectedCategoryId(prefilledCategoryId ?? "");
      setExpenseDate(toTodayDateString());
      router.push("/dashboard");
    }, 800);
  };

  const selectedCategory = categories.find(
    (c) => c.id === selectedCategoryId
  );

  // Quick-tap category grid (top 6 shown prominently)
  const quickCategories = categories.slice(0, 8);

  if (loadingCats) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Category selection grid */}
      <div>
        <Label className="text-base mb-3 block">Category</Label>
        <div className="grid grid-cols-4 gap-2">
          {quickCategories.map((cat: Category) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategoryId(cat.id)}
              className={cn(
                "flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all active:scale-95",
                selectedCategoryId === cat.id
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-[11px] font-medium leading-tight text-center">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <Label htmlFor="amount" className="text-base">
          Amount (₹)
        </Label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-muted-foreground">
            ₹
          </span>
          <Input
            id="amount"
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-9 text-2xl font-bold h-16"
            autoFocus={!!prefilledCategoryId}
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-base">
          Description{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="description"
          placeholder={
            selectedCategory
              ? `e.g. ${selectedCategory.name} items...`
              : "What did you buy?"
          }
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>

      {/* Date */}
      <div className="space-y-2">
        <Label htmlFor="date" className="text-base">
          Date
        </Label>
        <Input
          id="date"
          type="date"
          value={expenseDate}
          onChange={(e) => setExpenseDate(e.target.value)}
          max={toTodayDateString()}
          className="h-12"
        />
      </div>

      {/* Save button */}
      <Button
        size="xl"
        className="w-full"
        onClick={handleSave}
        disabled={saving || saved || !selectedCategoryId || !amount}
      >
        {saved ? (
          <>
            <Check className="mr-2 h-5 w-5" />
            Saved!
          </>
        ) : saving ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Expense"
        )}
      </Button>
    </div>
  );
}
