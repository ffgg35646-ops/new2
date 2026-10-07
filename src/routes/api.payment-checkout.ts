import { createFileRoute } from "@tanstack/react-router";
import { randomUUID } from "node:crypto";
import { getMongoCollection } from "@/lib/mongo.server";
import { getSessionUserId } from "@/lib/session.server";

export const Route = createFileRoute("/api/payment-checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const userId = getSessionUserId();
          if (!userId) return Response.json({ error: "انتهت جلسة الدخول" }, { status: 401 });

          const body = (await request.json()) as { packageId?: string };
          const packageId = String(body.packageId ?? "").trim();
          if (!packageId) return Response.json({ error: "الباقة غير محددة" }, { status: 400 });

          const offices = await getMongoCollection<Record<string, unknown>>("offices");
          const office = await offices.findOne({ owner_id: userId, is_deleted: { $ne: true } });
          if (!office) return Response.json({ error: "المكتب غير موجود" }, { status: 404 });

          const packages = await getMongoCollection<Record<string, unknown>>("package_catalog");
          const pkg = await packages.findOne({
            $or: [{ id: packageId }, { code: packageId }],
            is_active: { $ne: false },
          });

          if (!pkg) return Response.json({ error: "الباقة غير موجودة" }, { status: 404 });

          const amount = Number(pkg.price ?? 0);
          if (!Number.isFinite(amount) || amount <= 0) {
            return Response.json({ error: "سعر الباقة غير صالح" }, { status: 400 });
          }

          const baseUrl = String(process.env["HYPERPAY_BASE_URL"] ?? "").replace(/\/$/, "");
          const accessToken = process.env["HYPERPAY_ACCESS_TOKEN"];
          const entityId = process.env["HYPERPAY_ENTITY_ID"];

          if (!baseUrl || !accessToken || !entityId) {
            return Response.json({ error: "إعدادات HyperPay غير مكتملة" }, { status: 500 });
          }

          const origin = new URL(request.url).origin;
          const merchantTransactionId = randomUUID();

          const params = new URLSearchParams();
          params.set("entityId", entityId);
          params.set("amount", amount.toFixed(2));
          params.set("currency", "SAR");
          params.set("paymentType", "DB");
          params.set("merchantTransactionId", merchantTransactionId);
          params.set("shopperResultUrl", origin + "/office/payresult");

          const hpResponse = await fetch(baseUrl + "/v1/checkouts", {
            method: "POST",
            headers: {
              Authorization: "Bearer " + accessToken,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
          });

          const hpData = (await hpResponse.json()) as {
            id?: string;
            integrity?: string;
            result?: { code?: string; description?: string };
          };

          if (!hpResponse.ok || !hpData.id) {
            return Response.json(
              { error: hpData.result?.description || "تعذر إنشاء عملية الدفع" },
              { status: 502 },
            );
          }

          await getMongoCollection("payment_transactions").insertOne({
            id: randomUUID(),
            checkout_id: hpData.id,
            merchant_transaction_id: merchantTransactionId,
            user_id: userId,
            office_id: office.id,
            package_id: pkg.id,
            amount,
            currency: "SAR",
            status: "pending",
            created_at: new Date(),
            updated_at: new Date(),
          });

          return Response.json({
            checkoutId: hpData.id,
            integrity: hpData.integrity ?? null,
            baseUrl,
          });
        } catch (error) {
          console.error("[payment-checkout]", error);
          return Response.json(
            { error: error instanceof Error ? error.message : "تعذر بدء الدفع" },
            { status: 500 },
          );
        }
      },
    },
  },
});
