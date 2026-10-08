type NotifyEvent = "booking_created" | "inquiry_created" | "booking_status";

export function notifyWhatsApp(_event: NotifyEvent, _id: string) {
  // The current Mongo/TanStack backend does not expose Supabase Edge Functions.
  // Keep this helper safe until a WhatsApp provider/webhook is connected.
  return;
}
