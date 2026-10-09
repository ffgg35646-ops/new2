import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download, X } from "lucide-react";
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
    if (!open || !canvasRef.current) return;
    QRCode.toCanvas(
      canvasRef.current,
      value,
      { width: 240, margin: 2, color: { dark: "#0f4d3a", light: "#ffffff" } },
      (err) => {
        if (err) return;
        setDataUrl(canvasRef.current?.toDataURL("image/png") ?? "");
      },
    );
  }, [open, value]);

  if (!open) return null;

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
          <canvas ref={canvasRef} />
        </div>

        <a
          href={dataUrl || undefined}
          download={`${fileName}.png`}
          onClick={() => {
            if (!dataUrl) {
              toast.error("جارٍ توليد الرمز، حاول بعد لحظة");
            }
          }}
          className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-forest py-3 text-sm font-bold text-background"
        >
          <Download className="size-4" /> تنزيل الرمز
        </a>
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="mt-3 block break-all text-[10px] font-semibold text-forest underline"
        >
          فتح الرابط لاختباره
        </a>
        <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
          امسح الرمز بكاميرا الجوال أو Google Lens؛ سيفتح رابط المكتب أو العقار في الموقع.
        </p>
      </div>
    </div>
  );
}
