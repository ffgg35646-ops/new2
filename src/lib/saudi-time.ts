const SAUDI_TIME_ZONE = "Asia/Riyadh";

export function saudiDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SAUDI_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return get("year") + "-" + get("month") + "-" + get("day");
}

export function saudiAppointmentDateTime(
  visitDate: string,
  visitTime: string,
) {
  const normalizedTime = String(visitTime ?? "").slice(0, 5);
  return new Date(visitDate + "T" + normalizedTime + ":00+03:00");
}

export function isSaudiAppointmentStarted(
  visitDate: string,
  visitTime: string,
  now = new Date(),
) {
  const appointment = saudiAppointmentDateTime(visitDate, visitTime);
  return Number.isFinite(appointment.getTime()) && appointment.getTime() <= now.getTime();
}

export function isSaudiAppointmentToday(
  visitDate: string,
  now = new Date(),
) {
  return String(visitDate ?? "").slice(0, 10) === saudiDateKey(now);
}

export function formatBookingTime(visitTime: string) {
  return String(visitTime ?? "").slice(0, 5);
}
