import { RoleGuard } from "@/lib/role-guard";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Copy, Loader2, Phone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { EmptyState, ListSkeleton } from "@/components/EmptyState";
import { LISTING_TYPES, PROPERTY_KINDS, REQUEST_STATUS } from "@/lib/constants";
import { useAuth } from "@/lib/auth";
import { useNeighborhoods, useSelectedGovernorate } from "@/lib/governorate";
import { formatDate, formatPrice } from "@/lib/format";
import { whatsappHref } from "@/lib/office";
import { cn } from "@/lib/utils";
import { MediaUploader } from "@/components/MediaUploader";

type OfferRow = {
  id: string;
  message: string;
  price: number | null;
  status: string;
  created_at: string;
  offices: { name: string; phone: string | null; whatsapp: string | null } | null;
  properties: { id: string; title: string } | null;
};

const OFFER_STATUS: Record<string, string> = {
  sent: "جديد",
  accepted: "مقبول ✓",
  rejected: "مرفوض",
};

export const Route = createFileRoute("/request")({
  validateSearch: (search: Record<string, unknown>) => ({
    request:
      typeof search.request === "string" ? search.request : undefined,
  }),
  head: () => ({
    meta: [
      { title: "اطلب عقارًا | عقار البطين" },
      {
        name: "description",
        content: "انشر طلبك العقاري ودع المكاتب الموثقة ترسل لك عروضًا مناسبة لميزانيتك.",
      },
      { property: "og:title", content: "اطلب عقارًا | عقار البطين" },
      { property: "og:description", content: "اكتب مواصفات العقار المطلوب وتصلك العروض." },
    ],
  }),
  component: () => (
    <RoleGuard allow={["individual", "admin"]}>
      <RequestPage />
    </RoleGuard>
  ),
});

function RequestPage() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  const search = Route.useSearch();
  const [revealedPhoneId, setRevealedPhoneId] = useState<string | null>(null);
  const { governorateId } = useSelectedGovernorate();
  const { data: neighborhoods = [] } = useNeighborhoods(governorateId);

  const [kind, setKind] = useState<string>("land");
  const [listing, setListing] = useState<string>("sale");
  const [neighborhood, setNeighborhood] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [areaMin, setAreaMin] = useState("");
  const [description, setDescription] = useState("");
  const [durationDays, setDurationDays] = useState<7 | 30>(7);
  const [attachment, setAttachment] = useState<string[]>([]);

  const { data: myRequests, isLoading } = useQuery({
    queryKey: ["my-requests", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_requests")
        .select(
          "*, office_offers(id,message,price,status,created_at,offices(name,phone,whatsapp),properties(id,title))",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (!search.request || !myRequests?.length) return;

    const id = "request-" + search.request;
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 0);
  }, [search.request, myRequests?.length]);

  async function copyPhone(phone: string) {
    try {
      await navigator.clipboard.writeText(phone);
      toast.success("تم نسخ الرقم");
    } catch {
      toast.error("تعذّر نسخ الرقم");
    }
  }

  const setOfferStatus = useMutation({
    mutationFn: async (vars: { id: string; status: "accepted" | "rejected" }) => {
      const { error } = await supabase.rpc(
        "respond_property_offer" as never,
        {
          _offer_id: vars.id,
          _status: vars.status,
        } as never,
      );
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast.success(
        vars.status === "accepted"
          ? "تم قبول العرض وإغلاق الطلب كمكتمل"
          : "تم رفض العرض",
      );
      void qc.invalidateQueries({ queryKey: ["my-requests"] });
      void qc.invalidateQueries({ queryKey: ["open-requests"] });
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "تعذّر تحديث العرض"),
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("سجّل الدخول لنشر الطلب");
      if (description.trim().length < 10) throw new Error("اكتب وصفًا أوضح لطلبك");
      if (!governorateId) {
        throw new Error("اختر المحافظة أولًا");
      }

      const { data: createdRequest, error } = await supabase.rpc(
        "create_property_request" as never,
        {
          _governorate_id: governorateId,
          _kind: kind,
          _listing: listing,
          _neighborhood: neighborhood || null,
          _budget_min: budgetMin ? Number(budgetMin) : null,
          _budget_max: budgetMax ? Number(budgetMax) : null,
          _area_min: areaMin ? Number(areaMin) : null,
          _description: description.trim(),
          _attachment_url: attachment[0] ?? null,
          _duration_days: durationDays,
        } as never,
      );

      if (error) throw error;

      if (createdRequest) {
        const { error: notifyError } = await supabase.rpc(
          "notify_matching_offices_for_request" as never,
          { _request_id: createdRequest } as never,
        );

        if (notifyError) {
          console.warn(
            "[request] matching-office notification failed",
            notifyError,
          );
        }
      }
    },
    onSuccess: () => {
      toast.success("تم نشر طلبك، ستصلك عروض المكاتب");
      setDescription("");
      setBudgetMin("");
      setBudgetMax("");
      setDurationDays(7);
      setAttachment([]);
      qc.invalidateQueries({ queryKey: ["my-requests"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "تعذّر نشر الطلب"),
  });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <AppHeader showSearch={false} />
      <main className="flex-1 space-y-5 px-4 py-4">
        <div>
          <h1 className="font-display text-xl font-extrabold">اطلب عقارًا</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            اكتب ما تبحث عنه، وسترسل لك المكاتب العقارية عروضها مباشرة.
          </p>
        </div>

        <section className="space-y-3 rounded-3xl bg-surface p-4 ring-1 ring-line">
          <Row label="نوع العقار">
            {PROPERTY_KINDS.map((k) => (
              <Pill
                key={k.value}
                active={kind === k.value}
                onClick={() => setKind(k.value)}
                label={k.label}
              />
            ))}
          </Row>
          <Row label="نوع العرض">
            {LISTING_TYPES.map((l) => (
              <Pill
                key={l.value}
                active={listing === l.value}
                onClick={() => setListing(l.value)}
                label={l.label}
              />
            ))}
          </Row>
          {!!neighborhoods.length && (
            <Row label="الحي المفضل">
              <Pill active={!neighborhood} onClick={() => setNeighborhood("")} label="أي حي" />
              {neighborhoods.map((n) => (
                <Pill
                  key={n.id}
                  active={neighborhood === n.name_ar}
                  onClick={() => setNeighborhood(n.name_ar)}
                  label={n.name_ar}
                />
              ))}
            </Row>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Num label="الميزانية من" value={budgetMin} onChange={setBudgetMin} />
            <Num label="الميزانية إلى" value={budgetMax} onChange={setBudgetMax} />
          </div>
          <Num label="أقل مساحة مطلوبة (م²)" value={areaMin} onChange={setAreaMin} />

          <label className="block">
            <span className="mb-1 block text-[11px] text-muted-foreground">
              مدة صلاحية الطلب
            </span>
            <select
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value) as 7 | 30)}
              className="w-full rounded-xl bg-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest"
            >
              <option value={7}>7 أيام</option>
              <option value={30}>30 يومًا</option>
            </select>
          </label>

          {userId && (
            <div>
              <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                مرفق الطلب
              </span>
              <MediaUploader
                userId={userId}
                folder="requests"
                value={attachment}
                onChange={(urls) => setAttachment(urls.slice(0, 1))}
                label="إرفاق مخطط أو صورة (اختياري)"
              />
            </div>
          )}

          <label className="block">
            <span className="mb-1 block text-[11px] text-muted-foreground">وصف الطلب</span>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="مثال: أبحث عن أرض سكنية بمساحة لا تقل عن 500م في حي الروضة، شارع 20م."
              className="w-full rounded-2xl bg-sand px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-forest"
            />
          </label>

          {userId ? (
            <button
              onClick={() => create.mutate()}
              disabled={create.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-terracotta py-3.5 font-display font-bold text-background disabled:opacity-60"
            >
              {create.isPending && <Loader2 className="size-4 animate-spin" />} نشر الطلب
            </button>
          ) : (
            <Link
              to="/auth/individual"
              className="block rounded-2xl bg-forest py-3.5 text-center font-display font-bold text-background"
            >
              سجّل الدخول لنشر الطلب
            </Link>
          )}
        </section>

        <Link
          to="/requests"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-surface py-3.5 text-sm font-bold text-forest ring-1 ring-line"
        >
          <ClipboardList className="size-4" />
          عرض طلباتي والعروض المستلمة
        </Link>
      </main>
      <BottomNav />
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold text-muted-foreground">{label}</div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-semibold transition",
        active ? "bg-forest text-background" : "bg-sand text-muted-foreground",
      )}
    >
      {label}
    </button>
  );
}

function Num({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] text-muted-foreground">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl bg-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest"
      />
    </label>
  );
}
