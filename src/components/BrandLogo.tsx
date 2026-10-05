import logoUrl from "@/assets/logo.jpeg";

export function BrandLogo({ size = 36 }: { size?: number }) {
  return (
    <img
      src={logoUrl}
      alt="عقار البطين"
      width={size}
      height={size}
      className="shrink-0 rounded-xl object-contain"
      style={{ width: size, height: size }}
    />
  );
}
