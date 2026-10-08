import { useEffect, useState } from "react";
import { CalendarDays, Loader2, Phone, X } from "lucide-react";
import { saudiAppointmentDateTime, saudiInputDateTime } from "@/lib/saudi-time";

export function EditViewingBookingModal({
  open,
  pending = false,
  visitDate,
  visitTime,
  contactPhone,
  onClose,
  onConfirm,
}: {
  open: boolean;
  pending?: boolean;
  visitDate: string;
  visitTime: string;
  contactPhone: string;
  onClose: () => void;
  onConfirm: (values: {
    visitDate: string;
    visitTime: string;
    contactPhone: string;
  }) => void;
}) {
  const [dateTime, setDateTime] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!open) return;
    setDateTime(
      visitDate && visitTime
        ? String(visitDate).slice(0, 10) + "T" + String(visitTime).slice(0, 5)
        : saudiInputDateTime(new Date(Date.now() + 60_000)),
    );
    setPhone(contactPhone ?? "");
  }, [open, visitDate, visitTime, contactPhone]);

  if (!open) return null;

  const minimum = saudiInputDateTime(new Date(Date.now() + 60_000));

  const submit = () => {
    const value = phone.trim();
    const date = dateTime.slice(0, 10);
    const time = dateTime.slice(11, 16);

    if (!date || !time || value.length < 3) return;

    const appointment = saudiAppointmentDateTime(date, time);
    if (!Number.isFinite(appointment.getTime()) || appointment.getTime() <= Date.now()) return;

    onConfirm({
      visitDate: date,
      visitTime: time,
      contactPhone: value,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/45 p-3"
      role="dialog"
      aria-modal="true"
      aria-label="تعديل المعاينة"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-[28px] bg-surface p-4 shadow-2xl ring-1 ring-line"
        onClick={(event) => event.stopPropagation()}
        dir="rtl"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-semibold text-muted-foreground">
              تعديل حجز المعاينة
            </div>
            <h2 className="mt-1 font-display text-base font-extrabold">
              عدّل الموعد أو وسيلة الاتصال
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full bg-background ring-1 ring-line"
            aria-label="إغلاق"
          >
            <X className="size-4" />
          </button>
        </div>

        <label className="mt-4 block">
          <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <CalendarDays className="size-3.5" /> تاريخ ووقت المعاينة
          </span>
          <input
            type="datetime-local"
            value={dateTime}
            min={minimum}
            onChange={(event) => setDateTime(event.target.value)}
            className="w-full rounded-2xl bg-sand px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-forest"
          />
        </label>

        <label className="mt-3 block">
          <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Phone className="size-3.5" /> وسيلة الاتصال
          </span>
          <input
            type="text"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="رقم الهاتف أو وسيلة الاتصال"
            className="w-full rounded-2xl bg-sand px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-forest"
          />
        </label>

        <button
          type="button"
          onClick={submit}
          disabled={pending || !dateTime || phone.trim().length < 3}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 text-sm font-bold text-background disabled:opacity-50"
        >
          {pending && <Loader2 className="size-4 animate-spin" />}
          حفظ التعديل
        </button>
      </div>
    </div>
  );
}
