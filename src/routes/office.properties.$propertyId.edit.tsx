import { RoleGuard } from "@/lib/role-guard";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { MediaUploader } from "@/components/MediaUploader";
import { LocationPicker } from "@/components/LocationPicker";
import type { LatLng } from "@/lib/location";
import { FACINGS, LISTING_TYPES, PROPERTY_KINDS } from "@/lib/constants";
import { useAuth } from "@/lib/auth";
import { useNeighborhoods, useSelectedGovernorate } from "@/lib/governorate";
import { cn } from "@/lib/utils";
import { useMyOffice } from "@/lib/office";

export const Route = createFileRoute("/office/properties/$propertyId/edit")({
  head: () => ({
    meta: [
      { title: "تعديل العرض العقاري | عقار البطين" },
      { name: "description", content: "عدّل بيانات وصور عرضك العقاري." },
      { property: "og:title", content: "تعديل العرض العقاري | عقار البطين" },
      { property: "og:description", content: "نموذج تعديل عرض عقاري للمكاتب." },
    ],
  }),
  component: () => (
    <RoleGuard allow={["office"]} guestsTo="/auth/office">
      <EditProperty />
    </RoleGuard>
  ),
});

function EditProperty() {
  const { propertyId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { userId } = useAuth();
  const { data: membership } = useMyOffice();
  const officeId = membership?.office?.id ?? null;
  const { governorateId } = useSelectedGovernorate();
  const { data: neighborhoods = [] } = useNeighborhoods(governorateId);

  const { data: property, isLoading } = useQuery({
    queryKey: ["edit-property", propertyId, officeId],
    enabled: !!officeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*, property_images(id,url,sort_order)")
        .eq("id", propertyId)
        .eq("office_id", officeId!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const [kind, setKind] = useState("land");
  const [listing, setListing] = useState("sale");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
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
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!property || loaded) return;
    setKind(property.kind);
    setListing(property.listing);
    setTitle(property.title);
    setDescription(property.description ?? "");
    setNeighborhood(property.neighborhood);
    setPrice(String(property.price ?? ""));
    setArea(String(property.area ?? ""));
    setFacing(property.facing ?? "");
    setStreetWidth(property.street_width != null ? String(property.street_width) : "");
    setRooms(property.rooms != null ? String(property.rooms) : "");
    setBathrooms(property.bathrooms != null ? String(property.bathrooms) : "");
    setAgeYears(property.age_years != null ? String(property.age_years) : "");
    if (property.latitude != null && property.longitude != null) {
      setLocation({ lat: property.latitude, lng: property.longitude });
    }
    const imgs = [...((property.property_images ?? []) as { url: string; sort_order: number }[])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((i) => i.url);
    setImages(
      property.cover_url && !imgs.includes(property.cover_url)
        ? [property.cover_url, ...imgs]
        : imgs,
    );
    setLoaded(true);
  }, [property, loaded]);

  const save = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error("أدخل عنوان العرض");
      if (!neighborhood) throw new Error("اختر الحي");
      if (!price || !area) throw new Error("أدخل السعر والمساحة");

      const { data: updated, error } = await supabase
        .from("properties")
        .update({
          kind: kind as never,
          listing: listing as never,
          title: title.trim(),
          description: description.trim() || null,
          neighborhood,
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
        .eq("id", propertyId)
        .eq("office_id", officeId!)
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (!updated) throw new Error("العقار غير موجود ضمن عروض مكتبك.");

      await supabase.from("property_images").delete().eq("property_id", propertyId);
      if (images.length) {
        await supabase
          .from("property_images")
          .insert(images.map((url, i) => ({ property_id: propertyId, url, sort_order: i })));
      }
    },
    onSuccess: () => {
      toast.success("تم حفظ التعديلات");
      void qc.invalidateQueries({ queryKey: ["property", propertyId] });
      void qc.invalidateQueries({ queryKey: ["office-properties"] });
      navigate({ to: "/properties/$propertyId", params: { propertyId } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "تعذّر حفظ التعديلات"),
  });

  if (isLoading || !loaded) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="size-6 animate-spin text-forest" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <AppHeader showSearch={false} />
      <main className="flex-1 space-y-4 px-4 py-4 pb-24">
        <h1 className="font-display text-xl font-extrabold">تعديل العرض العقاري</h1>

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

          <Field label="عنوان العرض" value={title} onChange={setTitle} />

          <Row label="الحي">
            {neighborhoods.map((n) => (
              <Pill
                key={n.id}
                label={n.name_ar}
                active={neighborhood === n.name_ar}
                onClick={() => setNeighborhood(n.name_ar)}
              />
            ))}
            {neighborhood && !neighborhoods.some((n) => n.name_ar === neighborhood) && (
              <Pill label={neighborhood} active onClick={() => {}} />
            )}
          </Row>

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
                صور العقار (الأولى هي الغلاف)
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
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 font-display font-bold text-background disabled:opacity-60"
          >
            {save.isPending && <Loader2 className="size-4 animate-spin" />} حفظ التعديلات
          </button>
        </section>
      </main>
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl bg-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest"
      />
    </label>
  );
}
