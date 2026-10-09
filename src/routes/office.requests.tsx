import { RoleGuard } from "@/lib/role-guard";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Copy,
  Clock3,
  Loader2,
  MapPin,
  Pencil,
  Phone,
  Ruler,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { PaginationControls } from "@/components/PaginationControls";
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
import { CancelReasonModal } from "@/components/CancelReasonModal";
import { formatBookingTime, isSaudiAppointmentStarted, isSaudiAppointmentToday } from "@/lib/saudi-time";

export const Route = createFileRoute("/office/requests")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab:
      search.tab === "inbox" ||
      search.tab === "bookings" ||
      search.tab === "market" ||
      search.tab === "sent"
        ? search.tab
        : undefined,
  }),
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
  const search = Route.useSearch();
  const [tab, setTab] = useState<"inbox" | "bookings" | "market" | "sent">(
    search.tab ?? "inbox",
  );

  useEffect(() => {
    if (search.tab) setTab(search.tab);
  }, [search.tab]);
  const { data: membership } = useMyOffice();
  const officeId = membership?.office?.id ?? null;
  const officeGovernorateId = membership?.office?.governorate_id ?? null;

  const { data: marketRequests = [] } = useQuery({
    queryKey: ["open-requests", officeId, officeGovernorateId],
    enabled: !!officeId && !!officeGovernorateId,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        "office_market_requests" as never,
      );

      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: bookingsCount = 0 } = useQuery({
    queryKey: ["office-bookings-tab-count", officeId],
    enabled: !!officeId,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("viewing_bookings")
        .select("id", { count: "exact", head: true })
        .eq("office_id", officeId!);

      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: inquiriesCount = 0 } = useQuery({
    queryKey: ["office-inquiries-tab-count", officeId],
    enabled: !!officeId,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("property_inquiries")
        .select("id", { count: "exact", head: true })
        .eq("office_id", officeId!);

      if (error) throw error;
      return count ?? 0;
    },
  });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <AppHeader showSearch={false} />
      <main className="flex-1 space-y-4 px-4 py-4">
        <h1 className="font-display text-xl font-extrabold">الطلبات</h1>

        <div className="flex gap-2">
          <TabButton
            active={tab === "bookings"}
            onClick={() => setTab("bookings")}
            label="المعاينات"
            count={bookingsCount}
          />
          <TabButton
            active={tab === "market"}
            onClick={() => setTab("market")}
            label="السوق"
            count={marketRequests.length}
          />
          <TabButton
            active={tab === "inbox"}
            onClick={() => setTab("inbox")}
            label="طلبات التواصل"
            count={inquiriesCount}
          />
          <TabButton
            active={tab === "sent"}
            onClick={() => setTab("sent")}
            label="تاريخ الطلبات"
          />
        </div>

        {tab === "inbox" ? (
          <InquiriesInbox officeId={officeId} />
        ) : tab === "bookings" ? (
          <BookingsInbox officeId={officeId} />
        ) : tab === "market" ? (
          <MarketRequests officeId={officeId} />
        ) : (
          <SentOffers officeId={officeId} />
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
  cancel_reason?: string | null;
  contact_phone?: string | null;
  created_at: string;
  properties: {
    id: string;
    property_number: string;
    title: string;
    price: number | string;
    area: number | string;
    kind: string;
    listing: string;
    neighborhood: string | null;
    cover_url: string | null;
    images_count?: number | null;
    governorates?: { name_ar: string } | null;
  } | null;
  client?: {
    full_name: string;
    phone: string | null;
    governorate_name: string | null;
  } | null;
  completion_reason?: string | null;
};

function BookingsInbox({ officeId }: { officeId: string | null }) {
  const qc = useQueryClient();
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [contactOpenId, setContactOpenId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [officeId]);

  const { data = [], isLoading } = useQuery({
    queryKey: ["office-bookings", officeId],
    enabled: !!officeId,
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("viewing_bookings")
        .select(
          "id,user_id,visit_date,visit_time,status,office_note,cancel_reason,completion_reason,contact_phone,contact_name,contact_governorate_id,created_at,properties(id,property_number,title,price,area,kind,listing,neighborhood,cover_url,images_count,governorates(name_ar))",
        )
        .eq("office_id", officeId!)
        .order("visit_date", { ascending: true })
        .order("visit_time", { ascending: true })
        .limit(100);

      if (error) throw error;

      const bookings = (rows ?? []) as unknown as Array<
        BookingRow & {
          contact_name?: string | null;
          contact_governorate_id?: string | null;
        }
      >;

      const governorateIds = [
        ...new Set(
          bookings
            .map((booking) => booking.contact_governorate_id)
            .filter((id): id is string => typeof id === "string" && !!id),
        ),
      ];

      const { data: governorates, error: governorateError } = governorateIds.length
        ? await supabase
            .from("governorates")
            .select("id,name_ar")
            .in("id", governorateIds)
        : { data: [], error: null };

      if (governorateError) throw governorateError;

      const governorateMap = new Map(
        (governorates ?? []).map((row) => [
          String(row.id),
          String(row.name_ar ?? ""),
        ]),
      );

      for (const booking of bookings) {
        booking.client = {
          full_name: String(booking.contact_name ?? "عميل"),
          phone: booking.contact_phone ? String(booking.contact_phone) : null,
          governorate_name: booking.contact_governorate_id
            ? governorateMap.get(String(booking.contact_governorate_id)) ?? null
            : null,
        };
      }

      const activeBookings = bookings.filter(
        (booking) => booking.status !== "cancelled",
      );
      const cancelledBookings = bookings.filter(
        (booking) => booking.status === "cancelled",
      );
      const todayBookings = activeBookings.filter((booking) =>
        isSaudiAppointmentToday(booking.visit_date),
      );
      const otherBookings = activeBookings.filter(
        (booking) => !isSaudiAppointmentToday(booking.visit_date),
      );

      // Keep cancelled appointments at the bottom, after all non-cancelled bookings.
      return [...todayBookings, ...otherBookings, ...cancelledBookings];
    },
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  const pageSize = 6;
  const pageCount = Math.max(1, Math.ceil(data.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleBookings = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const setStatus = useMutation({
    mutationFn: async (vars: {
      id: string;
      status: "accepted" | "rejected" | "completed" | "cancelled";
      reason?: string;
      note?: string;
    }) => {
      const { error } = await supabase.rpc(
        "set_viewing_booking_status" as never,
        {
          _booking_id: vars.id,
          _status: vars.status,
          _reason: vars.reason ?? "",
        } as never,
      );
      if (error) throw error;

      if (vars.note?.trim()) {
        const { error: noteError } = await supabase
          .from("viewing_bookings")
          .update({ office_note: vars.note.trim() })
          .eq("id", vars.id)
          .eq("office_id", officeId!);
        if (noteError) throw noteError;
      }

      return vars;
    },
    onSuccess: (vars) => {
      if (vars.status === "cancelled") setCancelId(null);
      setNoteFor(null);
      setNote("");
      toast.success(
        vars.status === "cancelled"
          ? "تم إلغاء المعاينة"
          : vars.status === "completed"
            ? "المعاينة انتهت"
            : "تم تحديث حالة الحجز",
      );
      void qc.invalidateQueries({ queryKey: ["office-bookings"] });
      void qc.invalidateQueries({ queryKey: ["unread-notifications"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "تعذّر تحديث الحجز"),
  });

  if (isLoading) return <ListSkeleton />;

  if (!data.length) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="لا توجد حجوزات معاينة"
        description="ستظهر هنا مواعيد العملاء لعقارات مكتبك."
      />
    );
  }

  return (
    <>
      <div className="space-y-2">
        {visibleBookings.map((booking) => {
          const contactPhone = booking.contact_phone || booking.client?.phone;
          const property = booking.properties as {
            id: string;
            property_number: string;
            title: string;
            price: number | string;
            area: number | string;
            kind: string;
            listing: string;
            neighborhood: string | null;
            cover_url: string | null;
            images_count?: number | null;
            governorates?: { name_ar: string } | null;
          } | null;
          return (
            <article
              key={booking.id}
              className="overflow-hidden rounded-2xl bg-surface ring-1 ring-line"
            >
              {property?.id ? (
                <a href={"/properties/" + encodeURIComponent(property.id)} className="block">
                  {property.cover_url ? (
                    <img
                      src={property.cover_url}
                      alt={property.title}
                      className="aspect-[16/9] w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="grid aspect-[16/9] w-full place-items-center bg-sand text-xs text-muted-foreground">
                      لا توجد صورة للعقار
                    </div>
                  )}
                  <div className="p-3">
                    <div className="text-[10px] font-semibold text-muted-foreground">
                      العقار المرتبط بالمعاينة
                    </div>
                    <div className="mt-1 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="font-display text-base font-extrabold leading-6">
                          {property.title || "عقار"}
                        </h2>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                          <span>{property.property_number || "—"}</span>
                          {property.governorates?.name_ar && <span>· {property.governorates.name_ar}</span>}
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-terracotta px-2.5 py-1 text-[10px] font-bold text-background">
                        {listingLabel(property.listing)}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className="font-display text-lg font-extrabold text-forest">
                        {formatPrice(property.price)} <span className="text-xs">ر.س</span>
                      </div>
                      <span className="rounded-full bg-sand px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
                        {kindLabel(property.kind)}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-2xl bg-background p-3 ring-1 ring-line">
                        <div className="text-[10px] text-muted-foreground">الحي</div>
                        <div className="mt-1 flex items-center gap-1.5 text-xs font-bold">
                          <MapPin className="size-3.5 text-terracotta" />
                          {property.neighborhood || "—"}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-background p-3 ring-1 ring-line">
                        <div className="text-[10px] text-muted-foreground">المساحة</div>
                        <div className="mt-1 flex items-center gap-1.5 text-xs font-bold">
                          <Ruler className="size-3.5 text-terracotta" />
                          {property.area != null ? formatArea(property.area) : "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                </a>
              ) : (
                <div className="p-4">
                  <div className="font-display text-base font-extrabold">العقار</div>
                </div>
              )}

              <div className="border-t border-line p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-semibold text-muted-foreground">موعد المعاينة</div>
                    <div className="mt-1 flex items-center gap-1.5 text-sm font-extrabold">
                      <CalendarDays className="size-4 text-terracotta" />
                      {formatDate(booking.visit_date)}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock3 className="size-3.5" /> الساعة {formatBookingTime(booking.visit_time)}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    {isSaudiAppointmentToday(booking.visit_date) && booking.status === "accepted" && (
                      <span className="rounded-full bg-terracotta px-2.5 py-1 text-[10px] font-bold text-background">
                        معاينة اليوم
                      </span>
                    )}
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[10px] font-semibold",
                        booking.status === "accepted" || booking.status === "completed"
                          ? "bg-forest-soft text-forest"
                          : booking.status === "rejected" || booking.status === "cancelled"
                            ? "bg-terracotta-soft text-terracotta"
                            : "bg-sand text-muted-foreground",
                      )}
                    >
                      {booking.status === "completed"
                        ? "المعاينة انتهت"
                        : BOOKING_STATUS[booking.status] ?? booking.status}
                    </span>
                  </div>
                </div>

                <div className="mt-2 rounded-2xl bg-background p-3 ring-1 ring-line">
                  <div className="flex items-start gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-forest-soft text-forest">
                      <Building2 className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-semibold text-muted-foreground">بيانات العميل المتاحة</div>
                      <div className="mt-1 text-sm font-extrabold">{booking.client?.full_name || "عميل"}</div>
                      {booking.client?.governorate_name && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          المحافظة: {booking.client.governorate_name}
                        </div>
                      )}
                      {contactPhone && (
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setContactOpenId((current) =>
                                current === booking.id ? null : booking.id,
                              )
                            }
                            aria-expanded={contactOpenId === booking.id}
                            aria-label="عرض رقم اتصال العميل"
                            title="اتصال"
                            className={cn(
                              "grid size-10 place-items-center rounded-xl ring-1 ring-line",
                              contactOpenId === booking.id
                                ? "bg-forest-soft text-forest"
                                : "bg-surface text-forest",
                            )}
                          >
                            <Phone className="size-4" />
                          </button>
                          <a
                            href={whatsappHref(
                              contactPhone,
                              `مرحبًا ${booking.client?.full_name || "عميل"}، بخصوص موعد المعاينة`,
                            )}
                            target="_blank"
                            rel="noreferrer"
                            aria-label="واتساب العميل"
                            title="واتساب"
                            className="grid size-10 place-items-center rounded-xl bg-[#25D366]/10 text-[#25D366]"
                          >
                            <WhatsAppIcon className="size-5 text-[#25D366]" />
                          </a>
                        </div>
                      )}
                      {contactPhone && contactOpenId === booking.id && (
                        <div className="mt-2 rounded-2xl bg-background p-3 ring-1 ring-line">
                          <div className="text-[10px] font-semibold text-muted-foreground">
                            رقم الاتصال الذي أضافه العميل
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <div className="min-w-0 flex-1 text-sm font-extrabold" dir="ltr">
                              {contactPhone}
                            </div>
                            <button
                              type="button"
                              onClick={() => void copyContactPhone(contactPhone)}
                              className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface text-forest ring-1 ring-line"
                              aria-label="نسخ رقم اتصال العميل"
                              title="نسخ الرقم"
                            >
                              <Copy className="size-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {booking.office_note && (
                  <p className="mt-2 rounded-2xl bg-sand p-3 text-[11px] leading-6 text-muted-foreground">
                    ملاحظتك: {booking.office_note}
                  </p>
                )}

                {booking.cancel_reason && booking.status === "cancelled" && (
                  <p className="mt-2 rounded-2xl bg-terracotta-soft p-3 text-xs leading-6 text-terracotta">
                    سبب الإلغاء: {booking.cancel_reason}
                  </p>
                )}

                {booking.completion_reason && booking.status === "completed" && (
                  <p className="mt-2 rounded-2xl bg-forest-soft p-3 text-xs leading-6 text-forest">
                    <span className="font-bold">سبب إنهاء المعاينة:</span>{" "}
                    {booking.completion_reason}
                  </p>
                )}

                {booking.status === "pending" && (
                  <>
                    {noteFor === booking.id && (
                      <input
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder="ملاحظة للعميل (اختياري)"
                        className="mt-3 w-full rounded-xl bg-background px-3 py-2.5 text-xs ring-1 ring-line outline-none focus:ring-forest"
                      />
                    )}
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          noteFor === booking.id
                            ? setStatus.mutate({
                                id: booking.id,
                                status: "accepted",
                                note,
                              })
                            : setNoteFor(booking.id)
                        }
                        disabled={setStatus.isPending}
                        className="rounded-xl bg-forest py-2.5 text-xs font-bold text-background disabled:opacity-50"
                      >
                        {noteFor === booking.id ? "تأكيد القبول" : "قبول"}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setStatus.mutate({
                            id: booking.id,
                            status: "rejected",
                            note,
                          })
                        }
                        disabled={setStatus.isPending}
                        className="rounded-xl bg-terracotta-soft py-2.5 text-xs font-bold text-terracotta disabled:opacity-50"
                      >
                        رفض
                      </button>
                    </div>
                  </>
                )}

                {(booking.status === "pending" || booking.status === "accepted") && (
                  <button
                    type="button"
                    onClick={() => setCancelId(booking.id)}
                    disabled={setStatus.isPending}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-terracotta-soft py-2.5 text-xs font-bold text-terracotta disabled:opacity-50"
                  >
                    <XCircle className="size-4" /> إلغاء المعاينة
                  </button>
                )}

                {booking.status === "accepted" &&
                  !isSaudiAppointmentToday(booking.visit_date) &&
                  isSaudiAppointmentStarted(booking.visit_date, booking.visit_time) && (
                    <button
                      type="button"
                      onClick={() =>
                        setStatus.mutate({
                          id: booking.id,
                          status: "completed",
                        })
                      }
                      disabled={setStatus.isPending}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-forest py-2.5 text-xs font-bold text-background disabled:opacity-50"
                    >
                      <CheckCircle2 className="size-4" /> إنهاء المعاينة
                    </button>
                  )}
              </div>
            </article>
          );
        })}
      </div>
      <PaginationControls
        page={currentPage}
        total={data.length}
        pageSize={pageSize}
        onPageChange={setPage}
      />

      <CancelReasonModal
        open={!!cancelId}
        pending={setStatus.isPending}
        onClose={() => {
          if (!setStatus.isPending) setCancelId(null);
        }}
        onConfirm={(reason) => {
          if (cancelId) {
            setStatus.mutate({
              id: cancelId,
              status: "cancelled",
              reason,
            });
          }
        }}
      />
    </>
  );
}


function TabButton({
  label,
  active,
  onClick,
  count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 rounded-full py-2 text-xs font-semibold transition",
        active ? "bg-forest text-background" : "bg-surface text-muted-foreground ring-1 ring-line",
      )}
    >
      <span>{label}</span>
      {count != null && count > 0 && (
        <span className="min-w-5 rounded-full bg-terracotta px-1.5 py-0.5 text-[10px] font-extrabold leading-none text-background">
          {count}
        </span>
      )}
    </button>
  );
}

function InquiriesInbox({ officeId }: { officeId: string | null }) {
  const qc = useQueryClient();
  const [contactOpenId, setContactOpenId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [officeId]);

  const { data, isLoading } = useQuery({
    queryKey: ["office-inquiries", officeId],
    enabled: !!officeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_inquiries")
        .select("*, properties(title,property_number)")
        .eq("office_id", officeId!)
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  const rows = data ?? [];
  const pageSize = 6;
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleInquiries = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
      {isLoading ? (
        <ListSkeleton />
      ) : data?.length ? (
        <>
        <div className="space-y-2">
          {visibleInquiries.map((q) => {
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
                  {q.message && (
                    <p className="mt-1 leading-relaxed text-muted-foreground">{q.message}</p>
                  )}
                </div>

                {q.contact_phone && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setContactOpenId((current) =>
                          current === q.id ? null : String(q.id),
                        )
                      }
                      aria-expanded={contactOpenId === q.id}
                      aria-label="عرض رقم اتصال العميل"
                      title="اتصال"
                      className={cn(
                        "grid size-10 place-items-center rounded-xl ring-1 ring-line",
                        contactOpenId === q.id
                          ? "bg-forest-soft text-forest"
                          : "bg-surface text-forest",
                      )}
                    >
                      <Phone className="size-4" />
                    </button>
                    <a
                      href={whatsappHref(q.contact_phone, `مرحبًا ${q.contact_name}`)}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="واتساب العميل"
                      title="واتساب"
                      className="grid size-10 place-items-center rounded-xl bg-[#25D366]/10 text-[#25D366]"
                    >
                      <WhatsAppIcon className="size-5 text-[#25D366]" />
                    </a>
                  </div>
                )}

                {q.contact_phone && contactOpenId === q.id && (
                  <div className="rounded-2xl bg-background p-3 ring-1 ring-line">
                    <div className="text-[10px] font-semibold text-muted-foreground">
                      رقم الاتصال الذي أضافه العميل
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="min-w-0 flex-1 text-sm font-extrabold" dir="ltr">
                        {q.contact_phone}
                      </div>
                      <button
                        type="button"
                        onClick={() => void copyContactPhone(String(q.contact_phone))}
                        className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface text-forest ring-1 ring-line"
                        aria-label="نسخ رقم اتصال العميل"
                        title="نسخ الرقم"
                      >
                        <Copy className="size-4" />
                      </button>
                    </div>
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
        <PaginationControls
          page={currentPage}
          total={rows.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
        </>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title="لا توجد طلبات تواصل على عروضك"
          description="ستظهر هنا طلبات التواصل والاستفسارات الخاصة بعقارات مكتبك فقط."
        />
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
  count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
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
      <span className="inline-flex items-center justify-center gap-1.5">
        {label}
        {count != null && count > 0 && (
          <span className="min-w-5 rounded-full bg-terracotta px-1.5 py-0.5 text-[10px] font-extrabold leading-none text-background">
            {count}
          </span>
        )}
      </span>
    </button>
  );
}


function SentOffers({ officeId }: { officeId: string | null }) {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [officeId]);

  const { data = [], isLoading } = useQuery({
    queryKey: ["office-sent-offers", officeId],
    enabled: !!officeId,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const { data: offers, error } = await supabase
        .from("office_offers")
        .select("id,request_id,message,price,status,created_at")
        .eq("office_id", officeId!)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      const rows = (offers ?? []) as Array<{
        id: string;
        request_id: string;
        message: string | null;
        price: number | null;
        status: string;
        created_at: string;
      }>;

      const requestIds = [...new Set(rows.map((row) => row.request_id).filter(Boolean))];
      if (!requestIds.length) {
        return rows
          .filter((row) => row.status === "completed")
          .map((row) => ({ ...row, request: null }));
      }

      const { data: requests, error: requestError } = await supabase
        .from("property_requests")
        .select("id,user_id,kind,listing,neighborhood,budget_min,budget_max,description,status")
        .in("id", requestIds);

      if (requestError) throw requestError;

      const requestById = new Map(
        (requests ?? []).map((request) => [String(request.id), request]),
      );

      const historyRows = rows.map((row) => ({
        ...row,
        request: requestById.get(row.request_id) ?? null,
      }));

      // Include finished offers, offers waiting for the customer's confirmation,
      // rejected/ended offers, and offers whose customer request has since closed.
      return historyRows.filter(
        (row) =>
          ["awaiting_confirmation", "completed", "ended", "deleted", "rejected"].includes(row.status) ||
          ["fulfilled", "cancelled"].includes(String(row.request?.status ?? "")),
      );
    },
  });

  const pageSize = 6;
  const pageCount = Math.max(1, Math.ceil(data.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleHistory = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (isLoading) return <ListSkeleton />;
  if (!data.length) {
    return (
      <EmptyState
        icon={Send}
        title="لا يوجد سجل طلبات بعد"
        description="ستظهر هنا الطلبات المكتملة والطلبات التي أنهيت التعامل معها."
      />
    );
  }

  return (
    <div className="space-y-2">
      {visibleHistory.map((row) => {
        const request = row.request as {
          kind: string;
          listing: string;
          neighborhood: string | null;
          budget_min: number | null;
          budget_max: number | null;
          description: string;
          status: string;
        } | null;

        return (
          <div key={row.id} className="rounded-2xl bg-surface p-3 ring-1 ring-line">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-display text-sm font-extrabold">
                  {request ? kindLabel(request.kind) + " · " + listingLabel(request.listing) : "طلب عقاري"}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  {formatDate(row.created_at)}
                </div>
              </div>
              <span className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold",
                row.status === "completed"
                  ? "bg-forest-soft text-forest"
                  : row.status === "awaiting_confirmation"
                    ? "bg-sand text-muted-foreground"
                    : "bg-terracotta-soft text-terracotta",
              )}>
                {row.status === "completed"
                  ? "مكتمل"
                  : row.status === "awaiting_confirmation"
                    ? "بانتظار تأكيد الفردي"
                    : row.status === "ended" || row.status === "deleted"
                      ? "منتهي"
                      : row.status === "rejected"
                        ? "مرفوض"
                        : request?.status === "cancelled"
                          ? "الطلب ملغي"
                          : row.status === "accepted"
                            ? "مقبول"
                            : request?.status === "fulfilled"
                              ? "الطلب مكتمل"
                              : "منتهي"}
              </span>
            </div>

            {request && (
              <div className="mt-3 rounded-2xl bg-background p-3 ring-1 ring-line">
                <div className="text-xs font-bold">
                  {request.neighborhood || "أي حي"}
                </div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {request.description}
                </p>
                {(request.budget_min != null || request.budget_max != null) && (
                  <div className="mt-1 text-[11px] text-forest">
                    الميزانية: {formatPrice(request.budget_min)} - {formatPrice(request.budget_max)} ر.س
                  </div>
                )}
              </div>
            )}

            {row.message && (
              <p className="mt-2 rounded-2xl bg-sand p-3 text-xs leading-5 text-muted-foreground">
                عرضك: {row.message}
              </p>
            )}

            {row.price != null && (
              <div className="mt-2 text-sm font-display font-extrabold text-forest">
                السعر المقترح: {formatPrice(row.price)} ر.س
              </div>
            )}


          </div>
        );
      })}
      <PaginationControls
        page={currentPage}
        total={data.length}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </div>
  );
}


function MarketOfferActions({
  offerId,
  offerStatus,
  offerMessage,
  offerPrice,
  onChanged,
}: {
  offerId: string | null;
  offerStatus: string;
  offerMessage: string;
  offerPrice: number | null;
  onChanged: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState(offerMessage);
  const [price, setPrice] = useState(offerPrice == null ? "" : String(offerPrice));

  async function changeOffer(action: "request_completion" | "end" | "edit") {
    if (!offerId) {
      toast.error("تعذّر العثور على العرض");
      return;
    }

    if (action === "edit" && message.trim().length < 5) {
      toast.error("اكتب تفاصيل العرض (5 أحرف على الأقل)");
      return;
    }

    setPending(true);
    try {
      const rpcName =
        action === "request_completion"
          ? "office_request_offer_completion"
          : action === "end"
            ? "office_end_offer"
            : "office_edit_offer";
      const args =
        action === "edit"
          ? {
              _offer_id: offerId,
              _message: message.trim(),
              _price: price.trim() ? Number(price) : null,
            }
          : { _offer_id: offerId };

      const { error } = await supabase.rpc(rpcName as never, args as never);
      if (error) throw error;

      toast.success(
        action === "request_completion"
          ? "تم إرسال طلب تأكيد إتمام الصفقة للعميل"
          : action === "end"
            ? "تم إنهاء العرض دون تسجيل الصفقة كمكتملة"
            : "تم تعديل العرض",
      );
      setEditing(false);
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذّر تحديث العرض");
    } finally {
      setPending(false);
    }
  }

  if (offerStatus === "ended" || offerStatus === "deleted") {
    return (
      <div className="mt-2.5 rounded-xl bg-terracotta-soft py-2.5 text-center text-xs font-bold text-terracotta">
        منتهي — لم يتم تأكيد إتمام الصفقة داخل التطبيق
      </div>
    );
  }

  if (offerStatus === "completed") {
    return (
      <div className="mt-2.5 rounded-xl bg-forest-soft py-2.5 text-center text-xs font-bold text-forest">
        مكتمل — أكد العميل إتمام الصفقة
      </div>
    );
  }

  if (offerStatus === "awaiting_confirmation") {
    return (
      <div className="mt-2.5 space-y-2">
        <div className="rounded-xl bg-sand py-2.5 text-center text-xs font-semibold text-muted-foreground">
          أرسلت طلب تأكيد الإتمام، وبانتظار تأكيد الفردي
        </div>
        <button
          type="button"
          onClick={() => void changeOffer("end")}
          disabled={pending}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-terracotta-soft py-2.5 text-[11px] font-bold text-terracotta disabled:opacity-50"
        >
          <Trash2 className="size-4" /> إنهاء العرض
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2.5 space-y-2">
      <div className="rounded-xl bg-forest-soft py-2 text-center text-xs font-semibold text-forest">
        {offerStatus === "accepted" ? "قبل العميل العرض" : "تم إرسال عرضك"}
      </div>

      {offerStatus === "sent" && (
        editing ? (
          <div className="space-y-2 rounded-xl bg-background p-3 ring-1 ring-line">
            <label className="block text-xs font-bold">تعديل تفاصيل العرض</label>
            <textarea
              rows={3}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="اكتب تفاصيل العرض"
              className="w-full rounded-xl bg-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest"
            />
            <input
              type="number"
              min="0"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="السعر المقترح (اختياري)"
              className="w-full rounded-xl bg-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest"
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => void changeOffer("edit")}
                disabled={pending}
                className="rounded-xl bg-forest py-2.5 text-xs font-bold text-background disabled:opacity-50"
              >
                حفظ التعديل
              </button>
              <button
                type="button"
                onClick={() => {
                  setMessage(offerMessage);
                  setPrice(offerPrice == null ? "" : String(offerPrice));
                  setEditing(false);
                }}
                disabled={pending}
                className="rounded-xl bg-sand py-2.5 text-xs font-bold text-foreground disabled:opacity-50"
              >
                إلغاء
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            disabled={pending}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-sand py-2.5 text-[11px] font-bold text-foreground disabled:opacity-50"
          >
            <Pencil className="size-4" /> تعديل العرض
          </button>
        )
      )}

      {offerStatus === "accepted" ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => void changeOffer("request_completion")}
            disabled={pending || !offerId}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-forest py-2.5 text-[11px] font-bold text-background disabled:opacity-50"
          >
            <CheckCircle2 className="size-4" /> إبلاغ بإتمام الصفقة
          </button>
          <button
            type="button"
            onClick={() => void changeOffer("end")}
            disabled={pending || !offerId}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-terracotta-soft py-2.5 text-[11px] font-bold text-terracotta disabled:opacity-50"
          >
            <Trash2 className="size-4" /> إنهاء العرض
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => void changeOffer("end")}
          disabled={pending || !offerId}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-terracotta-soft py-2.5 text-[11px] font-bold text-terracotta disabled:opacity-50"
        >
          <Trash2 className="size-4" /> إنهاء العرض
        </button>
      )}
    </div>
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
  const [page, setPage] = useState(1);
  const viewed = useRef(new Set<string>());

  useEffect(() => setPage(1), [officeId, officeGovernorateId]);

  const { data, isLoading } = useQuery({
    queryKey: ["open-requests", "office-market-list", officeId, officeGovernorateId],
    enabled: !!officeId && !!officeGovernorateId,
    queryFn: async () => {
      const { data: marketData, error } = await supabase.rpc(
        "office_market_requests" as never,
      );
      if (error) throw error;

      const requests = (marketData ?? []) as Array<{
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
        offer_id: string | null;
        offer_status?: string | null;
        client_name: string;
        client_phone: string | null;
      }>;

      const { data: ownOffers, error: offersError } = await supabase
        .from("office_offers")
        .select("id,request_id,status,created_at,message,price")
        .eq("office_id", officeId!)
        .order("created_at", { ascending: false });
      if (offersError) throw offersError;

      const latestOfferByRequest = new Map<string, {
        id: string;
        status: string;
        message: string | null;
        price: number | null;
      }>();
      for (const offer of ownOffers ?? []) {
        if (!latestOfferByRequest.has(offer.request_id)) {
          latestOfferByRequest.set(offer.request_id, {
            id: offer.id,
            status: offer.status,
            message: typeof offer.message === "string" ? offer.message : null,
            price: offer.price == null ? null : Number(offer.price),
          });
        }
      }

      return requests.map((request) => {
        const latestOffer = latestOfferByRequest.get(request.id);
        if (!latestOffer) {
          return {
            ...request,
            offer_status: request.offer_sent ? "sent" : null,
            offer_message: null,
            offer_price: null,
          };
        }

        // A rejected/deleted offer can be replaced. An ended offer remains visible,
        // but is archived as "منتهي" and cannot be treated as completed.
        const offerStillTracked = [
          "sent",
          "accepted",
          "awaiting_confirmation",
          "completed",
          "ended",
        ].includes(latestOffer.status);

        return {
          ...request,
          offer_sent: offerStillTracked,
          offer_id: offerStillTracked ? latestOffer.id : null,
          offer_status: offerStillTracked ? latestOffer.status : null,
          offer_message: offerStillTracked ? latestOffer.message : null,
          offer_price: offerStillTracked ? latestOffer.price : null,
        };
      });
    },
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  const rows = data ?? [];
  const pageSize = 6;
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleRequests = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
  if (!data?.length) return <EmptyState icon={ClipboardList} title="السوق فارغ حاليًا" description="ستظهر هنا طلبات البحث العقاري النشطة في محافظتك." />;

  const details = data.find((request) => request.id === detailsId) ?? null;

  return (
    <div className="space-y-2">
      {visibleRequests.map((r) => {
        const sent = r.offer_sent;
        return (
          <div key={r.id} className="rounded-2xl bg-surface p-3 ring-1 ring-line">
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

            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{r.description}</p>
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
                  className="flex-1 rounded-xl bg-[#25D366]/10 py-2.5 text-center text-xs font-bold text-[#25D366]"
                >
                  <WhatsAppIcon className="mx-auto mb-1 size-4 text-[#25D366]" />
                  واتساب
                </a>
              </div>
            )}

            {sent ? (
              <MarketOfferActions
                offerId={r.offer_id}
                offerStatus={r.offer_status ?? "sent"}
                offerMessage={r.offer_message ?? ""}
                offerPrice={r.offer_price ?? null}
                onChanged={() => {
                  void qc.invalidateQueries({ queryKey: ["open-requests"] });
                  void qc.invalidateQueries({ queryKey: ["office-sent-offers"] });
                  void qc.invalidateQueries({ queryKey: ["unread-notifications"] });
                }}
              />
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
      <PaginationControls
        page={currentPage}
        total={rows.length}
        pageSize={pageSize}
        onPageChange={setPage}
      />

    {details && (
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3"
        role="dialog"
        aria-modal="true"
        aria-label="تفاصيل طلب العميل"
        onClick={() => setDetailsId(null)}
      >
        <div
          className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-[28px] bg-surface p-4 shadow-2xl ring-1 ring-line"
          onClick={(event) => event.stopPropagation()}
          dir="rtl"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-semibold text-muted-foreground">تفاصيل طلب العميل</div>
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

          <div className="mt-3 space-y-2.5">
            <section className="rounded-2xl bg-background p-3 ring-1 ring-line">
              <div className="text-[10px] font-semibold text-muted-foreground">العميل</div>
              <div className="mt-1 text-sm font-extrabold">{details.client_name}</div>
              {details.client_phone && <div className="mt-1 text-xs text-muted-foreground">{details.client_phone}</div>}
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

            <section className="rounded-2xl bg-background p-3 ring-1 ring-line">
              <div className="text-[10px] font-semibold text-muted-foreground">وصف الطلب</div>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-7">{details.description || "لا يوجد وصف إضافي."}</p>
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
                <a href={"tel:" + details.client_phone} className="flex-1 rounded-2xl bg-forest py-3.5 text-center text-sm font-bold text-background">
                  <Phone className="mx-auto mb-1 size-4" /> اتصال
                </a>
                <a
                  href={whatsappHref(details.client_phone, "مرحبًا " + details.client_name + "، بخصوص طلب العقار")}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 rounded-2xl bg-[#25D366]/10 py-3.5 text-center text-sm font-bold text-[#25D366]"
                >
                  <WhatsAppIcon className="mx-auto mb-1 size-4 text-[#25D366]" /> واتساب
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
    </div>
  );
}

async function copyContactPhone(phone: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(phone);
    } else {
      const input = document.createElement("textarea");
      input.value = phone;
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
