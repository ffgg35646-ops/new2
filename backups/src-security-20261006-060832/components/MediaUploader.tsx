import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { storageRef } from "@/lib/media-url";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024;

export async function uploadMedia(file: File, userId: string, folder: string) {
  if (!ALLOWED.includes(file.type)) throw new Error("الصيغة غير مدعومة. استخدم JPG أو PNG أو WEBP");
  if (file.size > MAX_BYTES) throw new Error("حجم الملف يتجاوز 8 ميجابايت");
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("property-media").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  // نخزن مسار الملف فقط، وليس Signed URL مؤقت.
  // الرابط الحقيقي يتولد وقت عرض الملف.
  return storageRef(path);
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
      <div className="flex flex-wrap gap-2">
        {value.map((url) => (
          <div key={url} className="relative size-20 overflow-hidden rounded-xl ring-1 ring-line">
            <img src={url} alt="" className="size-full object-cover" />
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
