import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function isSuccess(code: string) {
  return /^(000\.000\.|000\.100\.1|000\.[36])/.test(
    code || "",
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return json({ error: "غير مصرح" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY",
    )!;
    const accessKey = Deno.env.get(
      "HYPERPAY_ACCESS_TOKEN",
    )!;
    const baseUrl = Deno.env.get(
      "HYPERPAY_BASE_URL",
    )!;
    const envEntityId = Deno.env.get(
      "HYPERPAY_ENTITY_ID",
    )!;

    const { data: gatewaySettings } =
      await admin
        .from("payment_gateway_settings")
        .select("entity_id")
        .eq("id", 1)
        .maybeSingle();

    const entityId =
      gatewaySettings?.entity_id || envEntityId;

    const accessToken = authHeader.replace(
      /^Bearer\s+/i,
      "",
    );

    const admin = createClient(
      supabaseUrl,
      serviceKey,
    );

    const {
      data: { user },
      error: userError,
    } = await admin.auth.getUser(accessToken);

    if (userError || !user) {
      return json(
        { error: "جلسة الدخول غير صالحة" },
        401,
      );
    }

    const body = await req.json();
    const checkoutId = String(
      body?.checkoutId || "",
    ).trim();

    if (!checkoutId) {
      return json(
        { error: "checkoutId مفقود" },
        400,
      );
    }

    const { data: tx } = await admin
      .from("payment_transactions")
      .select(
        "*, package_catalog:package_id(id,code,name,duration_days,price)",
      )
      .eq("checkout_id", checkoutId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!tx) {
      return json(
        { error: "عملية الدفع غير موجودة" },
        404,
      );
    }

    const gatewayUrl =
      `${baseUrl.replace(/\/$/, "")}` +
      `/v1/checkouts/${encodeURIComponent(checkoutId)}/payment` +
      `?entityId=${encodeURIComponent(entityId)}`;

    const gatewayResponse = await fetch(
      gatewayUrl,
      {
        method: "GET",
        headers: {
          Authorization:
            `Bearer ${accessKey}`,
        },
      },
    );

    const gatewayData =
      await gatewayResponse.json();

    const resultCode =
      gatewayData?.result?.code ||
      "";

    const description =
      gatewayData?.result?.description ||
      "";

    const success = isSuccess(resultCode);

    const status = success
      ? "success"
      : resultCode.startsWith("000.200")
        ? "pending"
        : "failed";

    await admin
      .from("payment_transactions")
      .update({
        gateway_transaction_id:
          gatewayData?.id || null,
        payment_type:
          gatewayData?.paymentType || "DB",
        payment_brand:
          gatewayData?.paymentBrand || null,
        result_code: resultCode,
        result_description: description,
        status,
        updated_at: new Date().toISOString(),
        ...(success
          ? {
              paid_at:
                new Date().toISOString(),
            }
          : {}),
      })
      .eq("id", tx.id);

    if (success) {
      const packageData =
        tx.package_catalog as any;

      const durationDays =
        Number(
          packageData?.duration_days || 0,
        );

      const startedAt = new Date();

      const expiresAt = new Date(
        startedAt.getTime() +
          durationDays *
            24 *
            60 *
            60 *
            1000,
      );

      await admin
        .from("offices")
        .update({
          package_id: packageData.id,
          plan:
            packageData.code === "pro"
              ? "pro"
              : "free",
          plan_started_at:
            startedAt.toISOString(),
          plan_expires_at:
            durationDays > 0
              ? expiresAt.toISOString()
              : null,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", tx.office_id);

      await admin
        .from("office_plan_events")
        .insert({
          office_id: tx.office_id,
          plan:
            packageData.code === "pro"
              ? "pro"
              : "free",
          started_at:
            startedAt.toISOString(),
          expires_at:
            durationDays > 0
              ? expiresAt.toISOString()
              : null,
          note:
            `تم تفعيل ${packageData.name} بعد الدفع`,
        });
    }

    return json({
      success,
      pending: status === "pending",
      status,
      description:
        description ||
        (success
          ? "Transaction succeeded"
          : "لم تكتمل عملية الدفع"),
    });
  } catch (error) {
    console.error(error);

    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "حدث خطأ غير متوقع",
      },
      500,
    );
  }
});
