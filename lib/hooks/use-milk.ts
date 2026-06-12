"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MilkConfig, MilkEntry } from "@/lib/types";

interface UseMilkOptions {
  startDate: string;
  endDate: string;
}

export function useMilk({ startDate, endDate }: UseMilkOptions) {
  const supabase = createClient();
  const [entries, setEntries] = useState<MilkEntry[]>([]);
  const [currentRate, setCurrentRate] = useState<MilkConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];
    const [entriesResult, rateResult] = await Promise.all([
      supabase
        .from("milk_entries")
        .select("*")
        .gte("entry_date", startDate)
        .lte("entry_date", endDate)
        .order("entry_date", { ascending: false }),
      supabase
        .from("milk_config")
        .select("*")
        .lte("effective_from", today)
        .order("effective_from", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    setEntries((entriesResult.data as MilkEntry[]) ?? []);
    setCurrentRate(rateResult.data as MilkConfig | null);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addEntry = async (entry: {
    entry_date: string;
    quantity_liters: number;
    notes?: string;
  }): Promise<{ error: unknown }> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };
    const { error } = await supabase.from("milk_entries").insert({
      ...entry,
      created_by: user.id,
    });
    if (!error) await fetchData();
    return { error };
  };

  const updateEntry = async (
    id: string,
    entry: { entry_date: string; quantity_liters: number; notes?: string }
  ): Promise<{ error: unknown }> => {
    const { error } = await supabase
      .from("milk_entries")
      .update(entry)
      .eq("id", id);
    if (!error) await fetchData();
    return { error };
  };

  const deleteEntry = async (id: string): Promise<{ error: unknown }> => {
    const { error } = await supabase
      .from("milk_entries")
      .delete()
      .eq("id", id);
    if (!error) await fetchData();
    return { error };
  };

  const updateRate = async (newRate: number): Promise<{ error: unknown }> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };
    const today = new Date().toISOString().split("T")[0];
    const { error } = await supabase.from("milk_config").insert({
      rate_per_liter: newRate,
      effective_from: today,
      created_by: user.id,
    });
    if (!error) await fetchData();
    return { error };
  };

  return {
    entries,
    currentRate,
    loading,
    addEntry,
    updateEntry,
    deleteEntry,
    updateRate,
  };
}
