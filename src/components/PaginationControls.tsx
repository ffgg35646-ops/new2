import { cn } from "@/lib/utils";

type PaginationControlsProps = {
  page: number;
  total: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
};

export function PaginationControls({
  page,
  total,
  pageSize = 6,
  onPageChange,
}: PaginationControlsProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  if (total <= pageSize) return null;

  const currentPage = Math.min(Math.max(1, page), pageCount);
  const firstVisiblePage = Math.max(1, Math.min(currentPage - 2, pageCount - 4));
  const lastVisiblePage = Math.min(pageCount, firstVisiblePage + 4);
  const pages = Array.from(
    { length: lastVisiblePage - firstVisiblePage + 1 },
    (_, index) => firstVisiblePage + index,
  );
  const firstItem = (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, total);

  return (
    <nav
      aria-label="تقسيم صفحات النتائج"
      className="mt-3 flex flex-col gap-2 rounded-2xl bg-surface px-3 py-2.5 ring-1 ring-line sm:flex-row sm:items-center sm:justify-between"
    >
      <span className="text-center text-[11px] text-muted-foreground">
        عرض {firstItem}–{lastItem} من {total}
      </span>
      <div className="flex flex-wrap items-center justify-center gap-1.5" dir="rtl">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-forest ring-1 ring-line disabled:cursor-not-allowed disabled:opacity-35"
        >
          السابق
        </button>
        {pages.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            onClick={() => onPageChange(pageNumber)}
            aria-current={pageNumber === currentPage ? "page" : undefined}
            className={cn(
              "grid min-w-8 place-items-center rounded-lg px-2.5 py-1.5 text-xs font-bold ring-1 ring-line",
              pageNumber === currentPage
                ? "bg-forest text-background ring-forest"
                : "bg-background text-foreground",
            )}
          >
            {pageNumber}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= pageCount}
          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-forest ring-1 ring-line disabled:cursor-not-allowed disabled:opacity-35"
        >
          التالي
        </button>
      </div>
    </nav>
  );
}
