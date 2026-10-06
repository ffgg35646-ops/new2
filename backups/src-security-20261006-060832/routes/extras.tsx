import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  Building2,
  ChevronLeft,
  ClipboardList,
  Crown,
  Heart,
  MessageSquare,
  QrCode,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { ProLockDialog, CHAT_LOCK_MESSAGE, PRO_LOCK_MESSAGE } from "@/components/ProLock";
import { RoleGuard } from "@/lib/role-guard";
import { useMyPlan } from "@/lib/plans";

export const Route = createFileRoute("/extras")({
  head: () => ({
    meta: [
      { title: "الإضافات | عقار البطين" },
      {
        name: "description",
        content:
          "المميزات والخدمات الإضافية في عقار البطين: إشعارات المكاتب، المفضلة، الطلبات، الدردشة، والباقات.",
      },
      { property: "og:title", content: "الإضافات | عقار البطين" },
      {
        property: "og:description",
        content: "كل الخدمات الإضافية المرتبطة بحسابك وعقاراتك في مكان واحد.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RoleGuard allow={["individual", "office", "admin"]}>
      <ExtrasPage />
    </RoleGuard>
  ),
});

function ExtrasPage() {
  const { isPro } = useMyPlan();
  const [lock, setLock] = useState<string | null>(null);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <AppHeader showSearch={false} />

      <main className="flex-1 space-y-5 px-4 py-4">
        <header>
          <h1 className="font-display text-xl font-extrabold">الإضافات</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            خدمات ومميزات إضافية مرتبطة بحسابك وعقاراتك.
          </p>
        </header>

        <section className="space-y-2">
          <h2 className="px-1 font-display text-sm font-extrabold">متاحة لك</h2>
          <Row to="/chats" icon={MessageSquare} label="محادثاتي مع المكاتب" />
          <Row to="/offices/following" icon={Bell} label="إشعارات المكاتب التي أتابعها" />
          <Row to="/properties" icon={Building2} label="جميع العقارات" />
          <Row to="/favorites" icon={Heart} label="المفضلة" />
          <Row to="/request" icon={ClipboardList} label="طلباتي العقارية" />
          <Row to="/plans" icon={Sparkles} label="الباقات" />
        </section>

        <section className="space-y-2">
          <h2 className="px-1 font-display text-sm font-extrabold">
            مميزات الباقة الاحترافية {!isPro && "🔒"}
          </h2>

          <LockRow
            icon={MessageSquare}
            label="الدردشة المباشرة مع العملاء"
            to="/office/chat"
            locked={!isPro}
            onLocked={() => setLock(CHAT_LOCK_MESSAGE)}
          />
          <LockRow
            icon={QrCode}
            label="QR Code للمكتب والعقارات"
            to="/office/profile"
            locked={!isPro}
            onLocked={() => setLock(PRO_LOCK_MESSAGE)}
          />
          <LockRow
            icon={Crown}
            label="لوحة إحصائيات متقدمة"
            to="/office"
            locked={!isPro}
            onLocked={() => setLock(PRO_LOCK_MESSAGE)}
          />
        </section>

        <ProLockDialog
          open={lock !== null}
          onClose={() => setLock(null)}
          message={lock ?? PRO_LOCK_MESSAGE}
        />
      </main>

      <BottomNav />
    </div>
  );
}

function Row({ to, icon: Icon, label }: { to: string; icon: typeof Heart; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-2xl bg-surface p-3.5 ring-1 ring-line">
      <Icon className="size-[18px] text-terracotta" />
      <span className="text-sm">{label}</span>
      <ChevronLeft className="ms-auto size-4 text-muted-foreground" />
    </Link>
  );
}

function LockRow({
  to,
  icon: Icon,
  label,
  locked,
  onLocked,
}: {
  to: string;
  icon: typeof Heart;
  label: string;
  locked: boolean;
  onLocked: () => void;
}) {
  if (!locked) return <Row to={to} icon={Icon} label={label} />;
  return (
    <button
      onClick={onLocked}
      className="flex w-full items-center gap-3 rounded-2xl bg-surface p-3.5 text-right ring-1 ring-line"
    >
      <Icon className="size-[18px] text-muted-foreground" />
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="ms-auto text-sm">🔒</span>
    </button>
  );
}
