import { useState } from "react";
import { Crosshair, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { getCurrentPosition, googleMapsUrl, parseLatLng, type LatLng } from "@/lib/location";

export function LocationPicker({
  value,
  onChange,
}: {
  value: LatLng | null;
  onChange: (v: LatLng | null) => void;
}) {
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);

  function applyLink() {
    const parsed = parseLatLng(link);
    if (!parsed) {
      toast.error(
        "تعذّر قراءة الموقع من الرابط. الصق رابطًا يحتوي إحداثيات، أو استخدم «موقعي الحالي».",
      );
      return;
    }
    onChange(parsed);
    toast.success("تم تحديد الموقع من الرابط ✓");
  }

  async function useCurrent() {
    setBusy(true);
    try {
      const pos = await getCurrentPosition();
      onChange(pos);
      toast.success("تم تحديد موقعك الحالي ✓");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذّر تحديد الموقع");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <span className="block text-xs font-semibold text-muted-foreground">
        موقع العقار على الخريطة (اختياري)
      </span>

      <div className="flex gap-2">
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="الصق رابط قوقل ماب هنا"
          dir="ltr"
          className="flex-1 rounded-xl bg-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest"
        />
        <button
          type="button"
          onClick={applyLink}
          className="shrink-0 rounded-xl bg-forest-soft px-3 text-xs font-bold text-forest"
        >
          تطبيق
        </button>
      </div>

      <button
        type="button"
        onClick={useCurrent}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-sand py-2.5 text-xs font-bold text-forest disabled:opacity-60"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Crosshair className="size-4" />}
        تحديد موقعي الحالي (GPS)
      </button>

      {value && (
        <div className="flex items-center justify-between rounded-xl bg-forest-soft px-3 py-2 text-[11px] text-forest">
          <a
            href={googleMapsUrl(value.lat, value.lng)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 font-semibold underline underline-offset-2"
          >
            <MapPin className="size-3.5" /> معاينة الموقع المحدد
          </a>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setLink("");
            }}
            className="text-terracotta"
          >
            إزالة
          </button>
        </div>
      )}
    </div>
  );
}
