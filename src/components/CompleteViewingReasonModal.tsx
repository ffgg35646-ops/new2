import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, X, XCircle } from "lucide-react";

export function CompleteViewingReasonModal({
  open,
  pending = false,
  title = "تسجيل انتهاء المعاينة",
  heading = "لماذا أنهيت المعاينة؟",
  reasonLabel = "سبب إنهاء المعاينة",
  placeholder = "اكتب السبب الذي تريد إرساله للمكتب",
  confirmLabel = "تأكيد إنهاء المعاينة",
  variant = "complete",
  optionalReason = false,
  onClose,
  onConfirm,
}: {
  open: boolean;
  pending?: boolean;
  title?: string;
  heading?: string;
  reasonLabel?: string;
  placeholder?: string;
  confirmLabel?: string;
  variant?: "complete" | "reject";
  optionalReason?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  useEffect(() => {
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
          <div>
            <div className="text-[10px] font-semibold text-muted-foreground">
              {title}
            </div>
            <h2 className="mt-1 font-display text-base font-extrabold">
              {heading}
            </h2>
          </div>
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
            {reasonLabel}
          </span>
          <textarea
            autoFocus
            rows={4}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={placeholder}
            className="w-full rounded-2xl bg-sand px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-forest"
          />
        </label>

        <button
          type="button"
          onClick={() => {
            const value = reason.trim();
            if (!optionalReason && value.length < 3) return;
            onConfirm(value);
          }}
          disabled={pending || (!optionalReason && reason.trim().length < 3)}
          className={`mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-background disabled:opacity-50 ${variant === "reject" ? "bg-terracotta" : "bg-forest"}`}
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : variant === "reject" ? (
            <XCircle className="size-4" />
          ) : (
            <CheckCircle2 className="size-4" />
          )}
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
