import { Link } from "@tanstack/react-router";
import { Crown, Lock, X } from "lucide-react";
import { useState } from "react";

export const PRO_LOCK_MESSAGE =
  "هذه الميزة متاحة ضمن الباقة الاحترافية فقط. قم بالترقية للاستفادة منها.";

export const CHAT_LOCK_MESSAGE =
  "الدردشة متاحة ضمن الباقة الاحترافية. قم بترقية باقتك لبدء المحادثات مع العملاء.";

export function ProBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={
        "inline-flex items-center gap-1 rounded-full bg-terracotta-soft px-2 py-0.5 text-[10px] font-bold text-terracotta " +
        className
      }
    >
      <Lock className="size-3" /> احترافي
    </span>
  );
}

export function ProLockDialog({
  open,
  onClose,
  message = PRO_LOCK_MESSAGE,
  ctaLabel = "الترقية إلى الباقة الاحترافية",
}: {
  open: boolean;
  onClose: () => void;
  message?: string;
  ctaLabel?: string;
}) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-end bg-foreground/40 p-0 sm:place-items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-surface p-5 ring-1 ring-line sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-terracotta-soft text-terracotta">
            <Crown className="size-5" />
          </span>
          <p className="pt-1 text-sm leading-relaxed">{message}</p>
          <button onClick={onClose} aria-label="إغلاق" className="ms-auto text-muted-foreground">
            <X className="size-4" />
          </button>
        </div>

        <Link
          to="/office/subscription"
          onClick={onClose}
          className="mt-5 block rounded-2xl bg-forest py-3.5 text-center font-display font-bold text-background"
        >
          {ctaLabel}
        </Link>
        <button
          onClick={onClose}
          className="mt-2 w-full rounded-2xl bg-sand py-3 text-center text-xs font-semibold text-muted-foreground"
        >
          لاحقًا
        </button>
      </div>
    </div>
  );
}

export function useProLock(isPro: boolean) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(PRO_LOCK_MESSAGE);

  function guard(action: () => void, lockMessage: string = PRO_LOCK_MESSAGE) {
    if (isPro) {
      action();
      return;
    }
    setMessage(lockMessage);
    setOpen(true);
  }

  return {
    locked: !isPro,
    guard,
    dialog: <ProLockDialog open={open} onClose={() => setOpen(false)} message={message} />,
  };
}
