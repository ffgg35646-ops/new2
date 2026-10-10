import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, ShieldCheck, Sparkles, User } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "عقار البطين | عقارات المزاحمية وضرما" },
      {
        name: "description",
        content:
          "منصة عقارية محلية لعرض وطلب العقارات في المزاحمية وضرما — مكاتب موثقة، طلبات مباشرة، وحجز معاينة.",
      },
      { property: "og:title", content: "عقار البطين | عقارات المزاحمية وضرما" },
      {
        property: "og:description",
        content: "ابحث عن أرضك أو بيتك في محافظتك، وتواصل مع مكاتب عقارية موثقة.",
      },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background px-5 py-10">
      <div className="flex items-center gap-3">
        <BrandLogo size={64} />
        <div className="leading-tight">
          <div className="font-display text-2xl font-extrabold">عقار البطين</div>
          <div className="text-xs text-muted-foreground">وجهتك الأولى للعقار</div>
        </div>
      </div>

      <h1 className="mt-8 font-display text-3xl leading-tight font-extrabold">
        ابدأ رحلتك العقارية
        <br />
        <span className="text-terracotta">من محافظتك</span>
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        
        وتقييمات موثوقة.
      </p>

      <div className="mt-8 space-y-2.5">
        <Feature icon={ShieldCheck} text="مكاتب عقارية موثقة ومراجعة من الإدارة" />
        <Feature icon={Sparkles} text="اطلب عقارك ودع المكاتب تعرض عليك" />
      </div>

      <div className="mt-auto space-y-3 pt-10">
        <Link
          to="/auth/individual"
          className="flex items-center justify-center gap-2 rounded-2xl bg-forest py-4 font-display font-bold text-background"
        >
          <User className="size-5" />
          دخول كفرد
        </Link>
        <Link
          to="/auth/office"
          className="flex items-center justify-center gap-2 rounded-2xl bg-surface py-4 font-display font-bold ring-1 ring-line"
        >
          <Building2 className="size-5 text-terracotta" />
          دخول كمكتب عقاري
        </Link>
        <Link
          to="/home"
          className="block py-2 text-center text-sm text-muted-foreground underline underline-offset-4"
        >
          تصفح بدون تسجيل
        </Link>
      </div>
    </div>
  );
}

function Feature({ icon: Icon, text }: { icon: typeof ShieldCheck; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface p-3.5 ring-1 ring-line">
      <span className="grid size-9 place-items-center rounded-xl bg-forest-soft text-forest">
        <Icon className="size-[18px]" />
      </span>
      <span className="text-sm">{text}</span>
    </div>
  );
}
