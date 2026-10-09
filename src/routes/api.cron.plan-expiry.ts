import { createFileRoute } from "@tanstack/react-router";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { getMongoDb } from "@/lib/mongo.server";

function hasValidCronSecret(request: Request) {
  const secret = process.env["CRON_SECRET"] ?? "";
  const supplied = request.headers.get("authorization") ?? "";
  const expected = secret ? `Bearer ${secret}` : "";

  if (!expected || supplied.length !== expected.length) return false;

  return timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
}

function asDate(value: unknown): Date | null {
  if (value == null) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isFinite(date.getTime()) ? date : null;
}

async function processPlanExpirations(request: Request) {
  if (!process.env["CRON_SECRET"]) {
    return Response.json(
      { error: "إعداد CRON_SECRET مطلوب لتشغيل مهمة انتهاء الباقات." },
      { status: 503 },
    );
  }

  if (!hasValidCronSecret(request)) {
    return Response.json({ error: "غير مصرح" }, { status: 401 });
  }

  try {
    const db = await getMongoDb();
    const offices = db.collection<Record<string, any>>("offices");
    const notifications = db.collection<Record<string, any>>("notifications");
    const events = db.collection<Record<string, any>>("office_plan_events");
    const packages = db.collection<Record<string, any>>("package_catalog");

    const freePackage = await packages.findOne({
      code: "free",
      is_active: { $ne: false },
    });

    const now = new Date();
    const reminderDeadline = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    // Include legacy Pro rows without an expiry; they must not remain Pro forever.
    const activeProOffices = await offices.find({
      plan: "pro",
      is_deleted: { $ne: true },
    }).toArray();

    let remindersSent = 0;
    let downgraded = 0;
    let notificationErrors = 0;

    for (const office of activeProOffices) {
      const expiry = asDate(office.plan_expires_at);
      const officeId = String(office.id ?? "");
      if (!officeId) continue;

      if (!expiry || expiry.getTime() <= now.getTime()) {
        const update: Record<string, any> = {
          $set: {
            plan: "free",
            last_plan_expired_at: now,
            updated_at: now,
          },
        };

        if (freePackage?.id) {
          (update.$set as Record<string, unknown>).package_id = freePackage.id;
        } else {
          update.$unset = { package_id: "" };
        }

        const changed = await offices.updateOne(
          {
            id: officeId,
            plan: "pro",
            plan_expires_at: office.plan_expires_at,
          },
          update,
        );

        if (changed.modifiedCount !== 1) continue;
        downgraded += 1;

        try {
          await events.insertOne({
            id: randomUUID(),
            _id: randomUUID(),
            office_id: officeId,
            package_id: freePackage?.id ?? null,
            plan: "free",
            action: "expired",
            created_at: now,
            expired_at: expiry,
            note: "انتهت مدة الباقة الاحترافية وعاد المكتب إلى الباقة المجانية.",
          });
        } catch (error) {
          console.error("[plan-expiry] event history insert failed", error);
        }

        if (office.owner_id) {
          try {
            await notifications.insertOne({
              id: randomUUID(),
              _id: randomUUID(),
              user_id: String(office.owner_id),
              title: "انتهت الباقة الاحترافية",
              body: "انتهت مدة باقة Pro وعاد مكتبك إلى الباقة المجانية. يمكنك الاشتراك مجددًا لتفعيل المميزات الاحترافية.",
              type: "pro_expired",
              link: "/office/subscription",
              is_read: false,
              created_at: now,
              office_id: officeId,
              expires_at: expiry,
            });
          } catch (error) {
            notificationErrors += 1;
            console.error("[plan-expiry] expiration notification failed", error);
          }
        }

        continue;
      }

      // إرسال تذكير واحد فقط لكل تاريخ انتهاء، خلال آخر 48 ساعة قبل الانتهاء.
      if (expiry.getTime() <= reminderDeadline.getTime() && office.owner_id) {
        const expiryKey = expiry.toISOString();
        const claimed = await offices.updateOne(
          {
            id: officeId,
            plan: "pro",
            plan_expires_at: office.plan_expires_at,
            pro_expiry_notice_for: { $ne: expiryKey },
          },
          { $set: { pro_expiry_notice_for: expiryKey } },
        );

        if (claimed.modifiedCount !== 1) continue;

        try {
          await notifications.insertOne({
            id: randomUUID(),
            _id: randomUUID(),
            user_id: String(office.owner_id),
            title: "باقة Pro ستنتهي قريبًا",
            body: `ستنتهي الباقة الاحترافية خلال يوم أو يومين في ${expiry.toLocaleDateString("ar-SA", { timeZone: "Asia/Riyadh" })}. جدّد الاشتراك للحفاظ على الدردشة والمميزات الاحترافية.`,
            type: "pro_expiry_reminder",
            link: "/office/subscription",
            is_read: false,
            created_at: now,
            office_id: officeId,
            expires_at: expiry,
            notification_key: `pro-expiry:${officeId}:${expiryKey}`,
          });
          remindersSent += 1;
        } catch (error) {
          notificationErrors += 1;
          // اسمح للمهمة اليومية بإعادة المحاولة إذا فشل إنشاء الإشعار.
          await offices.updateOne(
            { id: officeId, pro_expiry_notice_for: expiryKey },
            { $unset: { pro_expiry_notice_for: "" } },
          );
          console.error("[plan-expiry] reminder notification failed", error);
        }
      }
    }

    return Response.json({
      ok: true,
      checked: activeProOffices.length,
      remindersSent,
      downgraded,
      notificationErrors,
      ranAt: now.toISOString(),
    });
  } catch (error) {
    console.error("[plan-expiry]", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "تعذر معالجة انتهاء الباقات." },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/cron/plan-expiry")({
  server: {
    handlers: {
      GET: async ({ request }) => processPlanExpirations(request),
    },
  },
});
