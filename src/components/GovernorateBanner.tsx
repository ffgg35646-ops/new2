import type { Governorate } from "@/lib/governorate";

export function GovernorateBanner({ governorate }: { governorate: Governorate | null }) {
  if (!governorate?.banner_url) return null;

  return (
    <section
      aria-label="إعلان ترحيبي"
      className="overflow-hidden rounded-3xl bg-surface ring-1 ring-line"
    >
      <img
        key={governorate.banner_url}
        src={governorate.banner_url}
        alt={`عقار البطين — العقار في ${governorate.name_ar}`}
        loading="eager"
        decoding="async"
        className="block h-auto w-full object-contain"
      />
    </section>
  );
}
