import { randomUUID, randomBytes, scrypt } from "node:crypto";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || "aqar_albatin";

if (!uri) {
  throw new Error("MONGODB_URI is required");
}

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = randomBytes(16).toString("hex");
    scrypt(password, salt, 64, (error, derived) => {
      if (error) return reject(error);
      resolve(`scrypt$${salt}$${Buffer.from(derived).toString("hex")}`);
    });
  });
}

const client = new MongoClient(uri, { maxPoolSize: 10 });
await client.connect();

try {
  const db = client.db(dbName);
  const now = new Date();

  await db.collection("governorates").bulkWrite([
    {
      updateOne: {
        filter: { code: "MUZAHMIYAH" },
        update: {
          $set: {
            name_ar: "المزاحمية",
            name_en: "Al Muzahimiyah",
            code: "MUZAHMIYAH",
            is_active: true,
            sort_order: 1,
            updated_at: now,
          },
          $setOnInsert: { id: randomUUID(), created_at: now },
        },
        upsert: true,
      },
    },
    {
      updateOne: {
        filter: { code: "DHURMA" },
        update: {
          $set: {
            name_ar: "ضرما",
            name_en: "Dhurma",
            code: "DHURMA",
            is_active: true,
            sort_order: 2,
            updated_at: now,
          },
          $setOnInsert: { id: randomUUID(), created_at: now },
        },
        upsert: true,
      },
    },
  ]);

  const packages = [
    {
      code: "free",
      name: "الباقة المجانية",
      description: "الباقة الأساسية للمكاتب العقارية",
      price: 0,
      duration_days: 0,
      property_limit: 5,
      chat_enabled: false,
      featured_limit: 0,
      verification_included: false,
      features: [
        "إنشاء صفحة خاصة بالمكتب",
        "الظهور في قسم المكاتب العقارية",
        "إضافة حتى 5 عقارات",
        "استقبال المتابعين والتقييمات",
        "اتصال وواتساب",
        "مشاركة صفحة المكتب",
        "إحصائيات أساسية",
      ],
      is_active: true,
      sort_order: 1,
    },
    {
      code: "pro",
      name: "الباقة الاحترافية",
      description: "الباقة الاحترافية للمكاتب العقارية",
      price: 199,
      duration_days: 30,
      property_limit: null,
      chat_enabled: true,
      featured_limit: 3,
      verification_included: true,
      features: [
        "عقارات غير محدودة",
        "توثيق المكتب ✓",
        "دردشة خاصة ومستقلة مع كل عميل",
        "إرسال الصور داخل المحادثة",
        "معرفة العقار الذي يستفسر عنه العميل",
        "رمز QR للمكتب والعقار",
        "تمييز حتى 3 عقارات",
        "أولوية ظهور المكتب",
        "كل مميزات الباقة المجانية",
      ],
      is_active: true,
      sort_order: 2,
    },
  ];

  for (const pkg of packages) {
    await db.collection("package_catalog").updateOne(
      { code: pkg.code },
      {
        $set: { ...pkg, updated_at: now },
        $setOnInsert: { id: randomUUID(), created_at: now },
      },
      { upsert: true },
    );
  }

  const policies = [
    {
      key: "privacy_policy",
      content:
        "سياسة الخصوصية\\n\\nنحترم خصوصية المستخدم ونستخدم البيانات اللازمة لتقديم خدمات عقار البطين وتشغيل الحساب والطلبات والمراسلات والدعم.",
      updated_at: now,
    },
    {
      key: "terms_of_use",
      content:
        "شروط الاستخدام\\n\\nباستخدام عقار البطين أنت توافق على استخدام المنصة وفق الأنظمة المعمول بها، وتتحمل مسؤولية المعلومات والإعلانات التي تضيفها إلى حسابك.",
      updated_at: now,
    },
  ];

  for (const policy of policies) {
    await db.collection("app_content").updateOne(
      { key: policy.key },
      { $set: policy, $setOnInsert: { id: randomUUID(), created_at: now } },
      { upsert: true },
    );
  }

  const testOfficeEmail = process.env.MONGODB_TEST_OFFICE_EMAIL?.trim().toLowerCase();
  const testOfficePassword = process.env.MONGODB_TEST_OFFICE_PASSWORD;
  const testOfficeName = process.env.MONGODB_TEST_OFFICE_NAME || "مكتب اختبار احترافي";
  const testOfficePhone = process.env.MONGODB_TEST_OFFICE_PHONE || "0550000000";

  if (testOfficeEmail && testOfficePassword) {
    const proPackage = await db.collection("package_catalog").findOne({
      code: "pro",
      is_active: true,
    });

    const testGovernorate = await db.collection("governorates").findOne({
      code: "MUZAHMIYAH",
      is_active: true,
    });

    if (!proPackage || !testGovernorate) {
      throw new Error("لا يمكن تجهيز حساب المكتب التجريبي قبل الباقات والمحافظات.");
    }

    const passwordHash = await hashPassword(testOfficePassword);
    const existing = await db.collection("users").findOne({
      email: testOfficeEmail,
    });
    const userId = existing?._id || randomUUID();
    const expiresAt = new Date(Date.now() + Number(proPackage.duration_days || 30) * 86_400_000);

    await db.collection("users").updateOne(
      { _id: userId },
      {
        $set: {
          email: testOfficeEmail,
          password_hash: passwordHash,
          email_verified: true,
          email_confirmed_at: now.toISOString(),
          full_name: testOfficeName,
          phone: testOfficePhone,
          role: "office",
          updated_at: now,
        },
        $setOnInsert: {
          _id: userId,
          created_at: now,
        },
      },
      { upsert: true },
    );

    await db.collection("profiles").updateOne(
      { id: userId },
      {
        $set: {
          id: userId,
          _id: userId,
          email: testOfficeEmail,
          full_name: testOfficeName,
          phone: testOfficePhone,
          updated_at: now,
        },
        $setOnInsert: { created_at: now },
      },
      { upsert: true },
    );

    await db.collection("user_roles").updateOne(
      { user_id: userId, role: "office" },
      {
        $setOnInsert: {
          id: randomUUID(),
          user_id: userId,
          role: "office",
          created_at: now,
        },
      },
      { upsert: true },
    );

    const existingOffice = await db.collection("offices").findOne({
      owner_id: userId,
    });
    const officeId = existingOffice?.id || randomUUID();

    await db.collection("offices").updateOne(
      { owner_id: userId },
      {
        $set: {
          id: officeId,
          _id: officeId,
          owner_id: userId,
          package_id: proPackage.id,
          name: testOfficeName,
          manager_name: testOfficeName,
          phone: testOfficePhone,
          whatsapp: testOfficePhone,
          email: testOfficeEmail,
          governorate_id: testGovernorate.id,
          plan: "pro",
          plan_started_at: now,
          plan_expires_at: expiresAt,
          verification_status: "verified",
          is_deleted: false,
          updated_at: now,
        },
        $setOnInsert: {
          created_at: now,
        },
      },
      { upsert: true },
    );

    await db.collection("office_plan_events").updateOne(
      {
        office_id: officeId,
        action: "test_seed",
        plan: "pro",
      },
      {
        $set: {
          office_id: officeId,
          action: "test_seed",
          plan: "pro",
          expires_at: expiresAt,
          created_at: now,
          note: "حساب اختبار للباقة الاحترافية",
        },
        $setOnInsert: { id: randomUUID() },
      },
      { upsert: true },
    );

    console.log("Test Pro office account seeded:", testOfficeEmail);
  }

  const adminEmail = process.env.MONGODB_ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.MONGODB_ADMIN_PASSWORD;
  const adminName = process.env.MONGODB_ADMIN_NAME || "مدير النظام";

  if (adminEmail && adminPassword) {
    const passwordHash = await hashPassword(adminPassword);

    const existing = await db.collection("users").findOne({
      email: adminEmail,
    });

    const userId = existing?._id || randomUUID();

    await db.collection("users").updateOne(
      { _id: userId },
      {
        $set: {
          email: adminEmail,
          password_hash: passwordHash,
          email_verified: true,
          email_confirmed_at: now.toISOString(),
          full_name: adminName,
          role: "admin",
          updated_at: now,
        },
        $setOnInsert: {
          _id: userId,
          created_at: now,
        },
      },
      { upsert: true },
    );

    await db.collection("profiles").updateOne(
      { id: userId },
      {
        $set: {
          id: userId,
          _id: userId,
          email: adminEmail,
          full_name: adminName,
          updated_at: now,
        },
        $setOnInsert: { created_at: now },
      },
      { upsert: true },
    );

    await db.collection("user_roles").updateOne(
      { user_id: userId, role: "admin" },
      {
        $setOnInsert: {
          id: randomUUID(),
          user_id: userId,
          role: "admin",
          created_at: now,
        },
      },
      { upsert: true },
    );

    console.log("Admin account seeded:", adminEmail);
  }

  console.log("MongoDB seed completed:", dbName);
} finally {
  await client.close();
}
