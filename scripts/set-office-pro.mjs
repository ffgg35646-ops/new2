import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { MongoClient } from "mongodb";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

function arg(name) {
  const prefix = `--${name}=`;
  const item = process.argv.find((value) => value.startsWith(prefix));
  return item ? item.slice(prefix.length).trim() : null;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function normalizeEmail(value, flag) {
  const email = String(value ?? "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error(`Missing or invalid --${flag}=email argument.`);
  }
  return email;
}

function maskedMongoHost(uri) {
  try {
    return new URL(uri).hostname || "(host unavailable)";
  } catch {
    return "(host unavailable)";
  }
}

function iso(value) {
  return value instanceof Date && Number.isFinite(value.getTime())
    ? value.toISOString()
    : null;
}

const primaryEmail = normalizeEmail(arg("primary-email"), "primary-email");
const testEmail = normalizeEmail(arg("test-email"), "test-email");
if (primaryEmail === testEmail) {
  throw new Error("The two target emails must be different.");
}

const testHours = Number(arg("test-expires-in-hours") ?? "1");
if (!Number.isFinite(testHours) || testHours <= 0 || testHours > 720) {
  throw new Error("--test-expires-in-hours must be greater than 0 and no more than 720.");
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || "aqar_albatin";
if (!uri) throw new Error("MONGODB_URI is missing. Load the correct .env file first.");

const apply = hasFlag("apply");
const client = new MongoClient(uri, { maxPoolSize: 5, serverSelectionTimeoutMS: 10000 });

try {
  await client.connect();
  const db = client.db(dbName);
  const users = db.collection("users");
  const offices = db.collection("offices");
  const packages = db.collection("package_catalog");
  const events = db.collection("office_plan_events");

  const proPackage = await packages.findOne({ code: "pro", is_active: true });
  if (!proPackage) {
    throw new Error('No active package_catalog entry found for { code: "pro", is_active: true }.');
  }

  const durationDays = Number(proPackage.duration_days || 30);
  if (!Number.isFinite(durationDays) || durationDays <= 0) {
    throw new Error("The active Pro package has an invalid duration_days value.");
  }

  const findAccount = async (email, kind) => {
    const matches = await users.find(
      { email },
      { projection: { _id: 1, email: 1, role: 1, email_verified: 1 } },
    ).limit(2).toArray();

    if (matches.length !== 1) {
      throw new Error(`${kind}: expected exactly one user with email ${email}, found ${matches.length}.`);
    }

    const user = matches[0];
    if (user.role !== "office") {
      throw new Error(`${kind}: ${email} is not an office account (users.role=${String(user.role)}).`);
    }
    if (user.email_verified !== true) {
      throw new Error(`${kind}: ${email} has not verified its email; no changes made.`);
    }

    const owners = await offices.find({
      owner_id: String(user._id),
      is_deleted: { $ne: true },
    }).limit(2).toArray();

    if (owners.length !== 1) {
      throw new Error(`${kind}: expected exactly one active office owned by ${email}, found ${owners.length}.`);
    }

    return { kind, user, office: owners[0] };
  };

  const [primary, test] = await Promise.all([
    findAccount(primaryEmail, "Primary account"),
    findAccount(testEmail, "Expiry-test account"),
  ]);

  if (String(primary.office.id) === String(test.office.id)) {
    throw new Error("Both emails resolve to the same office; no changes made.");
  }

  const now = new Date();
  const primaryStartedAt = now;
  const primaryExpiresAt = new Date(now.getTime() + durationDays * DAY_MS);

  // Simulate a 30-day subscription that has already run for 29 days and 23 hours:
  // the second account should have approximately one hour remaining (or the supplied value).
  const testExpiresAt = new Date(now.getTime() + testHours * HOUR_MS);
  const testStartedAt = new Date(testExpiresAt.getTime() - durationDays * DAY_MS);

  const targets = [
    {
      ...primary,
      planStartedAt: primaryStartedAt,
      planExpiresAt: primaryExpiresAt,
      note: "تفعيل Pro يدوي لمدة الباقة الكاملة",
    },
    {
      ...test,
      planStartedAt: testStartedAt,
      planExpiresAt: testExpiresAt,
      note: `اختبار انتهاء Pro؛ المدة المنقضية ${durationDays} يومًا ناقص ${testHours} ساعة متبقية`,
    },
  ];

  console.log("\nDatabase target (verify before applying):");
  console.log(`  Database: ${dbName}`);
  console.log(`  Mongo host: ${maskedMongoHost(uri)}`);
  console.log(`  Active Pro package: ${String(proPackage.name ?? proPackage.code)} (${String(proPackage.id)})`);
  console.log(`  Package duration: ${durationDays} days`);
  console.log(`  Mode: ${apply ? "APPLY CHANGES" : "DRY RUN (no writes)"}\n`);

  for (const target of targets) {
    console.log(JSON.stringify({
      email: target.user.email,
      officeName: target.office.name ?? null,
      officeId: target.office.id,
      previousPlan: target.office.plan ?? null,
      previousPackageId: target.office.package_id ?? null,
      previousExpiry: iso(target.office.plan_expires_at instanceof Date
        ? target.office.plan_expires_at
        : target.office.plan_expires_at ? new Date(target.office.plan_expires_at) : null),
      newPlan: "pro",
      newPackageId: proPackage.id,
      planStartedAt: target.planStartedAt.toISOString(),
      planExpiresAt: target.planExpiresAt.toISOString(),
      expected: target.kind === "Expiry-test account"
        ? `should expire in about ${testHours} hour(s) and be treated as Free after expiry`
        : `full ${durationDays}-day Pro period`,
    }, null, 2));
  }

  if (!apply) {
    console.log("\nDry run only. No database documents were changed.");
    console.log("After checking the database/host and dates above, rerun with --apply to write the changes.");
    process.exitCode = 0;
  } else {
    const backupDir = path.resolve(process.cwd(), ".local-backups");
    await mkdir(backupDir, { recursive: true });
    const backupPath = path.join(
      backupDir,
      `office-pro-changes-${now.toISOString().replace(/[:.]/g, "-")}.json`,
    );
    const backup = targets.map((target) => ({
      email: target.user.email,
      office: {
        id: target.office.id,
        owner_id: target.office.owner_id,
        name: target.office.name ?? null,
        email: target.office.email ?? null,
        plan: target.office.plan ?? null,
        package_id: target.office.package_id ?? null,
        plan_started_at: target.office.plan_started_at ?? null,
        plan_expires_at: target.office.plan_expires_at ?? null,
        updated_at: target.office.updated_at ?? null,
      },
    }));

    await writeFile(backupPath, JSON.stringify({
      created_at: now.toISOString(),
      database: dbName,
      mongo_host: maskedMongoHost(uri),
      pro_package_id: proPackage.id,
      accounts: backup,
    }, null, 2), { mode: 0o600 });

    for (const target of targets) {
      const result = await offices.updateOne(
        { id: target.office.id, owner_id: String(target.user._id), is_deleted: { $ne: true } },
        {
          $set: {
            package_id: proPackage.id,
            plan: "pro",
            plan_started_at: target.planStartedAt,
            plan_expires_at: target.planExpiresAt,
            updated_at: now,
          },
        },
      );
      if (result.modifiedCount !== 1) {
        throw new Error(`Expected to update exactly one office for ${target.user.email}; stopped after backup at ${backupPath}.`);
      }

      await events.insertOne({
        id: randomUUID(),
        office_id: String(target.office.id),
        action: "package_changed",
        plan: "pro",
        package_id: proPackage.id,
        expires_at: target.planExpiresAt,
        created_at: now,
        note: target.note,
      });
    }

    console.log(`\nUpdated both office subscriptions. Backup saved to: ${backupPath}`);
    console.log(`Expiry-test account expires at: ${testExpiresAt.toISOString()}`);
  }
} finally {
  await client.close();
}
