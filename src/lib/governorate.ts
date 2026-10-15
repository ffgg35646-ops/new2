import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type Governorate = {
  id: string;
  name_ar: string;
  code: string;
  banner_url: string | null;
};

const STORAGE_KEY = "ofoq-governorate";

export function useGovernorates() {
  const visualPreview = import.meta.env.VITE_VISUAL_PREVIEW === "true";
  const previewGovernorates: Governorate[] = [
    {
      id: "preview-muzahmiyah",
      name_ar: "المزاحمية",
      code: "muzahmiyah",
      banner_url: "/5943001103257505505.jpg",
    },
    {
      id: "preview-dharma",
      name_ar: "ضرما",
      code: "dharma",
      banner_url: "/5943001103257505506.jpg",
    },
  ];

  return useQuery({
    queryKey: ["governorates"],
    enabled: !visualPreview,
    initialData: visualPreview ? previewGovernorates : undefined,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("governorates")
        .select("id,name_ar,code,banner_url")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Governorate[];
    },
    staleTime: visualPreview ? Infinity : 10 * 60_000,
    refetchOnMount: !visualPreview,
    retry: 2,
  });
}

export function useNeighborhoods(governorateId?: string | null) {
  return useQuery({
    queryKey: ["neighborhoods", governorateId],
    enabled: !!governorateId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("neighborhoods")
        .select("id,name_ar")
        .eq("governorate_id", governorateId!)
        .eq("is_active", true)
        .order("name_ar");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });
}

export function useSelectedGovernorate() {
  const {
    data: governorates,
    error: governoratesError,
    isLoading: governoratesLoading,
  } = useGovernorates();
  const { profile, userId } = useAuth();
  const qc = useQueryClient();
  const [local, setLocal] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") setLocal(window.localStorage.getItem(STORAGE_KEY));
  }, []);

  const id = profile?.governorate_id ?? local ?? governorates?.[0]?.id ?? null;
  const current = governorates?.find((g) => g.id === id) ?? null;

  const select = useCallback(
    async (next: string) => {
      setLocal(next);
      if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, next);
      if (userId) {
        await supabase.from("profiles").update({ governorate_id: next }).eq("id", userId);
        qc.invalidateQueries({ queryKey: ["session"] });
      }
      qc.invalidateQueries();
    },
    [qc, userId],
  );

  return {
    governorates: governorates ?? [],
    governoratesError,
    governoratesLoading,
    governorateId: id,
    governorate: current,
    select,
  };
}
