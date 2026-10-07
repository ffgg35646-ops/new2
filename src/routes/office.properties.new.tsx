import { RoleGuard } from "@/lib/role-guard";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { MediaUploader } from "@/components/MediaUploader";
import { LocationPicker } from "@/components/LocationPicker";
import type { LatLng } from "@/lib/location";
import { FACINGS, LISTING_TYPES, PROPERTY_KINDS } from "@/lib/constants";
import { useAuth } from "@/lib/auth";
import { useSelectedGovernorate } from "@/lib/governorate";
import {
  planErrorMessage,
  useMyPlan,
  useOfficePropertiesCount,
} from "@/lib/plans";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/office/properties/new")({
  head: () => ({
    meta: [
      { title: "إضافة عرض عقاري | عقار البطين" },
      { name: "description", content: "أضف عرضًا عقاريًا جديدًا بالصور والمواصفات الكاملة." },
      { property: "og:title", content: "إضافة عرض عقاري | عقار البطين" },
      { property: "og:description", content: "نموذج إضافة عرض عقاري للمكاتب." },
    ],
  }),
  component: () => (
    <RoleGuard allow={["office"]} guestsTo="/auth/office">
      <NewProperty />
    </RoleGuard>
  ),
});

function NewProperty() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { governorateId } = useSelectedGovernorate();

  const { data: office } = useQuery({
    queryKey: ["my-office-id", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offices")
        .select("id,governorate_id")
        .eq("owner_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const propertyGovernorateId = office?.governorate_id ?? governorateId;

  const { propertyLimit } = useMyPlan();
  const { data: propertiesCount = 0 } = useOfficePropertiesCount(office?.id);
  const limitReached = propertyLimit != null && propertiesCount >= propertyLimit;

  const [kind, setKind] = useState("land");
  const [listing, setListing] = useState("sale");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [governorateName, setGovernorateName] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [price, setPrice] = useState("");
  const [area, setArea] = useState("");
  const [facing, setFacing] = useState("");
  const [streetWidth, setStreetWidth] = useState("");
  const [rooms, setRooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [ageYears, setAgeYears] = useState("");
  const [location, setLocation] = useState<LatLng | null>(null);
  const [images, setImages] = useState<string[]>([]);

  const create = useMutation({
    mutationFn: async () => {
      if (!office?.id) throw new Error("لم يتم العثور على مكتبك");
      if (limitReached)
        throw new Error(
          `باقتك تسمح بـ ${propertyLimit} عقار فقط. اختر باقة أخرى لزيادة الحد.`,
        );
      if (!title.trim()) throw new Error("أدخل عنوان العرض");
      if (!governorateName.trim()) throw new Error("أدخل اسم المحافظة");
      if (!neighborhood.trim()) throw new Error("أدخل اسم الحي");
      if (!price || !area) throw new Error("أدخل السعر والمساحة");

      const { data, error } = await supabase
        .from("properties")
        .insert({
          property_number: "",
          office_id: office.id,
          governorate_id: propertyGovernorateId!,
          is_published: true,
          is_deleted: false,
          kind: kind as never,
          listing: listing as never,
          title: title.trim(),
          description: description.trim() || null,
          governorate: governorateName.trim(),
          neighborhood: neighborhood.trim(),
          price: Number(price),
          area: Number(area),
          facing: facing || null,
          street_width: streetWidth ? Number(streetWidth) : null,
          rooms: rooms ? Number(rooms) : null,
          bathrooms: bathrooms ? Number(bathrooms) : null,
          age_years: ageYears ? Number(ageYears) : null,
          latitude: location?.lat ?? null,
          longitude: location?.lng ?? null,
          cover_url: images[0] ?? null,
        })
        .select("id")
        .single();
      if (error) throw error;

      if (images.length) {
        await supabase
          .from("property_images")
          .insert(images.map((url, i) => ({ property_id: data.id, url, sort_order: i })));
      }
      return data.id;
    },
    onSuccess: (id) => {
      toast.success("تم نشر العرض بنجاح");
      navigate({ to: "/properties/$propertyId", params: { propertyId: id } });
    },
    onError: (e) => toast.error(planErrorMessage(e)),
  });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <AppHeader showSearch={false} />
      <main className="flex-1 space-y-4 px-4 py-4 pb-28">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate({ to: "/office" })}
            aria-label="العودة لرئيسية المكتب"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-surface ring-1 ring-line"
          >
            <ArrowRight className="size-4" />
          </button>
          <h1 className="font-display text-xl font-extrabold">إضافة عرض عقاري</h1>
        </div>

        {propertyLimit != null && (
          <div className="rounded-2xl bg-sand p-3 text-[12px] leading-relaxed">
            <p>
              الحد الحالي: {propertiesCount} من {propertyLimit} عقارات.
              {limitReached && " وصلت إلى الحد الأقصى."}
            </p>
            <Link
              to="/office/subscription"
              className="mt-1 inline-block font-semibold text-terracotta underline underline-offset-4"
            >
              الترقية إلى الباقة الاحترافية لعقارات غير محدودة
            </Link>
          </div>
        )}

        <section className="space-y-3 rounded-3xl bg-surface p-4 ring-1 ring-line">
          <Row label="نوع العقار">
            {PROPERTY_KINDS.map((k) => (
              <Pill
                key={k.value}
                label={k.label}
                active={kind === k.value}
                onClick={() => setKind(k.value)}
              />
            ))}
          </Row>
          <Row label="نوع العرض">
            {LISTING_TYPES.map((l) => (
              <Pill
                key={l.value}
                label={l.label}
                active={listing === l.value}
                onClick={() => setListing(l.value)}
              />
            ))}
          </Row>

          <Field
            label="عنوان العرض"
            value={title}
            onChange={setTitle}
            placeholder="أرض سكنية بحي الروضة"
          />

          <Field
            label="المحافظة"
            value={governorateName}
            onChange={setGovernorateName}
            placeholder="المزاحمية"
          />

          <Field
            label="الحي"
            value={neighborhood}
            onChange={setNeighborhood}
            placeholder="حي الروضة"
          />

          <div className="grid grid-cols-2 gap-2">
            <Field label="السعر (ر.س)" value={price} onChange={setPrice} type="number" />
            <Field label="المساحة (م²)" value={area} onChange={setArea} type="number" />
            <Field
              label="عرض الشارع (م)"
              value={streetWidth}
              onChange={setStreetWidth}
              type="number"
            />
            <Field label="عمر العقار (سنة)" value={ageYears} onChange={setAgeYears} type="number" />
            <Field label="الغرف" value={rooms} onChange={setRooms} type="number" />
            <Field label="دورات المياه" value={bathrooms} onChange={setBathrooms} type="number" />
          </div>

          <Row label="الواجهة">
            {FACINGS.map((f) => (
              <Pill key={f} label={f} active={facing === f} onClick={() => setFacing(f)} />
            ))}
          </Row>

          <label className="block">
            <span className="mb-1 block text-[11px] text-muted-foreground">الوصف</span>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-2xl bg-sand px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-forest"
            />
          </label>

          <LocationPicker value={location} onChange={setLocation} />

          {userId && (
            <div>
              <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                صور العقار (حتى 8 ميجابايت للصورة)
              </span>
              <MediaUploader
                userId={userId}
                folder="properties"
                value={images}
                onChange={setImages}
                multiple
              />
            </div>
          )}

          <button
            onClick={() => create.mutate()}
            disabled={create.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 font-display font-bold text-background disabled:opacity-60"
          >
            {create.isPending && <Loader2 className="size-4 animate-spin" />} نشر العرض
          </button>
        </section>
      </main>

      <BottomNav variant="office" />
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold text-muted-foreground">{label}</div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-semibold transition",
        active ? "bg-forest text-background" : "bg-sand text-muted-foreground",
      )}
    >
      {label}
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl bg-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest"
      />
    </label>
  );
}
