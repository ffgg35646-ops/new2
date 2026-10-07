import { useQuery } from "@tanstack/react-query";
import { Check, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_PRIVACY_POLICY, DEFAULT_TERMS_OF_USE } from "@/lib/legal-content";

type PolicyKey = "privacy_policy" | "terms_of_use";

const DEFAULT_CONTENT: Record<PolicyKey, string> = {
  privacy_policy: DEFAULT_PRIVACY_POLICY,
  terms_of_use: DEFAULT_TERMS_OF_USE,
};

export function LegalPolicyModal({
  open,
  policyKey,
  title,
  onClose,
  onAccept,
}: {
  open: boolean;
  policyKey: PolicyKey;
  title: string;
  onClose: () => void;
  onAccept: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["legal-policy", policyKey],
    enabled: open,
    initialData: DEFAULT_CONTENT[policyKey],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_content")
        .select("content")
        .eq("key", policyKey)
        .maybeSingle();

      if (error) throw error;

      return data?.content || DEFAULT_CONTENT[policyKey];
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-background px-4 py-4">
        <h2 className="font-display text-lg font-extrabold">
          {title}
        </h2>

        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق"
          className="grid size-9 place-items-center rounded-full bg-surface ring-1 ring-line"
        >
          <X className="size-5" />
        </button>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {isLoading ? (
          <div className="grid min-h-[50vh] place-items-center">
            <Loader2 className="size-6 animate-spin text-forest" />
          </div>
        ) : (
          <article className="whitespace-pre-wrap text-sm leading-8">
            {data || DEFAULT_CONTENT[policyKey]}
          </article>
        )}
      </main>

      <div className="border-t border-line bg-background px-5 py-4">
        <button
          type="button"
          onClick={onAccept}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 font-display font-bold text-background"
        >
          <Check className="size-4" />
          أوافق وأتابع
        </button>
      </div>
    </div>
  );
}
