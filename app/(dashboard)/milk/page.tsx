"use client";

import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle } from "lucide-react";
import { useMilk } from "@/lib/hooks/use-milk";
import { useProfile } from "@/lib/hooks/use-profile";
import { MilkSummaryCard } from "@/components/milk/milk-summary-card";
import { MilkDailyTable } from "@/components/milk/milk-daily-table";
import { MilkRateCard } from "@/components/milk/milk-rate-card";
import { MilkEntryForm } from "@/components/milk/milk-entry-form";
import toast from "react-hot-toast";

const MONTHS_BACK = 3;

export default function MilkPage() {
  const { profile } = useProfile();
  const isAdmin = profile?.role === "admin";

  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showAddForm, setShowAddForm] = useState(false);

  const startDate = format(startOfMonth(selectedMonth), "yyyy-MM-dd");
  const endDate = format(endOfMonth(selectedMonth), "yyyy-MM-dd");

  const { entries, currentRate, loading, addEntry, updateEntry, deleteEntry, updateRate } =
    useMilk({ startDate, endDate });

  const months = useMemo(
    () => Array.from({ length: MONTHS_BACK + 1 }, (_, i) => subMonths(new Date(), i)),
    []
  );

  const handleAdd = async (data: {
    entry_date: string;
    quantity_liters: number;
    notes?: string;
  }) => {
    const { error } = await addEntry(data);
    if (error) {
      toast.error("Failed to add entry");
      return { error };
    }
    toast.success("Entry added!");
    setShowAddForm(false);
    return { error: null };
  };

  const handleUpdate = async (
    id: string,
    data: { entry_date: string; quantity_liters: number; notes?: string }
  ) => {
    const { error } = await updateEntry(id, data);
    if (error) toast.error("Failed to update entry");
    else toast.success("Entry updated!");
    return { error };
  };

  const handleDelete = async (id: string) => {
    const { error } = await deleteEntry(id);
    if (error) toast.error("Failed to delete entry");
    else toast.success("Entry deleted");
    return { error };
  };

  const handleUpdateRate = async (rate: number) => {
    const { error } = await updateRate(rate);
    if (error) toast.error("Failed to update rate");
    else toast.success("Rate updated!");
    return { error };
  };

  return (
    <>
      <Header title="🥛 Milk Tracker" />
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

        {/* Monthly summary stats */}
        {loading ? (
          <Skeleton className="h-20 rounded-2xl" />
        ) : (
          <MilkSummaryCard entries={entries} currentRate={currentRate} />
        )}

        {/* Add entry */}
        {showAddForm ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Add Entry</CardTitle>
            </CardHeader>
            <CardContent>
              <MilkEntryForm
                onSubmit={handleAdd}
                onCancel={() => setShowAddForm(false)}
              />
            </CardContent>
          </Card>
        ) : (
          <Button
            size="lg"
            className="w-full h-12 gap-2"
            onClick={() => setShowAddForm(true)}
          >
            <PlusCircle className="h-5 w-5" />
            Add Milk Entry
          </Button>
        )}

        {/* Daily breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {format(selectedMonth, "MMMM yyyy")} · Daily Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-32 rounded-xl" />
            ) : (
              <MilkDailyTable
                entries={entries}
                currentRate={currentRate}
                isAdmin={isAdmin}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            )}
          </CardContent>
        </Card>

        {/* Rate management — admin only */}
        {isAdmin && (
          <MilkRateCard currentRate={currentRate} onUpdateRate={handleUpdateRate} />
        )}

        <div className="h-4" />
      </div>
    </>
  );
}
