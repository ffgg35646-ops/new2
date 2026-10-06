import {
  createFileRoute,
  Link,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth/admin")({
  head: () => ({
    meta: [
      { title: "دخول الإدارة | عقار البطين" },
      {
        name: "description",
        content:
          "تسجيل دخول المشرف إلى لوحة إدارة عقار البطين.",
      },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const { session, isAdmin, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isLoading && session && isAdmin) {
      navigate({ to: "/admin", replace: true });
    }
  }, [
    isLoading,
    session,
    isAdmin,
    navigate,
  ]);

  async function login() {
    setBusy(true);

    try {
      if (!email.trim() || !password) {
        throw new Error(
          "أدخل البريد الإلكتروني وكلمة المرور.",
        );
      }

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (error) throw error;

      if (!data.user) {
        throw new Error("تعذر تسجيل الدخول.");
      }

      const { data: roles, error: roleError } =
        await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id);

      if (roleError) throw roleError;

      const admin = (roles ?? []).some(
        (r) => r.role === "admin",
      );

      if (!admin) {
        await supabase.auth.signOut();
        throw new Error(
          "هذا الحساب ليس لديه صلاحية دخول لوحة الإدارة.",
        );
      }

      toast.success("تم تسجيل دخول الإدارة");
      navigate({
        to: "/admin",
        replace: true,
      });
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : "تعذر تسجيل دخول الإدارة.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-8">
      <Link
        to="/"
        className="flex size-9 items-center justify-center rounded-full bg-surface ring-1 ring-line"
      >
        <ArrowRight className="size-4" />
      </Link>

      <div className="mt-10 flex justify-center">
        <div className="grid size-16 place-items-center rounded-3xl bg-forest text-background">
          <ShieldCheck className="size-8" />
        </div>
      </div>

      <div className="mt-5 text-center">
        <h1 className="font-display text-2xl font-extrabold">
          دخول الإدارة
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          لوحة التحكم الخاصة بالمشرفين.
        </p>
      </div>

      <div className="mt-8 space-y-3">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
            البريد الإلكتروني
          </span>

          <input
            type="email"
            dir="ltr"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            placeholder="admin@example.com"
            className="w-full rounded-2xl bg-surface px-4 py-3.5 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-forest"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
            كلمة المرور
          </span>

          <input
            type="password"
            dir="ltr"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            placeholder="••••••••"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                void login();
              }
            }}
            className="w-full rounded-2xl bg-surface px-4 py-3.5 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-forest"
          />
        </label>

        <button
          onClick={() => void login()}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 font-display font-bold text-background disabled:opacity-60"
        >
          {busy && (
            <Loader2 className="size-4 animate-spin" />
          )}
          دخول لوحة الإدارة
        </button>

        <Link
          to="/auth/forgot-password"
          className="block py-2 text-center text-xs font-semibold text-forest"
        >
          نسيت كلمة المرور؟
        </Link>
      </div>
    </div>
  );
}
