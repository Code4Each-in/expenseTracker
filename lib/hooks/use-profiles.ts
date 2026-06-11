"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchProfiles() {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name");

      setProfiles(data ?? []);
      setLoading(false);
    }

    fetchProfiles();
  }, [supabase]);

  // Note: RLS on profiles automatically scopes results:
  // - Admins receive all profiles
  // - Members receive only their own profile
  return { profiles, loading };
}
