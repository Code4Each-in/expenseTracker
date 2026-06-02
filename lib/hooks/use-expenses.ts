"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ExpenseWithDetails } from "@/lib/types";

interface UseExpensesOptions {
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export function useExpenses(options: UseExpensesOptions = {}) {
  const [expenses, setExpenses] = useState<ExpenseWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const { limit, startDate, endDate } = options;
  const supabase = createClient();

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("expenses_with_details")
      .select("*")
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (startDate) query = query.gte("expense_date", startDate);
    if (endDate) query = query.lte("expense_date", endDate);
    if (limit) query = query.limit(limit);

    const { data } = await query;
    setExpenses(data ?? []);
    setLoading(false);
  }, [supabase, limit, startDate, endDate]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const deleteExpense = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (!error) {
        setExpenses((prev) => prev.filter((e) => e.id !== id));
      }
      return { error };
    },
    [supabase]
  );

  return { expenses, loading, refetch: fetchExpenses, deleteExpense };
}
