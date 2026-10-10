import { createFileRoute } from "@tanstack/react-router";
import { randomUUID } from "node:crypto";
import { getMongoCollection, getMongoDb } from "@/lib/mongo.server";
import { getSessionUserId } from "@/lib/session.server";

const PRO_DURATION_DAYS = 30;
const DAY_MS = 86_400_000;

export const Route = createFileRoute("/api/payment-status")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const userId = getSessionUserId();
          if (!userId) {
            return Response.json({ error: "انتهت جلسة الدخول" }, { status: 401 });
          }

          const body = (await request.json()) as { checkoutId?: string };
          const checkoutId = String(body.checkoutId ?? "").trim();
          if (!checkoutId) {
            return Response.json({ error: "checkoutId مفقود" }, { status: 400 });
          }

          const txs = await getMongoCollection<Record<string, any>>("payment_transactions");
          const tx = await txs.findOne({ checkout_id: checkoutId, user_id: userId });
          if (!tx) {
            return Response.json({ error: "عملية الدفع غير موجودة" }, { status: 404 });
          }

          // لا نعيد تمديد الاشتراك إذا زار المستخدم صفحة النتيجة أكثر من مرة.
          if (tx.status === "success" || tx.activation_applied_at) {
            return Response.json({
              success: true,
              pending: false,
              status: "success",
              description: "تم الدفع وتفعيل الباقة بالفعل.",
            });
          }

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

          const gatewayContentType = response.headers.get("content-type") ?? "";
          const gatewayBody = await response.text();
          let data: {
            id?: string;
            amount?: string | number;
            currency?: string;
            merchantTransactionId?: string;
            paymentType?: string;
            paymentBrand?: string;
            parameterErrors?: unknown;
            result?: { code?: string; description?: string };
          };

          try {
            data = JSON.parse(gatewayBody) as typeof data;
          } catch {
            console.error("[payment-status] HyperPay returned non-JSON response", {
              status: response.status,
              contentType: gatewayContentType,
              bodyPreview: gatewayBody.replace(/\s+/g, " ").slice(0, 200),
            });

            const code = `HTTP_${response.status}`;
            const description =
              `بوابة HyperPay أعادت ردًا غير قابل للقراءة أثناء التحقق (HTTP ${response.status}, Content-Type: ${gatewayContentType || "غير معروف"}). لم يتم تأكيد حالة البطاقة، ولم يتم تفعيل الباقة.`;

            await txs.updateOne(
              { id: tx.id, status: { $ne: "success" }, activation_applied_at: { $exists: false } },
              {
                $set: {
                  status: "verification_error",
                  result_code: code,
                  result_description: description,
                  verification_error: true,
                  gateway_http_status: response.status,
                  updated_at: new Date(),
                },
              },
            );

            return Response.json({
              success: false,
              pending: false,
              status: "verification_error",
              verificationError: true,
              code,
              description,
            });
          }

          if (!response.ok) {
            const code = data.result?.code ?? `HTTP_${response.status}`;
            const gatewayDescription =
              data.result?.description ?? "تعذّر التحقق من نتيجة الدفع لدى HyperPay.";
            const noPaymentSession =
              code === "200.300.404" &&
              /No payment session found/i.test(gatewayDescription);

            const description = noPaymentSession
              ? `تعذّر العثور على جلسة الدفع لدى HyperPay (${code}): ${gatewayDescription}. هذا لا يثبت أن البنك رفض البطاقة؛ قد تكون الجلسة منتهية أو من بيئة مختلفة. أنشئ جلسة جديدة في البيئة المطابقة. لم يتم تفعيل الباقة.`
              : `تعذّر التحقق من نتيجة الدفع لدى HyperPay (${code}): ${gatewayDescription}. لم يتم تفعيل الباقة.`;

            console.warn("[payment-status] gateway verification error", {
              checkoutId,
              httpStatus: response.status,
              code,
              description: gatewayDescription,
              parameterErrors: data.parameterErrors ?? null,
            });

            await txs.updateOne(
              { id: tx.id, status: { $ne: "success" }, activation_applied_at: { $exists: false } },
              {
                $set: {
                  status: "verification_error",
                  result_code: code,
                  result_description: gatewayDescription,
                  verification_error: true,
                  gateway_http_status: response.status,
                  parameter_errors: data.parameterErrors ?? null,
                  updated_at: new Date(),
                },
              },
            );

            return Response.json({
              success: false,
              pending: false,
              status: "verification_error",
              verificationError: true,
              code,
              description,
              gatewayDescription,
              parameterErrors: data.parameterErrors ?? null,
            });
          }

          if (
            data.merchantTransactionId &&
            String(data.merchantTransactionId) !== String(tx.merchant_transaction_id ?? "")
          ) {
            return Response.json({ error: "رقم عملية الدفع لا يطابق الطلب المسجل." }, { status: 502 });
          }
          if (data.amount != null) {
            const gatewayAmount = Number(data.amount);
            const storedAmount = Number(tx.amount);
            if (
              !Number.isFinite(gatewayAmount) ||
              !Number.isFinite(storedAmount) ||
              Math.abs(gatewayAmount - storedAmount) >= 0.01
            ) {
              return Response.json({ error: "قيمة الدفع لا تطابق قيمة الاشتراك." }, { status: 502 });
            }
          }
          if (data.currency && String(data.currency).toUpperCase() !== String(tx.currency ?? "SAR").toUpperCase()) {
            return Response.json({ error: "عملة الدفع لا تطابق عملة الاشتراك." }, { status: 502 });
          }

          const resultCode = data.result?.code ?? "";
          const description = data.result?.description ?? "";
          const success = /^(000\.000\.|000\.100\.1|000\.[36])/.test(resultCode);
          const pending = resultCode.startsWith("000.200");
          const statusValue = success ? "success" : pending ? "pending" : "failed";
          const now = new Date();

          if (success) {
            const db = await getMongoDb();
            const session = db.client.startSession();
            try {
              await session.withTransaction(async () => {
                const txCollection = db.collection<Record<string, any>>("payment_transactions");
                const currentTx = await txCollection.findOne(
                  { id: tx.id, user_id: userId },
                  { session },
                );
                if (!currentTx) throw new Error("عملية الدفع غير موجودة");

                // حماية من تكرار استدعاء النتيجة أو إعادة المحاولة المتزامنة.
                if (currentTx.status === "success" || currentTx.activation_applied_at) {
                  return;
                }

                const packages = db.collection<Record<string, any>>("package_catalog");
                const pkg = await packages.findOne(
                  { id: String(currentTx.package_id), is_active: { $ne: false } },
                  { session },
                );
                if (!pkg || String(pkg.code ?? "").toLowerCase() !== "pro") {
                  throw new Error("عملية الدفع لا تخص الباقة الاحترافية.");
                }

                const offices = db.collection<Record<string, any>>("offices");
                const office = await offices.findOne(
                  { id: String(currentTx.office_id), is_deleted: { $ne: true } },
                  { session },
                );
                if (!office) throw new Error("المكتب المرتبط بعملية الدفع غير موجود.");

                const oldExpiry = office.plan_expires_at
                  ? new Date(office.plan_expires_at)
                  : null;
                const hasActivePro =
                  String(office.plan ?? "") === "pro" &&
                  !!oldExpiry &&
                  Number.isFinite(oldExpiry.getTime()) &&
                  oldExpiry.getTime() > now.getTime();

                // التجديد المبكر يمدد من تاريخ الانتهاء الحالي؛ التجديد بعد الانتهاء يبدأ من الآن.
                const periodStart = hasActivePro ? oldExpiry!.getTime() : now.getTime();
                const expiresAt = new Date(periodStart + PRO_DURATION_DAYS * DAY_MS);
                const oldStartedAt = office.plan_started_at
                  ? new Date(office.plan_started_at)
                  : null;
                const startedAt =
                  hasActivePro && oldStartedAt && Number.isFinite(oldStartedAt.getTime())
                    ? oldStartedAt
                    : now;

                await offices.updateOne(
                  { id: String(office.id) },
                  {
                    $set: {
                      package_id: pkg.id,
                      plan: "pro",
                      plan_started_at: startedAt,
                      plan_expires_at: expiresAt,
                      last_payment_transaction_id: currentTx.id,
                      updated_at: now,
                    },
                  },
                  { session },
                );

                await txCollection.updateOne(
                  { id: currentTx.id },
                  {
                    $set: {
                      gateway_transaction_id: data.id ?? null,
                      payment_type: data.paymentType ?? "DB",
                      payment_brand: data.paymentBrand ?? null,
                      result_code: resultCode,
                      result_description: description,
                      status: "success",
                      paid_at: now,
                      activation_applied_at: now,
                      activated_until: expiresAt,
                      updated_at: now,
                    },
                  },
                  { session },
                );

                await db.collection<any>("office_plan_events").insertOne(
                  {
                    id: randomUUID(),
                    _id: randomUUID(),
                    office_id: office.id,
                    plan: "pro",
                    package_id: pkg.id,
                    action: "payment",
                    created_at: now,
                    expires_at: expiresAt,
                    payment_transaction_id: currentTx.id,
                    note: "تم تفعيل الباقة الاحترافية لمدة 30 يومًا بعد الدفع.",
                  },
                  { session },
                );

                if (office.owner_id) {
                  await db.collection<any>("notifications").insertOne(
                    {
                      id: randomUUID(),
                      _id: randomUUID(),
                      user_id: String(office.owner_id),
                      title: "تم تفعيل الباقة الاحترافية",
                      body: `تم تفعيل باقة Pro لمدة 30 يومًا. تنتهي في ${expiresAt.toLocaleDateString("ar-SA", { timeZone: "Asia/Riyadh" })}.`,
                      type: "pro_activated",
                      link: "/office/subscription",
                      is_read: false,
                      created_at: now,
                      office_id: office.id,
                      payment_transaction_id: currentTx.id,
                      expires_at: expiresAt,
                    },
                    { session },
                  );
                }
              });
            } finally {
              await session.endSession();
            }

            return Response.json({
              success: true,
              pending: false,
              status: "success",
              description: "تم الدفع وتفعيل الباقة الاحترافية لمدة 30 يومًا.",
            });
          }

          // الفشل أو استمرار المعالجة لا يغير باقة المكتب إطلاقًا.
          await txs.updateOne(
            { id: tx.id, status: { $ne: "success" } },
            {
              $set: {
                gateway_transaction_id: data.id ?? null,
                payment_type: data.paymentType ?? "DB",
                payment_brand: data.paymentBrand ?? null,
                result_code: resultCode,
                result_description: description,
                status: statusValue,
                updated_at: now,
              },
            },
          );

          return Response.json({
            success: false,
            pending,
            status: statusValue,
            description: description || (
              pending
                ? "الدفع ما زال قيد المعالجة؛ لم يتم تفعيل الباقة بعد."
                : "لم يكتمل الدفع، ولم يتم تفعيل الباقة."
            ),
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
