import { RoleGuard } from "@/lib/role-guard";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarDays, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { EmptyState, ListSkeleton } from "@/components/EmptyState";
import { useAuth } from "@/lib/auth";
import { BOOKING_STATUS } from "@/lib/constants";
import { formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CancelReasonModal } from "@/components/CancelReasonModal";
import { isSaudiAppointmentStarted, formatBookingTime } from "@/lib/saudi-time";

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
    queryKey: ["bookings", userId],
    enabled: !!userId,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("viewing_bookings")
        .select(
          "id,property_id,office_id,visit_date,visit_time,status,office_note,cancel_reason,contact_phone,created_at,properties(title,price,neighborhood),offices(name,phone,whatsapp)",
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
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc(
        "set_viewing_booking_status" as never,
        { _booking_id: id, _status: "completed" } as never,
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("المعاينة انتهت");
      void qc.invalidateQueries({ queryKey: ["bookings"] });
      void qc.invalidateQueries({ queryKey: ["unread-notifications"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "تعذّر إنهاء المعاينة"),
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
          <div className="space-y-3">
            {data.map((booking: any) => {
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

              return (
                <div key={booking.id} className="rounded-3xl bg-surface p-4 ring-1 ring-line">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-display text-sm font-extrabold">
                        {property?.title ?? "عقار"}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {office?.name ?? "مكتب عقاري"}
                      </div>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Info label="تاريخ المعاينة">{formatDate(booking.visit_date)}</Info>
                    <Info label="الوقت">{String(booking.visit_time).slice(0, 5)}</Info>
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

                  {booking.cancel_reason && booking.status === "cancelled" && (
                    <div className="mt-3 rounded-2xl bg-terracotta-soft p-3 text-xs leading-6 text-terracotta">
                      سبب الإلغاء: {booking.cancel_reason}
                    </div>
                  )}

                  {(booking.status === "pending" || booking.status === "accepted") && (
                    <button
                      type="button"
                      onClick={() => setCancelId(booking.id)}
                      disabled={cancel.isPending}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-terracotta-soft py-2.5 text-xs font-bold text-terracotta disabled:opacity-50"
                    >
                      <XCircle className="size-4" /> إلغاء المعاينة
                    </button>
                  )}

                  {booking.status === "accepted" &&
                    isSaudiAppointmentStarted(booking.visit_date, booking.visit_time) && (
                      <button
                        type="button"
                        onClick={() => finish.mutate(booking.id)}
                        disabled={finish.isPending}
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-forest py-2.5 text-xs font-bold text-background disabled:opacity-50"
                      >
                        <CheckCircle2 className="size-4" /> إنهاء المعاينة
                      </button>
                    )}

                  {booking.status === "accepted" && (
                    <div className="mt-2 text-center text-[11px] text-muted-foreground">
                      موعدك الساعة {formatBookingTime(booking.visit_time)}
                    </div>
                  )}

                  {booking.status === "completed" && (
                    <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-forest-soft py-2.5 text-xs font-bold text-forest">
                      <CheckCircle2 className="size-4" /> المعاينة انتهت
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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
