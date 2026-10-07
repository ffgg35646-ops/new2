
import { createServerFn } from "@tanstack/react-start";
import { randomUUID } from "node:crypto";
import { getMongoCollection, storeMedia, deleteMedia } from "./mongo.server";
import {
  currentUser,
  registerUser,
  resendVerification,
  resetPassword,
  requestPasswordReset,
  signIn,
  signOut,
  updateCurrentUser,
  verifyEmailCode,
} from "./auth.server";
import { getSessionUserId } from "./session.server";

type Filter = { field: string; op: string; value: unknown };
type Order = { field: string; ascending: boolean };

type DbInput = {
  collection: string;
  operation: "select" | "insert" | "update" | "upsert" | "delete";
  filters?: Filter[];
  or?: string | null;
  payload?: unknown;
  select?: string | null;
  orders?: Order[];
  limit?: number | null;
  offset?: number | null;
  single?: boolean;
  maybeSingle?: boolean;
  count?: boolean;
  head?: boolean;
};

const publicReads = new Set([
  "governorates",
  "neighborhoods",
  "offices",
  "properties",
  "property_images",
  "office_reviews",
  "package_catalog",
  "app_content",
]);

const userOwned = new Set([
  "profiles",
  "user_roles",
  "favorites",
  "follows",
  "notifications",
  "device_tokens",
  "saved_searches",
  "property_requests",
]);

function buildFilter(filters: Filter[] = []) {
  const query: Record<string, unknown> = {};

  for (const filter of filters) {
    switch (filter.op) {
      case "eq":
        query[filter.field] = filter.value;
        break;
      case "neq":
        query[filter.field] = { $ne: filter.value };
        break;
      case "gt":
        query[filter.field] = { $gt: filter.value };
        break;
      case "gte":
        query[filter.field] = { $gte: filter.value };
        break;
      case "lt":
        query[filter.field] = { $lt: filter.value };
        break;
      case "lte":
        query[filter.field] = { $lte: filter.value };
        break;
      case "in":
        query[filter.field] = { $in: Array.isArray(filter.value) ? filter.value : [] };
        break;
      case "ilike":
      case "like":
        query[filter.field] = {
          $regex: String(filter.value ?? "").replaceAll("%", ".*"),
          $options: "i",
        };
        break;
      case "contains":
        query[filter.field] = {
          $all: Array.isArray(filter.value) ? filter.value : [filter.value],
        };
        break;
      default:
        query[filter.field] = filter.value;
    }
  }

  return query;
}

function parseOr(value: string | null | undefined) {
  if (!value) return null;

  const expressions = value.split(",").map((part) => part.trim()).filter(Boolean);
  const queries = expressions.map((part) => {
    const match = part.match(/^([\\w.]+)\\.(eq|ilike|like)\\.(.*)$/);
    if (!match) return null;

    const field = match[1];
    const op = match[2];
    const raw = match[3];

    if (!field || !op || raw == null) return null;
    if (op === "eq") return { [field]: raw };

    return {
      [field]: {
        $regex: raw.replaceAll("%", ".*"),
        $options: "i",
      },
    };
  }).filter(Boolean);

  return queries.length ? { $or: queries } : null;
}

function clean(doc: Record<string, unknown>) {
  if (typeof doc._id === "string") {
    const { _id, ...rest } = doc;
    return { id: rest.id ?? _id, ...rest };
  }

  const { _id, ...rest } = doc;
  void _id;
  return rest;
}

function project(doc: Record<string, unknown>, select: string | null) {
  const row = clean(doc);
  if (!select || select === "*" || select.includes("(")) return row;

  const fields = select.split(",").map((x) => x.trim()).filter(Boolean);
  const result: Record<string, unknown> = {};

  for (const field of fields) {
    if (field in row) result[field] = row[field];
  }

  if (!("id" in result) && "id" in row) result.id = row.id;
  return result;
}

async function roleFor(userId: string) {
  const users = await getMongoCollection<Record<string, unknown>>("users");
  const user = await users.findOne({ _id: userId });

  if (user?.role === "admin") return "admin";

  const roles = await getMongoCollection<Record<string, unknown>>("user_roles");
  const rows = await roles.find({ user_id: userId }).toArray();

  return rows.some((row) => row.role === "office") ? "office" : "individual";
}

async function authorize(input: DbInput) {
  const userId = getSessionUserId();
  const role = userId ? await roleFor(userId) : null;

  if (input.operation === "select" && publicReads.has(input.collection)) {
    return { userId, role };
  }

  if (!userId) throw new Error("يجب تسجيل الدخول.");

  if (input.collection === "notifications" || input.collection === "profiles" || input.collection === "user_roles") {
    if (role !== "admin" && input.operation === "select") {
      input.filters = [
        ...(input.filters ?? []),
        {
          field: input.collection === "profiles" ? "id" : "user_id",
          op: "eq",
          value: userId,
        },
      ];
    }
  }

  if (userOwned.has(input.collection) && role !== "admin" && input.operation === "select") {
    const hasOwnerFilter = (input.filters ?? []).some(
      (filter) => filter.field === "user_id" || filter.field === "owner_id",
    );

    if (!hasOwnerFilter) {
      input.filters = [
        ...(input.filters ?? []),
        { field: "user_id", op: "eq", value: userId },
      ];
    }
  }

  return { userId, role };
}

async function runDb(input: DbInput) {
  const { userId, role } = await authorize(input);
  const collection = await getMongoCollection<Record<string, unknown>>(input.collection);

  const filters = [...(input.filters ?? [])];

  if (input.collection === "properties" && input.operation === "select" && role !== "admin") {
    let ownOffice = null;

    if (role === "office" && userId) {
      ownOffice = await collection.db
        .collection("offices")
        .findOne({ owner_id: userId, is_deleted: { $ne: true } });
    }

    const officeId = filters.find((filter) => filter.field === "office_id")?.value;

    if (!ownOffice || officeId !== ownOffice.id) {
      filters.push({ field: "is_published", op: "eq", value: true });
      filters.push({ field: "is_deleted", op: "neq", value: true });
    }
  }

  const base = buildFilter(filters);
  const orFilter = parseOr(input.or);
  const mongoQuery = orFilter ? { $and: [base, orFilter] } : base;

  if (input.operation === "select") {
    let cursor = collection.find(mongoQuery);

    for (const order of input.orders ?? []) {
      cursor = cursor.sort(order.field, order.ascending ? 1 : -1);
    }

    if (input.offset && input.offset > 0) cursor = cursor.skip(input.offset);
    if (input.limit != null) cursor = cursor.limit(Math.max(0, input.limit));

    const rows = await cursor.toArray();
    const count = input.count ? await collection.countDocuments(mongoQuery) : null;

    if (input.head) return { data: null, count, error: null };

    const output = rows.map((row) => project(row, input.select ?? null));

    if (input.single || input.maybeSingle) {
      if (!output[0]) {
        if (input.single) throw new Error("البيانات المطلوبة غير موجودة.");
        return { data: null, count, error: null };
      }

      if (input.single && output.length > 1) {
        throw new Error("أكثر من نتيجة مطابقة.");
      }

      return { data: output[0], count, error: null };
    }

    return { data: output, count, error: null };
  }

  if (input.operation === "insert") {
    const list = Array.isArray(input.payload) ? input.payload : [input.payload];

    const docs = list.map((value) => {
      const item = { ...(value as Record<string, unknown>) };
      const id = typeof item.id === "string" && item.id ? item.id : randomUUID();

      item.id = id;
      item._id = id;
      item.created_at ??= new Date();
      item.updated_at ??= new Date();

      if (userId && "user_id" in item && !item.user_id) {
        item.user_id = userId;
      }

      return item;
    });

    if (input.collection === "profiles" && userId) {
      for (const doc of docs) {
        doc.id = userId;
        doc._id = userId;
      }
    }

    await collection.insertMany(docs);

    const rows = docs.map((row) => project(row, input.select ?? null));

    return {
      data: input.single ? rows[0] ?? null : rows,
      error: null,
    };
  }

  if (input.operation === "update") {
    const payload = (input.payload ?? {}) as Record<string, unknown>;

    const result = await collection.updateMany(
      mongoQuery,
      { $set: { ...payload, updated_at: new Date() } },
    );

    if (!input.select) {
      return { data: null, count: result.modifiedCount, error: null };
    }

    const rows = await collection.find(mongoQuery).toArray();
    const output = rows.map((row) => project(row, input.select ?? null));

    return {
      data: input.single || input.maybeSingle ? output[0] ?? null : output,
      count: result.modifiedCount,
      error: null,
    };
  }

  if (input.operation === "upsert") {
    const list = Array.isArray(input.payload) ? input.payload : [input.payload];
    const rows: Record<string, unknown>[] = [];

    for (const value of list) {
      const item = { ...(value as Record<string, unknown>) };
      const id = typeof item.id === "string" && item.id ? item.id : randomUUID();

      item.id = id;
      item._id = id;
      item.updated_at = new Date();
      item.created_at ??= new Date();

      await collection.updateOne({ _id: id }, { $set: item }, { upsert: true });
      rows.push(project(item, input.select ?? null));
    }

    return { data: input.single ? rows[0] ?? null : rows, error: null };
  }

  if (input.operation === "delete") {
    const result = await collection.deleteMany(mongoQuery);
    return { data: null, count: result.deletedCount, error: null };
  }

  throw new Error("Unsupported database operation.");
}

export const dbRequest = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => value as DbInput)
  .handler(async ({ data }) => {
    try {
      return await runDb(data);
    } catch (error) {
      console.error("[MongoDB]", error);
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : "حدث خطأ في قاعدة البيانات.",
        },
      };
    }
  });

export const rpcRequest = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => value as { name: string; args?: Record<string, unknown> })
  .handler(async ({ data }) => {
    try {
      const userId = getSessionUserId();

      if (data.name === "complete_signup") {
        if (!userId) throw new Error("يجب تأكيد البريد أولًا.");

        const args = data.args ?? {};
        const users = await getMongoCollection<Record<string, unknown>>("users");
        const user = await users.findOne({ _id: userId });

        if (!user) throw new Error("الحساب غير موجود.");

        const role = args._role === "office" ? "office" : "individual";

        await getMongoCollection("profiles").updateOne(
          { id: userId },
          {
            $set: {
              id: userId,
              _id: userId,
              full_name: args._full_name ?? user.full_name ?? "مستخدم",
              phone: args._phone ?? null,
              email: user.email,
              governorate_id: args._governorate_id ?? null,
              updated_at: new Date(),
            },
            $setOnInsert: { created_at: new Date() },
          },
          { upsert: true },
        );

        await getMongoCollection("user_roles").updateOne(
          { user_id: userId, role },
          {
            $setOnInsert: {
              id: randomUUID(),
              user_id: userId,
              role,
              created_at: new Date(),
            },
          },
          { upsert: true },
        );

        await users.updateOne(
          { _id: userId },
          { $set: { role, full_name: args._full_name ?? null, updated_at: new Date() } },
        );

        if (role === "office") {
          const office = (args._office ?? {}) as Record<string, unknown>;

          await getMongoCollection("offices").updateOne(
            { owner_id: userId, is_deleted: { $ne: true } },
            {
              $set: {
                owner_id: userId,
                name: office.name ?? args._full_name ?? "مكتب عقاري",
                manager_name: office.manager_name ?? args._full_name ?? null,
                phone: args._phone ?? null,
                email: user.email,
                address: office.address ?? null,
                license_number: office.license_number ?? null,
                commercial_register: office.commercial_register ?? null,
                governorate_id: args._governorate_id ?? null,
                plan: office.plan ?? "free",
                verification_status: "pending",
                is_deleted: false,
                updated_at: new Date(),
              },
              $setOnInsert: {
                id: randomUUID(),
                created_at: new Date(),
              },
            },
            { upsert: true },
          );
        }

        return { data: null, error: null };
      }

      if (data.name === "office_effective_plan") {
        if (!userId) throw new Error("يجب تسجيل الدخول.");

        const officeId = data.args?._office_id ?? data.args?.office_id;
        const offices = await getMongoCollection<Record<string, unknown>>("offices");
        const office = await offices.findOne({ id: officeId });

        return {
          data: {
            plan: office?.plan ?? "free",
            expires_at: office?.plan_expires_at ?? null,
          },
          error: null,
        };
      }

      if (data.name === "request_pro_upgrade") {
        if (!userId) throw new Error("يجب تسجيل الدخول.");

        const offices = await getMongoCollection<Record<string, unknown>>("offices");
        const office = await offices.findOne({
          owner_id: userId,
          is_deleted: { $ne: true },
        });

        if (!office) throw new Error("المكتب غير موجود.");

        await getMongoCollection("office_plan_events").insertOne({
          id: randomUUID(),
          office_id: office.id,
          plan: "pro",
          action: "request",
          created_at: new Date(),
          note: "طلب ترقية إلى Pro",
        });

        return { data: null, error: null };
      }

      throw new Error("RPC غير مدعوم بعد: " + data.name);
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : "فشل تنفيذ العملية.",
        },
      };
    }
  });

export const authSignUp = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => value as {
    email: string;
    password: string;
    options?: { data?: { full_name?: string; phone?: string | null; role?: "individual" | "office" } };
  })
  .handler(({ data }) =>
    registerUser({
      email: data.email,
      password: data.password,
      fullName: data.options?.data?.full_name,
      phone: data.options?.data?.phone ?? null,
      role: data.options?.data?.role,
    }),
  );

export const authVerifyOtp = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => value as { email: string; token: string })
  .handler(({ data }) => verifyEmailCode(data.email, data.token));

export const authResend = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => value as { email: string })
  .handler(({ data }) => resendVerification(data.email));

export const authSignIn = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => value as { email: string; password: string })
  .handler(({ data }) => signIn(data.email, data.password));

export const authGetSession = createServerFn({ method: "GET" })
  .handler(async () => {
    const user = await currentUser();

    if (!user) return { data: { session: null }, error: null };

    return {
      data: {
        session: {
          access_token: user._id,
          refresh_token: user._id,
          token_type: "bearer",
          user: {
            id: user._id,
            email: user.email,
            email_confirmed_at: user.email_confirmed_at,
            user_metadata: {
              full_name: user.full_name ?? undefined,
              phone: user.phone ?? null,
              role: user.role ?? null,
            },
          },
        },
      },
      error: null,
    };
  });

export const authGetUser = createServerFn({ method: "GET" })
  .handler(async () => {
    const user = await currentUser();

    return {
      data: {
        user: user
          ? {
              id: user._id,
              email: user.email,
              email_confirmed_at: user.email_confirmed_at,
              user_metadata: {
                full_name: user.full_name ?? undefined,
                phone: user.phone ?? null,
                role: user.role ?? null,
              },
            }
          : null,
      },
      error: null,
    };
  });

export const authSignOut = createServerFn({ method: "POST" })
  .handler(async () => ({ data: await signOut(), error: null }));

export const authUpdateUser = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => value as { password?: string; email?: string })
  .handler(async ({ data }) => ({ data: await updateCurrentUser(data), error: null }));

export const authResetPasswordForEmail = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => value as { email: string; origin: string })
  .handler(async ({ data }) => ({ data: await requestPasswordReset(data.email, data.origin), error: null }));

export const authResetPassword = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => value as { email: string; token: string; password: string })
  .handler(async ({ data }) => ({ data: await resetPassword(data.email, data.token, data.password), error: null }));

export const uploadMedia = createServerFn({ method: "POST", strict: { input: false } })
  .validator((value) => {
    if (!(value instanceof FormData)) throw new Error("Expected FormData.");
    return value;
  })
  .handler(async ({ data }) => {
    const file = data.get("file");

    if (!(file instanceof File)) throw new Error("الملف غير موجود.");

    const bytes = Buffer.from(await file.arrayBuffer());
    const id = await storeMedia(file.name, file.type || "application/octet-stream", bytes);

    return {
      data: {
        path: id,
        publicUrl: "/api/media/" + encodeURIComponent(id),
      },
      error: null,
    };
  });

export const removeMedia = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => value as { path: string })
  .handler(async ({ data }) => {
    await deleteMedia(data.path);
    return { data: null, error: null };
  });
