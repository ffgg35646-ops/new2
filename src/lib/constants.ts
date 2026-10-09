export const PROPERTY_KINDS = [
  { value: "land", label: "أرض", plural: "أراضي" },
  { value: "villa", label: "فيلا", plural: "فلل" },
  { value: "apartment", label: "شقة", plural: "شقق" },
  { value: "farm", label: "مزرعة", plural: "مزارع" },
  { value: "rest_house", label: "استراحة", plural: "استراحات" },
  { value: "building", label: "عمارة", plural: "عمائر" },
  { value: "shop", label: "محل", plural: "محلات" },
] as const;

export type PropertyKind = (typeof PROPERTY_KINDS)[number]["value"];

export const LISTING_TYPES = [
  { value: "sale", label: "للبيع" },
  { value: "rent", label: "للإيجار" },
] as const;

export const PROPERTY_STATES = [
  { value: "available", label: "متاح" },
  { value: "reserved", label: "محجوز" },
  { value: "sold", label: "مباع" },
  { value: "rented", label: "مؤجر" },
] as const;

export const FACINGS = ["شمال", "جنوب", "شرق", "غرب", "شارعين", "زاوية"] as const;

export const BOOKING_STATUS: Record<string, string> = {
  pending: "بانتظار الموافقة",
  accepted: "مقبول",
  rejected: "مرفوض",
  completed: "المعاينة انتهت",
  appointment_ended: "انتهى موعد المعاينة",
  cancelled: "ملغي",
};

export const REQUEST_STATUS: Record<string, string> = {
  active: "نشط",
  expired: "منتهي",
  cancelled: "ملغي",
  fulfilled: "مكتمل",
};

export const VERIFICATION_STATUS: Record<string, string> = {
  pending: "قيد المراجعة",
  verified: "موثق",
  rejected: "مرفوض",
};

export function kindLabel(value?: string | null) {
  return PROPERTY_KINDS.find((k) => k.value === value)?.label ?? "—";
}
export function listingLabel(value?: string | null) {
  return LISTING_TYPES.find((k) => k.value === value)?.label ?? "—";
}
export function stateLabel(value?: string | null) {
  return PROPERTY_STATES.find((k) => k.value === value)?.label ?? "—";
}

export const QUICK_KINDS = PROPERTY_KINDS.filter((k) =>
  ["land", "villa", "apartment", "farm", "rest_house", "building"].includes(k.value),
);

export const RENT_PERIODS = [
  { value: "yearly", label: "سنوي" },
  { value: "monthly", label: "شهري" },
  { value: "daily", label: "يومي" },
] as const;

export function rentPeriodLabel(value?: string | null) {
  return RENT_PERIODS.find((p) => p.value === value)?.label ?? "سنوي";
}

export const INQUIRY_TYPES = [
  { value: "viewing", label: "أرغب بمعاينة العقار", short: "معاينة" },
  { value: "buy", label: "أرغب بالشراء", short: "شراء" },
  { value: "rent", label: "أرغب بالاستئجار", short: "استئجار" },
  { value: "question", label: "لدي استفسار", short: "استفسار" },
] as const;

export function inquiryTypeLabel(value?: string | null) {
  return INQUIRY_TYPES.find((t) => t.value === value)?.short ?? "طلب";
}

export const INQUIRY_STATUSES = [
  { value: "new", label: "جديد" },
  { value: "accepted", label: "مقبول" },
  { value: "rejected", label: "مرفوض" },
  { value: "contacted", label: "تم التواصل" },
  { value: "scheduled", label: "موعد معاينة" },
  { value: "completed", label: "مكتمل" },
  { value: "closed", label: "مغلق" },
] as const;

export function inquiryStatusLabel(value?: string | null) {
  return INQUIRY_STATUSES.find((s) => s.value === value)?.label ?? "—";
}
