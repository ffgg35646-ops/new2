import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, ChevronDown, MapPin, Search } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { homeForRoles } from "@/lib/role-guard";
import { useSelectedGovernorate } from "@/lib/governorate";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppHeader({ showSearch = true }: { showSearch?: boolean }) {
  const navigate = useNavigate();
  const { userId, roles, isOffice, officeId } = useAuth();
  const { governorates, governorate, select } = useSelectedGovernorate();

  const { data: officeGovernorate } = useQuery({
    queryKey: ["office-governorate", officeId],
    enabled: isOffice && !!officeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offices")
        .select("governorate_id, governorates(name_ar)")
        .eq("id", officeId!)
        .maybeSingle();
      if (error) throw error;
      return (data?.governorates as { name_ar: string } | null)?.name_ar ?? null;
    },
    staleTime: 5 * 60_000,
  });

  const { data: unread = 0 } = useQuery({
    queryKey: ["unread-notifications", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false);
      return count ?? 0;
    },
    refetchInterval: 60_000,
  });

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-background/95 backdrop-blur-sm">
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <Link to={homeForRoles(roles)} className="flex shrink-0 items-center gap-2">
          <BrandLogo size={36} />
          <div className="leading-tight">
            <div className="font-display text-[15px] font-extrabold">عقار البطين</div>
            <div className="-mt-0.5 text-[9px] text-muted-foreground">وجهتك الأولى للعقار</div>
          </div>
        </Link>

        {isOffice ? (
          <span className="ms-auto flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 ring-1 ring-line">
            <MapPin className="size-3.5 text-terracotta" />
            <span className="text-sm">{officeGovernorate ?? "—"}</span>
          </span>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger className="ms-auto flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 ring-1 ring-line">
              <span className="text-sm">{governorate?.name_ar ?? "اختر محافظتك"}</span>
              <ChevronDown className="size-3.5 text-terracotta" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {governorates.map((g) => (
                <DropdownMenuItem key={g.id} onSelect={() => void select(g.id)}>
                  {g.name_ar}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Link
          to="/notifications"
          aria-label="الإشعارات"
          className="relative grid size-9 place-items-center rounded-full bg-surface ring-1 ring-line"
        >
          <Bell className="size-[18px] text-muted-foreground" />
          {unread > 0 && (
            <span className="absolute top-1.5 left-2 size-1.5 rounded-full bg-terracotta" />
          )}
        </Link>
      </div>

      {showSearch && (
        <div className="px-4 pb-3">
          <button
            onClick={() => navigate({ to: "/search" })}
            className="flex w-full items-center gap-2 rounded-2xl bg-surface px-3 py-2.5 text-right ring-1 ring-line"
          >
            <Search className="size-[18px] text-muted-foreground" />
            <span className="text-sm text-muted-foreground">ابحث عن حي، سعر، مساحة…</span>
          </button>
        </div>
      )}
    </header>
  );
}
