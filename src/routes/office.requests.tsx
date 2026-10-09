import { RoleGuard } from "@/lib/role-guard";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Copy,
  Clock3,
  Loader2,
  Pencil,
  Phone,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getOfficeViewingClientDetails } from "@/lib/backend.functions";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { PaginationControls } from "@/components/PaginationControls";
import { EmptyState, ListSkeleton } from "@/components/EmptyState";
import {
  inquiryTypeLabel,
  kindLabel,
  listingLabel,
} from "@/lib/constants";
import { formatArea, formatDate, formatPrice, timeAgo } from "@/lib/format";
import { useMyOffice, whatsappHref } from "@/lib/office";
import { cn } from "@/lib/utils";
import { CompleteViewingReasonModal } from "@/components/CompleteViewingReasonModal";
import { formatBookingTime, isSaudiAppointmentStarted, isSaudiAppointmentToday } from "@/lib/saudi-time";

function Info({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl bg-surface p-2 ring-1 ring-line">
      <div className="text-[10px] font-semibold text-muted-foreground">{label}</div>
      <div className="mt-1 break-words text-xs font-semibold text-foreground">{children}</div>
    </div>
  );
}

export const Route = createFileRoute("/office/requests")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab:
      search["tab"] === "inbox" ||
      search["tab"] === "bookings" ||
      search["tab"] === "market" ||
      search["tab"] === "sent"
        ? (search["tab"] as "inbox" | "bookings" | "market" | "sent")
        : undefined,
    request: typeof search.request === "string" ? search.request : undefined,
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
      const { data: rows, error } = await supabase
        .from("viewing_bookings")
        .select("id,status")
        .eq("office_id", officeId!)
        .limit(500);

      if (error) throw error;
      return (rows ?? []).filter((booking: any) => {
        const status = String(booking.status ?? "").trim() || "pending";
        return ["pending", "accepted"].includes(status);
      }).length;
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
        .eq("office_id", officeId!)
        .eq("status", "new");
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
          <>
            <AcceptedRequestsInbox officeId={officeId} highlightedRequestId={search.request} />
            <InquiriesInbox officeId={officeId} />
          </>
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
  status: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  created_at: string;
};

function BookingsInbox({ officeId }: { officeId: string | null }) {
  const qc = useQueryClient();
  const [acceptId, setAcceptId] = useState<string | null>(null);
  const [acceptNote, setAcceptNote] = useState("");
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [finishId, setFinishId] = useState<string | null>(null);
  const [contactOpenId, setContactOpenId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [officeId]);

  const { data = [], isLoading, error: bookingsError } = useQuery({
    queryKey: ["office-bookings", officeId],
    enabled: !!officeId,
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("viewing_bookings")
        .select("id,user_id,visit_date,visit_time,status,contact_name,contact_phone,created_at")
        .eq("office_id", officeId!)
        .order("visit_date", { ascending: true })
        .order("visit_time", { ascending: true })
        .limit(100);

      if (error) throw error;

      const bookings = ((rows ?? []) as unknown as BookingRow[])
        .map((booking) => ({
          ...booking,
          status: String(booking.status ?? "").trim() || "pending",
        }))
        .filter((booking) => ["pending", "accepted"].includes(booking.status));

      // Older bookings can have the generic "عميل" name saved if the profile
      // was still loading when the appointment was created. Resolve only these
      // bookings' client details on the server, after verifying office access.
      const clientDetails = bookings.length
        ? await getOfficeViewingClientDetails({
            data: {
              officeId: officeId!,
              bookingIds: bookings.map((booking) => String(booking.id)),
            },
          })
        : { clients: [] as Array<{ bookingId: string; fullName: string; phone: string | null }> };
      const clientsByBookingId = new Map(
        clientDetails.clients.map((client) => [client.bookingId, client]),
      );

      const bookingsWithClient = bookings.map((booking) => {
        const client = clientsByBookingId.get(String(booking.id));
        const savedName = String(booking.contact_name ?? "").trim();
        const savedNameIsFallback = !savedName || ["عميل", "العميل"].includes(savedName);
        return {
          ...booking,
          contact_name: savedNameIsFallback
            ? client?.fullName || savedName || "عميل"
            : savedName,
          contact_phone:
            String(booking.contact_phone ?? "").trim() || client?.phone || null,
        };
      });

      const todayBookings = bookingsWithClient.filter((booking) =>
        isSaudiAppointmentToday(booking.visit_date),
      );
      const otherBookings = bookingsWithClient.filter(
        (booking) => !isSaudiAppointmentToday(booking.visit_date),
      );

      return [...todayBookings, ...otherBookings];
    },
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  const pageSize = 6;
  const pageCount = Math.max(1, Math.ceil(data.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleBookings = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const acceptBooking = data.find((booking) => booking.id === acceptId) ?? null;
  const contactBooking = data.find((booking) => booking.id === contactOpenId) ?? null;

  const setStatus = useMutation({
    mutationFn: async (vars: {
      id: string;
      status: "accepted" | "rejected" | "completed";
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
      if (vars.status === "accepted") {
        setAcceptId(null);
        setAcceptNote("");
      }
      if (vars.status === "rejected") setRejectId(null);
      if (vars.status === "completed") setFinishId(null);
      toast.success(
        vars.status === "accepted"
          ? "تم قبول طلب المعاينة"
          : vars.status === "rejected"
            ? "تم رفض طلب المعاينة وإرسال السبب للفردي"
            : "تم إنهاء المعاينة وإرسال السبب للعميل",
      );
      void qc.invalidateQueries({ queryKey: ["office-bookings"] });
      void qc.invalidateQueries({ queryKey: ["office-bookings-tab-count"] });
      void qc.invalidateQueries({ queryKey: ["office-bottom-nav-request-count"] });
      void qc.invalidateQueries({ queryKey: ["unread-notifications"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "تعذّر تحديث الحجز"),
  });

  if (isLoading) return <ListSkeleton />;

  if (bookingsError) {
    return (
      <div role="alert" className="rounded-2xl bg-terracotta-soft p-3 text-xs leading-6 text-terracotta">
        تعذّر تحميل المعاينات: {bookingsError instanceof Error ? bookingsError.message : "خطأ غير معروف"}
      </div>
    );
  }

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
          const contactName = String(booking.contact_name ?? "").trim() || "عميل";
          const contactPhone = String(booking.contact_phone ?? "").trim();
          return (
            <article
              key={booking.id}
              className="rounded-2xl bg-surface p-4 ring-1 ring-line"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-extrabold">{contactName}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="size-4 text-terracotta" />
                      {formatDate(booking.visit_date)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock3 className="size-3.5" />
                      {formatBookingTime(booking.visit_time)} · توقيت السعودية
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setContactOpenId(booking.id)}
                    aria-label={"عرض اتصال " + contactName}
                    title="بيانات الاتصال"
                    className="grid size-10 place-items-center rounded-xl bg-background text-forest ring-1 ring-line"
                  >
                    <Phone className="size-4" />
                  </button>
                  {contactPhone ? (
                    <a
                      href={whatsappHref(contactPhone, "مرحبًا " + contactName + "، بخصوص موعد المعاينة")}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={"واتساب " + contactName}
                      title="واتساب"
                      className="grid size-10 place-items-center rounded-xl bg-[#25D366]/10 text-[#25D366]"
                    >
                      <WhatsAppIcon className="size-5 text-[#25D366]" />
                    </a>
                  ) : (
                    <span
                      aria-label="رقم واتساب غير متوفر"
                      title="رقم العميل غير متوفر"
                      className="grid size-10 place-items-center rounded-xl bg-background text-muted-foreground ring-1 ring-line"
                    >
                      <WhatsAppIcon className="size-5" />
                    </span>
                  )}
                </div>
              </div>

              {booking.status === "pending" ? (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAcceptNote("");
                      setAcceptId(booking.id);
                    }}
                    disabled={setStatus.isPending}
                    className="rounded-xl bg-forest py-2.5 text-sm font-bold text-background disabled:opacity-50"
                  >
                    قبول
                  </button>
                  <button
                    type="button"
                    onClick={() => setRejectId(booking.id)}
                    disabled={setStatus.isPending}
                    className="rounded-xl bg-terracotta-soft py-2.5 text-sm font-bold text-terracotta disabled:opacity-50"
                  >
                    رفض
                  </button>
                </div>
              ) : (
                <>
                  <div className="mt-3 rounded-xl bg-forest-soft px-3 py-2 text-center text-xs font-bold text-forest">
                    تمت الموافقة على المعاينة
                  </div>
                  <button
                    type="button"
                    onClick={() => setFinishId(booking.id)}
                    disabled={setStatus.isPending || !isSaudiAppointmentStarted(booking.visit_date, booking.visit_time)}
                    title={!isSaudiAppointmentStarted(booking.visit_date, booking.visit_time) ? "يتاح إنهاء المعاينة عند حلول موعدها" : "إنهاء المعاينة"}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-forest py-2.5 text-sm font-bold text-background disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CheckCircle2 className="size-4" />
                    إنهاء المعاينة
                  </button>
                  {!isSaudiAppointmentStarted(booking.visit_date, booking.visit_time) && (
                    <p className="mt-1 text-center text-[10px] text-muted-foreground">
                      يتاح تأكيد إنهاء المعاينة عند حلول الموعد المحدد.
                    </p>
                  )}
                </>
              )}
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

      {acceptBooking && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="تأكيد قبول المعاينة"
          onClick={() => {
            if (!setStatus.isPending) {
              setAcceptId(null);
              setAcceptNote("");
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-[28px] bg-surface p-5 shadow-2xl ring-1 ring-line"
            dir="rtl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-extrabold">قبول طلب المعاينة</h2>
                <p className="mt-1 text-xs leading-6 text-muted-foreground">
                  هل توافق على موعد {formatDate(acceptBooking.visit_date)} الساعة {formatBookingTime(acceptBooking.visit_time)} للعميل {String(acceptBooking.contact_name ?? "").trim() || "عميل"}؟
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!setStatus.isPending) {
                    setAcceptId(null);
                    setAcceptNote("");
                  }
                }}
                disabled={setStatus.isPending}
                aria-label="إغلاق"
                className="grid size-9 shrink-0 place-items-center rounded-full bg-background ring-1 ring-line"
              >
                <X className="size-4" />
              </button>
            </div>
            <label className="mt-4 block text-xs font-semibold">
              ملاحظة للعميل (اختياري)
              <textarea
                rows={3}
                value={acceptNote}
                onChange={(event) => setAcceptNote(event.target.value)}
                placeholder="اكتب ملاحظة تظهر للعميل عند الحاجة"
                className="mt-2 w-full rounded-xl bg-background px-3 py-2.5 text-sm outline-none ring-1 ring-line focus:ring-forest"
              />
            </label>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setStatus.mutate({
                    id: acceptBooking.id,
                    status: "accepted",
                    note: acceptNote,
                  })
                }
                disabled={setStatus.isPending}
                className="rounded-xl bg-forest py-3 text-sm font-bold text-background disabled:opacity-50"
              >
                {setStatus.isPending ? "جارٍ التأكيد..." : "تأكيد القبول"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!setStatus.isPending) {
                    setAcceptId(null);
                    setAcceptNote("");
                  }
                }}
                disabled={setStatus.isPending}
                className="rounded-xl bg-background py-3 text-sm font-bold ring-1 ring-line disabled:opacity-50"
              >
                رجوع
              </button>
            </div>
          </div>
        </div>
      )}

      {contactBooking && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="كارت اتصال العميل"
          onClick={() => setContactOpenId(null)}
        >
          <div
            className="w-full max-w-md rounded-[28px] bg-surface p-5 shadow-2xl ring-1 ring-line"
            dir="rtl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-semibold text-muted-foreground">كارت الاتصال</div>
                <h2 className="mt-1 font-display text-lg font-extrabold">
                  {String(contactBooking.contact_name ?? "").trim() || "عميل"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setContactOpenId(null)}
                aria-label="إغلاق"
                className="grid size-9 shrink-0 place-items-center rounded-full bg-background ring-1 ring-line"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="mt-3 rounded-2xl bg-background p-3 ring-1 ring-line">
              <div className="text-[10px] text-muted-foreground">موعد المعاينة</div>
              <div className="mt-1 text-sm font-bold">
                {formatDate(contactBooking.visit_date)} · {formatBookingTime(contactBooking.visit_time)}
              </div>
              <div className="mt-3 text-[10px] text-muted-foreground">رقم الهاتف</div>
              <div className="mt-1 text-sm font-extrabold" dir="ltr">
                {String(contactBooking.contact_phone ?? "").trim() || "رقم الهاتف غير مسجل"}
              </div>
            </div>
            {String(contactBooking.contact_phone ?? "").trim() && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                <a
                  href={"tel:" + String(contactBooking.contact_phone).trim()}
                  className="rounded-xl bg-forest py-3 text-center text-xs font-bold text-background"
                >
                  <Phone className="mx-auto mb-1 size-4" />
                  اتصال
                </a>
                <a
                  href={whatsappHref(
                    String(contactBooking.contact_phone).trim(),
                    "مرحبًا " + (String(contactBooking.contact_name ?? "").trim() || "عميل") + "، بخصوص موعد المعاينة",
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-[#25D366]/10 py-3 text-center text-xs font-bold text-[#25D366]"
                >
                  <WhatsAppIcon className="mx-auto mb-1 size-4" />
                  واتساب
                </a>
                <button
                  type="button"
                  onClick={() => void copyContactPhone(String(contactBooking.contact_phone).trim())}
                  className="rounded-xl bg-background py-3 text-center text-xs font-bold ring-1 ring-line"
                >
                  <Copy className="mx-auto mb-1 size-4" />
                  نسخ الرقم
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => setContactOpenId(null)}
              className="mt-3 w-full rounded-xl bg-background py-3 text-sm font-bold ring-1 ring-line"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      <CompleteViewingReasonModal
        open={!!rejectId}
        pending={setStatus.isPending}
        title="رفض طلب المعاينة"
        heading="لماذا ترفض طلب المعاينة؟"
        variant="reject"
        reasonLabel="سبب الرفض"
        placeholder="اكتب سبب رفض طلب المعاينة ليظهر للفردي"
        confirmLabel="تأكيد الرفض"
        onClose={() => {
          if (!setStatus.isPending) setRejectId(null);
        }}
        onConfirm={(reason) => {
          if (rejectId) {
            setStatus.mutate({
              id: rejectId,
              status: "rejected",
              reason,
            });
          }
        }}
      />

      <CompleteViewingReasonModal
        open={!!finishId}
        pending={setStatus.isPending}
        title="إنهاء المعاينة"
        heading="هل تمت المعاينة؟ اكتب السبب أو الملاحظات."
        reasonLabel="سبب إنهاء المعاينة"
        placeholder="اكتب ما حدث أثناء المعاينة ليظهر للطرف الآخر"
        confirmLabel="تأكيد إنهاء المعاينة"
        onClose={() => {
          if (!setStatus.isPending) setFinishId(null);
        }}
        onConfirm={(reason) => {
          if (finishId) {
            setStatus.mutate({
              id: finishId,
              status: "completed",
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

type AcceptedPropertyInquiry = {
  id: string;
  property_id: string;
  type: string;
  status: string;
  created_at: string;
  message: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  properties: { title: string | null; property_number: string | null } | null;
};

type AcceptedContactRequest = {
  id: string; accepted_offer_id: string; user_id: string; kind: string | null; listing: string | null;
  governorate_name: string | null; neighborhood: string | null; budget_min: number | null; budget_max: number | null;
  area_min: number | null; description: string; attachment_url: string | null; created_at: string | null;
  expires_at: string | null; client_name: string; client_phone: string | null; offer_message: string | null;
  offer_price: number | null; offer_status: string;
};

function AcceptedRequestsInbox({ officeId, highlightedRequestId }: { officeId: string | null; highlightedRequestId?: string }) {
  const qc = useQueryClient();
  const [cancelRequestId, setCancelRequestId] = useState<string | null>(null);
  const { data = [], isLoading, error } = useQuery<AcceptedContactRequest[]>({
    queryKey: ["office-accepted-property-requests", officeId],
    enabled: !!officeId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("office_accepted_property_requests" as never);
      if (error) throw error;
      return (Array.isArray(data) ? data : []) as AcceptedContactRequest[];
    },
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  const {
    data: acceptedInquiries = [],
    isLoading: acceptedInquiriesLoading,
    error: acceptedInquiriesError,
  } = useQuery<AcceptedPropertyInquiry[]>({
    queryKey: ["office-accepted-property-inquiries", officeId],
    enabled: !!officeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_inquiries")
        .select("id,property_id,type,status,created_at,message,contact_name,contact_phone,properties(title,property_number)")
        .eq("office_id", officeId!)
        .eq("status", "accepted")
        .order("updated_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as AcceptedPropertyInquiry[];
    },
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  const cancelAcceptedOffer = useMutation({
    mutationFn: async (vars: { offerId: string; reason: string }) => {
      const { error } = await supabase.rpc("office_cancel_accepted_offer" as never, {
        _offer_id: vars.offerId,
        _reason: vars.reason,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      setCancelRequestId(null);
      toast.success("تم إلغاء العرض وإشعار الفردي بسبب الإلغاء");
      void qc.invalidateQueries({ queryKey: ["office-accepted-property-requests"] });
      void qc.invalidateQueries({ queryKey: ["open-requests"] });
      void qc.invalidateQueries({ queryKey: ["office-sent-offers"] });
      void qc.invalidateQueries({ queryKey: ["office-inquiries-tab-count"] });
      void qc.invalidateQueries({ queryKey: ["unread-notifications"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "تعذّر إلغاء العرض"),
  });

  useEffect(() => {
    if (!highlightedRequestId || !data.length) return;
    window.setTimeout(() => {
      document.getElementById("accepted-request-card-" + highlightedRequestId)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  }, [highlightedRequestId, data.length]);
  if (isLoading || acceptedInquiriesLoading) return <ListSkeleton />;
  if (error || acceptedInquiriesError) {
    const loadError = error ?? acceptedInquiriesError;
    return <div role="alert" className="rounded-2xl bg-terracotta-soft p-3 text-xs leading-6 text-terracotta">تعذّر تحميل الطلبات المقبولة: {loadError instanceof Error ? loadError.message : "خطأ غير معروف"}</div>;
  }
  const acceptedTotal = data.length + acceptedInquiries.length;
  return (
    <section className="space-y-2" aria-label="طلبات مقبولة">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-sm font-extrabold">طلبات مقبولة</h2>
        {acceptedTotal > 0 && (
          <span className="min-w-6 rounded-full bg-forest-soft px-2 py-1 text-center text-[10px] font-extrabold text-forest" aria-label={String(acceptedTotal) + " طلب مقبول"}>{acceptedTotal > 99 ? "99+" : acceptedTotal}</span>
        )}
      </div>
      {data.length ? data.map((request) => {
        const phone = String(request.client_phone ?? "").trim();
        return (
          <article id={"accepted-request-card-" + request.id} key={request.id}
            className={cn("space-y-3 rounded-2xl bg-surface p-3 ring-1 ring-line", highlightedRequestId === request.id && "ring-2 ring-forest")}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-sm font-extrabold">{request.client_name || "عميل"}</h3>
                <p className="mt-1 text-[11px] text-muted-foreground">{kindLabel(request.kind)} · {listingLabel(request.listing)} · {timeAgo(request.created_at)}</p>
              </div>
              <span className="shrink-0 rounded-full bg-forest-soft px-2.5 py-1 text-[10px] font-bold text-forest">تم قبول عرضك</span>
            </div>
            {request.attachment_url && <img src={request.attachment_url} alt="صورة الطلب" loading="lazy" className="max-h-64 w-full rounded-xl object-cover" />}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-background p-2.5 ring-1 ring-line"><div className="text-[10px] text-muted-foreground">المحافظة</div><div className="mt-1 text-xs font-bold">{request.governorate_name || "—"}</div></div>
              <div className="rounded-xl bg-background p-2.5 ring-1 ring-line"><div className="text-[10px] text-muted-foreground">الحي</div><div className="mt-1 text-xs font-bold">{request.neighborhood || "أي حي"}</div></div>
              <div className="rounded-xl bg-background p-2.5 ring-1 ring-line"><div className="text-[10px] text-muted-foreground">الميزانية</div><div className="mt-1 text-xs font-bold">{request.budget_min != null || request.budget_max != null ? formatPrice(request.budget_min) + " - " + formatPrice(request.budget_max) + " ر.س" : "غير محددة"}</div></div>
              <div className="rounded-xl bg-background p-2.5 ring-1 ring-line"><div className="text-[10px] text-muted-foreground">المساحة</div><div className="mt-1 text-xs font-bold">{request.area_min != null ? "من " + formatArea(request.area_min) : "غير محددة"}</div></div>
            </div>
            <div className="rounded-xl bg-background p-3 ring-1 ring-line"><div className="text-[10px] font-semibold text-muted-foreground">تفاصيل الطلب</div><p className="mt-1 whitespace-pre-wrap text-sm leading-6">{request.description || "لا يوجد وصف إضافي."}</p></div>
            {request.offer_message && <div className="rounded-xl bg-forest-soft p-3 text-xs leading-5 text-forest"><div className="font-bold">رسالة عرض مكتبك</div><p className="mt-1 whitespace-pre-wrap">{request.offer_message}</p>{request.offer_price != null && <div className="mt-1 font-extrabold">السعر المقترح: {formatPrice(request.offer_price)} ر.س</div>}</div>}
            <button
              type="button"
              onClick={() => setCancelRequestId(request.id)}
              disabled={cancelAcceptedOffer.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-terracotta-soft py-2.5 text-xs font-bold text-terracotta disabled:opacity-50"
            >
              <X className="size-4" /> إلغاء العرض
            </button>
            <div className="rounded-xl bg-background p-3 ring-1 ring-line">
              <div className="text-[10px] font-semibold text-muted-foreground">بيانات اتصال العميل</div>
              <div className="mt-1 text-sm font-extrabold" dir="ltr">{phone || "رقم الهاتف غير مسجل"}</div>
              {phone && <div className="mt-3 grid grid-cols-3 gap-2">
                <a href={"tel:" + phone} className="rounded-xl bg-forest py-2.5 text-center text-xs font-bold text-background"><Phone className="mx-auto mb-1 size-4" /> اتصال</a>
                <a href={whatsappHref(phone, "مرحبًا " + (request.client_name || "عميل") + "، بخصوص طلب العقار")} target="_blank" rel="noreferrer" className="rounded-xl bg-[#25D366]/10 py-2.5 text-center text-xs font-bold text-[#25D366]"><WhatsAppIcon className="mx-auto mb-1 size-4" /> واتساب</a>
                <button type="button" onClick={() => void copyContactPhone(phone)} className="rounded-xl bg-background py-2.5 text-center text-xs font-bold ring-1 ring-line"><Copy className="mx-auto mb-1 size-4" /> نسخ الرقم</button>
              </div>}
            </div>
          </article>
        );
      }) : null}
      {acceptedInquiries.map((inquiry) => {
        const property = inquiry.properties;
        const phone = String(inquiry.contact_phone ?? "").trim();
        const inquiryType: Record<string, string> = {
          viewing: "معاينة",
          buy: "شراء",
          rent: "استئجار",
          question: "استفسار",
        };
        return (
          <article key={"accepted-inquiry-" + inquiry.id}
            className="space-y-3 rounded-2xl bg-surface p-3 ring-1 ring-line">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate font-display text-sm font-extrabold">{property?.title || "عقار المكتب"}</h3>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {property?.property_number ? "رقم العقار: " + property.property_number + " · " : ""}
                  {inquiryType[inquiry.type] || "طلب تواصل"} · {timeAgo(inquiry.created_at)}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-forest-soft px-2.5 py-1 text-[10px] font-bold text-forest">
                تم قبول طلب التواصل
              </span>
            </div>
            <div className="rounded-xl bg-background p-3 ring-1 ring-line">
              <div className="text-[10px] font-semibold text-muted-foreground">اسم العميل وتفاصيل طلبه</div>
              <div className="mt-1 text-sm font-extrabold">{inquiry.contact_name || "عميل"}</div>
              {inquiry.message && <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-muted-foreground">{inquiry.message}</p>}
            </div>
            <div className="rounded-xl bg-background p-3 ring-1 ring-line">
              <div className="text-[10px] font-semibold text-muted-foreground">بيانات اتصال العميل</div>
              <div className="mt-1 text-sm font-extrabold" dir="ltr">{phone || "رقم الهاتف غير مسجل"}</div>
              {phone && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <a href={"tel:" + phone} className="rounded-xl bg-forest py-2.5 text-center text-xs font-bold text-background">اتصال</a>
                  <a href={whatsappHref(phone, "مرحبًا " + (inquiry.contact_name || "عميل") + "، بخصوص " + (property?.title || "طلب التواصل"))}
                    target="_blank" rel="noreferrer" className="rounded-xl bg-[#25D366]/10 py-2.5 text-center text-xs font-bold text-[#25D366]">واتساب</a>
                </div>
              )}
            </div>
          </article>
        );
      })}
      {!acceptedTotal && (
        <div className="rounded-2xl bg-surface p-3 text-xs leading-6 text-muted-foreground ring-1 ring-line">
          لا توجد طلبات مقبولة حتى الآن. عندما توافق على طلب تواصل سيظهر هنا، بدلًا من اختفائه من الطلبات المستلمة.
        </div>
      )}
      <CompleteViewingReasonModal
        open={!!cancelRequestId}
        pending={cancelAcceptedOffer.isPending}
        title="إلغاء العرض"
        heading="وضّح سبب إلغاء العرض المقبول"
        reasonLabel="سبب الإلغاء (إلزامي)"
        placeholder="اكتب سبب إلغاء العرض الذي وافق عليه الفردي"
        confirmLabel="تأكيد إلغاء العرض"
        variant="reject"
        onClose={() => { if (!cancelAcceptedOffer.isPending) setCancelRequestId(null); }}
        onConfirm={(reason) => {
          const request = data.find((item) => item.id === cancelRequestId);
          if (!request?.accepted_offer_id) {
            toast.error("تعذّر العثور على العرض المقبول");
            return;
          }
          cancelAcceptedOffer.mutate({ offerId: request.accepted_offer_id, reason });
        }}
      />
    </section>
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
        .eq("status", "new")
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
    mutationFn: async (vars: { id: string; status: "accepted" | "rejected" }) => {
      const { error } = await supabase.rpc(
        "set_property_inquiry_status" as never,
        { _inquiry_id: vars.id, _status: vars.status } as never,
      );
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast.success(vars.status === "accepted" ? "تم قبول طلب التواصل" : "تم رفض طلب التواصل");
      void qc.invalidateQueries({ queryKey: ["office-inquiries"] });
      void qc.invalidateQueries({ queryKey: ["office-accepted-property-inquiries"] });
      void qc.invalidateQueries({ queryKey: ["office-inquiries-tab-count"] });
      void qc.invalidateQueries({ queryKey: ["new-inquiries-count"] });
      void qc.invalidateQueries({ queryKey: ["office-sent-offers"] });
      void qc.invalidateQueries({ queryKey: ["unread-notifications"] });
    },
    onError: (e) =>
      toast.error(
        e instanceof Error && e.message === "inquiry_already_handled"
          ? "تم التعامل مع هذا الطلب بالفعل"
          : e instanceof Error
            ? e.message
            : "تعذّر تحديث الحالة",
      ),
  });

  return (
    <div className="space-y-3" aria-label="طلبات مستلمة">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-sm font-extrabold">طلبات مستلمة</h2>
          <p className="mt-1 text-[11px] leading-5 text-muted-foreground">طلبات التواصل التي تنتظر قرار المكتب: قبول أو رفض.</p>
        </div>
        <span className="min-w-6 rounded-full bg-terracotta-soft px-2 py-1 text-center text-[10px] font-extrabold text-terracotta">{rows.length}</span>
      </div>
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

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus.mutate({ id: q.id, status: "accepted" })}
                    disabled={setStatus.isPending}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-forest py-2.5 text-xs font-bold text-background disabled:opacity-50"
                  >
                    <CheckCircle2 className="size-4" /> قبول الطلب
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus.mutate({ id: q.id, status: "rejected" })}
                    disabled={setStatus.isPending}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-terracotta-soft py-2.5 text-xs font-bold text-terracotta disabled:opacity-50"
                  >
                    <X className="size-4" /> رفض الطلب
                  </button>
                </div>
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


type OfficeOfferHistoryRow = {
  id: string;
  request_id: string;
  message: string | null;
  price: number | null;
  status: string;
  end_reason: string | null;
  created_at: string | Date;
  property_title: string;
  client_name: string;
  kind: string | null;
  listing: string | null;
  neighborhood: string | null;
  budget_min: number | null;
  budget_max: number | null;
  area_min: number | null;
  description: string;
  request_status: string;
  history_type?: "offer" | "inquiry";
};

function SentOffers({ officeId }: { officeId: string | null }) {
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [officeId]);

  const { data = [], isLoading, error } = useQuery<OfficeOfferHistoryRow[]>({
    queryKey: ["office-sent-offers", officeId],
    enabled: !!officeId,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("office_property_request_history" as never);
      if (error) throw error;
      return (Array.isArray(data) ? data : []) as OfficeOfferHistoryRow[];
    },
  });

  const pageSize = 6;
  const pageCount = Math.max(1, Math.ceil(data.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleHistory = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (isLoading) return <ListSkeleton />;
  if (error) {
    return (
      <div role="alert" className="rounded-2xl bg-terracotta-soft p-3 text-xs leading-6 text-terracotta">
        تعذّر تحميل تاريخ الطلبات: {error instanceof Error ? error.message : "خطأ غير معروف"}
      </div>
    );
  }
  if (!data.length) {
    return <EmptyState icon={Send} title="تاريخ الطلبات" />;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-sm font-extrabold">تاريخ الطلبات</h2>
        <span className="min-w-6 rounded-full bg-surface px-2 py-1 text-center text-[10px] font-extrabold ring-1 ring-line">
          {data.length}
        </span>
      </div>

      {visibleHistory.map((row) => {
        const isCompleted = row.status === "completed";
        const completedByAnotherOffice = row.request_status === "fulfilled" && !isCompleted;
        const listingText = listingLabel(row.listing);
        const kindText = kindLabel(row.kind);
        return (
          <article key={row.id} className="space-y-3 rounded-2xl bg-surface p-3 ring-1 ring-line">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-display text-sm font-extrabold">{row.property_title || "طلب عقاري"}</h3>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {[kindText, listingText, row.neighborhood].filter((value) => value && value !== "—").join(" · ")}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">{formatDate(String(row.created_at))}</p>
              </div>
              <span className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold",
                isCompleted ? "bg-forest-soft text-forest" :
                completedByAnotherOffice ? "bg-sand text-muted-foreground" :
                "bg-terracotta-soft text-terracotta",
              )}>
                {isCompleted ? "طلب مكتمل" :
                  completedByAnotherOffice ? "اكتمل مع مكتب آخر" :
                  row.status === "awaiting_confirmation" ? "بانتظار تأكيد الفردي" :
                  row.status === "rejected" ? "مرفوض" :
                  row.end_reason ? "تم إلغاء العرض" :
                  row.history_type === "inquiry" && row.status === "ended" ? "طلب تواصل منتهي" :
                  "عرض منتهي / مسحوب من السوق"}
              </span>
            </div>

            <div className="rounded-2xl bg-background p-3 ring-1 ring-line">
              <div className="text-[10px] font-semibold text-muted-foreground">تفاصيل الطلب</div>
              <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-foreground">
                {row.description || "لا توجد تفاصيل إضافية محفوظة."}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Info label="اسم العميل">{row.client_name || "عميل"}</Info>
                <Info label="المساحة">{row.area_min != null ? "من " + formatArea(row.area_min) : "غير محددة"}</Info>
                <Info label="الميزانية">
                  {row.budget_min != null || row.budget_max != null
                    ? formatPrice(row.budget_min) + " - " + formatPrice(row.budget_max) + " ر.س"
                    : "غير محددة"}
                </Info>
                <Info label="حالة الطلب">{isCompleted ? "مكتمل من خلال مكتبكم" : completedByAnotherOffice ? "أكمله مكتب آخر" : "منتهي أو مسحوب"}</Info>
              </div>
            </div>

            {row.message && (
              <div className="rounded-2xl bg-sand p-3 text-xs leading-5 text-muted-foreground">
                <div className="font-bold text-foreground">تفاصيل عرض مكتبك</div>
                <p className="mt-1 whitespace-pre-wrap">{row.message}</p>
              </div>
            )}
            {row.price != null && (
              <div className="text-sm font-display font-extrabold text-forest">
                السعر المقترح: {formatPrice(row.price)} ر.س
              </div>
            )}
            {row.end_reason && (
              <div className="rounded-xl bg-terracotta-soft p-3 text-xs leading-5 text-terracotta">
                سبب الإنهاء: {row.end_reason}
              </div>
            )}
          </article>
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

  if (offerStatus === "rejected" || offerStatus === "deleted" || offerStatus === "ended") {
    return (
      <div className="mt-2.5 rounded-xl bg-terracotta-soft py-2.5 text-center text-xs font-bold text-terracotta">
        {offerStatus === "rejected" ? "تم رفض عرضك — لا يمكنك إرسال عرض آخر على هذا الطلب" : "العرض منتهي — لا يمكنك إعادة تقديم عرض على الطلب"}
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

        // Once this office has submitted an offer, the action stays locked for this request.
        const offerStillTracked = true;

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
  const pageSize = 10;
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
  const offerRequest = data.find((request) => request.id === openId) ?? null;

  return (
    <div className="space-y-2">
      {visibleRequests.map((r) => {
        return (
          <div key={r.id} className="overflow-hidden rounded-2xl bg-surface ring-1 ring-line">
            <div className="relative w-full bg-sand">
              {r.attachment_url ? (
                <img
                  src={r.attachment_url}
                  alt="صورة الطلب العقاري"
                  loading="eager"
                  decoding="async"
                  className="block aspect-[4/3] w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                    const fallback = event.currentTarget.parentElement?.querySelector("[data-request-image-fallback]") as HTMLElement | null;
                    if (fallback) fallback.style.display = "grid";
                  }}
                />
              ) : null}
              <div
                data-request-image-fallback
                style={{ display: r.attachment_url ? "none" : "grid" }}
                className="aspect-[4/3] w-full place-items-center bg-sand px-4 text-center text-sm text-muted-foreground"
              >
                لا توجد صورة توضيحية لهذا الطلب
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 p-2.5">
              <button
                type="button"
                onClick={() => {
                  setDetailsId(r.id);
                  if (!viewed.current.has(r.id)) {
                    viewed.current.add(r.id);
                    void supabase.rpc("mark_property_request_view" as never, { _request_id: r.id } as never);
                  }
                }}
                className="flex w-full items-center justify-center rounded-xl bg-forest-soft px-2 py-3 text-xs font-bold text-forest"
              >
                عرض بيانات الطلب
              </button>
              {!r.offer_sent ? (
                <button
                  type="button"
                  onClick={() => {
                    setDetailsId(null);
                    setMessage("");
                    setPrice("");
                    setOpenId(r.id);
                  }}
                  className="flex w-full items-center justify-center rounded-xl bg-terracotta px-2 py-3 text-xs font-bold text-background"
                >
                  قبول
                </button>
              ) : (
                <div className="flex items-center justify-center rounded-xl bg-sand px-2 py-3 text-center text-[11px] font-bold text-muted-foreground">
                  تم إرسال العرض
                </div>
              )}
            </div>
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
            </section>

            {details.attachment_url ? (
              <img
                src={details.attachment_url}
                alt="صورة الطلب العقاري"
                loading="eager"
                decoding="async"
                className="block max-h-72 w-full rounded-2xl object-contain"
              />
            ) : null}

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


            <div className="text-[11px] leading-6 text-muted-foreground">
              نُشر الطلب: {formatDate(details.created_at)} · آخر موعد: {details.expires_at ? formatDate(details.expires_at) : "غير محدد"} · {details.views_count} مشاهدة
            </div>

            {!details.offer_sent ? (
              <button
                type="button"
                onClick={() => {
                  setDetailsId(null);
                  setMessage("");
                  setPrice("");
                  setOpenId(details.id);
                }}
                className="w-full rounded-2xl bg-terracotta py-3.5 text-sm font-bold text-background"
              >
                قبول العرض
              </button>
            ) : (
              <div className="rounded-xl bg-sand p-3 text-center text-xs font-bold text-muted-foreground">
                سبق أن أرسلت عرضًا على هذا الطلب
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    {offerRequest && (
      <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/45 p-3" role="dialog" aria-modal="true" aria-label="إرسال عرض للعميل"
        onClick={() => { if (!sendOffer.isPending) setOpenId(null); }}>
        <div className="w-full max-w-md rounded-[28px] bg-surface p-4 shadow-2xl ring-1 ring-line" onClick={(event) => event.stopPropagation()} dir="rtl">
          <div className="flex items-center justify-between gap-3">
            <div><div className="text-[10px] text-muted-foreground">قبول طلب العميل بإرسال عرض</div><h2 className="mt-1 font-display text-lg font-extrabold">ما السبب الذي يجعل العميل يختارك؟</h2></div>
            <button type="button" onClick={() => { if (!sendOffer.isPending) setOpenId(null); }} className="grid size-9 place-items-center rounded-full bg-background ring-1 ring-line" aria-label="إغلاق"><X className="size-4" /></button>
          </div>
          <textarea rows={4} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="اكتب رسالة تشرح للعميل لماذا يختار مكتبك"
            className="mt-3 w-full rounded-xl bg-sand px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-forest" />
          <input type="number" min="0" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="السعر المقترح (اختياري)"
            className="mt-2 w-full rounded-xl bg-sand px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-forest" />
          <button type="button" onClick={() => sendOffer.mutate(offerRequest.id)}
            disabled={sendOffer.isPending || message.trim().length < 5 || (price.trim() !== "" && (!Number.isFinite(Number(price)) || Number(price) < 0))}
            className="mt-3 flex w-full items-center justify-center rounded-xl bg-forest py-3 text-sm font-bold text-background disabled:opacity-50">
            {sendOffer.isPending ? "جارٍ إرسال العرض..." : "تأكيد وإرسال العرض"}
          </button>
          <button type="button" onClick={() => { if (!sendOffer.isPending) setOpenId(null); }} disabled={sendOffer.isPending}
            className="mt-2 w-full rounded-xl bg-background py-3 text-sm font-bold ring-1 ring-line">رجوع</button>
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
