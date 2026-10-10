import { RoleGuard } from "@/lib/role-guard";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Bell,
  Building2,
  CalendarDays,
  ChevronLeft,
  Heart,
  LogOut,
  Moon,
  ShieldCheck,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { EmptyState } from "@/components/EmptyState";
import { useAuth, signOut } from "@/lib/auth";
import { useSelectedGovernorate } from "@/lib/governorate";
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

  const profileName =
    profile?.full_name ||
    (typeof session?.user?.user_metadata?.full_name === "string"
      ? session.user.user_metadata.full_name
      : "") ||
    "بدون اسم";

  const profilePhone =
    profile?.phone ||
    session?.user?.phone ||
    (typeof session?.user?.user_metadata?.phone === "string"
      ? session.user.user_metadata.phone
      : "") ||
    "—";

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

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <AppHeader showSearch={false} />
      <main className="flex-1 space-y-5 px-4 py-4">
        {!userId ? (
          <EmptyState
            icon={User}
            title="لم تسجّل الدخول بعد"
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
              <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-full bg-forest-soft font-display text-xl font-extrabold text-forest ring-1 ring-line">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={"صورة " + profileName} className="size-full object-cover" />
                ) : (
                  (profileName || session?.user?.email || "؟").charAt(0)
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="font-display text-base font-bold">
                  {profileName}
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
              avatarUrl={profile?.avatar_url}
              userId={userId ?? undefined}
              canEditAvatar={!isAdmin && !isOffice && !!userId}
              rows={[
                ["الاسم الكامل", profileName],
                ["رقم الجوال", profilePhone],
                ["المحافظة", governorate?.name_ar ?? "—"],
              ].map(([label, value]) => ({
                label: String(label ?? ""),
                value: String(value ?? ""),
              }))}
            />

            <section className="space-y-2">
              <NavRow to="/favorites" icon={Heart} label="المفضلة" />
              <NavRow to="/requests" icon={CalendarDays} label="الطلبات" />
              <NavRow to="/bookings" icon={CalendarDays} label="حجوزات المعاينة" />
              <NavRow to="/offices" icon={Building2} label="المكاتب العقارية" />
              <NavRow to="/properties" icon={Building2} label="جميع العقارات" />
              <button
                type="button"
                onClick={() => setSupportOpen(true)}
                className="flex w-full items-center gap-3 rounded-2xl bg-surface p-3.5 text-right ring-1 ring-line"
              >
                <Bell className="size-[18px] text-terracotta" />
                <span className="text-sm">تواصل مع الدعم</span>
                <ChevronLeft className="ms-auto size-4 text-muted-foreground" />
              </button>


              {isOffice && <NavRow to="/office" icon={Building2} label="لوحة مكتبي" />}
              {isAdmin && <NavRow to="/admin" icon={ShieldCheck} label="لوحة الإدارة" />}
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
