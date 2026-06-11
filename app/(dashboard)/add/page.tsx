"use client";

import { useState } from "react";
import { useCategories } from "@/lib/hooks/use-categories";
import { useProfile } from "@/lib/hooks/use-profile";
import { QuickAddForm } from "@/components/expenses/quick-add-form";
import { AIExpenseForm } from "@/components/expenses/ai-expense-form";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ParsedExpense } from "@/lib/types";

type Tab = "quick" | "ai";

export default function AddExpensePage() {
  const [activeTab, setActiveTab] = useState<Tab>("quick");
  const { categories } = useCategories();
  const { profile } = useProfile();

  const isAdmin = profile?.role === "admin";

  // State that AI form populates into QuickAddForm
  const [prefilledCategoryId, setPrefilledCategoryId] = useState<string>("");
  const [prefilledAmount, setPrefilledAmount] = useState<string>("");
  const [prefilledDescription, setPrefilledDescription] = useState<string>("");

  const handleAIParsed = (
    result: ParsedExpense & { category_id?: string }
  ) => {
    setPrefilledCategoryId(result.category_id ?? "");
    setPrefilledAmount(String(result.amount));
    setPrefilledDescription(result.description);
    setActiveTab("quick");
  };

  return (
    <>
      <Header title="Add Expense" />
      <div className="px-4 py-4 space-y-4">
        {/* Tab switcher */}
        <div className="flex bg-muted rounded-2xl p-1 gap-1">
          <button
            onClick={() => setActiveTab("quick")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all",
              activeTab === "quick"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            <Zap className="h-4 w-4" />
            Quick Add
          </button>
          <button
            onClick={() => setActiveTab("ai")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all",
              activeTab === "ai"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            <Sparkles className="h-4 w-4" />
            AI Entry
          </button>
        </div>

        {activeTab === "ai" && (
          <Card>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground mb-3">
                Type or speak naturally — AI will extract the details.
              </p>
              <AIExpenseForm
                onParsed={handleAIParsed}
                categories={categories}
              />
            </CardContent>
          </Card>
        )}

        {activeTab === "quick" && (
          <Card>
            <CardContent className="pt-5">
              <QuickAddForm
                prefilledCategoryId={prefilledCategoryId}
                prefilledAmount={prefilledAmount}
                prefilledDescription={prefilledDescription}
                isAdmin={isAdmin}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
