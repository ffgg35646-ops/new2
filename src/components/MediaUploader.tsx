import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { uploadMedia as uploadMediaServer } from "@/lib/backend.functions";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024;

export async function uploadMedia(file: File, userId: string, folder: string) {
  const allowedTypes = folder === "support"
    ? [...ALLOWED, "application/pdf"]
    : ALLOWED;
  const maxBytes = folder === "support" ? 20 * 1024 * 1024 : MAX_BYTES;
  if (!allowedTypes.includes(file.type)) {
    throw new Error(folder === "support"
      ? "صيغة المرفق غير مدعومة. استخدم صورة أو PDF."
      : "الصيغة غير مدعومة. استخدم JPG أو PNG أو WEBP");
  }
  if (file.size <= 0 || file.size > maxBytes) {
    throw new Error(folder === "support"
      ? "حجم مرفق الدعم يجب ألا يتجاوز 20 ميجابايت."
      : "حجم الملف يتجاوز 8 ميجابايت");
  }
  const ext = file.name.split(".").pop() ?? "jpg";
  const form = new FormData();
  form.append("file", file, file.name);
  form.append("folder", folder);
  form.append("uploaderId", userId);

  const result = await uploadMediaServer({ data: form });

  const publicUrl = result.data?.publicUrl;
  if (!publicUrl) throw new Error("تعذّر إنشاء رابط المرفق.");

  return publicUrl;
}

export function MediaUploader({
  userId,
  folder,
  value,
  onChange,
  multiple = false,
  label = "أضف صورة",
}: {
  userId: string;
  folder: string;
  value: string[];
  onChange: (urls: string[]) => void;
  multiple?: boolean;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files?.length || busy) return;
    setBusy(true);
    setUploadError("");
    try {
      const urls: string[] = [];
      for (const file of Array.from(files).slice(0, multiple ? 10 : 1)) {
        urls.push(await uploadMedia(file, userId, folder));
      }
      onChange(multiple ? [...value, ...urls] : urls);
      toast.success("تم رفع الصورة بنجاح");
    } catch (e) {
      const message = e instanceof Error ? e.message : "تعذّر رفع الملف";
      setUploadError(message);
      toast.error(message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((url) => (
          <div key={url} className="relative size-20 overflow-hidden rounded-xl ring-1 ring-line">
            <img src={url} alt="الصورة المرفوعة" className="size-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(value.filter((u) => u !== url))}
              className="absolute top-1 left-1 grid size-5 place-items-center rounded-full bg-background/90"
              aria-label="حذف"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
        <label
          className={
            "relative grid size-20 place-items-center rounded-xl border border-dashed border-line bg-surface text-muted-foreground " +
            (busy ? "cursor-wait opacity-60" : "cursor-pointer hover:bg-sand")
          }
          aria-label={busy ? "جارٍ رفع الصورة" : label}
        >
          {busy ? <Loader2 className="pointer-events-none size-5 animate-spin" /> : <ImagePlus className="pointer-events-none size-5" />}
          <input
            ref={inputRef}
            type="file"
            accept={ALLOWED.join(",")}
            multiple={multiple}
            disabled={busy}
            aria-label={label}
            className="absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-wait"
            onChange={(e) => void handleFiles(e.target.files)}
          />
        </label>
      </div>
      <p className="text-[11px] text-muted-foreground">{label} · JPG/PNG/WEBP · حتى 8 ميجابايت</p>
      {uploadError && <p role="alert" className="text-xs text-destructive">فشل رفع الصورة: {uploadError}</p>}
    </div>
  );
}
