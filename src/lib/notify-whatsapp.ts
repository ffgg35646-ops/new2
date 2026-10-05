import { supabase } from "@/integrations/supabase/client";

type NotifyEvent = "booking_created" | "inquiry_created" | "booking_status";

export function notifyWhatsApp(event: NotifyEvent, id: string) {
  void supabase.functions
    .invoke("notify-whatsapp", { body: { event, id } })
    .catch((e) => console.warn("[whatsapp] فشل إرسال الإشعار:", e));
}
