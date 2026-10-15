import { RoleGuard } from "@/lib/role-guard";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowDownWideNarrow,
  ArrowLeft,
  ArrowUpWideNarrow,
  ChevronDown,
  CirclePause,
  Clock3,
  Eye,
  EyeOff,
  Home,
  Images,
  KeyRound,
  MapPin,
  Maximize2,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  QrCode,
  Search,
  SlidersHorizontal,
  Star,
  Tag,
  Trash2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { EmptyState, ListSkeleton } from "@/components/EmptyState";
import { QrDialog } from "@/components/QrDialog";
import { useAuth } from "@/lib/auth";
import { useMyOffice } from "@/lib/office";
import { kindLabel, listingLabel, rentPeriodLabel, stateLabel } from "@/lib/constants";
import { formatArea, formatPrice } from "@/lib/format";
import { useMyPlan } from "@/lib/plans";
import { getPublicAppUrl, PUBLIC_APP_URL_HELP } from "@/lib/public-app-url";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MY_PROPERTIES_CSS = "\n:root{box-sizing:border-box}\n.my-properties-screen{\n  --mp-bg:#f4f2ee;--mp-card:#fff;--mp-ink:#1c2b25;--mp-muted:#7a847f;--mp-line:#e6e2da;\n  --mp-green:#1f5a45;--mp-green-soft:#e3efe8;--mp-orange:#d9622b;--mp-amber:#f3e3b5;\n  --mp-amber-ink:#8a6410;--mp-ok-ink:#1f7a4d;\n  box-sizing:border-box;position:relative;width:100%;max-width:430px;min-height:100vh;min-height:100dvh;\n  margin:0 auto;padding:0 14px 118px;background:var(--mp-bg);color:var(--mp-ink);\n  font-family:'Tajawal','IBM Plex Sans Arabic','Segoe UI',Tahoma,sans-serif;\n}\n.dark .my-properties-screen{--mp-bg:#15191a;--mp-card:#1f2523;--mp-ink:#eef2ef;--mp-muted:#9aa5a0;--mp-line:#2f3835;--mp-green:#3f8f70;--mp-green-soft:#22382f;--mp-orange:#d9622b;--mp-amber:#3d3418;--mp-amber-ink:#e9c76a;--mp-ok-ink:#6fcf9b}\n.my-properties-screen>header{position:relative!important;inset:auto!important;z-index:1!important;margin:0!important;border:0!important;background:transparent!important;backdrop-filter:none!important}\n.my-properties-screen>header>div:first-child{gap:8px!important;padding:calc(14px + env(safe-area-inset-top,0px)) 0 0!important}\n.my-properties-screen>header>div:first-child>a:first-child{gap:10px!important}\n.my-properties-screen>header>div:first-child>a:first-child>div:last-child>div:first-child{font-size:19px!important;line-height:1.1!important;color:var(--mp-ink)!important}\n.my-properties-screen>header>div:first-child>a:first-child>div:last-child>div:last-child{font-size:10px!important;line-height:1.3!important;color:var(--mp-muted)!important}\n.my-properties-screen>header>div:first-child>span{height:38px!important;min-height:38px!important;box-sizing:border-box;padding:0 12px!important;gap:6px!important;border:1px solid var(--mp-line)!important;background:var(--mp-card)!important;box-shadow:none!important;font-size:13px!important;color:var(--mp-ink)!important;white-space:nowrap}\n.my-properties-screen>header>div:first-child>span>svg{display:none!important}\n.my-properties-screen>header>div:first-child>span:after{content:\"⌄\";font-size:14px;color:var(--mp-muted);line-height:1}\n.my-properties-screen>header>div:first-child>a:last-child{width:38px!important;height:38px!important;min-width:38px!important;border:1px solid var(--mp-line)!important;background:var(--mp-card)!important;box-shadow:none!important}\n.my-properties-screen>header>div:first-child>a:last-child svg{width:18px!important;height:18px!important;color:var(--mp-ink)!important}\n.my-properties-screen .mp-main{display:flex;flex-direction:column;gap:0;padding:0;margin:0}\n.my-properties-screen .mp-heading{display:flex;align-items:center;justify-content:space-between;margin-top:20px}\n.my-properties-screen .mp-heading h1{display:flex;align-items:center;gap:8px;font-size:22px;font-weight:800;line-height:1.3;color:var(--mp-ink)}\n.my-properties-screen .mp-heading h1 svg{width:22px;height:22px}\n.my-properties-screen .mp-back{display:grid;place-items:center;width:28px;height:28px;color:var(--mp-ink);text-decoration:none}\n.my-properties-screen .mp-back svg{width:22px;height:22px}\n.my-properties-screen .mp-sub{margin-top:2px;color:var(--mp-muted);font-size:13px;line-height:1.6}\n.my-properties-screen .mp-tabs{display:flex;gap:8px;margin-top:14px;padding:5px;background:var(--mp-card);border:1px solid var(--mp-line);border-radius:14px}\n.my-properties-screen .mp-tab{flex:1;min-width:0;display:flex;align-items:center;justify-content:center;gap:6px;height:36px;border-radius:10px;background:transparent;color:var(--mp-muted);font-size:13px;font-weight:500;white-space:nowrap}\n.my-properties-screen .mp-tab svg{width:15px;height:15px}\n.my-properties-screen .mp-tab.on{background:var(--mp-green);color:#fff;font-weight:700}\n.my-properties-screen .mp-search{display:flex;gap:8px;margin-top:12px;width:100%;min-width:0}\n.my-properties-screen .mp-field{flex:1;min-width:0;display:flex;align-items:center;gap:8px;height:44px;padding:0 12px;border-radius:12px;background:var(--mp-card);border:1px solid var(--mp-line);color:var(--mp-muted)}\n.my-properties-screen .mp-field svg{width:17px;height:17px;flex:none}\n.my-properties-screen .mp-field input{flex:1;min-width:0;width:100%;border:0;outline:none;background:transparent;color:var(--mp-ink);font:inherit;font-size:13px}\n.my-properties-screen .mp-field input::placeholder{color:var(--mp-muted);opacity:1}\n.my-properties-screen .mp-field:focus-within{border-color:var(--mp-green);box-shadow:0 0 0 2px color-mix(in srgb,var(--mp-green) 15%,transparent)}\n.my-properties-screen .mp-sort{display:flex;align-items:center;justify-content:center;gap:5px;height:44px;padding:0 9px;flex:none;border-radius:12px;background:var(--mp-card);border:1px solid var(--mp-line);font-size:12px;font-weight:500;white-space:nowrap;color:var(--mp-ink)}\n.my-properties-screen .mp-sort svg{width:15px;height:15px;color:var(--mp-muted);flex:none}\n.my-properties-screen .mp-filter{width:44px;height:44px;flex:none;display:grid;place-items:center;border-radius:12px;background:var(--mp-card);border:1px solid var(--mp-line);color:var(--mp-green)}\n.my-properties-screen .mp-filter svg{width:18px;height:18px}\n.my-properties-screen .mp-list{display:flex;flex-direction:column;gap:12px;margin-top:14px}\n.my-properties-screen .mp-card{box-sizing:border-box;display:grid;grid-template-columns:96px minmax(0,1fr);gap:12px;width:100%;padding:10px;background:var(--mp-card);border:1px solid var(--mp-line);border-radius:16px;box-shadow:0 1px 3px rgba(20,40,30,.06);color:var(--mp-ink)}\n.my-properties-screen .mp-image{position:relative;display:block;width:96px;height:96px;overflow:hidden;border-radius:12px;background:var(--mp-green-soft);text-decoration:none}\n.my-properties-screen .mp-image img{display:block;width:100%;height:100%;object-fit:cover}\n.my-properties-screen .mp-placeholder{display:grid;width:100%;height:100%;place-items:center;background:var(--mp-green-soft);color:var(--mp-green)}\n.my-properties-screen .mp-placeholder svg{width:34px;height:34px}\n.my-properties-screen .mp-count{position:absolute;left:6px;bottom:6px;display:flex;align-items:center;gap:4px;padding:2px 7px;border-radius:8px;background:rgba(20,20,20,.65);color:#fff;font-size:11px}\n.my-properties-screen .mp-count svg{width:12px;height:12px}\n.my-properties-screen .mp-info{display:flex;flex-direction:column;min-width:0}\n.my-properties-screen .mp-row1{display:flex;align-items:flex-start;justify-content:space-between;gap:6px}\n.my-properties-screen .mp-title-block{min-width:0;flex:1}\n.my-properties-screen .mp-title{display:block;margin:0;color:var(--mp-ink);font-size:16px;font-weight:800;line-height:1.25;text-decoration:none}\n.my-properties-screen .mp-title span{display:-webkit-box;overflow:hidden;-webkit-box-orient:vertical;-webkit-line-clamp:2}\n.my-properties-screen .mp-loc{display:flex;align-items:center;gap:4px;margin-top:3px;color:var(--mp-muted);font-size:12px;line-height:1.45;min-width:0}\n.my-properties-screen .mp-loc svg{width:13px;height:13px;flex:none;color:var(--mp-muted)}\n.my-properties-screen .mp-loc span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.my-properties-screen .mp-chips{display:flex;align-items:center;gap:6px;flex:none}\n.my-properties-screen .mp-chip{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:10px;font-size:11px;font-weight:700;white-space:nowrap}\n.my-properties-screen .mp-chip:before{content:\"\";width:6px;height:6px;border-radius:50%;background:currentColor}\n.my-properties-screen .mp-chip.ok{background:var(--mp-green-soft);color:var(--mp-ok-ink)}\n.my-properties-screen .mp-chip.pause{background:var(--mp-amber);color:var(--mp-amber-ink)}\n.my-properties-screen .mp-dots{display:grid;place-items:center;width:24px;height:24px;flex:none;border:1px solid var(--mp-line);border-radius:7px;color:var(--mp-muted);background:transparent}\n.my-properties-screen .mp-dots svg{width:14px;height:14px}\n.my-properties-screen .mp-stats{display:grid;grid-template-columns:1.7fr 1.05fr .75fr;gap:4px;margin-top:8px}\n.my-properties-screen .mp-stat{display:flex;align-items:center;gap:4px;min-width:0}\n.my-properties-screen .mp-stat>svg{width:14px;height:14px;color:var(--mp-muted);flex:none}\n.my-properties-screen .mp-stat-text{display:block;min-width:0}\n.my-properties-screen .mp-stat small{display:block;color:var(--mp-muted);font-size:10px;line-height:1.3;white-space:nowrap}\n.my-properties-screen .mp-stat b{display:block;overflow:hidden;color:var(--mp-ink);font-size:11px;font-weight:800;line-height:1.45;text-overflow:ellipsis;white-space:nowrap}\n.my-properties-screen .mp-foot{grid-column:1/-1;display:flex;flex-direction:row-reverse;align-items:center;justify-content:space-between;gap:8px;margin-top:2px}\n.my-properties-screen .mp-manage{display:flex;align-items:center;justify-content:center;gap:6px;min-height:28px;padding:0 12px;border-radius:8px;background:var(--mp-green-soft);color:var(--mp-green);font-size:12px;font-weight:700;text-decoration:none;white-space:nowrap}\n.my-properties-screen .mp-manage svg{width:14px;height:14px}\n.my-properties-screen .mp-ago{display:flex;align-items:center;gap:4px;color:var(--mp-muted);font-size:11px;white-space:nowrap}\n.my-properties-screen .mp-ago svg{width:13px;height:13px}\n.my-properties-screen .mp-empty{text-align:center;margin:0;padding:40px 0;color:var(--mp-muted);font-size:14px}\n.my-properties-screen .mp-bottom-shell{position:fixed;z-index:40;left:50%;bottom:0;transform:translateX(-50%);width:100%;max-width:430px;box-sizing:border-box;padding:8px 10px calc(10px + env(safe-area-inset-bottom,0px));background:var(--mp-bg)}\n.my-properties-screen .mp-bottom-shell>nav{position:relative!important;inset:auto!important;display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;grid-auto-columns:unset!important;grid-auto-flow:unset!important;gap:0!important;width:100%;max-width:none;margin:0!important;padding:8px 4px 6px!important;border:1px solid var(--mp-line)!important;border-radius:22px!important;background:var(--mp-card)!important;box-shadow:0 4px 16px rgba(20,40,30,.08);backdrop-filter:none!important}\n.my-properties-screen .mp-bottom-shell>nav>a{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;min-width:0;padding:0!important;color:var(--mp-muted)!important;font-size:11px;font-weight:500;text-decoration:none;white-space:nowrap}\n.my-properties-screen .mp-bottom-shell>nav>a[href=\"/office/chat\"]{display:none!important}\n.my-properties-screen .mp-bottom-shell>nav>a>span:first-child>svg{width:22px!important;height:22px!important}\n.my-properties-screen .mp-bottom-shell>nav>a[href=\"/office/properties\"]{color:var(--mp-green)!important;font-weight:800}\n.my-properties-screen .mp-bottom-shell>nav>a[href=\"/office/properties\"]>span:last-child{font-size:0}\n.my-properties-screen .mp-bottom-shell>nav>a[href=\"/office/properties\"]>span:last-child:after{content:\"عقاري\";font-size:11px}\n.my-properties-screen .mp-bottom-shell>nav>a[href=\"/office/properties/new\"]{z-index:1;gap:2px;margin-top:-26px!important;color:var(--mp-orange)!important;font-weight:800}\n.my-properties-screen .mp-bottom-shell>nav>a[href=\"/office/properties/new\"]>span:first-child{box-sizing:border-box;width:50px!important;height:50px!important;border:4px solid var(--mp-card);border-radius:50%!important;background:var(--mp-orange)!important;color:#fff!important;box-shadow:0 4px 12px rgba(217,98,43,.4)}\n.my-properties-screen .mp-bottom-shell>nav>a[href=\"/office/properties/new\"]>span:first-child svg{width:24px!important;height:24px!important;stroke-width:2.4}\n.my-properties-screen .mp-bottom-shell>nav>a[href=\"/office/properties/new\"]>span:first-child svg circle{display:none}\n.my-properties-screen .mp-bottom-shell>nav>a[href=\"/office/requests\"]>span:first-child>span{background:var(--mp-orange)!important;color:#fff!important}\n@media(max-width:380px){\n .my-properties-screen .mp-sort{gap:3px;padding:0 6px;font-size:11px}\n .my-properties-screen .mp-sort svg:last-child{display:none}\n .my-properties-screen .mp-stats{grid-template-columns:1.45fr 1fr .75fr;gap:3px}\n .my-properties-screen .mp-card{grid-template-columns:88px minmax(0,1fr);gap:9px;padding:9px}\n .my-properties-screen .mp-image{width:88px;height:96px}\n .my-properties-screen .mp-title{font-size:15px}\n .my-properties-screen .mp-chip{padding:3px 7px;font-size:10px}\n}\n";

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

function timeAgo(value: string | null | undefined) {
  if (!value) return "";
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "";
  const days = Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000));
  if (days === 0) return "اليوم";
  if (days === 1) return "منذ يوم";
  if (days < 7) return "منذ " + days + " أيام";
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "منذ أسبوع";
  if (weeks < 5) return "منذ " + weeks + " أسابيع";
  const months = Math.floor(days / 30);
  if (months <= 1) return "منذ شهر";
  return "منذ " + months + " أشهر";
}

function OfficeProperties() {
  const { userId } = useAuth();
  const { data: membership } = useMyOffice();
  const qc = useQueryClient();
  const { featuredLimit } = useMyPlan();
  const officeId = membership?.office?.id ?? null;
  const canFeature = featuredLimit > 0;
  const [qrFor, setQrFor] = useState<{ id: string; title: string; url: string } | null>(null);
  const [deleteFor, setDeleteFor] = useState<{ id: string; title: string } | null>(null);
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState<PropertiesTab>("all");
  const [newestFirst, setNewestFirst] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ["office-my-properties", userId, officeId],
    enabled: !!userId && !!officeId,
    queryFn: async () => {
      const [propertiesResult, inquiriesResult] = await Promise.all([
        supabase
          .from("properties")
          .select(
            "id,property_number,title,price,area,kind,listing,state,neighborhood,cover_url,is_published,is_featured,created_at,images_count,rent_period,governorates(name_ar)",
          )
          .eq("office_id", officeId!)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false }),
        supabase
          .from("property_inquiries")
          .select("id,property_id")
          .eq("office_id", officeId!),
      ]);
      if (propertiesResult.error) throw propertiesResult.error;
      if (inquiriesResult.error) throw inquiriesResult.error;

      const offersByProperty = new Map<string, number>();
      for (const inquiry of inquiriesResult.data ?? []) {
        if (!inquiry.property_id) continue;
        offersByProperty.set(
          inquiry.property_id,
          (offersByProperty.get(inquiry.property_id) ?? 0) + 1,
        );
      }

      return (propertiesResult.data ?? []).map((property) => ({
        ...property,
        offers_count: offersByProperty.get(property.id) ?? 0,
      }));
    },
  });

  const properties = data ?? [];
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

      return matchesSearch && matchesTab;
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
      <div className="my-properties-screen" dir="rtl">
        <AppHeader showSearch={false} />

        <main className="mp-main">
          <div className="mp-heading">
            <h1><Home aria-hidden="true" />عقاراتي</h1>
            <Link to="/office" className="mp-back" aria-label="رجوع">
              <ArrowLeft aria-hidden="true" />
            </Link>
          </div>
          <p className="mp-sub">إدارة جميع عقاراتك المضافة</p>

          <nav className="mp-tabs" aria-label="تصنيف العقارات">
            {tabs.map((tab) => {
              const TabIcon = tab.key === "sale" ? Tag : tab.key === "rent" ? KeyRound : tab.key === "paused" ? CirclePause : Home;
              const selected = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  className={"mp-tab" + (selected ? " on" : "")}
                  onClick={() => setActiveTab(tab.key)}
                  aria-pressed={selected}
                >
                  <TabIcon aria-hidden="true" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="mp-search">
            <label className="mp-field">
              <Search aria-hidden="true" />
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
              className="mp-sort"
              onClick={() => setNewestFirst((current) => !current)}
              aria-label={newestFirst ? "ترتيب من الأحدث إلى الأقدم" : "ترتيب من الأقدم إلى الأحدث"}
            >
              {newestFirst ? <ArrowDownWideNarrow aria-hidden="true" /> : <ArrowUpWideNarrow aria-hidden="true" />}
              <span>{newestFirst ? "الأحدث أولاً" : "الأقدم أولاً"}</span>
              <ChevronDown aria-hidden="true" />
            </button>
            <button
              type="button"
              className="mp-filter"
              aria-label="تصفية العقارات"
            >
              <SlidersHorizontal aria-hidden="true" />
            </button>
          </div>

          {isLoading ? (
            <div className="mp-list"><ListSkeleton /></div>
          ) : visibleProperties.length ? (
            <section className="mp-list" aria-label="قائمة عقاراتي">
              {visibleProperties.map((p) => (
                <article key={p.id} className="mp-card">
                  <Link
                    to="/properties/$propertyId"
                    params={{ propertyId: p.id }}
                    className="mp-image"
                    aria-label={"فتح " + (p.title || "العقار")}
                  >
                    {p.cover_url ? (
                      <img src={p.cover_url} alt={p.title || "صورة العقار"} loading="lazy" />
                    ) : (
                      <span className="mp-placeholder"><Home aria-hidden="true" /></span>
                    )}
                    <span className="mp-count">
                      {p.images_count ?? (p.cover_url ? 1 : 0)}
                      <Images aria-hidden="true" />
                    </span>
                  </Link>

                  <div className="mp-info">
                    <div className="mp-row1">
                      <div className="mp-title-block">
                        <Link
                          to="/properties/$propertyId"
                          params={{ propertyId: p.id }}
                          className="mp-title"
                        >
                          <span>{p.title || "عقار بدون عنوان"}</span>
                        </Link>
                        <div className="mp-loc">
                          <MapPin aria-hidden="true" />
                          <span>
                            {(p.governorates as { name_ar?: string } | null)?.name_ar || "—"}
                            {" - "}
                            {p.neighborhood || "الموقع غير محدد"}
                          </span>
                        </div>
                      </div>

                      <div className="mp-chips">
                        <span className={"mp-chip " + (p.is_published ? "ok" : "pause")}>
                          {p.is_published ? "مفعل" : "موقوف"}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="mp-dots"
                              aria-label={"خيارات العقار: " + (p.title || "")}
                            >
                              <MoreHorizontal aria-hidden="true" />
                            </button>
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

                    <div className="mp-stats">
                      <div className="mp-stat">
                        <Wallet aria-hidden="true" />
                        <span className="mp-stat-text">
                          <small>السعر</small>
                          <b>
                            {formatPrice(p.price)} ر.س{p.listing === "rent" ? "/" + rentPeriodLabel(p.rent_period) : ""}
                          </b>
                        </span>
                      </div>
                      <div className="mp-stat">
                        <Maximize2 aria-hidden="true" />
                        <span className="mp-stat-text">
                          <small>المساحة</small>
                          <b>{formatArea(p.area)}</b>
                        </span>
                      </div>
                      <div className="mp-stat">
                        <MessageSquare aria-hidden="true" />
                        <span className="mp-stat-text">
                          <small>العروض</small>
                          <b>{p.offers_count ?? 0}</b>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mp-foot">
                    <Link
                      to="/properties/$propertyId"
                      params={{ propertyId: p.id }}
                      className="mp-manage"
                    >
                      <Pencil aria-hidden="true" />
                      إدارة العقار
                    </Link>
                    <span className="mp-ago">
                      <Clock3 aria-hidden="true" />
                      {timeAgo(p.created_at)}
                    </span>
                  </div>
                </article>
              ))}
            </section>
          ) : (
            <p className="mp-empty">
              {searchText.trim() || activeTab !== "all" ? "لا توجد عقارات مطابقة" : "لا توجد عقارات بعد"}
            </p>
          )}
        </main>

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
              <h2 id="delete-property-title" className="mt-3 text-center font-display text-lg font-extrabold">
                تأكيد حذف العقار
              </h2>
              <p id="delete-property-description" className="mt-2 text-center text-sm leading-6 text-muted-foreground">
                هل أنت متأكد أنك تريد حذف «{deleteFor.title}»؟ سيُزال العقار من قائمة عروضك.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteFor(null)}
                  disabled={remove.isPending}
                  className="rounded-xl bg-sand py-3 text-sm font-bold disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => remove.mutate(deleteFor.id)}
                  disabled={remove.isPending}
                  className="rounded-xl bg-destructive py-3 text-sm font-bold text-white disabled:opacity-50"
                >
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

        <div className="mp-bottom-shell">
          <BottomNav variant="office" />
        </div>
      </div>
    </>
  );
}
