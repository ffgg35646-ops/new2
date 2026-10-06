import { Check, Crown, Sparkles } from "lucide-react";
import { FREE_FEATURES, PLAN_PRICE, PRO_FEATURES, type OfficePlan } from "@/lib/plans";
import { cn } from "@/lib/utils";

type Props = {
  current?: OfficePlan | null;
  freeLabel?: string;
  proLabel?: string;
  busyPlan?: OfficePlan | null | undefined;
  disableFree?: boolean;
  disablePro?: boolean;
  onChoose: (plan: OfficePlan) => void;
};

export function PlanPicker({
  current,
  freeLabel = "ابدأ مجانًا",
  proLabel = "اشترك في الاحترافية",
  busyPlan,
  disableFree,
  disablePro,
  onChoose,
}: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <PlanCard
        plan="free"
        title="المجانية"
        icon={<Sparkles className="size-4 text-forest" />}
        features={FREE_FEATURES}
        selected={current === "free"}
        cta={freeLabel}
        busy={busyPlan === "free"}
        disabled={!!disableFree}
        onChoose={onChoose}
      />
      <PlanCard
        plan="pro"
        title="الاحترافية"
        icon={<Crown className="size-4 text-terracotta" />}
        features={PRO_FEATURES}
        note="تشمل جميع مميزات المجانية، بالإضافة إلى:"
        selected={current === "pro"}
        cta={proLabel}
        busy={busyPlan === "pro"}
        disabled={!!disablePro}
        highlight
        onChoose={onChoose}
      />
    </div>
  );
}

function PlanCard({
  plan,
  title,
  icon,
  features,
  note,
  selected,
  cta,
  busy,
  disabled,
  highlight,
  onChoose,
}: {
  plan: OfficePlan;
  title: string;
  icon: React.ReactNode;
  features: string[];
  note?: string;
  selected?: boolean;
  cta: string;
  busy?: boolean;
  disabled?: boolean;
  highlight?: boolean;
  onChoose: (plan: OfficePlan) => void;
}) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-3xl bg-surface p-4 ring-1 ring-line",
        highlight && "ring-terracotta/40",
        selected && "ring-2 ring-forest",
      )}
    >
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="font-display text-base font-extrabold">{title}</h2>
        {highlight && (
          <span className="ms-auto rounded-full bg-terracotta/10 px-2 py-0.5 text-[10px] font-bold text-terracotta">
            الأكثر تكاملًا
          </span>
        )}
      </div>
      <p className="mt-1 font-display text-lg font-extrabold text-forest">{PLAN_PRICE[plan]}</p>
      {note && <p className="mt-2 text-[11px] text-muted-foreground">{note}</p>}

      <ul className="mt-3 space-y-1.5">
        {features.map((f) => (
          <li key={f} className="flex gap-2 text-[12px] leading-relaxed">
            <Check className="mt-0.5 size-3.5 shrink-0 text-forest" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => onChoose(plan)}
        disabled={busy || disabled}
        className={cn(
          "mt-4 w-full rounded-2xl py-3 font-display text-sm font-bold disabled:opacity-60",
          plan === "pro" ? "bg-terracotta text-background" : "bg-forest text-background",
        )}
      >
        {busy ? "جارٍ التنفيذ…" : cta}
      </button>
    </div>
  );
}
