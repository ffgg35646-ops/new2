import { Loader2, X } from "lucide-react";

export function CancelReasonModal({
  open,
  title = "إلغاء المعاينة",
  pending = false,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title?: string;
  pending?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = React.useState("");

  React.useEffect(() => {
    if (open) setReason("");
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/45 p-3"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-[28px] bg-surface p-4 shadow-2xl ring-1 ring-line"
        onClick={(event) => event.stopPropagation()}
        dir="rtl"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-base font-extrabold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full bg-background ring-1 ring-line"
            aria-label="إغلاق"
          >
            <X className="size-4" />
          </button>
        </div>

        <label className="mt-4 block">
          <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
            سبب الإلغاء
          </span>
          <textarea
            autoFocus
            rows={4}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="اكتب سبب إلغاء المعاينة"
            className="w-full rounded-2xl bg-sand px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-forest"
          />
        </label>

        <button
          type="button"
          onClick={() => {
            const value = reason.trim();
            if (value.length < 3) return;
            onConfirm(value);
          }}
          disabled={pending || reason.trim().length < 3}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-terracotta py-3.5 text-sm font-bold text-background disabled:opacity-50"
        >
          {pending && <Loader2 className="size-4 animate-spin" />}
          تأكيد إلغاء المعاينة
        </button>
      </div>
    </div>
  );
}

import * as React from "react";
