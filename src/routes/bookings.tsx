import { RoleGuard } from "@/lib/role-guard";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, Edit3, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { EmptyState, ListSkeleton } from "@/components/EmptyState";
import { useAuth } from "@/lib/auth";
import { BOOKING_STATUS } from "@/lib/constants";
import { formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { EditViewingBookingModal } from "@/components/EditViewingBookingModal";
import { CompleteViewingReasonModal } from "@/components/CompleteViewingReasonModal";
import { CancelReasonModal } from "@/components/CancelReasonModal";
import { isSaudiAppointmentStarted, isSaudiAppointmentToday, formatBookingTime } from "@/lib/saudi-time";

export const Route = createFileRoute("/bookings")({
  head: () => ({
    meta: [
      { title: "حجوزات المعاينة | عقار البطين" },
      { name: "description", content: "متابعة حجوزات معاينة العقارات وحالتها." },
    ],
  }),
  component: () => (
    <RoleGuard allow={["individual", "admin"]}>
      <BookingsPage />
    </RoleGuard>
  ),
});

function BookingsPage() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [finishId, setFinishId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const { data = [], isLoading } = useQuery({
    queryKey: ["bookings", userId],
    enabled: !!userId,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("viewing_bookings")
        .select(
          "id,property_id,office_id,visit_date,visit_time,status,office_note,cancel_reason,completion_reason,contact_phone,created_at,properties(title,price,neighborhood),offices(name,phone,whatsapp)",
        )
        .eq("user_id", userId!)
        .order("visit_date", { ascending: false })
        .order("visit_time", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const cancel = useMutation({
    mutationFn: async (vars: { id: string; reason: string }) => {
      const { error } = await supabase.rpc(
        "set_viewing_booking_status" as never,
        { _booking_id: vars.id, _status: "cancelled", _reason: vars.reason } as never,
      );
      if (error) throw error;
    },
    onSuccess: () => {
      setCancelId(null);
      toast.success("تم إلغاء حجز المعاينة");
      void qc.invalidateQueries({ queryKey: ["bookings"] });
      void qc.invalidateQueries({ queryKey: ["unread-notifications"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "تعذّر إلغاء الحجز"),
  });

  const finish = useMutation({
    mutationFn: async (vars: { id: string; reason: string }) => {
      const { error } = await supabase.rpc(
        "set_viewing_booking_status" as never,
        {
          _booking_id: vars.id,
          _status: "completed",
          _reason: vars.reason,
        } as never,
      );
      if (error) throw error;
    },
    onSuccess: () => {
      setFinishId(null);
      toast.success("تم إنهاء المعاينة وإرسال السبب للمكتب");
      void qc.invalidateQueries({ queryKey: ["bookings"] });
      void qc.invalidateQueries({ queryKey: ["unread-notifications"] });
      void qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) =>
      toast.error(
        error instanceof Error
          ? error.message === "completion_reason_required"
            ? "اكتب سبب إنهاء المعاينة"
            : error.message === "booking_not_accepted"
              ? "هذا الحجز لم يعد في حالة تسمح بإنهائه"
              : error.message === "not_booking_member"
                ? "لا تملك صلاحية إنهاء هذه المعاينة"
                : error.message === "not_individual"
                  ? "إنهاء المعاينة متاح للمستخدم الفردي فقط"
                  : error.message === "appointment_not_started"
                    ? "لا يمكن إنهاء المعاينة قبل موعدها"
                    : error.message
          : "تعذّر إنهاء المعاينة",
      ),
  });

  const edit = useMutation({
    mutationFn: async (vars: {
      id: string;
      visitDate: string;
      visitTime: string;
      contactPhone: string;
    }) => {
      const { error } = await supabase.rpc(
        "update_viewing_booking" as never,
        {
          _booking_id: vars.id,
          _visit_date: vars.visitDate,
          _visit_time: vars.visitTime,
          _contact_phone: vars.contactPhone,
        } as never,
      );
      if (error) throw error;
    },
    onSuccess: () => {
      setEditId(null);
      toast.success("تم تعديل حجز المعاينة وإشعار المكتب");
      void qc.invalidateQueries({ queryKey: ["bookings"] });
      void qc.invalidateQueries({ queryKey: ["unread-notifications"] });
      void qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) =>
      toast.error(
        error instanceof Error
          ? error.message === "duplicate_booking_time"
            ? "يوجد لديك حجز آخر لنفس العقار في هذا الموعد"
            : error.message === "appointment_must_be_future"
              ? "اختر موعدًا مستقبليًا"
              : error.message === "appointment_already_started"
                ? "لا يمكن تعديل المعاينة بعد بدء موعدها"
                : error.message === "booking_not_editable"
                  ? "لا يمكن تعديل هذه المعاينة بعد انتهائها أو إلغائها"
                  : error.message === "booking_not_found"
                    ? "حجز المعاينة غير موجود"
                    : error.message === "contact_invalid"
                      ? "رقم التواصل طويل جدًا"
                      : error.message === "not_individual"
                        ? "تعديل المعاينة متاح للمستخدم الفردي فقط"
                        : error.message
          : "تعذّر تعديل حجز المعاينة",
      ),
  });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <AppHeader showSearch={false} />
      <main className="flex-1 space-y-4 px-4 py-4">
        <div>
          <h1 className="font-display text-xl font-extrabold">حجوزات المعاينة</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            كل مواعيد المعاينة الخاصة بك وحالتها في مكان واحد.
          </p>
        </div>

        {isLoading ? (
          <ListSkeleton />
        ) : data.length ? (
          (() => {
            const historyStatuses = new Set([
              "rejected",
              "completed",
              "cancelled",
              "appointment_ended",
            ]);

            const isHistoryBooking = (booking: any) => {
              const status = String(booking.status ?? "");
              return historyStatuses.has(status);
            };

            const activeBookings = data.filter(
              (booking: any) => !isHistoryBooking(booking),
            );

            const historyBookings = data.filter(isHistoryBooking);

            const renderBooking = (booking: any, history = false) => {
              const property = booking.properties as {
                title: string;
                price: number | string;
                neighborhood: string | null;
              } | null;
              const office = booking.offices as {
                name: string;
                phone: string | null;
                whatsapp: string | null;
              } | null;

              const isToday = isSaudiAppointmentToday(booking.visit_date, now);
              const started = isSaudiAppointmentStarted(
                booking.visit_date,
                booking.visit_time,
                now,
              );
              const status =
                String(booking.status ?? "").trim() || "pending";
              const canEdit =
                !history &&
                !started &&
                ["pending", "accepted"].includes(status);
              const canFinish =
                !history &&
                status === "accepted" &&
                started;

              return (
                <article
                  key={booking.id}
                  className={cn(
                    "rounded-3xl bg-surface p-4 ring-1 ring-line",
                    history && "opacity-95",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-display text-sm font-extrabold">
                        {property?.title ?? "عقار"}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {office?.name ?? "مكتب عقاري"}
                      </div>
                    </div>
                    <StatusBadge
                      status={
                        history && started && ["pending", "accepted"].includes(status)
                          ? "appointment_ended"
                          : status
                      }
                    />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Info label="تاريخ المعاينة">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="size-3.5 text-terracotta" />
                        {formatDate(booking.visit_date)}
                      </span>
                    </Info>
                    <Info label="الوقت">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 className="size-3.5 text-terracotta" />
                        {formatBookingTime(booking.visit_time)}
                      </span>
                    </Info>
                    <Info label="الحي">{property?.neighborhood || "—"}</Info>
                    <Info label="السعر">
                      {property?.price != null ? formatPrice(property.price) + " ر.س" : "—"}
                    </Info>
                  </div>

                  {booking.office_note && (
                    <div className="mt-3 rounded-2xl bg-forest-soft p-3 text-xs leading-6 text-forest">
                      ملاحظة المكتب: {booking.office_note}
                    </div>
                  )}

                  {booking.contact_phone && (
                    <div className="mt-3 rounded-2xl bg-sand p-3 text-xs ring-1 ring-line">
                      <div className="font-semibold">وسيلة الاتصال</div>
                      <div className="mt-1 text-forest" dir="ltr">{booking.contact_phone}</div>
                    </div>
                  )}

                  {booking.cancel_reason && (
                    <div className="mt-3 rounded-2xl bg-terracotta-soft p-3 text-xs leading-6 text-terracotta">
                      سبب الإلغاء: {booking.cancel_reason}
                    </div>
                  )}

                  {booking.completion_reason && booking.status === "completed" && (
                    <div className="mt-3 rounded-2xl bg-forest-soft p-3 text-xs leading-6 text-forest">
                      <span className="font-bold">سبب إنهاء المعاينة:</span>{" "}
                      {booking.completion_reason}
                    </div>
                  )}

                  {(!history && (canEdit || canFinish)) && (
                    <div
                      className={cn(
                        "mt-3 grid gap-2",
                        canEdit && canFinish ? "grid-cols-2" : "grid-cols-1",
                      )}
                    >
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => setEditId(booking.id)}
                          disabled={edit.isPending}
                          className="flex items-center justify-center gap-1.5 rounded-2xl bg-sand py-3 text-xs font-bold text-foreground ring-1 ring-line disabled:cursor-not-allowed disabled:opacity-45"
                          title="تعديل موعد المعاينة أو وسيلة الاتصال"
                        >
                          <Edit3 className="size-3.5" />
                          تعديل المعاينة
                        </button>
                      )}

                      {canFinish && (
                        <button
                          type="button"
                          onClick={() => setFinishId(booking.id)}
                          disabled={finish.isPending}
                          className="flex items-center justify-center gap-1.5 rounded-2xl bg-forest py-3 text-xs font-bold text-background disabled:opacity-50"
                          title="إنهاء المعاينة"
                        >
                          <CheckCircle2 className="size-3.5" />
                          إنهاء المعاينة
                        </button>
                      )}
                    </div>
                  )}

                  {isToday && !history && !started && (
                    <div className="mt-3 rounded-2xl bg-forest-soft p-3 text-center text-[11px] font-semibold text-forest">
                      لديك معاينة اليوم الساعة {formatBookingTime(booking.visit_time)}
                    </div>
                  )}

                  {!history && !started && (
                    <button
                      type="button"
                      onClick={() => setCancelId(booking.id)}
                      disabled={cancel.isPending}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-terracotta-soft py-2.5 text-xs font-bold text-terracotta disabled:opacity-50"
                    >
                      <XCircle className="size-4" /> إلغاء المعاينة
                    </button>
                  )}
                </article>
              );
            };

            return (
              <div className="space-y-6">
                <section>
                  <div className="mb-2.5 flex items-end justify-between">
                    <div>
                      <h2 className="font-display text-sm font-extrabold">المعاينات النشطة</h2>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        المواعيد الحالية والقادمة
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      {activeBookings.length}
                    </span>
                  </div>

                  {activeBookings.length ? (
                    <div className="space-y-3">
                      {activeBookings.map((booking: any) => renderBooking(booking))}
                    </div>
                  ) : (
                    <div className="rounded-3xl bg-surface p-4 text-center text-xs text-muted-foreground ring-1 ring-line">
                      لا توجد معاينات نشطة.
                    </div>
                  )}
                </section>

                {historyBookings.length > 0 && (
                  <section className="border-t border-line pt-5">
                    <div className="mb-2.5 flex items-end justify-between">
                      <div>
                        <h2 className="font-display text-sm font-extrabold">سجل المعاينات</h2>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          المعاينات المنتهية والمكتملة والملغاة
                        </p>
                      </div>
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        {historyBookings.length}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {historyBookings.map((booking: any) => renderBooking(booking, true))}
                    </div>
                  </section>
                )}
              </div>
            );
          })()
        ) : (
          <EmptyState
            icon={CalendarDays}
            title="لا توجد حجوزات حتى الآن"
            description="عندما تطلب معاينة عقار ستظهر جميع الحجوزات هنا."
            action={
              <Link
                to="/properties"
                className="rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-background"
              >
                تصفح العقارات
              </Link>
            }
          />
        )}
      </main>
      <BottomNav />
      <CancelReasonModal
        open={!!cancelId}
        pending={cancel.isPending}
        onClose={() => {
          if (!cancel.isPending) setCancelId(null);
        }}
        onConfirm={(reason) => {
          if (cancelId) cancel.mutate({ id: cancelId, reason });
        }}
      />

      {(() => {
        const selected = data.find((booking: any) => booking.id === editId) ?? null;
        if (!selected) return null;

        return (
          <EditViewingBookingModal
            open={!!editId}
            pending={edit.isPending}
            visitDate={String(selected.visit_date ?? "")}
            visitTime={String(selected.visit_time ?? "")}
            contactPhone={String(selected.contact_phone ?? "")}
            onClose={() => {
              if (!edit.isPending) setEditId(null);
            }}
            onConfirm={(values) => {
              edit.mutate({
                id: selected.id,
                ...values,
              });
            }}
          />
        );
      })()}

      <CompleteViewingReasonModal
        open={!!finishId}
        pending={finish.isPending}
        onClose={() => {
          if (!finish.isPending) setFinishId(null);
        }}
        onConfirm={(reason) => {
          if (finishId) finish.mutate({ id: finishId, reason });
        }}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold",
        status === "accepted" || status === "completed"
          ? "bg-forest-soft text-forest"
          : status === "rejected" || status === "cancelled"
            ? "bg-terracotta-soft text-terracotta"
            : status === "appointment_ended"
              ? "bg-sand text-muted-foreground"
              : "bg-sand text-muted-foreground",
      )}
    >
      {BOOKING_STATUS[status] ?? status}
    </span>
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
