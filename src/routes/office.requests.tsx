import { RoleGuard } from "@/lib/role-guard";
import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Loader2, MessageCircle, Phone, Send, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { EmptyState, ListSkeleton } from "@/components/EmptyState";
import {
  BOOKING_STATUS,
  INQUIRY_STATUSES,
  inquiryStatusLabel,
  inquiryTypeLabel,
  kindLabel,
  listingLabel,
} from "@/lib/constants";
import { formatArea, formatDate, formatPrice, timeAgo } from "@/lib/format";
import { notifyWhatsApp } from "@/lib/notify-whatsapp";
import { useMyOffice, whatsappHref } from "@/lib/office";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/office/requests")({
  head: () => ({
    meta: [
      { title: "الطلبات | عقار البطين" },
      {
        name: "description",
        content: "طلبات العملاء على عقارات مكتبك وطلبات البحث العامة وعروضك المرسلة.",
      },
      { property: "og:title", content: "الطلبات | عقار البطين" },
      { property: "og:description", content: "صندوق طلبات المكاتب العقارية في عقار البطين." },
    ],
  }),
  component: () => (
    <RoleGuard allow={["office"]} guestsTo="/auth/office">
      <OfficeRequests />
    </RoleGuard>
  ),
});

function OfficeRequests() {
  const [tab, setTab] = useState<"inbox" | "bookings" | "market">("inbox");
  const { data: membership } = useMyOffice();
  const officeId = membership?.office?.id ?? null;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <AppHeader showSearch={false} />
      <main className="flex-1 space-y-4 px-4 py-4">
        <h1 className="font-display text-xl font-extrabold">الطلبات</h1>

        <div className="flex gap-2">
          <TabButton
            active={tab === "inbox"}
            onClick={() => setTab("inbox")}
            label="طلبات التواصل"
          />
          <TabButton
            active={tab === "bookings"}
            onClick={() => setTab("bookings")}
            label="المعاينات"
          />
          <TabButton
            active={tab === "market"}
            onClick={() => setTab("market")}
            label="طلبات العملاء"
          />
        </div>

        {tab === "inbox" ? (
          <InquiriesInbox officeId={officeId} />
        ) : tab === "bookings" ? (
          <BookingsInbox officeId={officeId} />
        ) : (
          <MarketRequests officeId={officeId} />
        )}
      </main>
      <BottomNav />
    </div>
  );
}

type BookingRow = {
  id: string;
  user_id: string;
  visit_date: string;
  visit_time: string;
  status: string;
  office_note: string | null;
  created_at: string;
  properties: { title: string } | null;
  client?: { full_name: string; phone: string | null } | null;
};

function BookingsInbox({ officeId }: { officeId: string | null }) {
  const qc = useQueryClient();
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["office-bookings", officeId],
    enabled: !!officeId,
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("viewing_bookings")
        .select("id,user_id,visit_date,visit_time,status,office_note,created_at,properties(title)")
        .eq("office_id", officeId!)
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      const bookings = (rows ?? []) as unknown as BookingRow[];
      const ids = [...new Set(bookings.map((b) => b.user_id))];
      if (ids.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id,full_name,phone")
          .in("id", ids);
        const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
        for (const b of bookings) b.client = byId.get(b.user_id) ?? null;
      }
      return bookings;
    },
  });

  const setStatus = useMutation({
    mutationFn: async (vars: { id: string; status: string; note?: string }) => {
      const { error } = await supabase
        .from("viewing_bookings")
        .update({ status: vars.status as never, office_note: vars.note?.trim() || null })
        .eq("id", vars.id);
      if (error) throw error;
      return vars;
    },
    onSuccess: (vars) => {
      notifyWhatsApp("booking_status", vars.id);
      setNoteFor(null);
      setNote("");
      toast.success("تم تحديث حالة الحجز");
      qc.invalidateQueries({ queryKey: ["office-bookings"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "تعذّر تحديث الحجز"),
  });

  if (isLoading) return <ListSkeleton />;
  if (!data?.length)
    return (
      <EmptyState
        icon={ClipboardList}
        title="لا توجد حجوزات معاينة"
        description="ستظهر هنا طلبات معاينة العملاء لعقاراتك."
      />
    );

  return (
    <div className="space-y-2.5">
      {data.map((b) => (
        <div key={b.id} className="rounded-2xl bg-surface p-3.5 ring-1 ring-line">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-bold">{b.properties?.title ?? "عقار"}</span>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                b.status === "accepted"
                  ? "bg-forest-soft text-forest"
                  : b.status === "rejected" || b.status === "cancelled"
                    ? "bg-terracotta-soft text-terracotta"
                    : "bg-sand text-muted-foreground",
              )}
            >
              {BOOKING_STATUS[b.status] ?? b.status}
            </span>
          </div>

          <div className="mt-1 text-xs text-muted-foreground">
            {b.client?.full_name || "عميل"} · {formatDate(b.visit_date)} ·{" "}
            {String(b.visit_time).slice(0, 5)}
          </div>
          {b.client?.phone && (
            <a dir="ltr" href={`tel:${b.client.phone}`} className="mt-1 block text-xs text-forest">
              {b.client.phone}
            </a>
          )}
          {b.office_note && (
            <p className="mt-1.5 rounded-xl bg-sand p-2 text-[11px] text-muted-foreground">
              ملاحظتك: {b.office_note}
            </p>
          )}

          {b.status === "pending" && (
            <>
              {noteFor === b.id && (
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="ملاحظة للعميل (اختياري)"
                  className="mt-2 w-full rounded-xl bg-background px-3 py-2 text-xs ring-1 ring-line"
                />
              )}
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() =>
                    noteFor === b.id
                      ? setStatus.mutate({ id: b.id, status: "accepted", note })
                      : setNoteFor(b.id)
                  }
                  disabled={setStatus.isPending}
                  className="flex-1 rounded-xl bg-forest py-2 text-xs font-bold text-background disabled:opacity-50"
                >
                  {noteFor === b.id ? "تأكيد القبول" : "قبول"}
                </button>
                <button
                  onClick={() => setStatus.mutate({ id: b.id, status: "rejected", note })}
                  disabled={setStatus.isPending}
                  className="flex-1 rounded-xl bg-terracotta-soft py-2 text-xs font-bold text-terracotta disabled:opacity-50"
                >
                  رفض
                </button>
              </div>
            </>
          )}

          {b.status === "accepted" && (
            <button
              onClick={() => setStatus.mutate({ id: b.id, status: "completed" })}
              disabled={setStatus.isPending}
              className="mt-2 w-full rounded-xl bg-sand py-2 text-xs font-bold text-forest disabled:opacity-50"
            >
              تمت المعاينة ✓
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 rounded-full py-2 text-xs font-semibold transition",
        active ? "bg-forest text-background" : "bg-surface text-muted-foreground ring-1 ring-line",
      )}
    >
      {label}
    </button>
  );
}

function InquiriesInbox({ officeId }: { officeId: string | null }) {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["office-inquiries", officeId, filter],
    enabled: !!officeId,
    queryFn: async () => {
      let q = supabase
        .from("property_inquiries")
        .select("*, properties(title,property_number)")
        .eq("office_id", officeId!)
        .order("created_at", { ascending: false })
        .limit(60);
      if (filter !== "all") q = q.eq("status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const setStatus = useMutation({
    mutationFn: async (vars: { id: string; status: string }) => {
      const { error } = await supabase
        .from("property_inquiries")
        .update({ status: vars.status })
        .eq("id", vars.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["office-inquiries"] });
      qc.invalidateQueries({ queryKey: ["new-inquiries-count"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "تعذّر تحديث الحالة"),
  });

  return (
    <div className="space-y-3">
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")} label="الكل" />
        {INQUIRY_STATUSES.map((s) => (
          <FilterChip
            key={s.value}
            active={filter === s.value}
            onClick={() => setFilter(s.value)}
            label={s.label}
          />
        ))}
      </div>

      {isLoading ? (
        <ListSkeleton />
      ) : data?.length ? (
        <div className="space-y-2.5">
          {data.map((q) => {
            const prop = q.properties as { title: string; property_number: string } | null;
            return (
              <div key={q.id} className="space-y-2 rounded-2xl bg-surface p-3.5 ring-1 ring-line">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold">{prop?.title ?? "عقار"}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {prop?.property_number} · {timeAgo(q.created_at)}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-terracotta-soft px-2 py-0.5 text-[10px] font-semibold text-terracotta">
                    {inquiryTypeLabel(q.type)}
                  </span>
                </div>

                <div className="rounded-xl bg-background p-2.5 text-xs ring-1 ring-line">
                  <div className="font-semibold">{q.contact_name}</div>
                  {q.contact_phone && (
                    <div className="text-muted-foreground">{q.contact_phone}</div>
                  )}
                  {q.message && (
                    <p className="mt-1 leading-relaxed text-muted-foreground">{q.message}</p>
                  )}
                </div>

                {q.contact_phone && (
                  <div className="flex gap-2">
                    <a
                      href={`tel:${q.contact_phone}`}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-forest py-2 text-xs font-bold text-background"
                    >
                      <Phone className="size-3.5" /> اتصال
                    </a>
                    <a
                      href={whatsappHref(q.contact_phone, `مرحبًا ${q.contact_name}`)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-sand py-2 text-xs font-bold"
                    >
                      <MessageCircle className="size-3.5" /> واتساب
                    </a>
                  </div>
                )}

                <select
                  value={q.status}
                  onChange={(e) => setStatus.mutate({ id: q.id, status: e.target.value })}
                  className="w-full rounded-xl bg-background px-3 py-2 text-xs ring-1 ring-line outline-none focus:ring-forest"
                >
                  {INQUIRY_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {inquiryStatusLabel(s.value)}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title="لا توجد طلبات على عقاراتك"
          description="ستصل هنا طلبات المعاينة والشراء والاستفسار من العملاء."
        />
      )}
    </div>

    {details && (
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3"
        role="dialog"
        aria-modal="true"
        aria-label="تفاصيل طلب العميل"
        onClick={() => setDetailsId(null)}
      >
        <div
          className="w-full max-w-md max-h-[88vh] overflow-y-auto rounded-[28px] bg-surface p-4 shadow-2xl ring-1 ring-line"
          onClick={(event) => event.stopPropagation()}
          dir="rtl"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-semibold text-muted-foreground">
                تفاصيل طلب العميل
              </div>
              <h2 className="mt-1 font-display text-lg font-extrabold">
                {kindLabel(details.kind)} · {listingLabel(details.listing)}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setDetailsId(null)}
              className="grid size-9 shrink-0 place-items-center rounded-full bg-background ring-1 ring-line"
              aria-label="إغلاق"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            <section className="rounded-2xl bg-background p-3.5 ring-1 ring-line">
              <div className="text-[10px] font-semibold text-muted-foreground">العميل</div>
              <div className="mt-1 text-sm font-extrabold">{details.client_name}</div>
              {details.client_phone && (
                <div className="mt-1 text-xs text-muted-foreground">
                  {details.client_phone}
                </div>
              )}
            </section>

            <section className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-background p-3 ring-1 ring-line">
                <div className="text-[10px] text-muted-foreground">نوع العقار</div>
                <div className="mt-1 text-sm font-bold">{kindLabel(details.kind)}</div>
              </div>
              <div className="rounded-2xl bg-background p-3 ring-1 ring-line">
                <div className="text-[10px] text-muted-foreground">نوع الطلب</div>
                <div className="mt-1 text-sm font-bold">{listingLabel(details.listing)}</div>
              </div>
              <div className="rounded-2xl bg-background p-3 ring-1 ring-line">
                <div className="text-[10px] text-muted-foreground">المحافظة</div>
                <div className="mt-1 text-sm font-bold">{details.governorate_name || "—"}</div>
              </div>
              <div className="rounded-2xl bg-background p-3 ring-1 ring-line">
                <div className="text-[10px] text-muted-foreground">الحي</div>
                <div className="mt-1 text-sm font-bold">{details.neighborhood || "أي حي"}</div>
              </div>
              <div className="rounded-2xl bg-background p-3 ring-1 ring-line">
                <div className="text-[10px] text-muted-foreground">الميزانية</div>
                <div className="mt-1 text-sm font-bold">
                  {details.budget_min || details.budget_max
                    ? formatPrice(details.budget_min) + " - " + formatPrice(details.budget_max) + " ر.س"
                    : "غير محددة"}
                </div>
              </div>
              <div className="rounded-2xl bg-background p-3 ring-1 ring-line">
                <div className="text-[10px] text-muted-foreground">المساحة</div>
                <div className="mt-1 text-sm font-bold">
                  {details.area_min ? "من " + formatArea(details.area_min) : "غير محددة"}
                </div>
              </div>
            </section>

            <section className="rounded-2xl bg-background p-3.5 ring-1 ring-line">
              <div className="text-[10px] font-semibold text-muted-foreground">وصف الطلب</div>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-7">
                {details.description || "لا يوجد وصف إضافي."}
              </p>
            </section>

            {details.attachment_url && (
              <a
                href={details.attachment_url}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center rounded-2xl bg-sand py-3 text-sm font-bold text-forest"
              >
                فتح المرفق المضاف
              </a>
            )}

            <div className="text-[11px] leading-6 text-muted-foreground">
              نُشر الطلب: {formatDate(details.created_at)} · آخر موعد: {details.expires_at ? formatDate(details.expires_at) : "غير محدد"} · {details.views_count} مشاهدة
            </div>

            {details.client_phone && (
              <div className="flex gap-2">
                <a
                  href={"tel:" + details.client_phone}
                  className="flex-1 rounded-2xl bg-forest py-3.5 text-center text-sm font-bold text-background"
                >
                  <Phone className="mx-auto mb-1 size-4" />
                  اتصال
                </a>
                <a
                  href={whatsappHref(details.client_phone, "مرحبًا " + details.client_name + "، بخصوص طلب العقار")}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 rounded-2xl bg-sand py-3.5 text-center text-sm font-bold"
                >
                  <MessageCircle className="mx-auto mb-1 size-4" />
                  واتساب
                </a>
              </div>
            )}

            {!details.offer_sent && (
              <button
                type="button"
                onClick={() => {
                  setDetailsId(null);
                  setOpenId(details.id);
                }}
                className="w-full rounded-2xl bg-terracotta py-3.5 text-sm font-bold text-background"
              >
                إرسال عرض للعميل
              </button>
            )}
          </div>
        </div>
      </div>
    )}
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
        active
          ? "bg-terracotta text-background"
          : "bg-surface text-muted-foreground ring-1 ring-line",
      )}
    >
      {label}
    </button>
  );
}

function MarketRequests({ officeId }: { officeId: string | null }) {
  const qc = useQueryClient();
  const { data: membership } = useMyOffice();
  const officeGovernorateId = membership?.office?.governorate_id ?? null;
  const [openId, setOpenId] = useState<string | null>(null);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [price, setPrice] = useState("");
  const viewed = useRef(new Set<string>());

  const { data, isLoading } = useQuery({
    queryKey: ["open-requests", officeId, officeGovernorateId],
    enabled: !!officeId && !!officeGovernorateId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        "office_market_requests" as never,
      );

      if (error) throw error;

      return (data ?? []) as Array<{
        id: string;
        user_id: string;
        kind: string;
        listing: string;
        governorate_name: string | null;
        neighborhood: string | null;
        budget_min: number | null;
        budget_max: number | null;
        area_min: number | null;
        description: string;
        attachment_url: string | null;
        views_count: number;
        created_at: string | null;
        expires_at: string | null;
        offer_sent: boolean;
        client_name: string;
        client_phone: string | null;
      }>;
    },
  });
  const sendOffer = useMutation({
    mutationFn: async (requestId: string) => {
      if (!officeId) throw new Error("مكتبك غير متاح");
      if (message.trim().length < 5) throw new Error("اكتب رسالة العرض");
      const { data: offer, error } = await supabase
        .from("office_offers")
        .insert({
          request_id: requestId,
          office_id: officeId,
          message: message.trim(),
          price: price ? Number(price) : null,
        })
        .select("id")
        .single();

      if (error) throw error;

      if (offer?.id) {
        const { error: notifyError } = await supabase.rpc(
          "notify_new_property_offer" as never,
          { _offer_id: offer.id } as never,
        );

        if (notifyError) {
          console.warn(
            "[office-requests] customer notification failed",
            notifyError,
          );
        }
      }
    },
    onSuccess: () => {
      toast.success("تم إرسال عرضك للعميل");
      setOpenId(null);
      setMessage("");
      setPrice("");
      qc.invalidateQueries({ queryKey: ["open-requests"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "تعذّر إرسال العرض"),
  });

  if (isLoading) return <ListSkeleton />;
  if (!data?.length) return <EmptyState icon={ClipboardList} title="لا توجد طلبات نشطة حاليًا" />;

  const details = data.find((request) => request.id === detailsId) ?? null;

  return (
    <div className="space-y-2.5">
      {data.map((r) => {
        const sent = r.offer_sent;
        return (
          <div key={r.id} className="rounded-2xl bg-surface p-3.5 ring-1 ring-line">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">
                {kindLabel(r.kind)} · {listingLabel(r.listing)}
              </span>
              <span className="text-[10px] text-muted-foreground">{timeAgo(r.created_at)}</span>
            </div>
            <div className="mt-2 rounded-xl bg-background p-3 ring-1 ring-line">
              <div className="text-xs font-bold">{r.client_name}</div>
              {r.client_phone && (
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  {r.client_phone}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setDetailsId(r.id)}
              className="mt-2.5 flex w-full items-center justify-between rounded-xl bg-forest-soft px-3 py-2.5 text-xs font-bold text-forest"
            >
              <span>عرض تفاصيل الطلب كاملة</span>
              <span>‹</span>
            </button>

            <p className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-2">{r.description}</p>
            <div className="mt-1.5 text-[11px] text-muted-foreground">
              {r.neighborhood ? r.neighborhood + " · " : ""}
              {r.area_min ? "من " + formatArea(r.area_min) + " · " : ""}
              {r.budget_min || r.budget_max
                ? formatPrice(r.budget_min) + " - " + formatPrice(r.budget_max) + " ر.س"
                : "بدون ميزانية محددة"}
            </div>

            {r.client_phone && (
              <div className="mt-2 flex gap-2">
                <a
                  href={"tel:" + r.client_phone}
                  className="flex-1 rounded-xl bg-forest py-2.5 text-center text-xs font-bold text-background"
                >
                  <Phone className="mx-auto mb-1 size-3.5" />
                  اتصال بالعميل
                </a>
                <a
                  href={whatsappHref(r.client_phone, "مرحبًا " + r.client_name + "، بخصوص طلب العقار")}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 rounded-xl bg-sand py-2.5 text-center text-xs font-bold"
                >
                  <MessageCircle className="mx-auto mb-1 size-3.5" />
                  واتساب
                </a>
              </div>
            )}

            {sent ? (
              <div className="mt-2.5 rounded-xl bg-forest-soft py-2 text-center text-xs font-semibold text-forest">
                تم إرسال عرضك
              </div>
            ) : openId === r.id ? (
              <div className="mt-2.5 space-y-2">
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="اكتب تفاصيل العرض المناسب للعميل"
                  className="w-full rounded-xl bg-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest"
                />
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="السعر المقترح (اختياري)"
                  className="w-full rounded-xl bg-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest"
                />
                <button
                  onClick={() => sendOffer.mutate(r.id)}
                  disabled={sendOffer.isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-forest py-2.5 text-sm font-bold text-background disabled:opacity-60"
                >
                  {sendOffer.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  إرسال العرض
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setOpenId(r.id);

                  if (!viewed.current.has(r.id)) {
                    viewed.current.add(r.id);
                    void supabase.rpc(
                      "mark_property_request_view" as never,
                      { _request_id: r.id } as never,
                    );
                  }
                }}
                className="mt-2.5 w-full rounded-xl bg-terracotta py-2.5 text-sm font-bold text-background"
              >
                إرسال عرض
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
