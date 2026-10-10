import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { uploadMedia as uploadMediaServer } from "@/lib/backend.functions";
import { getPendingSignupAvatar } from "@/lib/pending-signup-avatar";

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

export async function uploadPendingSignupAvatar(userId: string) {
  const file = await getPendingSignupAvatar();
  if (!file) throw new Error("الصورة المختارة غير متاحة. اختر الصورة مرة أخرى.");
  return uploadMedia(file, userId, "avatars");
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
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files).slice(0, multiple ? 10 : 1)) {
        urls.push(await uploadMedia(file, userId, folder));
      }
      onChange(multiple ? [...value, ...urls] : urls);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذّر رفع الملف");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      {folder === "avatars" ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            {value.map((url) => (
              <div key={url} className="relative size-20 overflow-hidden rounded-full ring-1 ring-line">
                <img src={url} alt="معاينة صورة الملف الشخصي" className="size-full object-cover" />
                <button
                  type="button"
                  onClick={() => onChange(value.filter((item) => item !== url))}
                  className="absolute left-1 top-1 grid size-6 place-items-center rounded-full bg-background/95 shadow-sm ring-1 ring-line"
                  aria-label="إزالة الصورة"
                  title="إزالة الصورة"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-surface px-3 py-3 text-sm font-bold text-forest transition-colors hover:bg-forest-soft disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
              <span>{busy ? "جارٍ رفع الصورة..." : value.length ? "تغيير الصورة من الجهاز" : "اختيار صورة من الجهاز"}</span>
            </button>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            {label} · JPG أو PNG أو WEBP · حتى 8 ميجابايت
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {value.map((url) => (
              <div key={url} className="relative size-20 overflow-hidden rounded-xl ring-1 ring-line">
                <img src={url} alt="" className="size-full object-cover" />
                <button
                  type="button"
                  onClick={() => onChange(value.filter((item) => item !== url))}
                  className="absolute top-1 left-1 grid size-5 place-items-center rounded-full bg-background/90"
                  aria-label="حذف"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="grid size-20 place-items-center rounded-xl border border-dashed border-line bg-surface text-muted-foreground"
            >
              {busy ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">{label} · JPG/PNG/WEBP · حتى 8 ميجابايت</p>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED.join(",")}
        multiple={multiple}
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />
    </div>
  );
}
