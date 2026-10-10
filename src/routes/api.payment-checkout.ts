import { createFileRoute } from "@tanstack/react-router";
import { randomUUID } from "node:crypto";
import { getMongoCollection } from "@/lib/mongo.server";
import { getSessionUserId } from "@/lib/session.server";

function getTrustedCheckoutOrigin(request: Request) {
  if (process.env["NODE_ENV"] !== "production") {
    try {
      const origin = new URL(request.url);
      if (["localhost", "127.0.0.1"].includes(origin.hostname)) return origin.origin;
    } catch {
      // Use the configured origin below.
    }
  }

  const candidates = [
    process.env["PUBLIC_APP_URL"],
    process.env["APP_URL"],
    process.env["VITE_PUBLIC_APP_URL"],
    process.env["VERCEL_PROJECT_PRODUCTION_URL"]
      ? "https://" + process.env["VERCEL_PROJECT_PRODUCTION_URL"]
      : null,
    process.env["VERCEL_URL"] ? "https://" + process.env["VERCEL_URL"] : null,
  ].filter((value): value is string => typeof value === "string" && !!value.trim());

  const configured = candidates[0];
  if (!configured) {
    throw new Error("إعداد رابط الموقع العام غير مكتمل. اضبط PUBLIC_APP_URL في إعدادات النشر.");
  }

  const url = new URL(configured.startsWith("http") ? configured : "https://" + configured);
  if (process.env["NODE_ENV"] === "production" && url.protocol !== "https:") {
    throw new Error("يجب ضبط PUBLIC_APP_URL على عنوان HTTPS.");
  }
  if (["localhost", "127.0.0.1", "0.0.0.0"].includes(url.hostname)) {
    throw new Error("عنوان العودة من بوابة الدفع غير صالح.");
  }
  return url.origin;
}

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
          if (String(pkg.code ?? "").toLowerCase() !== "pro") {
            return Response.json(
              { error: "الدفع متاح للباقة الاحترافية فقط." },
              { status: 400 },
            );
          }

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

          const origin = getTrustedCheckoutOrigin(request);
          const merchantTransactionId = randomUUID();

          const params = new URLSearchParams();
          params.set("entityId", entityId);
          params.set("amount", amount.toFixed(2));
          params.set("currency", "SAR");
          params.set("paymentType", "DB");
          params.set("merchantTransactionId", merchantTransactionId);
          params.set("shopperResultUrl", origin + "/office/payresult");
          params.set(
            "Merchant.data[" + String.fromCharCode(39) + "ignoreDescriptorValidation" + String.fromCharCode(39) + "]",
            "true",
          );

          // بوابة LIVE لا تستقبل وضع الاختبار، حتى لو بقي المتغير مضبوطًا محليًا.
          const isLiveGateway =
            new URL(baseUrl).hostname.toLowerCase() === "eu-prod.oppwa.com";
          const testMode = isLiveGateway
            ? ""
            : String(process.env["HYPERPAY_TEST_MODE"] ?? "").trim();

          if (testMode) params.set("testMode", testMode);

          const hpResponse = await fetch(baseUrl + "/v1/checkouts", {
            method: "POST",
            headers: {
              Authorization: "Bearer " + accessToken,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
          });

          const hpContentType = hpResponse.headers.get("content-type") ?? "";
          const hpBody = await hpResponse.text();
          let hpData: {
            id?: string;
            integrity?: string;
            result?: { code?: string; description?: string };
          };

          try {
            hpData = JSON.parse(hpBody) as typeof hpData;
          } catch {
            console.error("[payment-checkout] HyperPay returned non-JSON response", {
              status: hpResponse.status,
              contentType: hpContentType,
              bodyPreview: hpBody.replace(/\\s+/g, " ").slice(0, 200),
            });
            return Response.json(
              {
                error:
                  "بوابة HyperPay أعادت صفحة غير متوقعة بدل بيانات الدفع. راجع HYPERPAY_BASE_URL وبيئة الاختبار/الإنتاج في إعدادات النشر.",
              },
              { status: 502 },
            );
          }

          if (!hpResponse.ok || !hpData.id) {
            return Response.json(
              { error: hpData.result?.description || "تعذر إنشاء عملية الدفع" },
              { status: 502 },
            );
          }

          await (await getMongoCollection("payment_transactions")).insertOne({
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
            testMode: testMode || null,
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
