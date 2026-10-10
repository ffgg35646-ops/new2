import {
  createFileRoute,
  Link,
} from "@tanstack/react-router";
import {
  Building2,
  CheckCircle2,
  Clock3,
  LogOut,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useAuth, signOut } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/office/status")({
  head: () => ({
    meta: [
      { title: "حالة حساب المكتب | عقار البطين" },
      {
        name: "description",
        content:
          "تابع حالة طلب تسجيل مكتبك العقاري.",
      },
    ],
  }),
  component: OfficeStatusPage,
});

function OfficeStatusPage() {
  const qc = useQueryClient();

  const {
    session,
    isOffice,
    officeVerificationStatus,
    officeRejectionReason,
    isLoading,
    isFetching,
  } = useAuth();

  async function refresh() {
    await qc.invalidateQueries({
      queryKey: ["session"],
    });
  }

  async function logout() {
    await signOut();

    await qc.invalidateQueries({
      queryKey: ["session"],
    });
  }

  if (isLoading || isFetching) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <RefreshCw className="size-6 animate-spin text-forest" />
      </div>
    );
  }

  if (!session || !isOffice) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-5 text-center">
        <Building2 className="size-12 text-forest" />

        <h1 className="mt-4 font-display text-2xl font-extrabold">
          حساب مكتب عقاري
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          سجّل دخولك بحساب المكتب لمتابعة حالة الطلب.
        </p>

        <Link
          to="/auth/office"
          className="mt-6 rounded-2xl bg-forest px-6 py-3 text-sm font-bold text-background"
        >
          تسجيل دخول المكتب
        </Link>
      </div>
    );
  }

  if (officeVerificationStatus === "verified") {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-5 text-center">
        <CheckCircle2 className="size-14 text-forest" />

        <h1 className="mt-5 font-display text-2xl font-extrabold">
          تم اعتماد حساب المكتب
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          
          وإدارة العقارات والطلبات.
        </p>

        <Link
          to="/office"
          className="mt-6 rounded-2xl bg-forest px-6 py-3 text-sm font-bold text-background"
        >
          دخول لوحة المكتب
        </Link>

        <button
          onClick={() => void logout()}
          className="mt-3 flex items-center gap-2 rounded-2xl bg-surface px-6 py-3 text-sm font-bold ring-1 ring-line"
        >
          <LogOut className="size-4" />
          تسجيل الخروج
        </button>
      </div>
    );
  }

  if (officeVerificationStatus === "rejected") {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-5 text-center">
        <XCircle className="size-14 text-destructive" />

        <h1 className="mt-5 font-display text-2xl font-extrabold">
          تم رفض طلب المكتب
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          لا يمكنك استخدام حساب المكتب حاليًا.
        </p>

        {officeRejectionReason && (
          <div className="mt-5 w-full rounded-2xl bg-destructive/5 p-4 text-right ring-1 ring-destructive/10">
            <div className="text-xs font-bold text-destructive">
              سبب الرفض
            </div>

            <p className="mt-1.5 text-sm leading-relaxed">
              {officeRejectionReason}
            </p>
          </div>
        )}

        <button
          onClick={() => void refresh()}
          className="mt-6 flex items-center gap-2 rounded-2xl bg-surface px-6 py-3 text-sm font-bold ring-1 ring-line"
        >
          <RefreshCw className="size-4" />
          تحديث الحالة
        </button>

        <button
          onClick={() => void logout()}
          className="mt-3 flex items-center gap-2 rounded-2xl bg-surface px-6 py-3 text-sm font-bold ring-1 ring-line"
        >
          <LogOut className="size-4" />
          تسجيل الخروج
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-5 text-center">
      <Clock3 className="size-14 text-terracotta" />

      <h1 className="mt-5 font-display text-2xl font-extrabold">
        طلبك قيد المراجعة
      </h1>

      

      <div className="mt-5 w-full rounded-2xl bg-sand p-4 text-right">
        <div className="text-sm font-bold">
          لا يمكنك استخدام لوحة المكتب الآن
        </div>

        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          
          والطلبات من لوحة المكتب.
        </p>
      </div>

      <button
        onClick={() => void refresh()}
        className="mt-6 flex items-center gap-2 rounded-2xl bg-forest px-6 py-3 text-sm font-bold text-background"
      >
        <RefreshCw className="size-4" />
        تحديث حالة الطلب
      </button>

      <button
        onClick={() => void logout()}
        className="mt-3 flex items-center gap-2 rounded-2xl bg-surface px-6 py-3 text-sm font-bold ring-1 ring-line"
      >
        <LogOut className="size-4" />
        تسجيل الخروج
      </button>
    </div>
  );
}
