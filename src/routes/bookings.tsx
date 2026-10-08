import { RoleGuard } from "@/lib/role-guard";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  Ruler,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { EmptyState, ListSkeleton } from "@/components/EmptyState";
import { useAuth } from "@/lib/auth";
import { BOOKING_STATUS, kindLabel, listingLabel } from "@/lib/constants";
import { formatArea, formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CancelReasonModal } from "@/components/CancelReasonModal";
import { CompleteViewingReasonModal } from "@/components/CompleteViewingReasonModal";
import { EditViewingBookingModal } from "@/components/EditViewingBookingModal";
import { isSaudiAppointmentToday, formatBookingTime } from "@/lib/saudi-time";

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
    const timer = window.setInterval(() => setNow(new Date()), 1000);
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
          "id,property_id,office_id,visit_date,visit_time,status,office_note,cancel_reason,contact_phone,created_at,properties(id,property_number,title,price,area,kind,listing,neighborhood,cover_url,images_count,governorates(name_ar)),offices(name,phone,whatsapp)",
        )
        .eq("user_id", userId!)
        .neq("status", "completed")
        .order("visit_date", { ascending: true })
        .order("visit_time", { ascending: true })
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
                : error.message
          : "تعذّر تعديل حجز المعاينة",
      ),
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
            : error.message === "appointment_not_started"
              ? "لا يمكن إنهاء المعاينة قبل موعدها"
              : error.message
          : "تعذّر إنهاء المعاينة",
      ),
  });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <AppHeader showSearch={false} />
      <main className="flex-1 space-y-4 px-4 py-4">
        <div>
          <h1 className="font-display text-xl font-extrabold">حجوزات المعاينة</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            حجوزاتك القادمة والنشطة. بعد إنهاء المعاينة تُزال تلقائيًا من هذه الصفحة.
          </p>
        </div>

        {isLoading ? (
          <ListSkeleton />
        ) : data.length ? (
          <div className="space-y-4">
            {data.map((booking: any) => {
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
              const office = booking.offices as {
                name: string;
                phone: string | null;
                whatsapp: string | null;
              } | null;
              const isToday = isSaudiAppointmentToday(booking.visit_date, now);

              return (
                <article key={booking.id} className="overflow-hidden rounded-[28px] bg-surface ring-1 ring-line">
                  {property?.id ? (
                    <Link to="/properties/$propertyId" params={{ propertyId: property.id }} className="block">
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

                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-[10px] font-semibold text-muted-foreground">
                              العقار المحجوز لمعاينته
                            </div>
                            <h2 className="mt-1 font-display text-base font-extrabold leading-6">
                              {property.title || "عقار"}
                            </h2>
                          </div>
                          <span className="shrink-0 rounded-full bg-terracotta px-2.5 py-1 text-[10px] font-bold text-background">
                            {listingLabel(property.listing)}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-2">
                          <div className="font-display text-lg font-extrabold text-forest">
                            {formatPrice(property.price)} <span className="text-xs">ر.س</span>
                          </div>
                          <div className="rounded-full bg-sand px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
                            {kindLabel(property.kind)}
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <Info label="الحي">
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin className="size-3.5 text-terracotta" />
                              {property.neighborhood || "—"}
                            </span>
                          </Info>
                          <Info label="المساحة">
                            <span className="inline-flex items-center gap-1.5">
                              <Ruler className="size-3.5 text-terracotta" />
                              {property.area != null ? formatArea(property.area) : "—"}
                            </span>
                          </Info>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                          <span>رقم العقار: {property.property_number || "—"}</span>
                          {property.governorates?.name_ar && <span>· {property.governorates.name_ar}</span>}
                        </div>

                        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-forest-soft px-3 py-2.5 text-xs font-semibold text-forest">
                          <Building2 className="size-4 shrink-0" />
                          <span className="truncate">{office?.name ?? "مكتب عقاري"}</span>
                        </div>
                      </div>
                    </Link>
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
                      <StatusBadge status={booking.status} />
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

                    {booking.cancel_reason && booking.status === "cancelled" && (
                      <div className="mt-3 rounded-2xl bg-terracotta-soft p-3 text-xs leading-6 text-terracotta">
                        سبب الإلغاء: {booking.cancel_reason}
                      </div>
                    )}

                    {(booking.status === "pending" || booking.status === "accepted") && !isToday && (
                      <div className="mt-3">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setEditId(booking.id)}
                            disabled={edit.isPending || started}
                            className="flex items-center justify-center gap-2 rounded-2xl bg-sand py-3.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-45"
                            title={started ? "لا يمكن تعديل المعاينة بعد بدء الموعد" : "تعديل التاريخ أو الوقت أو وسيلة الاتصال"}
                          >
                            تعديل المعاينة
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (booking.status === "accepted" && started) setFinishId(booking.id);
                            }}
                            disabled={finish.isPending || booking.status !== "accepted" || !started}
                            className="flex items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 text-xs font-bold text-background disabled:cursor-not-allowed disabled:opacity-40"
                            title={
                              booking.status !== "accepted"
                                ? "تنتظر قبول المكتب للمعاينة"
                                : !started
                                  ? "يصبح متاحًا تلقائيًا عند بدء موعد المعاينة"
                                  : "إنهاء المعاينة"
                            }
                          >
                            <CheckCircle2 className="size-4" />
                            إنهاء المعاينة
                          </button>
                        </div>

                        <p className="mt-2 text-center text-[11px] text-muted-foreground">
                          {!started
                            ? "يمكنك تعديل التاريخ أو الوقت أو وسيلة الاتصال قبل بدء الموعد. سيصبح إنهاء المعاينة متاحًا تلقائيًا عند بدء الموعد بعد قبول المكتب."
                            : booking.status === "accepted"
                              ? "يمكنك الآن إنهاء المعاينة وكتابة السبب لإرساله للمكتب."
                              : "انتظر قبول المكتب قبل إنهاء المعاينة."}
                        </p>
                      </div>
                    )}

                    {booking.status === "pending" || booking.status === "accepted" ? (
                      <button
                        type="button"
                        onClick={() => setCancelId(booking.id)}
                        disabled={cancel.isPending}
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-terracotta-soft py-3 text-xs font-bold text-terracotta disabled:opacity-50"
                      >
                        <XCircle className="size-4" /> إلغاء المعاينة
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={CalendarDays}
            title="لا توجد حجوزات معاينة"
            description="عندما تحجز معاينة ستظهر هنا كالعقار نفسه مع موعده وحالته."
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
