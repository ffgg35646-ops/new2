import { RoleGuard } from "@/lib/role-guard";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ClipboardList, Copy, Phone, XCircle } from "lucide-react";
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
    offer: typeof search.offer === "string" ? search.offer : undefined,
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
    const targetId = search.offer
      ? "offer-card-" + search.offer
      : search.request
        ? "request-card-" + search.request
        : null;
    if (!targetId || !myRequests.length) return;
    window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 0);
  }, [search.offer, search.request, myRequests.length, tab]);

  const setRequestStatus = useMutation({
    mutationFn: async (vars: { id: string; status: "cancelled" | "fulfilled" }) => {
      const { error } = await supabase.rpc(
        "set_property_request_status" as never,
        { _request_id: vars.id, _status: vars.status } as never,
      );
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast.success(vars.status === "fulfilled" ? "تم إنهاء الطلب ونقله إلى سجل الطلبات" : "تم إلغاء الطلب");
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
  const receivedCount = receivedOffers.length;

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
          <Tab active={tab === "received"} label="الطلبات المستلمة" count={receivedCount} onClick={() => setTab("received")} />
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
                contactOpen={openOfferId === offer.id}
                onContactToggle={() =>
                  setOpenOfferId((current) => (current === offer.id ? null : offer.id))
                }
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
          {status === "fulfilled" ? "منتهي" : (REQUEST_STATUS[status] ?? status)}
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
        <button
          type="button"
          onClick={() => onStatus("fulfilled")}
          disabled={pending}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-terracotta py-2.5 text-xs font-bold text-background disabled:opacity-50"
        >
          <CheckCircle2 className="size-4" /> إنهاء الطلب
        </button>
      )}
    </div>
  );
}

function OfferCard({
  offer,
  pending,
  contactOpen,
  onContactToggle,
  onStatus,
}: {
  offer: OfferRow;
  pending: boolean;
  contactOpen: boolean;
  onContactToggle: () => void;
  onStatus: (status: "accepted" | "rejected") => void;
}) {
  const office = offer.offices;
  const canRespond = offer.status === "sent" && offer.requestStatus === "active";

  return (
    <div
      id={"offer-card-" + offer.id}
      className="rounded-3xl bg-surface p-4 ring-1 ring-line"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-display text-sm font-extrabold">
            {office?.name ?? "مكتب عقاري"}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            عرض على طلبك · {formatDate(offer.created_at)}
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
      </div>

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

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onContactToggle();
          }}
          aria-expanded={contactOpen}
          aria-label="عرض رقم الاتصال"
          title="اتصال"
          className={cn(
            "grid size-10 place-items-center rounded-xl ring-1 ring-line",
            contactOpen ? "bg-forest-soft text-forest" : "bg-surface text-forest",
          )}
        >
          <Phone className="size-4" />
        </button>

        <a
          href={whatsappHref(
            office?.whatsapp || office?.phone,
            "مرحبًا، بخصوص العرض الذي أرسلتموه على طلبي العقاري",
          )}
          target="_blank"
          rel="noreferrer"
          onClick={(event) => event.stopPropagation()}
          aria-label="واتساب"
          title="واتساب"
          className="grid size-10 place-items-center rounded-xl bg-sand"
        >
          <WhatsAppIcon className="size-5" />
        </a>
      </div>

      {contactOpen && (
        <div className="mt-3 rounded-2xl bg-background p-3 ring-1 ring-line">
          <div className="text-[10px] font-semibold text-muted-foreground">
            رقم الاتصال الذي أضافه المكتب
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className="min-w-0 flex-1 text-sm font-extrabold" dir="ltr">
              {office?.phone || "المكتب لم يضع رقم الاتصال"}
            </div>

            {office?.phone && (
              <button
                type="button"
                onClick={async (event) => {
                  event.stopPropagation();
                  try {
                    if (navigator.clipboard?.writeText) {
                      await navigator.clipboard.writeText(office.phone!);
                    } else {
                      const input = document.createElement("textarea");
                      input.value = office.phone!;
                      input.setAttribute("readonly", "");
                      input.style.position = "fixed";
                      input.style.opacity = "0";
                      document.body.appendChild(input);
                      input.select();
                      const copied = document.execCommand("copy");
                      document.body.removeChild(input);
                      if (!copied) throw new Error("copy_failed");
                    }
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
        </div>
      )}
    </div>
  );
}

function WhatsAppIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("fill-current", className)}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.198.297-.767.966-.94 1.164-.173.198-.347.223-.644.075-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.075-.792.372-.273.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.077 4.487.71.307 1.263.49 1.694.626.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.268c.001-5.45 4.436-9.884 9.888-9.884a9.83 9.83 0 0 1 6.988 2.898 9.83 9.83 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.89a11.86 11.86 0 0 0 1.595 5.946L.057 24l6.304-1.655a11.88 11.88 0 0 0 5.684 1.448h.005c6.554 0 11.89-5.335 11.893-11.89a11.821 11.821 0 0 0-3.479-8.415" />
    </svg>
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
