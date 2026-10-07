import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth, type AppRole } from "@/lib/auth";

export function homeForRoles(roles: AppRole[]): string {
  if (roles.includes("admin")) return "/admin";
  if (roles.includes("office")) return "/office";
  return "/home";
}

type Props = {
  allow: AppRole[];
  guestsTo?: string;
  children: ReactNode;
};

export function RoleGuard({ allow, guestsTo, children }: Props) {
  const navigate = useNavigate();
  const { roles, session, isLoading, isError, error, refetch } = useAuth();

  const settled = !isLoading;
  const isGuest = settled && !session;
  const allowed = allow.some((r) => roles.includes(r));
  const unknownRole = settled && !!session && roles.length === 0;
  const blocked = settled && !!session && !unknownRole && !allowed;

  if (isError && !guestsTo) return <>{children}</>;

  useEffect(() => {
    if (isGuest && guestsTo) {
      navigate({ to: guestsTo, replace: true });
      return;
    }

    if (blocked && roles.length > 0) {
      navigate({ to: homeForRoles(roles), replace: true });
    }
  }, [isGuest, blocked, guestsTo, roles, navigate]);

  if ((isError || unknownRole) && guestsTo) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-5">
        <div className="max-w-md text-center">
          <h2 className="font-display text-lg font-extrabold">تعذر التحقق من الحساب</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {isError
              ? error instanceof Error
                ? error.message
                : "حدث خطأ أثناء تحميل صلاحيات الحساب."
              : "لم يتم العثور على دور صالح لهذا الحساب."}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-5 rounded-2xl bg-forest px-5 py-3 text-sm font-bold text-background"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  if (!settled || blocked || (isGuest && guestsTo)) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="size-6 animate-spin text-forest" />
      </div>
    );
  }

  return <>{children}</>;
}
