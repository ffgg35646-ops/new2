import { RoleGuard } from "@/lib/role-guard";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bell,
  Building2,
  Crown,
  Sparkles,
  CalendarDays,
  ChevronLeft,
  Heart,
  LogOut,
  Moon,
  ShieldCheck,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { EmptyState } from "@/components/EmptyState";
import { useAuth, signOut } from "@/lib/auth";
import { useSelectedGovernorate } from "@/lib/governorate";
import { BOOKING_STATUS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { SupportCenter } from "@/components/SupportCenter";
import { ProfileModal } from "@/components/ProfileModal";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "حسابي | عقار البطين" },
      { name: "description", content: "بياناتك، حجوزات المعاينة، والمكاتب التي تتابعها." },
      { property: "og:title", content: "حسابي | عقار البطين" },
      { property: "og:description", content: "إدارة حسابك وحجوزاتك في عقار البطين." },
    ],
  }),
  component: () => (
    <RoleGuard allow={["individual", "admin"]}>
      <AccountPage />
    </RoleGuard>
  ),
});

function AccountPage() {
  const navigate = useNavigate();
  const { userId, profile, session, isAdmin, isOffice } = useAuth();
  const { governorate } = useSelectedGovernorate();
  const [dark, setDark] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const supportTicketId =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("support")
      : null;

  useEffect(() => {
    const saved = localStorage.getItem("ofoq-theme") === "dark";
    setDark(saved);
    document.documentElement.classList.toggle("dark", saved);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    localStorage.setItem("ofoq-theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  }

  const qc = useQueryClient();
  const cancelBooking = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("viewing_bookings")
        .update({ status: "cancelled" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم إلغاء الحجز");
      void qc.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "تعذّر إلغاء الحجز"),
  });

  const { data: bookings } = useQuery({
    queryKey: ["bookings", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("viewing_bookings")
        .select("id,visit_date,visit_time,status,properties(title),offices(name)")
        .order("visit_date", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <AppHeader showSearch={false} />
      <main className="flex-1 space-y-5 px-4 py-4">
        {!userId ? (
          <EmptyState
            icon={User}
            title="لم تسجّل الدخول بعد"
            description="سجّل الدخول للوصول لحجوزاتك ومفضلتك وطلباتك."
            action={
              <Link
                to="/auth/individual"
                className="rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-background"
              >
                تسجيل الدخول
              </Link>
            }
          />
        ) : (
          <>
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="flex w-full items-center gap-3 rounded-3xl bg-surface p-4 text-right ring-1 ring-line"
            >
              <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-forest-soft font-display text-xl font-extrabold text-forest">
                {(profile?.full_name || session?.user?.email || "؟").charAt(0)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="font-display text-base font-bold">
                  {profile?.full_name || "بدون اسم"}
                </div>
                <div className="mt-1 text-xs font-semibold text-forest">
                  الملف الشخصي
                </div>
              </div>

              <ChevronLeft className="size-5 text-muted-foreground" />
            </button>

            <ProfileModal
              open={profileOpen}
              onClose={() => setProfileOpen(false)}
              email={session?.user?.email ?? profile?.email ?? ""}
              emailVerified={!!session?.user?.email_confirmed_at}
              rows={[
                ["الاسم الكامل", profile?.full_name ?? "—"],
                ["رقم الجوال", profile?.phone ?? "—"],
                ["المحافظة", governorate?.name_ar ?? "—"],
              ].map(([label, value]) => ({ label, value }))}
            />

            <section className="space-y-2">
              <NavRow to="/favorites" icon={Heart} label="المفضلة" />
              <NavRow to="/request" icon={CalendarDays} label="طلباتي العقارية" />
              <NavRow to="/offices" icon={Building2} label="المكاتب العقارية" />
              <NavRow
                to="/offices/following"
                icon={Bell}
                label="المكاتب التي أتابعها · إشعارات المكاتب"
              />
              <NavRow to="/properties" icon={Building2} label="جميع العقارات" />
              <NavRow to="/extras" icon={Sparkles} label="الإضافات" />
              <button
                type="button"
                onClick={() => setSupportOpen(true)}
                className="flex w-full items-center gap-3 rounded-2xl bg-surface p-3.5 text-right ring-1 ring-line"
              >
                <Bell className="size-[18px] text-terracotta" />
                <span className="text-sm">تواصل مع الدعم</span>
                <ChevronLeft className="ms-auto size-4 text-muted-foreground" />
              </button>

              <NavRow to="/plans" icon={Crown} label="الباقات" />

              {isOffice && <NavRow to="/office" icon={Building2} label="لوحة مكتبي" />}
              {isAdmin && <NavRow to="/admin" icon={ShieldCheck} label="لوحة الإدارة" />}
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-extrabold">حجوزات المعاينة</h2>
              {bookings?.length ? (
                <div className="space-y-2.5">
                  {bookings.map((b) => (
                    <div key={b.id} className="rounded-2xl bg-surface p-3.5 ring-1 ring-line">
                      <div className="flex items-center justify-between">
                        <span className="truncate text-sm font-bold">
                          {(b.properties as { title: string } | null)?.title}
                        </span>
                        <span className="shrink-0 rounded-full bg-terracotta-soft px-2 py-0.5 text-[10px] font-semibold text-terracotta">
                          {BOOKING_STATUS[b.status]}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {(b.offices as { name: string } | null)?.name} · {formatDate(b.visit_date)}{" "}
                        · {String(b.visit_time).slice(0, 5)}
                      </div>
                      {b.status === "pending" && (
                        <button
                          onClick={() => cancelBooking.mutate(b.id)}
                          disabled={cancelBooking.isPending}
                          className="mt-2 w-full rounded-xl bg-terracotta-soft py-2 text-xs font-bold text-terracotta disabled:opacity-50"
                        >
                          إلغاء الحجز
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">لا توجد حجوزات حتى الآن.</p>
              )}
            </section>

            <button
              onClick={toggleTheme}
              className="flex w-full items-center gap-3 rounded-2xl bg-surface p-3.5 ring-1 ring-line"
            >
              <Moon className="size-[18px] text-terracotta" />
              <span className="text-sm">الوضع الليلي</span>
              <span className="ms-auto text-xs text-muted-foreground">
                {dark ? "مفعّل" : "معطّل"}
              </span>
            </button>

            <button
              onClick={async () => {
                await signOut();
                navigate({ to: "/" });
              }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-surface py-3.5 text-sm font-bold text-destructive ring-1 ring-line"
            >
              <LogOut className="size-4" /> تسجيل الخروج
            </button>
          </>
        )}
      </main>
      <SupportCenter
        open={supportOpen || !!supportTicketId}
        initialTicketId={supportTicketId}
        onClose={() => setSupportOpen(false)}
      />

      <BottomNav />
    </div>
  );
}

function NavRow({ to, icon: Icon, label }: { to: string; icon: typeof Heart; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-2xl bg-surface p-3.5 ring-1 ring-line">
      <Icon className="size-[18px] text-terracotta" />
      <span className="text-sm">{label}</span>
      <ChevronLeft className="ms-auto size-4 text-muted-foreground" />
    </Link>
  );
}
