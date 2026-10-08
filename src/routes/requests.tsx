import { RoleGuard } from "@/lib/role-guard";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ChevronDown, ClipboardList, Copy, Phone, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { EmptyState, ListSkeleton } from "@/components/EmptyState";
import { useAuth } from "@/lib/auth";
import { LISTING_TYPES, PROPERTY_KINDS, REQUEST_STATUS } from "@/lib/constants";
import { formatDate, formatPrice } from "@/lib/format";
import { whatsappHref } from "@/lib/office";
import { cn } from "@/lib/utils";

type RequestRow = {
  id: string;
  kind: string;
  listing: string;
  neighborhood: string | null;
  budget_min: number | null;
  budget_max: number | null;
  area_min: number | null;
  description: string;
  status: string;
  created_at: string;
  expires_at: string | null;
  views_count: number | null;
  office_offers?: OfferRow[] | null;
};

type OfferRow = {
  id: string;
  message: string | null;
  price: number | null;
  status: string;
  created_at: string;
  offices: { id: string; name: string; phone: string | null; whatsapp: string | null } | null;
  properties: { id: string; title: string } | null;
  requestId: string;
  requestStatus: string;
  requestKind: string;
  requestListing: string;
  requestDescription: string;
};

export const Route = createFileRoute("/requests")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: search.tab === "received" ? "received" : "sent",
    request: typeof search.request === "string" ? search.request : undefined,
  }),
  head: () => ({
    meta: [
      { title: "الطلبات | عقار البطين" },
      { name: "description", content: "طلباتك العقارية والعروض التي وصلتك من المكاتب." },
    ],
  }),
  component: () => (
    <RoleGuard allow={["individual", "admin"]}>
      <RequestsPage />
    </RoleGuard>
  ),
});

function RequestsPage() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  const search = Route.useSearch();
  const [tab, setTab] = useState<"sent" | "received">(search.tab);
  const [openOfferId, setOpenOfferId] = useState<string | null>(null);

  useEffect(() => {
    setTab(search.tab);
  }, [search.tab]);

  const { data: myRequests = [], isLoading } = useQuery({
    queryKey: ["requests-page", userId],
    enabled: !!userId,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_requests")
        .select(
          "*, office_offers(id,message,price,status,created_at,offices(id,name,phone,whatsapp),properties(id,title))",
        )
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as RequestRow[];
    },
  });

  const receivedOffers = useMemo<OfferRow[]>(
    () =>
      myRequests.flatMap((request) =>
        (request.office_offers ?? []).map((offer) => ({
          ...offer,
          requestId: request.id,
          requestStatus: request.status,
          requestKind: request.kind,
          requestListing: request.listing,
          requestDescription: request.description,
        })),
      ),
    [myRequests],
  );

  useEffect(() => {
    if (!search.request || !myRequests.length) return;
    window.setTimeout(() => {
      document.getElementById("request-card-" + search.request)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 0);
  }, [search.request, myRequests.length]);

  const setRequestStatus = useMutation({
    mutationFn: async (vars: { id: string; status: "cancelled" | "fulfilled" }) => {
      const { error } = await supabase.rpc(
        "set_property_request_status" as never,
        { _request_id: vars.id, _status: vars.status } as never,
      );
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast.success(vars.status === "fulfilled" ? "تم تسجيل الطلب كمكتمل" : "تم حذف الطلب من الطلبات النشطة");
      void qc.invalidateQueries({ queryKey: ["requests-page"] });
      void qc.invalidateQueries({ queryKey: ["open-requests"] });
      void qc.invalidateQueries({ queryKey: ["unread-notifications"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "تعذّر تحديث الطلب"),
  });

  const setOfferStatus = useMutation({
    mutationFn: async (vars: { id: string; status: "accepted" | "rejected" }) => {
      const { error } = await supabase.rpc(
        "respond_property_offer" as never,
        { _offer_id: vars.id, _status: vars.status } as never,
      );
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast.success(vars.status === "accepted" ? "تم قبول العرض وإكمال الطلب" : "تم رفض العرض");
      void qc.invalidateQueries({ queryKey: ["requests-page"] });
      void qc.invalidateQueries({ queryKey: ["unread-notifications"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "تعذّر تحديث العرض"),
  });

  const activeSent = myRequests.filter((request) => request.status === "active").length;
  const receivedCount = receivedOffers.filter(
    (offer) => offer.status === "sent",
  ).length;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <AppHeader showSearch={false} />
      <main className="flex-1 space-y-4 px-4 py-4">
        <div>
          <h1 className="font-display text-xl font-extrabold">الطلبات</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            طلباتك المرسلة والعروض التي تستقبلها من المكاتب.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-surface p-1.5 ring-1 ring-line">
          <Tab active={tab === "sent"} label="المرسلة" count={activeSent} onClick={() => setTab("sent")} />
          <Tab active={tab === "received"} label="مستلم" count={receivedCount} onClick={() => setTab("received")} />
        </div>

        {isLoading ? (
          <ListSkeleton />
        ) : tab === "sent" ? (
          (() => {
            const activeRequests = myRequests.filter((request) => request.status === "active");
            const historyRequests = myRequests.filter((request) => request.status !== "active");

            if (!myRequests.length) {
              return (
                <EmptyState
                  icon={ClipboardList}
                  title="لا توجد طلبات مرسلة"
                  description="ابدأ بنشر طلب عقاري ليصل إلى المكاتب الموثقة."
                />
              );
            }

            return (
              <div className="space-y-5">
                {activeRequests.length > 0 && (
                  <section>
                    <div className="mb-2 flex items-center justify-between">
                      <h2 className="font-display text-sm font-extrabold">الطلبات النشطة</h2>
                      <span className="text-[11px] text-muted-foreground">
                        {activeRequests.length} طلب
                      </span>
                    </div>
                    <div className="space-y-3">
                      {activeRequests.map((request) => (
                        <RequestCard
                          key={request.id}
                          request={request}
                          highlighted={search.request === request.id}
                          pending={setRequestStatus.isPending}
                          onStatus={(status) => setRequestStatus.mutate({ id: request.id, status })}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {historyRequests.length > 0 && (
                  <section className="border-t border-line pt-5">
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <h2 className="font-display text-sm font-extrabold">سجل الطلبات</h2>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          الطلبات المنتهية والمكتملة والملغاة
                        </p>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {historyRequests.length} طلب
                      </span>
                    </div>
                    <div className="space-y-3">
                      {historyRequests.map((request) => (
                        <RequestCard
                          key={request.id}
                          request={request}
                          highlighted={search.request === request.id}
                          pending={setRequestStatus.isPending}
                          onStatus={(status) => setRequestStatus.mutate({ id: request.id, status })}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            );
          })()
        ) : receivedOffers.length ? (
          <div className="space-y-3">
            {receivedOffers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                pending={setOfferStatus.isPending}
                onStatus={(status) => setOfferStatus.mutate({ id: offer.id, status })}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={ClipboardList}
            title="لا توجد عروض مستقبلة"
            description="عندما يرد مكتب على أحد طلباتك سيظهر العرض هنا."
          />
        )}

        <a
          href="/request"
          className="block w-full rounded-2xl bg-terracotta py-3.5 text-center text-sm font-display font-bold text-background"
        >
          نشر طلب عقاري جديد
        </a>
      </main>
      <BottomNav />
    </div>
  );
}

function Tab({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold",
        active ? "bg-forest text-background" : "text-muted-foreground",
      )}
    >
      <span>{label}</span>
      {count > 0 && (
        <span
          className={cn(
            "min-w-5 rounded-full px-1.5 py-0.5 text-[10px] leading-none",
            active ? "bg-background text-forest" : "bg-terracotta text-background",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function RequestCard({
  request,
  highlighted,
  pending,
  onStatus,
}: {
  request: RequestRow;
  highlighted: boolean;
  pending: boolean;
  onStatus: (status: "cancelled" | "fulfilled") => void;
}) {
  const status = request.status;
  const isActive = status === "active";
  const offerCount = request.office_offers?.length ?? 0;

  return (
    <div
      id={"request-card-" + request.id}
      className={cn(
        "rounded-3xl bg-surface p-4 ring-1 ring-line",
        highlighted && "ring-2 ring-forest",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-display text-sm font-extrabold">
            {PROPERTY_KINDS.find((k) => k.value === request.kind)?.label ?? "عقار"} ·{" "}
            {LISTING_TYPES.find((l) => l.value === request.listing)?.label ?? "طلب"}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {formatDate(request.created_at)}
            {request.expires_at ? " · ينتهي " + formatDate(request.expires_at) : ""}
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold",
            status === "fulfilled"
              ? "bg-forest-soft text-forest"
              : status === "cancelled"
                ? "bg-terracotta-soft text-terracotta"
                : status === "expired"
                  ? "bg-sand text-muted-foreground"
                  : "bg-forest-soft text-forest",
          )}
        >
          {REQUEST_STATUS[status] ?? status}
        </span>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
        {request.description}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Info label="الميزانية">
          {request.budget_min != null || request.budget_max != null
            ? formatPrice(request.budget_min) + " - " + formatPrice(request.budget_max) + " ر.س"
            : "غير محددة"}
        </Info>
        <Info label="المساحة">
          {request.area_min != null ? "من " + request.area_min + " م²" : "غير محددة"}
        </Info>
        <Info label="الحي">{request.neighborhood || "أي حي"}</Info>
        <Info label="العروض">{offerCount}</Info>
      </div>

      {isActive && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onStatus("fulfilled")}
            disabled={pending}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-forest py-2.5 text-xs font-bold text-background disabled:opacity-50"
          >
            <CheckCircle2 className="size-4" /> طلب مكتمل
          </button>
          <button
            type="button"
            onClick={() => onStatus("cancelled")}
            disabled={pending}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-terracotta-soft py-2.5 text-xs font-bold text-terracotta disabled:opacity-50"
          >
            <Trash2 className="size-4" /> حذف الطلب
          </button>
        </div>
      )}
    </div>
  );
}

function OfferCard({
  offer,
  pending,
  open,
  onToggle,
  onStatus,
}: {
  offer: OfferRow;
  pending: boolean;
  open: boolean;
  onToggle: () => void;
  onStatus: (status: "accepted" | "rejected") => void;
}) {
  const office = offer.offices;
  const canRespond = offer.status === "sent" && offer.requestStatus === "active";

  return (
    <div className="rounded-3xl bg-surface p-4 ring-1 ring-line">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-start gap-3 text-right"
      >
        <div className="min-w-0 flex-1">
          <div className="font-display text-sm font-extrabold">
            {office?.name ?? "مكتب عقاري"}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            عرض على طلبك · {formatDate(offer.created_at)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-forest">
            <span>{open ? "إخفاء بيانات الاتصال" : "فتح الكارت لعرض بيانات الاتصال"}</span>
            <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold",
            offer.status === "accepted"
              ? "bg-forest-soft text-forest"
              : offer.status === "rejected"
                ? "bg-terracotta-soft text-terracotta"
                : offer.status === "completed"
                  ? "bg-forest-soft text-forest"
                  : "bg-sand text-muted-foreground",
          )}
        >
          {offer.status === "sent"
            ? "جديد"
            : offer.status === "accepted"
              ? "مقبول"
              : offer.status === "rejected"
                ? "مرفوض"
                : offer.status === "completed"
                  ? "مكتمل"
                  : offer.status}
        </span>
      </button>

      <div className="mt-3 rounded-2xl bg-background p-3 ring-1 ring-line">
        <div className="text-[10px] font-semibold text-muted-foreground">طلبك</div>
        <div className="mt-1 text-sm font-bold">
          {PROPERTY_KINDS.find((k) => k.value === offer.requestKind)?.label ?? "عقار"} ·{" "}
          {LISTING_TYPES.find((l) => l.value === offer.requestListing)?.label ?? "طلب"}
        </div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {offer.requestDescription}
        </p>
      </div>

      {offer.message && (
        <p className="mt-3 whitespace-pre-wrap rounded-2xl bg-sand p-3 text-sm leading-6 text-muted-foreground">
          {offer.message}
        </p>
      )}

      {offer.price != null && (
        <div className="mt-2 text-lg font-display font-extrabold text-forest">
          {formatPrice(offer.price)} <span className="text-sm">ر.س</span>
        </div>
      )}

      {offer.properties?.title && (
        <div className="mt-2 rounded-xl bg-forest-soft p-2.5 text-xs font-semibold text-forest">
          العقار المقترح: {offer.properties.title}
        </div>
      )}

      {canRespond && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onStatus("accepted")}
            disabled={pending}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-forest py-2.5 text-xs font-bold text-background disabled:opacity-50"
          >
            <CheckCircle2 className="size-4" /> قبول العرض
          </button>
          <button
            type="button"
            onClick={() => onStatus("rejected")}
            disabled={pending}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-terracotta-soft py-2.5 text-xs font-bold text-terracotta disabled:opacity-50"
          >
            <XCircle className="size-4" /> رفض
          </button>
        </div>
      )}

      {open && (
        <div className="mt-3 space-y-3 rounded-2xl bg-background p-3 ring-1 ring-line">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-semibold text-muted-foreground">رقم الاتصال الذي أضافه المكتب</div>
              <div className="mt-1 text-sm font-extrabold" dir="ltr">
                {office?.phone || "المكتب لم يضف رقم اتصال"}
              </div>
            </div>
            {office?.phone && (
              <button
                type="button"
                onClick={async (event) => {
                  event.stopPropagation();
                  try {
                    await navigator.clipboard.writeText(office.phone!);
                    toast.success("تم نسخ رقم الاتصال");
                  } catch {
                    toast.error("تعذّر نسخ رقم الاتصال");
                  }
                }}
                className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface text-forest ring-1 ring-line"
                aria-label="نسخ رقم الاتصال"
                title="نسخ الرقم"
              >
                <Copy className="size-4" />
              </button>
            )}
          </div>

          {(office?.phone || office?.whatsapp) && (
            <div className="grid grid-cols-2 gap-2">
              {office?.phone && (
                <a
                  href={"tel:" + office.phone}
                  onClick={(event) => event.stopPropagation()}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-surface py-2.5 text-xs font-bold text-forest ring-1 ring-line"
                >
                  <Phone className="size-3.5" /> اتصال
                </a>
              )}
              {office?.whatsapp && (
                <a
                  href={whatsappHref(
                    office.whatsapp,
                    "مرحبًا، بخصوص العرض الذي أرسلتموه على طلبي العقاري",
                  )}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => event.stopPropagation()}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-sand py-2.5 text-xs font-bold"
                >
                  واتساب
                </a>
              )}
            </div>
          )}

          {!office?.phone && !office?.whatsapp && (
            <div className="rounded-xl bg-sand px-3 py-2.5 text-xs font-semibold text-muted-foreground">
              المكتب لم يضف رقم اتصال أو واتساب.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-background p-3 ring-1 ring-line">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="mt-1 text-xs font-bold">{children}</div>
    </div>
  );
}
