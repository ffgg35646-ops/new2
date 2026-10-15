import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationItem = number | "gap-start" | "gap-end";

function getPageItems(page: number, pageCount: number): PaginationItem[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, "gap-end", pageCount];
  if (page >= pageCount - 3) {
    return [1, "gap-start", pageCount - 4, pageCount - 3, pageCount - 2, pageCount - 1, pageCount];
  }
  return [1, "gap-start", page - 1, page, page + 1, "gap-end", pageCount];
}

export function PropertyPagination({
  page,
  pageCount,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;

  const items = getPageItems(page, pageCount);
  const buttonClass =
    "grid size-8 shrink-0 place-items-center rounded-lg text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-35";

  return (
    <nav aria-label="صفحات العقارات" className="flex flex-wrap items-center justify-center gap-1.5 py-2" dir="rtl">
      <button
        type="button"
        aria-label="الصفحة السابقة"
        disabled={page <= 1}
        onClick={() => onPageChange(Math.max(1, page - 1))}
        className={buttonClass + " bg-surface text-foreground ring-1 ring-line"}
      >
        <ChevronRight className="size-4" />
      </button>
      {items.map((item) => {
        if (typeof item !== "number") {
          return <span key={item} className="px-1 text-xs text-muted-foreground">…</span>;
        }
        const active = item === page;
        return (
          <button
            key={item}
            type="button"
            aria-label={`الصفحة ${item}`}
            aria-current={active ? "page" : undefined}
            onClick={() => onPageChange(item)}
            className={buttonClass + (active ? " bg-forest text-background ring-1 ring-forest" : " bg-surface text-foreground ring-1 ring-line")}
          >
            {item}
          </button>
        );
      })}
      <button
        type="button"
        aria-label="الصفحة التالية"
        disabled={page >= pageCount}
        onClick={() => onPageChange(Math.min(pageCount, page + 1))}
        className={buttonClass + " bg-surface text-foreground ring-1 ring-line"}
      >
        <ChevronLeft className="size-4" />
      </button>
    </nav>
  );
}
