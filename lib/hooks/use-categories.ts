"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/lib/types";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .eq("active", true)
        .order("sort_order");

      setCategories(data ?? []);
      setLoading(false);
    }

    fetchCategories();
  }, [supabase]);

  return { categories, loading };
}
