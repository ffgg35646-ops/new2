import type { Governorate } from "@/lib/governorate";

export function GovernorateBanner({ governorate }: { governorate: Governorate | null }) {
  const name = governorate?.name_ar?.replace(/\s+/g, "") ?? "";
  const bannerUrl = governorate
    ? name.includes("ضرما")
      ? "/5943001103257505506.jpg"
      : name.includes("المزاحمية")
        ? "/5943001103257505505.jpg"
        : governorate.banner_url
    : null;

  if (!governorate || !bannerUrl) return null;

  return (
    <section
      aria-label={`بانر ${governorate.name_ar}`}
      className="mx-auto mt-2 mb-3 w-[calc(100%-2rem)] max-w-[400px] min-w-0 overflow-hidden rounded-2xl bg-background [contain:paint]"
    >
      <img
        key={bannerUrl}
        src={bannerUrl}
        alt={`عقار البطين — ${governorate.name_ar}`}
        loading="eager"
        decoding="async"
        className="block h-auto max-h-64 w-full max-w-full rounded-[inherit] object-contain object-center"
      />
    </section>
  );
}
