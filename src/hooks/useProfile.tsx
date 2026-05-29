import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type Profile = {
  id: string;
  full_name: string | null;
  target_role: string | null;
  college: string | null;
  branch: string | null;
  graduation_year: string | null;
  bio: string | null;
  skills: string[] | null;
  github_url: string | null;
  linkedin_url: string | null;
  location: string | null;
  experience_level: string | null;
};

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (data) {
      setProfile(data as Profile);
    } else {
      // create empty profile row
      const { data: created } = await supabase
        .from("profiles")
        .insert({ id: user.id, full_name: user.user_metadata?.full_name ?? "" })
        .select()
        .maybeSingle();
      setProfile((created as Profile) ?? null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const save = async (patch: Partial<Profile>) => {
    if (!user) return { error: new Error("Not signed in") };
    const { data, error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", user.id)
      .select()
      .maybeSingle();
    if (!error && data) setProfile(data as Profile);
    return { error };
  };

  return { profile, loading, save, reload: load };
}

export function initialsOf(name?: string | null, email?: string | null) {
  const src = (name || email || "U").trim();
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}
