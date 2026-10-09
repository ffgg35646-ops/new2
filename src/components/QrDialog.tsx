import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Copy, Download, Share2, X } from "lucide-react";
import { toast } from "sonner";

export function QrDialog({
  open,
  onClose,
  value,
  title,
  subtitle,
  fileName = "qr",
}: {
  open: boolean;
  onClose: () => void;
  value: string;
  title: string;
  subtitle?: string;
  fileName?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    if (!open || !canvasRef.current || !value) return;

    setDataUrl("");
    QRCode.toCanvas(
      canvasRef.current,
      value,
      { width: 320, margin: 3, errorCorrectionLevel: "H", color: { dark: "#0f4d3a", light: "#ffffff" } },
      (err) => {
        if (err) {
          toast.error("تعذّر إنشاء رمز QR. تحقق من رابط المكتب وحاول مرة أخرى.");
          return;
        }
        setDataUrl(canvasRef.current?.toDataURL("image/png") ?? "");
      },
    );
  }, [open, value]);

  if (!open) return null;

  async function copyLink() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const input = document.createElement("textarea");
        input.value = value;
        input.setAttribute("readonly", "");
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        const copied = document.execCommand("copy");
        input.remove();
        if (!copied) throw new Error("copy failed");
      }
      toast.success("تم نسخ رابط المكتب. أرسله للعميل أو افتحه من أي موبايل.");
    } catch {
      toast.error("تعذّر نسخ الرابط. اضغط على الرابط الظاهر وافتحه أو انسخه يدويًا.");
    }
  }

  async function shareLink() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: "صفحة المكتب العقاري", url: value });
        return;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
      }
    }
    await copyLink();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-xs rounded-3xl bg-background p-5 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <span className="font-display text-sm font-extrabold">{title}</span>
          <button onClick={onClose} aria-label="إغلاق" className="text-muted-foreground">
            <X className="size-5" />
          </button>
        </div>
        {subtitle && <p className="mt-1 text-[11px] text-muted-foreground">{subtitle}</p>}

        <div className="mt-4 grid place-items-center rounded-2xl bg-white p-3">
          <canvas ref={canvasRef} className="h-auto max-w-full" aria-label={`رمز QR الخاص بـ ${title}`} />
        </div>

        <a
          href={dataUrl || undefined}
          download={`${fileName}.png`}
          onClick={(event) => {
            if (!dataUrl) {
              event.preventDefault();
              toast.error("جارٍ تجهيز الرمز، حاول بعد لحظة.");
            }
          }}
          className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-forest py-3 text-sm font-bold text-background"
        >
          <Download className="size-4" /> تنزيل QR كصورة
        </a>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={copyLink}
            className="flex items-center justify-center gap-1.5 rounded-2xl bg-sand px-2 py-3 text-xs font-bold text-forest"
          >
            <Copy className="size-4" /> نسخ الرابط
          </button>
          <button
            type="button"
            onClick={shareLink}
            className="flex items-center justify-center gap-1.5 rounded-2xl bg-sand px-2 py-3 text-xs font-bold text-forest"
          >
            <Share2 className="size-4" /> مشاركة الرابط
          </button>
        </div>

        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="mt-3 block break-all text-[10px] font-semibold text-forest underline"
        >
          فتح صفحة المكتب لاختبارها
        </a>
        <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
          لكل مكتب رمز ورابط خاص به. إذا كانت كاميرا العميل لا تقرأ QR، أرسل له الرابط أو شاركه عبر واتساب.
        </p>
      </div>
    </div>
  );
}
