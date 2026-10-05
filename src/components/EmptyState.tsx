import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-3xl bg-surface px-6 py-12 text-center ring-1 ring-line">
      <div className="grid size-14 place-items-center rounded-2xl bg-forest-soft text-forest">
        <Icon className="size-6" />
      </div>
      <h3 className="mt-4 font-display text-base font-bold">{title}</h3>
      {description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-20 animate-shimmer rounded-2xl bg-sand" />
      ))}
    </div>
  );
}
