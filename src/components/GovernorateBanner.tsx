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
      className="relative w-full overflow-hidden bg-background"
    >
      <img
        key={bannerUrl}
        src={bannerUrl}
        alt={`عقار البطين — ${governorate.name_ar}`}
        loading="eager"
        decoding="async"
        className="block h-56 w-full object-cover object-center"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background via-background/35 to-transparent"
      />
    </section>
  );
}
