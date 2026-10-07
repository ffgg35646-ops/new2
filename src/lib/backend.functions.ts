
import { createServerFn } from "@tanstack/react-start";
import { randomUUID } from "node:crypto";
import { getMongoCollection, getMongoDb, storeMedia, deleteMedia } from "./mongo.server";
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
  onConflict?: string | null;
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


type RelationSpec = {
  output: string;
  collection: string;
  fields: string[];
};

function parseRelations(select: string | null): RelationSpec[] {
  if (!select) return [];

  const relations: RelationSpec[] = [];
  const pattern = /(?:(\w+):)?(\w+)\(([^()]*)\)/g;

  for (const match of select.matchAll(pattern)) {
    const output = match[1] ?? match[2];
    const collection = match[2];
    const fields = match[3]
      .split(",")
      .map((field) => field.trim())
      .filter(Boolean);

    if (output && collection) {
      relations.push({ output, collection, fields });
    }
  }

  return relations;
}

function pickFields(
  value: Record<string, unknown>,
  fields: string[],
) {
  if (!fields.length || fields.includes("*")) return clean(value);

  const row = clean(value);
  const output: Record<string, unknown> = {};

  for (const field of fields) {
    if (field in row) output[field] = row[field];
  }

  if ("id" in row && !("id" in output)) output.id = row.id;

  return output;
}

const relationRules: Record<
  string,
  { localField: string; foreignField: string; many?: boolean }
> = {
  governorates: { localField: "governorate_id", foreignField: "id" },
  offices: { localField: "office_id", foreignField: "id" },
  profiles: { localField: "user_id", foreignField: "id" },
  package_catalog: { localField: "package_id", foreignField: "id" },
  properties: { localField: "property_id", foreignField: "id" },
  office_offers: { localField: "id", foreignField: "request_id", many: true },
  property_images: { localField: "id", foreignField: "property_id", many: true },
  messages: { localField: "id", foreignField: "conversation_id", many: true },
  office_staff: { localField: "id", foreignField: "office_id", many: true },
  user_roles: { localField: "id", foreignField: "user_id", many: true },
};

async function enrichRows(
  collection: string,
  rows: Record<string, unknown>[],
  select: string | null,
) {
  const relations = parseRelations(select);
  if (!relations.length) return rows;

  const output = [];

  for (const raw of rows) {
    const row = clean(raw);

    for (const relation of relations) {
      const rule = relationRules[relation.collection];
      if (!rule) continue;

      const localValue = row[rule.localField];
      if (localValue == null) continue;

      const relatedCollection =
        await getMongoCollection<Record<string, unknown>>(
          relation.collection,
        );

      if (rule.many) {
        const related = await relatedCollection
          .find({ [rule.foreignField]: localValue })
          .toArray();

        row[relation.output] = related.map((item) =>
          pickFields(item, relation.fields),
        );
      } else {
        const related = await relatedCollection.findOne({
          [rule.foreignField]: localValue,
        });

        row[relation.output] = related
          ? pickFields(related, relation.fields)
          : null;
      }
    }

    output.push(row);
  }

  void collection;
  return output;
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

  if (input.collection === "app_content" && input.operation !== "select" && role !== "admin") {
    throw new Error("غير مصرح بتعديل المحتوى القانوني.");
  }

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
      ownOffice = await (await getMongoDb())
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

    const relatedRows = await enrichRows(
      input.collection,
      rows,
      input.select ?? null,
    );

    const output = relatedRows.map((row) =>
      project(row, input.select ?? null),
    );

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

      const conflictFields = String(input.onConflict ?? "")
        .split(",")
        .map((field) => field.trim())
        .filter(Boolean);

      if (conflictFields.length) {
        const conflictQuery = Object.fromEntries(
          conflictFields.map((field) => [field, item[field]]),
        );

        await collection.updateOne(
          conflictQuery,
          { $set: item },
          { upsert: true },
        );
      } else {
        await collection.updateOne(
          { _id: id },
          { $set: item },
          { upsert: true },
        );
      }

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

        await (await getMongoCollection("profiles")).updateOne(
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

        await (await getMongoCollection("user_roles")).updateOne(
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

          await (await getMongoCollection("offices")).updateOne(
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

      if (data.name === "set_office_package") {
        if (!userId) throw new Error("يجب تسجيل الدخول.");

        const packageId = String(data.args?._package_id ?? "");
        const offices = await getMongoCollection<Record<string, unknown>>("offices");
        const office = await offices.findOne({
          owner_id: userId,
          is_deleted: { $ne: true },
        });

        if (!office) throw new Error("office_not_found");

        const packages = await getMongoCollection<Record<string, unknown>>("package_catalog");
        const pkg = await packages.findOne({
          id: packageId,
          is_active: true,
        });

        if (!pkg) throw new Error("package_not_available");

        const plan =
          String(pkg.code ?? "") === "pro" || Number(pkg.price ?? 0) > 0
            ? "pro"
            : "free";

        const durationDays = Number(pkg.duration_days ?? 0);
        const expiresAt =
          durationDays > 0
            ? new Date(Date.now() + durationDays * 86_400_000)
            : null;

        await offices.updateOne(
          { id: office.id },
          {
            $set: {
              package_id: pkg.id,
              plan,
              plan_started_at: new Date(),
              plan_expires_at: expiresAt,
              updated_at: new Date(),
            },
          },
        );

        await (await getMongoCollection("office_plan_events")).insertOne({
          id: randomUUID(),
          office_id: office.id,
          action: "package_changed",
          plan,
          expires_at: expiresAt,
          created_at: new Date(),
          note: pkg.name ?? null,
        });

        return { data: null, error: null };
      }

      if (data.name === "create_property_request") {
        if (!userId) throw new Error("not_authenticated");

        const args = data.args ?? {};
        const description = String(args._description ?? "").trim();

        if (description.length < 10) {
          throw new Error("description_required");
        }

        const governorateId = args._governorate_id;
        const governorates = await getMongoCollection<Record<string, unknown>>("governorates");
        const governorate = await governorates.findOne({
          id: governorateId,
          is_active: true,
        });

        if (!governorate) throw new Error("governorate_inactive");

        const budgetMin =
          args._budget_min == null ? null : Number(args._budget_min);
        const budgetMax =
          args._budget_max == null ? null : Number(args._budget_max);

        if (
          budgetMin != null &&
          budgetMax != null &&
          budgetMin > budgetMax
        ) {
          throw new Error("invalid_budget_range");
        }

        const requests = await getMongoCollection<Record<string, unknown>>(
          "property_requests",
        );

        const id = randomUUID();
        await requests.insertOne({
          id,
          _id: id,
          user_id: userId,
          governorate_id: governorateId,
          kind: args._kind,
          listing: args._listing,
          neighborhood: args._neighborhood || null,
          budget_min: budgetMin,
          budget_max: budgetMax,
          area_min:
            args._area_min == null ? null : Number(args._area_min),
          description,
          attachment_url: args._attachment_url || null,
          expires_at:
            args._expires_at
              ? new Date(String(args._expires_at))
              : new Date(Date.now() + 7 * 86_400_000),
          status: "active",
          views_count: 0,
          created_at: new Date(),
          updated_at: new Date(),
        });

        return { data: id, error: null };
      }

      if (data.name === "notify_matching_offices_for_request") {
        if (!userId) throw new Error("not_authenticated");

        const requestId = String(data.args?._request_id ?? "");
        const requests = await getMongoCollection<Record<string, unknown>>(
          "property_requests",
        );
        const request = await requests.findOne({
          id: requestId,
          user_id: userId,
        });

        if (!request) throw new Error("request_not_found");

        const properties = await getMongoCollection<Record<string, unknown>>(
          "properties",
        );

        const propertyFilter: Record<string, unknown> = {
          governorate_id: request.governorate_id,
          kind: request.kind,
          is_published: true,
          is_deleted: { $ne: true },
        };

        if (request.neighborhood) {
          propertyFilter.neighborhood = request.neighborhood;
        }

        const matchingProperties = await properties
          .find(propertyFilter)
          .project({ office_id: 1 })
          .toArray();

        const officeIds = [
          ...new Set(
            matchingProperties
              .map((row) => row.office_id)
              .filter((id): id is string => typeof id === "string"),
          ),
        ];

        if (officeIds.length) {
          const offices = await getMongoCollection<Record<string, unknown>>("offices");
          const notifications =
            await getMongoCollection<Record<string, unknown>>("notifications");

          const rows = await offices
            .find({
              id: { $in: officeIds },
              is_deleted: false,
              verification_status: "verified",
            })
            .project({ owner_id: 1 })
            .toArray();

          const recipientIds = [
            ...new Set(
              rows
                .map((row) => row.owner_id)
                .filter((id): id is string => typeof id === "string"),
            ),
          ];

          if (recipientIds.length) {
            await notifications.insertMany(
              recipientIds.map((recipientId) => ({
                id: randomUUID(),
                _id: randomUUID(),
                user_id: recipientId,
                title: "طلب عقار جديد",
                body: "يوجد طلب عقاري مطابق لنوع عقارات مكتبك ومنطقتك.",
                type: "property_request",
                link: "/office/requests",
                is_read: false,
                created_at: new Date(),
              })),
            );
          }
        }

        return { data: null, error: null };
      }

      if (data.name === "notify_new_property_offer") {
        if (!userId) throw new Error("not_authenticated");

        const offerId = String(data.args?._offer_id ?? "");
        const offers = await getMongoCollection<Record<string, unknown>>(
          "office_offers",
        );
        const offer = await offers.findOne({ id: offerId });

        if (!offer) throw new Error("offer_not_found");

        const offices = await getMongoCollection<Record<string, unknown>>(
          "offices",
        );
        const office = await offices.findOne({ id: offer.office_id });

        if (!office || office.owner_id !== userId) {
          throw new Error("not_office_member");
        }

        const requests = await getMongoCollection<Record<string, unknown>>(
          "property_requests",
        );
        const request = await requests.findOne({ id: offer.request_id });

        if (!request || typeof request.user_id !== "string") {
          throw new Error("request_not_found");
        }

        await getMongoCollection<Record<string, unknown>>(
          "notifications",
        ).insertOne({
          id: randomUUID(),
          _id: randomUUID(),
          user_id: request.user_id,
          title: "وصل عرض جديد",
          body: "أرسل لك " + String(office.name ?? "مكتب عقاري") + " عرضًا على طلبك العقاري.",
          type: "property_offer",
          link: "/request",
          is_read: false,
          created_at: new Date(),
        });

        return { data: null, error: null };
      }

      if (data.name === "mark_property_request_view") {
        if (!userId) throw new Error("not_authenticated");

        const requestId = String(data.args?._request_id ?? "");
        const offices = await getMongoCollection<Record<string, unknown>>("offices");
        const office = await offices.findOne({
          owner_id: userId,
          is_deleted: { $ne: true },
        });

        if (!office) throw new Error("not_office_member");

        const requests = await getMongoCollection<Record<string, unknown>>(
          "property_requests",
        );

        const request = await requests.findOne({
          id: requestId,
          status: "active",
        });

        if (!request) throw new Error("request_not_active");

        const views = await getMongoCollection<Record<string, unknown>>(
          "property_request_views",
        );

        const existing = await views.findOne({
          request_id: requestId,
          office_id: office.id,
        });

        if (!existing) {
          await views.insertOne({
            id: randomUUID(),
            _id: randomUUID(),
            request_id: requestId,
            office_id: office.id,
            created_at: new Date(),
          });

          await requests.updateOne(
            { id: requestId },
            {
              $inc: { views_count: 1 },
              $set: { updated_at: new Date() },
            },
          );
        }

        const fresh = await requests.findOne({ id: requestId });

        return {
          data: Number(fresh?.views_count ?? 0),
          error: null,
        };
      }

      if (data.name === "admin_delete_user") {
        if (role !== "admin") throw new Error("not_admin");

        const targetId = String(data.args?._user_id ?? "");
        if (!targetId) throw new Error("user_not_found");
        if (targetId === userId) throw new Error("cannot_delete_self");

        for (const collection of [
          "profiles",
          "user_roles",
          "favorites",
          "follows",
          "notifications",
          "device_tokens",
          "saved_searches",
          "property_requests",
          "property_request_views",
          "office_offers",
          "messages",
          "conversations",
          "viewing_bookings",
          "property_inquiries",
          "reports",
          "support_tickets",
          "support_messages",
        ]) {
          await (await getMongoCollection(collection)).deleteMany({
            $or: [{ user_id: targetId }, { owner_id: targetId }, { reporter_id: targetId }],
          });
        }

        await (await getMongoCollection("offices")).deleteMany({ owner_id: targetId });
        await (await getMongoCollection("users")).deleteOne({ _id: targetId });

        return { data: null, error: null };
      }

      if (data.name === "admin_send_notifications") {
        if (role !== "admin") throw new Error("not_admin");

        const args = data.args ?? {};
        const ids = Array.isArray(args._user_ids)
          ? args._user_ids.filter((id): id is string => typeof id === "string")
          : [];

        if (!ids.length) throw new Error("no_recipients");

        const title = String(args._title ?? "").trim();
        const body = String(args._body ?? "").trim();

        if (title.length < 2 || body.length < 2) {
          throw new Error("invalid_notification");
        }

        const type = String(args._type ?? "admin_message").trim() || "admin_message";
        const link =
          String(args._link ?? "/notifications").startsWith("/")
            ? String(args._link)
            : "/notifications";

        await (await getMongoCollection("notifications")).insertMany(
          ids.map((recipientId) => ({
            id: randomUUID(),
            _id: randomUUID(),
            user_id: recipientId,
            title,
            body,
            type,
            link,
            is_read: false,
            created_at: new Date(),
          })),
        );

        return { data: ids.length, error: null };
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

        await (await getMongoCollection("office_plan_events")).insertOne({
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
