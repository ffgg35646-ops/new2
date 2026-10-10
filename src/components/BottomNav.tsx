import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useMyOffice } from "@/lib/office";
import {
  Building2,
  ClipboardList,
  Heart,
  Home,
  LayoutGrid,
  PlusCircle,
  MessageSquare,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Item = { to: string; label: string; icon: LucideIcon; primary?: boolean };

const individualItems: Item[] = [
  { to: "/home", label: "الرئيسية", icon: Home },
  { to: "/properties", label: "العقارات", icon: Building2 },
  { to: "/request", label: "اطلب", icon: PlusCircle, primary: true },
  { to: "/requests", label: "طلباتي", icon: ClipboardList },
  { to: "/chats", label: "الدردشة", icon: MessageSquare },
  { to: "/account", label: "حسابي", icon: User },
];

const officeItems: Item[] = [
  { to: "/office", label: "الرئيسية", icon: LayoutGrid },
  { to: "/office/properties", label: "عقاراتي", icon: Building2 },
  { to: "/office/properties/new", label: "إضافة", icon: PlusCircle, primary: true },
  { to: "/office/chat", label: "الدردشة", icon: MessageSquare },
  { to: "/office/requests", label: "الطلبات", icon: ClipboardList },
  { to: "/office/profile", label: "الحساب", icon: User },
];

export function BottomNav({
  variant,
  fixed = false,
}: {
  variant?: "individual" | "office";
  fixed?: boolean;
}) {
  const { isOffice, userId } = useAuth();
  const resolved = variant ?? (isOffice ? "office" : "individual");
  const items = resolved === "office" ? officeItems : individualItems;
  const { data: membership } = useMyOffice();
  const officeId = resolved === "office" ? membership?.office?.id ?? null : null;
  const officeGovernorateId =
    resolved === "office" ? membership?.office?.governorate_id ?? null : null;

  const individualUserId = resolved === "individual" ? userId ?? null : null;

  const { data: individualRequestsCount = 0 } = useQuery({
    queryKey: ["individual-bottom-nav-request-count", individualUserId],
    enabled: !!individualUserId,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const [requestsResult, inquiryResult, acceptedInquiryResult] = await Promise.all([
        supabase
          .from("property_requests")
          .select("id,status,accepted_offer_id,office_offers(id,status)")
          .eq("user_id", individualUserId!)
          .limit(500),
        supabase
          .from("property_inquiries")
          .select("id", { count: "exact", head: true })
          .eq("user_id", individualUserId!)
          .eq("status", "new"),
        supabase
          .from("property_inquiries")
          .select("id", { count: "exact", head: true })
          .eq("user_id", individualUserId!)
          .eq("status", "accepted"),
      ]);

      if (requestsResult.error) throw requestsResult.error;
      if (inquiryResult.error) throw inquiryResult.error;
      if (acceptedInquiryResult.error) throw acceptedInquiryResult.error;

      const rows = (requestsResult.data ?? []) as Array<{
        id: string;
        status: string;
        accepted_offer_id?: string | null;
        office_offers?: Array<{ id: string; status: string }> | null;
      }>;
      const activeRequests = rows.filter(
        (request) => request.status === "active" && !request.accepted_offer_id,
      );
      const acceptedMarketRequests = rows.filter(
        (request) => request.status === "active" && !!request.accepted_offer_id,
      );
      const waitingOffers = rows.reduce((total, request) => {
        if (request.accepted_offer_id) return total;
        return total + (request.office_offers ?? []).filter(
          (offer) => ["sent", "pending"].includes(String(offer.status ?? "")),
        ).length;
      }, 0);

      return activeRequests.length
        + waitingOffers
        + acceptedMarketRequests.length
        + (inquiryResult.count ?? 0)
        + (acceptedInquiryResult.count ?? 0);
    },
  });


  const { data: individualUnreadMessages = 0 } = useQuery({
    queryKey: ["individual-bottom-nav-chat-count", individualUserId],
    enabled: !!individualUserId,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const { data: conversations, error: conversationError } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_id", individualUserId!)
        .limit(500);
      if (conversationError) throw conversationError;

      const conversationIds = (conversations ?? []).map((row) => row.id).filter(Boolean);
      if (!conversationIds.length) return 0;

      const { count, error } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in("conversation_id", conversationIds)
        .neq("sender_id", individualUserId!)
        .is("read_at", null);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: officeUnreadMessages = 0 } = useQuery({
    queryKey: ["office-bottom-nav-chat-count", officeId, userId],
    enabled: resolved === "office" && !!officeId && !!userId,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const { data: conversations, error: conversationError } = await supabase
        .from("conversations")
        .select("id")
        .eq("office_id", officeId!)
        .limit(500);
      if (conversationError) throw conversationError;

      const conversationIds = (conversations ?? []).map((row) => row.id).filter(Boolean);
      if (!conversationIds.length) return 0;

      const { count, error } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in("conversation_id", conversationIds)
        .neq("sender_id", userId!)
        .is("read_at", null);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: officeRequestsCount = 0 } = useQuery({
    queryKey: ["office-bottom-nav-request-count", officeId, officeGovernorateId],
    enabled: !!officeId,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const [bookingResult, inquiryResult, acceptedInquiryResult, marketRequests, acceptedMarketRequests] = await Promise.all([
        supabase
          .from("viewing_bookings")
          .select("id,status")
          .eq("office_id", officeId!)
          .limit(500),
        supabase
          .from("property_inquiries")
          .select("id", { count: "exact", head: true })
          .eq("office_id", officeId!)
          .eq("status", "new"),
        supabase
          .from("property_inquiries")
          .select("id", { count: "exact", head: true })
          .eq("office_id", officeId!)
          .eq("status", "accepted"),
        (async () => {
          if (!officeGovernorateId) return [];
          const { data, error } = await supabase.rpc("office_market_requests" as never);
          if (error) throw error;
          return Array.isArray(data) ? data : [];
        })(),
        (async () => {
          const { data, error } = await supabase.rpc("office_accepted_property_requests" as never);
          if (error) throw error;
          return Array.isArray(data) ? data : [];
        })(),
      ]);

      if (bookingResult.error) throw bookingResult.error;
      if (inquiryResult.error) throw inquiryResult.error;
      if (acceptedInquiryResult.error) throw acceptedInquiryResult.error;

      const activeBookings = (bookingResult.data ?? []).filter((booking: any) => {
        const status = String(booking.status ?? "").trim() || "pending";
        return ["pending", "accepted"].includes(status);
      }).length;

      return marketRequests.length + activeBookings + (inquiryResult.count ?? 0) + (acceptedInquiryResult.count ?? 0) + acceptedMarketRequests.length;
    },
  });

  return (
    <nav
      className={
        fixed
          ? "fixed inset-x-0 bottom-0 z-40 mx-auto grid w-full max-w-md auto-cols-fr grid-flow-col gap-1 border-t border-line bg-surface/95 px-2 py-2 backdrop-blur"
          : "sticky bottom-0 z-30 grid auto-cols-fr grid-flow-col gap-1 border-t border-line bg-surface/95 px-2 py-2 backdrop-blur"
      }
    >
      {items.map((item) => {
        const Icon = item.icon;
        if (item.primary) {
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col items-center gap-1 py-1.5 -mt-4"
            >
              <span className="grid size-12 place-items-center rounded-2xl bg-terracotta text-background ring-4 ring-background">
                <Icon className="size-6" />
              </span>
              <span className="text-[11px] font-semibold text-terracotta">{item.label}</span>
            </Link>
          );
        }
        return (
          <Link
            key={item.to}
            to={item.to}
            className="flex flex-col items-center gap-1 py-1.5 text-muted-foreground"
            activeProps={{ className: "text-forest [&_span]:font-semibold" }}
            activeOptions={{ exact: item.to === "/office" || item.to === "/home" }}
          >
            <span className="relative">
              <Icon className="size-5" />
              {item.to === "/office/requests" && officeRequestsCount > 0 && (
                <span className="absolute -top-1.5 -left-2 grid min-w-4 place-items-center rounded-full bg-terracotta px-1 text-[9px] font-bold text-background">
                  {officeRequestsCount > 99 ? "99+" : officeRequestsCount}
                </span>
              )}
              {item.to === "/office/chat" && officeUnreadMessages > 0 && (
                <span className="absolute -top-1.5 -left-2 grid min-w-4 place-items-center rounded-full bg-terracotta px-1 text-[9px] font-bold text-background">
                  {officeUnreadMessages > 99 ? "99+" : officeUnreadMessages}
                </span>
              )}
              {item.to === "/requests" && individualRequestsCount > 0 && (
                <span className="absolute -top-1.5 -left-2 grid min-w-4 place-items-center rounded-full bg-terracotta px-1 text-[9px] font-bold text-background">
                  {individualRequestsCount > 99 ? "99+" : individualRequestsCount}
                </span>
              )}
              {item.to === "/chats" && individualUnreadMessages > 0 && (
                <span className="absolute -top-1.5 -left-2 grid min-w-4 place-items-center rounded-full bg-terracotta px-1 text-[9px] font-bold text-background">
                  {individualUnreadMessages > 99 ? "99+" : individualUnreadMessages}
                </span>
              )}
            </span>
            <span className="text-[11px]">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
