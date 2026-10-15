import { RoleGuard } from "@/lib/role-guard";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Eye, EyeOff, QrCode, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { ListSkeleton } from "@/components/EmptyState";
import { QrDialog } from "@/components/QrDialog";
import { useAuth } from "@/lib/auth";
import { useMyOffice } from "@/lib/office";
import { kindLabel, listingLabel, rentPeriodLabel, stateLabel } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { useMyPlan } from "@/lib/plans";
import { getPublicAppUrl, PUBLIC_APP_URL_HELP } from "@/lib/public-app-url";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const paths = {
  home: <><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></>,
  tag: <><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="8.5" r="1" /></>,
  key: <path d="M14.7 6.3a4 4 0 0 0-5.4 5l-6 6V21h3.7l1-1v-2h2l1-1v-2l1.3-1.3a4 4 0 0 0 5-5.4l-2.5 2.5-2.1-2.1z" />,
  pause: <><circle cx="12" cy="12" r="9" /><path d="M10 9v6M14 9v6" /></>,
  chev: <path d="M6 9l6 6 6-6" />,
  left: <path d="M15 6l-6 6 6 6" />,
  bell: <><path d="M6 17V11a6 6 0 0 1 12 0v6l2 2H4z" /><path d="M10 21h4" /></>,
  pin: <><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></>,
  sort: <path d="M8 4v16M4 8l4-4 4 4M16 20V4M12 16l4 4 4-4" />,
  sliders: <><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></>,
  dots: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
  wallet: <><path d="M4 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4z" /><path d="M4 7l12-3v3" /><circle cx="16" cy="13.5" r="1" /></>,
  area: <path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" />,
  chat: <path d="M4 5h16v11H9l-5 4z" />,
  img: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.5" /><path d="M21 16l-5-5-8 9" /></>,
  edit: <><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M13 7l4 4" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  list: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" /></>,
  build: <><rect x="5" y="3" width="14" height="18" rx="1" /><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M3 21h18" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
};

function Icon({ name }: { name: keyof typeof paths }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

const MY_PROPERTIES_CSS = "\n.my-properties-screen{\n  --bg:#f4f2ee;--card:#fff;--ink:#1c2b25;--mute:#7a847f;--line:#e6e2da;\n  --green:#1f5a45;--green-soft:#e3efe8;--orange:#d9622b;--amber:#f3e3b5;--amber-ink:#8a6410;--ok-ink:#1f7a4d;\n  box-sizing:border-box;width:100%;max-width:430px;min-height:100vh;min-height:100dvh;margin:0 auto;\n  padding:calc(14px + env(safe-area-inset-top,0px)) 14px calc(110px + env(safe-area-inset-bottom,0px));\n  position:relative;background:var(--bg);color:var(--ink);font-family:'Tajawal','Segoe UI',Tahoma,sans-serif\n}\n.dark .my-properties-screen{--bg:#15191a;--card:#1f2523;--ink:#eef2ef;--mute:#9aa5a0;--line:#2f3835;--green:#3f8f70;--green-soft:#22382f;--amber:#3d3418;--amber-ink:#e9c76a;--ok-ink:#6fcf9b}\n.my-properties-screen *{box-sizing:border-box}\n.my-properties-screen svg{width:1em;height:1em;stroke:currentColor;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;flex:none}\n.my-properties-screen button{font:inherit;color:inherit;border:0;background:none;cursor:pointer}\n.my-properties-screen button:focus-visible,.my-properties-screen input:focus-visible{outline:2px solid var(--green);outline-offset:2px}\n.my-properties-screen .top{display:flex;align-items:center;justify-content:space-between;gap:8px}\n.my-properties-screen .brand{display:flex;align-items:center;gap:10px;min-width:0;text-decoration:none;color:var(--ink)}\n.my-properties-screen .logo{width:34px;height:34px;flex:none;border-radius:10px;border:1.5px solid var(--green);display:grid;place-items:center;color:var(--green);font-size:20px}\n.my-properties-screen .brand b{display:block;font-size:19px;font-weight:800;line-height:1.1;white-space:nowrap}\n.my-properties-screen .brand small{display:block;font-size:10px;color:var(--mute);margin-top:2px;white-space:nowrap}\n.my-properties-screen .tools{display:flex;align-items:center;gap:8px;flex:none}\n.my-properties-screen .pill{display:flex;align-items:center;gap:6px;height:38px;padding:0 12px;border-radius:19px;background:var(--card);border:1px solid var(--line);font-size:13px;font-weight:500;white-space:nowrap}\n.my-properties-screen .pill svg{font-size:14px;color:var(--mute)}\n.my-properties-screen .bell{width:38px;height:38px;border-radius:50%;background:var(--card);border:1px solid var(--line);display:grid;place-items:center;font-size:18px;color:var(--ink);text-decoration:none}\n.my-properties-screen .head{display:flex;align-items:center;justify-content:space-between;margin-top:20px}\n.my-properties-screen .head h1{display:flex;align-items:center;gap:8px;font-size:22px;font-weight:800;color:var(--ink)}\n.my-properties-screen .head h1 svg{font-size:22px}\n.my-properties-screen .back{display:grid;place-items:center;width:28px;height:28px;font-size:22px;color:var(--ink);text-decoration:none}\n.my-properties-screen .back svg{font-size:22px}\n.my-properties-screen .sub{color:var(--mute);font-size:13px;margin-top:2px;line-height:1.5}\n.my-properties-screen .tabs{display:flex;gap:8px;margin-top:14px;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:5px}\n.my-properties-screen .tab{flex:1;min-width:0;display:flex;align-items:center;justify-content:center;gap:6px;height:36px;border-radius:10px;font-size:13px;font-weight:500;color:var(--mute);white-space:nowrap}\n.my-properties-screen .tab svg{font-size:15px}\n.my-properties-screen .tab.on{background:var(--green);color:#fff;font-weight:700}\n.my-properties-screen .search{display:flex;gap:8px;margin-top:12px;width:100%;min-width:0}\n.my-properties-screen .field{flex:1;min-width:0;display:flex;align-items:center;gap:8px;height:44px;padding:0 12px;border-radius:12px;background:var(--card);border:1px solid var(--line);color:var(--mute)}\n.my-properties-screen .field>svg{font-size:16px}\n.my-properties-screen .field input{flex:1;width:100%;border:0;outline:none;background:none;font:inherit;font-size:13px;color:var(--ink);min-width:0}\n.my-properties-screen .field input::placeholder{color:var(--mute);opacity:1}\n.my-properties-screen .sort{display:flex;align-items:center;gap:5px;height:44px;padding:0 10px;border-radius:12px;background:var(--card);border:1px solid var(--line);font-size:12px;font-weight:500;white-space:nowrap;color:var(--ink);flex:none}\n.my-properties-screen .sort svg{font-size:15px;color:var(--mute)}\n.my-properties-screen .filter{width:44px;height:44px;flex:none;border-radius:12px;background:var(--card);border:1px solid var(--line);display:grid;place-items:center;font-size:18px;color:var(--green)}\n.my-properties-screen .filter.active{background:var(--green-soft);border-color:var(--green)}\n.my-properties-screen .filter-panel{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:8px;padding:10px 12px;background:var(--card);border:1px solid var(--line);border-radius:12px}\n.my-properties-screen .filter-panel label{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:600}\n.my-properties-screen .filter-panel input{width:16px;height:16px;accent-color:var(--green)}\n.my-properties-screen .clear-filter{display:flex;align-items:center;gap:4px;font-size:11px;color:var(--mute);white-space:nowrap}\n.my-properties-screen .clear-filter svg{width:13px;height:13px}\n.my-properties-screen .list{display:flex;flex-direction:column;gap:12px;margin-top:14px}\n.my-properties-screen .card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:10px;display:grid;grid-template-columns:96px minmax(0,1fr);gap:12px;box-shadow:0 1px 3px rgba(20,40,30,.06);color:var(--ink)}\n.my-properties-screen .img{display:block;width:96px;height:96px;border-radius:12px;position:relative;overflow:hidden;background:var(--green-soft);text-decoration:none}\n.my-properties-screen .img img{width:100%;height:100%;object-fit:cover;display:block}\n.my-properties-screen .ph{width:100%;height:100%;display:grid;place-items:center;background:var(--green-soft);color:var(--green);font-size:34px}\n.my-properties-screen .ph svg{font-size:34px}\n.my-properties-screen .cnt{position:absolute;left:6px;bottom:6px;display:flex;align-items:center;gap:4px;background:rgba(20,20,20,.65);color:#fff;border-radius:8px;padding:2px 7px;font-size:11px}\n.my-properties-screen .cnt svg{font-size:12px}\n.my-properties-screen .info{min-width:0;display:flex;flex-direction:column}\n.my-properties-screen .row1{display:flex;align-items:flex-start;justify-content:space-between;gap:6px}\n.my-properties-screen .title-location{min-width:0;flex:1}\n.my-properties-screen .row1 h3{font-size:16px;font-weight:800;line-height:1.2;overflow:hidden}\n.my-properties-screen .row1 h3 a{color:inherit;text-decoration:none}\n.my-properties-screen .loc{display:flex;align-items:center;gap:4px;font-size:12px;color:var(--mute);margin-top:3px;min-width:0}\n.my-properties-screen .loc svg{font-size:13px;color:var(--mute)}\n.my-properties-screen .loc span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.my-properties-screen .chips{display:flex;align-items:center;gap:6px;flex:none}\n.my-properties-screen .chip{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;padding:3px 9px;border-radius:10px;white-space:nowrap}\n.my-properties-screen .chip:before{content:\"\";width:6px;height:6px;flex:none;border-radius:50%;background:currentColor}\n.my-properties-screen .chip.ok{background:var(--green-soft);color:var(--ok-ink)}\n.my-properties-screen .chip.pause{background:var(--amber);color:var(--amber-ink)}\n.my-properties-screen .dots{width:24px;height:24px;flex:none;border:1px solid var(--line);border-radius:7px;display:grid;place-items:center;font-size:14px;color:var(--mute);background:transparent}\n.my-properties-screen .dots svg{font-size:14px}\n.my-properties-screen .stats{display:grid;grid-template-columns:1.7fr 1.05fr .75fr;gap:4px;margin-top:8px}\n.my-properties-screen .st{display:flex;align-items:center;gap:4px;min-width:0}\n.my-properties-screen .st>svg{font-size:14px;color:var(--mute)}\n.my-properties-screen .st small{display:block;font-size:10px;color:var(--mute);white-space:nowrap}\n.my-properties-screen .st b{display:block;overflow:hidden;font-size:11px;font-weight:800;white-space:nowrap;text-overflow:ellipsis;color:var(--ink)}\n.my-properties-screen .foot{grid-column:1/-1;display:flex;flex-direction:row-reverse;align-items:center;justify-content:space-between;gap:8px;margin-top:2px}\n.my-properties-screen .manage{display:flex;align-items:center;justify-content:center;gap:6px;min-height:28px;padding:0 12px;border-radius:8px;background:var(--green-soft);color:var(--green);font-size:12px;font-weight:700;text-decoration:none;white-space:nowrap}\n.my-properties-screen .manage svg{font-size:14px}\n.my-properties-screen .ago{display:flex;align-items:center;gap:4px;font-size:11px;color:var(--mute);white-space:nowrap}\n.my-properties-screen .ago svg{font-size:13px}\n.my-properties-screen .empty{text-align:center;color:var(--mute);padding:40px 0;font-size:14px}\n.my-properties-screen .nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:430px;padding:8px 10px calc(10px + env(safe-area-inset-bottom,0px));background:var(--bg);z-index:40}\n.my-properties-screen .nav>nav{position:relative!important;inset:auto!important;left:auto!important;bottom:auto!important;transform:none!important;display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;grid-auto-columns:unset!important;grid-auto-flow:unset!important;align-items:end!important;gap:0!important;width:100%;max-width:none;margin:0!important;border:1px solid var(--line)!important;border-radius:22px!important;background:var(--card)!important;padding:8px 4px 6px!important;box-shadow:0 4px 16px rgba(20,40,30,.08);backdrop-filter:none!important}\n.my-properties-screen .nav>nav>a{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;min-width:0;padding:0!important;color:var(--mute)!important;font-size:11px;font-weight:500;text-decoration:none;white-space:nowrap}\n.my-properties-screen .nav>nav>a>span:first-child{display:grid;place-items:center;min-width:22px;min-height:22px}\n.my-properties-screen .nav>nav>a>span:first-child svg{width:22px!important;height:22px!important}\n.my-properties-screen .nav>nav>a>span:last-child{font-size:11px!important;line-height:1.4}\n.my-properties-screen .nav>nav>a[href=\"/office/chat\"]{display:none!important}\n.my-properties-screen .nav>nav>a[href=\"/office/properties\"]{color:var(--green)!important;font-weight:800}\n.my-properties-screen .nav>nav>a[href=\"/office/properties/new\"]{z-index:1;gap:2px;margin-top:-26px!important;color:var(--orange)!important;font-weight:800}\n.my-properties-screen .nav>nav>a[href=\"/office/properties/new\"]>span:first-child{box-sizing:border-box;width:50px!important;height:50px!important;min-width:50px;min-height:50px;border:4px solid var(--card);border-radius:50%!important;background:var(--orange)!important;color:#fff!important;box-shadow:0 4px 12px rgba(217,98,43,.4)}\n.my-properties-screen .nav>nav>a[href=\"/office/properties/new\"]>span:first-child svg{width:24px!important;height:24px!important;stroke-width:2.4}\n.my-properties-screen .nav>nav>a[href=\"/office/properties/new\"]>span:first-child svg circle{display:none}\n.my-properties-screen .nav>nav>a[href=\"/office/requests\"]>span:first-child>span{background:var(--orange)!important;color:#fff!important}\n.my-properties-screen .nav>nav>a[href=\"/office/properties\"]>span:last-child{font-size:0!important}\n.my-properties-screen .nav>nav>a[href=\"/office/properties\"]>span:last-child:after{content:\"عقاري\";font-size:11px!important}\n@media(max-width:380px){\n .my-properties-screen .sort{gap:3px;padding:0 6px;font-size:11px}\n .my-properties-screen .sort svg:last-child{display:none}\n .my-properties-screen .stats{grid-template-columns:1.45fr 1fr .75fr;gap:3px}\n .my-properties-screen .card{grid-template-columns:88px minmax(0,1fr);gap:9px;padding:9px}\n .my-properties-screen .img{width:88px;height:96px}\n .my-properties-screen .row1 h3{font-size:15px}\n .my-properties-screen .chip{padding:3px 7px;font-size:10px}\n}\n";

export const Route = createFileRoute("/office/properties/")({
  head: () => ({
    meta: [
      { title: "عقاراتي | عقار البطين" },
      { name: "description", content: "إدارة عقارات مكتبك ومتابعة حالة النشر." },
      { property: "og:title", content: "عقاراتي | عقار البطين" },
      { property: "og:description", content: "قائمة عقارات المكتب وإدارتها." },
    ],
  }),
  component: () => (
    <RoleGuard allow={["office"]} guestsTo="/auth/office">
      <OfficeProperties />
    </RoleGuard>
  ),
});

type PropertiesTab = "all" | "sale" | "rent" | "paused";

function timeAgo(iso: string | null | undefined) {
  if (!iso) return "";
  const timestamp = new Date(iso).getTime();
  if (!Number.isFinite(timestamp)) return "";
  const days = Math.floor((Date.now() - timestamp) / 86400000);
  if (days <= 0) return "اليوم";
  if (days === 1) return "قبل يوم";
  if (days === 2) return "قبل يومين";
  if (days <= 10) return "قبل " + days + " أيام";
  if (days < 14) return "قبل أسبوع";
  if (days < 21) return "قبل أسبوعين";
  return "قبل " + Math.floor(days / 7) + " أسابيع";
}

function OfficeProperties() {
  const { userId } = useAuth();
  const { data: membership, isLoading: officeLoading, error: officeError } = useMyOffice();
  const qc = useQueryClient();
  const { featuredLimit } = useMyPlan();
  const officeId = membership?.office?.id ?? null;
  const officeGovernorateId = membership?.office?.governorate_id ?? null;
  const { data: cityName = "المزاحمية" } = useQuery({
    queryKey: ["office-properties-governorate-name", officeGovernorateId],
    enabled: !!officeGovernorateId,
    queryFn: async () => {
      const { data: governorate, error } = await supabase
        .from("governorates")
        .select("name_ar")
        .eq("id", officeGovernorateId!)
        .maybeSingle();
      if (error) throw error;
      return governorate?.name_ar ?? "المزاحمية";
    },
  });
  const canFeature = featuredLimit > 0;
  const [qrFor, setQrFor] = useState<{ id: string; title: string; url: string } | null>(null);
  const [deleteFor, setDeleteFor] = useState<{ id: string; title: string } | null>(null);
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState<PropertiesTab>("all");
  const [newestFirst, setNewestFirst] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["office-my-properties", userId, officeId],
    enabled: !!userId && !!officeId,
    queryFn: async () => {
      const propertiesResult = await supabase
        .from("properties")
        .select(
          "id,property_number,title,price,area,kind,listing,state,neighborhood,cover_url,is_published,is_featured,created_at,images_count,rent_period,governorates(name_ar)",
        )
        .eq("office_id", officeId!)
        // Legacy MongoDB documents may not have is_deleted; only exclude explicit deletions.
        .neq("is_deleted", true)
        .order("created_at", { ascending: false });
      if (propertiesResult.error) throw propertiesResult.error;
      return propertiesResult.data ?? [];
    },
  });

  // Inquiry counts are supplemental. Fetch them separately so they never delay or block the property list.
  const { data: inquiryRows = [] } = useQuery({
    queryKey: ["office-my-properties-inquiries", officeId],
    enabled: !!officeId,
    queryFn: async () => {
      try {
        const inquiriesResult = await supabase
          .from("property_inquiries")
          .select("id,property_id")
          .eq("office_id", officeId!);
        return inquiriesResult.error ? [] : inquiriesResult.data ?? [];
      } catch {
        return [];
      }
    },
  });

  const offersByProperty = new Map<string, number>();
  for (const inquiry of inquiryRows) {
    if (!inquiry.property_id) continue;
    offersByProperty.set(
      inquiry.property_id,
      (offersByProperty.get(inquiry.property_id) ?? 0) + 1,
    );
  }

  const properties = (data ?? []).map((property) => ({
    ...property,
    offers_count: offersByProperty.get(property.id) ?? 0,
  }));
  const counts = {
    all: properties.length,
    sale: properties.filter((p) => p.listing === "sale").length,
    rent: properties.filter((p) => p.listing === "rent").length,
    paused: properties.filter((p) => !p.is_published).length,
  };

  const visibleProperties = properties
    .filter((property) => {
      const query = searchText.trim().toLocaleLowerCase("ar");
      const matchesSearch =
        !query ||
        [
          property.title,
          property.property_number,
          property.neighborhood,
          kindLabel(property.kind),
          listingLabel(property.listing),
          stateLabel(property.state),
        ].some((value) => String(value ?? "").toLocaleLowerCase("ar").includes(query));

      const matchesTab =
        activeTab === "all" ||
        (activeTab === "sale" && property.listing === "sale") ||
        (activeTab === "rent" && property.listing === "rent") ||
        (activeTab === "paused" && !property.is_published);

      return matchesSearch && matchesTab && (!featuredOnly || property.is_featured);
    })
    .sort((a, b) => {
      const aTime = new Date(a.created_at ?? 0).getTime() || 0;
      const bTime = new Date(b.created_at ?? 0).getTime() || 0;
      return newestFirst ? bTime - aTime : aTime - bTime;
    });

  const toggleFeatured = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: boolean }) => {
      const { error } = await supabase
        .from("properties")
        .update({ is_featured: next })
        .eq("id", id);
      if (error) {
        if (error.message.includes("featured_requires_pro"))
          throw new Error("التمييز ميزة احترافية — رقِّ باقتك أولًا.");
        if (error.message.includes("featured_limit_reached"))
          throw new Error("يمكنك تمييز 3 عقارات كحد أقصى. ألغِ تمييز عقار أولًا.");
        throw error;
      }
    },
    onSuccess: (_, vars) => {
      toast.success(vars.next ? "تم تمييز العرض ⭐" : "أُلغي تمييز العرض");
      qc.invalidateQueries({ queryKey: ["office-my-properties"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "تعذّر تغيير التمييز"),
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: boolean }) => {
      const { error } = await supabase
        .from("properties")
        .update({ is_published: next })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم تحديث حالة العقار");
      qc.invalidateQueries({ queryKey: ["office-my-properties"] });
    },
    onError: () => toast.error("تعذّر تحديث حالة النشر"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("properties").update({ is_deleted: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      setDeleteFor(null);
      toast.success("تم حذف العرض");
      qc.invalidateQueries({ queryKey: ["office-my-properties"] });
    },
    onError: () => toast.error("تعذّر حذف العرض"),
  });

  const tabs: { key: PropertiesTab; label: string; count: number }[] = [
    { key: "all", label: "الكل", count: counts.all },
    { key: "sale", label: "للبيع", count: counts.sale },
    { key: "rent", label: "للإيجار", count: counts.rent },
    { key: "paused", label: "موقوفة", count: counts.paused },
  ];

  return (
    <>
      <style>{MY_PROPERTIES_CSS}</style>
      <div className="app my-properties-screen">
        <header className="top">
          <Link to="/office" className="brand">
            <div className="logo"><Icon name="home" /></div>
            <div>
              <b>عقار البطين</b>
              <small>وجهتك الأولى للعقار في المزاحمية وضرما</small>
            </div>
          </Link>
          <div className="tools">
            <button className="pill" type="button" aria-label="المدينة">
              {cityName} <Icon name="chev" />
            </button>
            <Link to="/notifications" className="bell" aria-label="الإشعارات">
              <Icon name="bell" />
            </Link>
          </div>
        </header>

        <div className="head">
          <h1><Icon name="home" /> عقاراتي</h1>
          <Link to="/office" className="back" aria-label="رجوع"><Icon name="left" /></Link>
        </div>
        <p className="sub">إدارة جميع عقاراتك المضافة</p>

        <nav className="tabs" aria-label="التصنيف">
          {tabs.map((tab) => {
            const iconName = tab.key === "sale" ? "tag" : tab.key === "rent" ? "key" : tab.key === "paused" ? "pause" : "home";
            return (
              <button
                key={tab.key}
                type="button"
                className={"tab " + (activeTab === tab.key ? "on" : "")}
                onClick={() => setActiveTab(tab.key)}
                aria-pressed={activeTab === tab.key}
              >
                <Icon name={iconName} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="search">
          <label className="field">
            <Icon name="search" />
            <input
              type="search"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="ابحث في عقاراتك ..."
              aria-label="ابحث في عقاراتك"
            />
          </label>
          <button
            type="button"
            className="sort"
            onClick={() => setNewestFirst((current) => !current)}
            aria-label={newestFirst ? "ترتيب من الأحدث إلى الأقدم" : "ترتيب من الأقدم إلى الأحدث"}
          >
            <Icon name="sort" />
            {newestFirst ? "الأحدث أولاً" : "الأقدم أولاً"}
            <Icon name="chev" />
          </button>
          <button
            type="button"
            className={"filter" + (showFilters || featuredOnly ? " active" : "")}
            aria-label="تصفية"
            aria-expanded={showFilters}
            onClick={() => setShowFilters((current) => !current)}
          >
            <Icon name="sliders" />
          </button>
        </div>

        {showFilters && (
          <div className="filter-panel">
            <label>
              <input type="checkbox" checked={featuredOnly} onChange={(event) => setFeaturedOnly(event.target.checked)} />
              العقارات المميزة فقط
            </label>
            <button
              type="button"
              className="clear-filter"
              onClick={() => {
                setFeaturedOnly(false);
                setActiveTab("all");
                setSearchText("");
              }}
            >
              <Icon name="dots" /> مسح التصفية
            </button>
          </div>
        )}

        <section className="list">
          {officeLoading || isLoading || (!!userId && membership === undefined && !officeError) ? (
            <ListSkeleton />
          ) : officeError ? (
            <p className="empty" role="alert">
              تعذّر تحميل بيانات المكتب. أعد فتح الصفحة للمحاولة مرة أخرى.
            </p>
          ) : !officeId ? (
            <p className="empty" role="alert">
              لم يتم العثور على بيانات المكتب المرتبطة بهذا الحساب.
            </p>
          ) : error ? (
            <p className="empty" role="alert">
              تعذّر تحميل العقارات حاليًا. أعد فتح الصفحة للمحاولة مرة أخرى.
            </p>
          ) : visibleProperties.length === 0 ? (
            <p className="empty">
              {searchText.trim() || activeTab !== "all" || featuredOnly ? "لا توجد عقارات مطابقة" : "لا توجد عقارات بعد"}
            </p>
          ) : visibleProperties.map((p) => {
            const active = p.is_published;
            const price = new Intl.NumberFormat("en-US").format(Number(p.price ?? 0)) + " ر.س" + (p.listing === "rent" ? "/" + rentPeriodLabel(p.rent_period) : "");
            const imageCount = p.images_count ?? (p.cover_url ? 1 : 0);
            return (
              <article key={p.id} className="card">
                <Link
                  to="/properties/$propertyId"
                  params={{ propertyId: p.id }}
                  className="img"
                  aria-label={"فتح " + (p.title || "العقار")}
                >
                  {p.cover_url ? (
                    <img src={p.cover_url} alt={p.title || "صورة العقار"} loading="lazy" />
                  ) : (
                    <div className="ph"><Icon name="home" /></div>
                  )}
                  <span className="cnt">{imageCount} <Icon name="img" /></span>
                </Link>

                <div className="info">
                  <div className="row1">
                    <div className="title-location">
                      <h3><Link to="/properties/$propertyId" params={{ propertyId: p.id }}>{p.title || "عقار بدون عنوان"}</Link></h3>
                      <div className="loc">
                        <Icon name="pin" />
                        <span>{cityName} - {p.neighborhood || "الموقع غير محدد"}</span>
                      </div>
                    </div>
                    <div className="chips">
                      <span className={"chip " + (active ? "ok" : "pause")}>{active ? "مفعل" : "موقوف"}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="dots" type="button" aria-label="المزيد"><Icon name="dots" /></button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" sideOffset={6} className="w-52">
                          <DropdownMenuItem
                            onSelect={() => {
                              if (!canFeature && !p.is_featured) {
                                toast.error("التمييز ميزة احترافية — رقِّ باقتك لإبراز عقاراتك.");
                                return;
                              }
                              toggleFeatured.mutate({ id: p.id, next: !p.is_featured });
                            }}
                            disabled={toggleFeatured.isPending}
                          >
                            <Star className={"size-4 " + (p.is_featured ? "fill-current text-forest" : "")} />
                            {p.is_featured ? "إلغاء التمييز" : "تمييز العرض"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => togglePublish.mutate({ id: p.id, next: !p.is_published })}
                            disabled={togglePublish.isPending}
                          >
                            {p.is_published ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            {p.is_published ? "إيقاف العقار" : "تفعيل العقار"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => {
                              if (!canFeature) {
                                toast.error("رمز QR ميزة احترافية — رقِّ باقتك.");
                                return;
                              }
                              if (!p.is_published) {
                                toast.error("انشر العقار أولًا لإنشاء رمز QR صالح للمشاركة.");
                                return;
                              }
                              const url = getPublicAppUrl("/properties/" + p.id);
                              if (!url) {
                                toast.error(PUBLIC_APP_URL_HELP);
                                return;
                              }
                              setQrFor({ id: p.id, title: p.title, url });
                            }}
                          >
                            <QrCode className="size-4" />
                            رمز QR
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() => setDeleteFor({ id: p.id, title: p.title })}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="size-4" />
                            حذف العقار
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="stats">
                    <div className="st"><Icon name="wallet" /><div><small>السعر</small><b>{price}</b></div></div>
                    <div className="st"><Icon name="area" /><div><small>المساحة</small><b>{p.area ?? 0} م²</b></div></div>
                    <div className="st"><Icon name="chat" /><div><small>العروض</small><b>{p.offers_count ?? 0}</b></div></div>
                  </div>
                </div>

                <div className="foot">
                  <Link to="/properties/$propertyId" params={{ propertyId: p.id }} className="manage">
                    <Icon name="edit" />إدارة العقار
                  </Link>
                  <span className="ago"><Icon name="clock" />{timeAgo(p.created_at)}</span>
                </div>
              </article>
            );
          })}
        </section>

        {deleteFor && (
          <div
            className="fixed inset-0 z-[60] grid place-items-center bg-black/55 p-4"
            role="presentation"
            onClick={() => !remove.isPending && setDeleteFor(null)}
          >
            <section
              className="w-full max-w-sm rounded-3xl bg-surface p-5 shadow-2xl ring-1 ring-line"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="delete-property-title"
              aria-describedby="delete-property-description"
              dir="rtl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
                <Trash2 className="size-6" />
              </div>
              <h2 id="delete-property-title" className="mt-3 text-center font-display text-lg font-extrabold">تأكيد حذف العقار</h2>
              <p id="delete-property-description" className="mt-2 text-center text-sm leading-6 text-muted-foreground">
                هل أنت متأكد أنك تريد حذف «{deleteFor.title}»؟ سيُزال العقار من قائمة عروضك.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setDeleteFor(null)} disabled={remove.isPending} className="rounded-xl bg-sand py-3 text-sm font-bold disabled:opacity-50">
                  إلغاء
                </button>
                <button type="button" onClick={() => remove.mutate(deleteFor.id)} disabled={remove.isPending} className="rounded-xl bg-destructive py-3 text-sm font-bold text-white disabled:opacity-50">
                  {remove.isPending ? "جارٍ الحذف..." : "نعم، احذف العقار"}
                </button>
              </div>
            </section>
          </div>
        )}

        {qrFor && (
          <QrDialog
            open={!!qrFor}
            onClose={() => setQrFor(null)}
            value={qrFor.url}
            title={qrFor.title}
            subtitle="امسح الرمز لفتح صفحة العقار"
            fileName={"qr-" + qrFor.title}
          />
        )}

        <div className="nav">
          <BottomNav variant="office" />
        </div>
      </div>
    </>
  );
}
