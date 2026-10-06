import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth, type AppRole } from "@/lib/auth";

export function homeForRoles(roles: AppRole[]): string {
  if (roles.includes("office")) return "/office";
  if (roles.includes("admin")) return "/admin";
  return "/home";
}

type Props = {
  allow: AppRole[];
  guestsTo?: string;
  children: ReactNode;
};

export function RoleGuard({ allow, guestsTo, children }: Props) {
  const navigate = useNavigate();
  const { roles, session, data, isLoading } = useAuth();

  // وجود بيانات سابقة كافٍ لعرض الصفحة.
  // isFetching قد يكون مجرد تحديث خلفي، ولا يجوز أن يخفي الواجهة.
  const settled = !isLoading || !!data;
  const isGuest = settled && !session;
  const allowed = allow.some((r) => roles.includes(r));
  const effectiveRoles: AppRole[] = roles.length ? roles : ["individual"];
  const blocked = settled && !!session && !allowed;

  useEffect(() => {
    if (isGuest && guestsTo) {
      navigate({ to: guestsTo, replace: true });
      return;
    }
    if (blocked) {
      navigate({ to: homeForRoles(effectiveRoles), replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGuest, blocked, guestsTo, roles.join(",")]);

  if (!settled || blocked || (isGuest && guestsTo)) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="size-6 animate-spin text-forest" />
      </div>
    );
  }

  return <>{children}</>;
}
