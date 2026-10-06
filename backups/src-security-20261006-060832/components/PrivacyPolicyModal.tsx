import { useQuery } from "@tanstack/react-query";
import { X, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_POLICY = `سياسة الخصوصية

نحترم خصوصيتك ونلتزم بحماية البيانات التي تقدمها عند استخدام التطبيق.`;

export function PrivacyPolicyModal({
  open,
  onClose,
  onAccept,
}: {
  open: boolean;
  onClose: () => void;
  onAccept?: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["privacy-policy"],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_content")
        .select("content")
        .eq("key", "privacy_policy")
        .maybeSingle();

      if (error) throw error;

      return data?.content || DEFAULT_POLICY;
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-background px-4 py-4">
        <h2 className="font-display text-lg font-extrabold">
          سياسة الخصوصية
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

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {isLoading ? (
          <div className="grid min-h-[50vh] place-items-center">
            <Loader2 className="size-6 animate-spin text-forest" />
          </div>
        ) : (
          <article className="whitespace-pre-wrap text-sm leading-8 text-foreground">
            {data || DEFAULT_POLICY}
          </article>
        )}
      </div>

      {onAccept && (
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
      )}
    </div>
  );
}
