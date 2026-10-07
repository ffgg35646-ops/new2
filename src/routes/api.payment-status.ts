import { createFileRoute } from "@tanstack/react-router";
import { getMongoCollection } from "@/lib/mongo.server";
import { getSessionUserId } from "@/lib/session.server";

export const Route = createFileRoute("/api/payment-status")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const userId = getSessionUserId();
          if (!userId) return Response.json({ error: "انتهت جلسة الدخول" }, { status: 401 });

          const body = (await request.json()) as { checkoutId?: string };
          const checkoutId = String(body.checkoutId ?? "").trim();
          if (!checkoutId) return Response.json({ error: "checkoutId مفقود" }, { status: 400 });

          const txs = await getMongoCollection<Record<string, unknown>>("payment_transactions");
          const tx = await txs.findOne({ checkout_id: checkoutId, user_id: userId });

          if (!tx) return Response.json({ error: "عملية الدفع غير موجودة" }, { status: 404 });

          const baseUrl = String(process.env["HYPERPAY_BASE_URL"] ?? "").replace(/\/$/, "");
          const accessToken = process.env["HYPERPAY_ACCESS_TOKEN"];
          const entityId = process.env["HYPERPAY_ENTITY_ID"];

          if (!baseUrl || !accessToken || !entityId) {
            return Response.json({ error: "إعدادات HyperPay غير مكتملة" }, { status: 500 });
          }

          const response = await fetch(
            baseUrl + "/v1/checkouts/" + encodeURIComponent(checkoutId) +
              "/payment?entityId=" + encodeURIComponent(entityId),
            {
              method: "GET",
              headers: { Authorization: "Bearer " + accessToken },
            },
          );

          const data = (await response.json()) as {
            id?: string;
            paymentType?: string;
            paymentBrand?: string;
            result?: { code?: string; description?: string };
          };

          const resultCode = data.result?.code ?? "";
          const description = data.result?.description ?? "";
          const success = /^(000\.000\.|000\.100\.1|000\.[36])/.test(resultCode);
          const pending = resultCode.startsWith("000.200");

          const statusValue = success ? "success" : pending ? "pending" : "failed";

          await txs.updateOne(
            { id: tx.id },
            {
              $set: {
                gateway_transaction_id: data.id ?? null,
                payment_type: data.paymentType ?? "DB",
                payment_brand: data.paymentBrand ?? null,
                result_code: resultCode,
                result_description: description,
                status: statusValue,
                updated_at: new Date(),
                ...(success ? { paid_at: new Date() } : {}),
              },
            },
          );

          if (success) {
            const packages = await getMongoCollection<Record<string, unknown>>("package_catalog");
            const pkg = await packages.findOne({ id: tx.package_id });

            const durationDays = Number(pkg?.duration_days ?? 0);
            const startedAt = new Date();
            const expiresAt =
              durationDays > 0
                ? new Date(startedAt.getTime() + durationDays * 86_400_000)
                : null;

            const offices = await getMongoCollection("offices");

            await offices.updateOne(
              { id: tx.office_id },
              {
                $set: {
                  package_id: pkg?.id ?? tx.package_id,
                  plan: pkg?.code === "pro" ? "pro" : "free",
                  plan_started_at: startedAt,
                  plan_expires_at: expiresAt,
                  updated_at: new Date(),
                },
              },
            );

            await getMongoCollection("office_plan_events").insertOne({
              id: crypto.randomUUID(),
              office_id: tx.office_id,
              plan: pkg?.code === "pro" ? "pro" : "free",
              action: "payment",
              created_at: new Date(),
              expires_at: expiresAt,
              note: "تم تفعيل الباقة بعد الدفع",
            });
          }

          return Response.json({
            success,
            pending,
            status: statusValue,
            description: description || (success ? "تمت العملية بنجاح" : "لم تكتمل عملية الدفع"),
          });
        } catch (error) {
          console.error("[payment-status]", error);
          return Response.json(
            { error: error instanceof Error ? error.message : "تعذر التحقق من الدفع" },
            { status: 500 },
          );
        }
      },
    },
  },
});
