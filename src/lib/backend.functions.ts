
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
import { saudiAppointmentDateTime, saudiDateKey } from "@/lib/saudi-time";

type Filter = { field: string; op: string; value: unknown };

const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: "بانتظار الموافقة",
  accepted: "مقبول",
  rejected: "مرفوض",
  completed: "مكتمل",
  cancelled: "ملغي",
};
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
    const match = part.match(/^([\w.]+)\\.(eq|ilike|like)\\.(.*)$/);
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
  const relationPattern = /(?:(\w+):)?(\w+)\(/g;

  for (const match of select.matchAll(relationPattern)) {
    const output = match[1] ?? match[2];
    const collection = match[2];
    const openIndex = (match.index ?? 0) + match[0].length - 1;

    let depth = 0;
    let closeIndex = -1;

    for (let index = openIndex; index < select.length; index += 1) {
      const char = select[index];
      if (char === "(") depth += 1;
      if (char === ")") {
        depth -= 1;
        if (depth === 0) {
          closeIndex = index;
          break;
        }
      }
    }

    if (closeIndex < 0 || !output || !collection) continue;

    const fieldsText = select.slice(openIndex + 1, closeIndex);
    const fields = fieldsText
      .split(",")
      .map((field) => field.trim())
      .filter(Boolean);

    relations.push({ output, collection, fields });
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

        const mapped = related.map((item) =>
          pickFields(item, relation.fields),
        );

        if (relation.collection === "office_offers") {
          const offerFields = relation.fields;

          const needOffices = /(?:^|,)\s*offices\(/.test(offerFields.join(","));
          const needProperties = /(?:^|,)\s*properties\(/.test(offerFields.join(","));

          const officeIds = needOffices
            ? [
                ...new Set(
                  related
                    .map((item) => item.office_id)
                    .filter((id): id is string => typeof id === "string"),
                ),
              ]
            : [];

          const propertyIds = needProperties
            ? [
                ...new Set(
                  related
                    .map((item) => item.property_id)
                    .filter((id): id is string => typeof id === "string"),
                ),
              ]
            : [];

          const [offices, properties] = await Promise.all([
            officeIds.length
              ? getMongoCollection<Record<string, unknown>>("offices").then((collection) =>
                  collection.find({ id: { $in: officeIds } }).toArray(),
                )
              : Promise.resolve([]),
            propertyIds.length
              ? getMongoCollection<Record<string, unknown>>("properties").then((collection) =>
                  collection.find({ id: { $in: propertyIds } }).toArray(),
                )
              : Promise.resolve([]),
          ]);

          const officeMap = new Map(
            offices.map((office) => [
              String(office.id),
              pickFields(office, ["name", "phone", "whatsapp"]),
            ]),
          );

          const propertyMap = new Map(
            properties.map((property) => [
              String(property.id),
              pickFields(property, ["id", "title"]),
            ]),
          );

          row[relation.output] = mapped.map((offer, index) => {
            const source = related[index];
            const next = { ...offer } as Record<string, unknown>;

            if (needOffices) {
              next.offices = officeMap.get(String(source.office_id)) ?? null;
            }

            if (needProperties) {
              next.properties = propertyMap.get(String(source.property_id)) ?? null;
            }

            return next;
          });
        } else {
          row[relation.output] = mapped;
        }
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

  if (rows.some((row) => row.role === "admin")) return "admin";
  return rows.some((row) => row.role === "office") ? "office" : "individual";
}

async function authorize(input: DbInput) {
  const userId = getSessionUserId();

  if (input.operation === "select" && publicReads.has(input.collection)) {
    return { userId, role: null };
  }

  const role = userId ? await roleFor(userId) : null;

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

  if (
    userOwned.has(input.collection) &&
    role !== "admin" &&
    input.operation === "select" &&
    !(input.collection === "property_requests" && role === "office")
  ) {
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

  if (
    input.collection === "property_requests" &&
    input.operation === "select" &&
    role === "office" &&
    !filters.some((filter) => filter.field === "status")
  ) {
    filters.push({ field: "status", op: "eq", value: "active" });
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

    if (input.collection === "support_tickets") {
      const latest = await collection
        .find({ ticket_number: { $exists: true } })
        .sort({ ticket_number: -1 })
        .limit(1)
        .toArray();

      let nextTicketNumber =
        Number(latest[0]?.ticket_number ?? 0) + 1;

      for (const doc of docs) {
        doc.ticket_number = nextTicketNumber++;
        doc.status ??= "open";
      }
    }

    await collection.insertMany(docs);

    try {
      if (input.collection === "reports") {
        const users = await getMongoCollection<Record<string, unknown>>("users");
        const roles = await getMongoCollection<Record<string, unknown>>("user_roles");
        const [adminsFromUsers, adminsFromRoles] = await Promise.all([
          users.find({ role: "admin" }).project({ _id: 1 }).toArray(),
          roles.find({ role: "admin" }).project({ user_id: 1 }).toArray(),
        ]);

        const adminIds = [
          ...new Set(
            [
              ...adminsFromUsers.map((row) => String(row._id ?? "")),
              ...adminsFromRoles.map((row) => String(row.user_id ?? "")),
            ].filter(Boolean),
          ),
        ].filter((id) => id !== userId);

        if (adminIds.length) {
          const notifications = await getMongoCollection<Record<string, unknown>>("notifications");
          await notifications.insertMany(
            adminIds.map((adminId) => ({
              id: randomUUID(),
              _id: randomUUID(),
              user_id: adminId,
              title: "بلاغ جديد",
              body: "تم استلام بلاغ جديد ويحتاج إلى المراجعة.",
              type: "report",
              link: "/admin?tab=reports",
              is_read: false,
              created_at: new Date(),
            })),
          );
        }
      }

      if (input.collection === "support_tickets") {
        const users = await getMongoCollection<Record<string, unknown>>("users");
        const roles = await getMongoCollection<Record<string, unknown>>("user_roles");
        const [adminsFromUsers, adminsFromRoles] = await Promise.all([
          users.find({ role: "admin" }).project({ _id: 1 }).toArray(),
          roles.find({ role: "admin" }).project({ user_id: 1 }).toArray(),
        ]);

        const adminIds = [
          ...new Set(
            [
              ...adminsFromUsers.map((row) => String(row._id ?? "")),
              ...adminsFromRoles.map((row) => String(row.user_id ?? "")),
            ].filter(Boolean),
          ),
        ].filter((id) => id !== userId);

        if (adminIds.length) {
          const notifications = await getMongoCollection<Record<string, unknown>>("notifications");
          await notifications.insertMany(
            docs.map((ticket) =>
              adminIds.map((adminId) => ({
                id: randomUUID(),
                _id: randomUUID(),
                user_id: adminId,
                title: "تذكرة دعم جديدة",
                body: "تم فتح تذكرة دعم جديدة وتحتاج إلى الرد.",
                type: "support_ticket",
                link: "/admin?tab=support",
                is_read: false,
                created_at: new Date(),
                ticket_id: ticket.id,
                ticket_number: ticket.ticket_number,
              })),
            ).flat(),
          );
        }
      }

      if (input.collection === "support_messages") {
        const tickets = await getMongoCollection<Record<string, unknown>>("support_tickets");
        const users = await getMongoCollection<Record<string, unknown>>("users");
        const roles = await getMongoCollection<Record<string, unknown>>("user_roles");
        const notifications = await getMongoCollection<Record<string, unknown>>("notifications");

        const [adminsFromUsers, adminsFromRoles] = await Promise.all([
          users.find({ role: "admin" }).project({ _id: 1 }).toArray(),
          roles.find({ role: "admin" }).project({ user_id: 1 }).toArray(),
        ]);

        const adminIds = [
          ...new Set(
            [
              ...adminsFromUsers.map((row) => String(row._id ?? "")),
              ...adminsFromRoles.map((row) => String(row.user_id ?? "")),
            ].filter(Boolean),
          ),
        ];

        for (const message of docs) {
          const ticket = await tickets.findOne({ id: message.ticket_id });
          if (!ticket) continue;

          const ticketUserId = String(ticket.user_id ?? "");
          const senderId = String(message.sender_id ?? userId ?? "");

          if (!ticketUserId || !senderId) continue;

          if (senderId === ticketUserId) {
            const recipientIds = adminIds.filter((id) => id !== senderId);

            if (recipientIds.length) {
              await notifications.insertMany(
                recipientIds.map((adminId) => ({
                  id: randomUUID(),
                  _id: randomUUID(),
                  user_id: adminId,
                  title: `رد جديد على تذكرة #${ticket.ticket_number ?? "—"}`,
                  body: "وصلت رسالة جديدة من صاحب التذكرة.",
                  type: "support_ticket",
                  link: "/admin?tab=support",
                  is_read: false,
                  created_at: new Date(),
                  ticket_id: ticket.id,
                  ticket_number: ticket.ticket_number,
                })),
              );
            }
          } else {
            await notifications.insertOne({
              id: randomUUID(),
              _id: randomUUID(),
              user_id: ticketUserId,
              title: `رد جديد على تذكرة #${ticket.ticket_number ?? "—"}`,
              body: "وصل رد جديد من فريق الدعم.",
              type: "support_ticket",
              link: `/account?support=${encodeURIComponent(String(ticket.id))}`,
              is_read: false,
              created_at: new Date(),
              ticket_id: ticket.id,
              ticket_number: ticket.ticket_number,
            });
          }
        }
      }

    } catch (notificationError) {
      console.error("[notifications]", notificationError);
      // فشل الإشعار لا يجب أن يفشل العملية الأصلية للتقرير أو الدعم.
    }

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
  .validator((value: unknown) => value as DbInput)
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
  .validator((value: unknown) => value as { name: string; args?: Record<string, unknown> })
  .handler(async ({ data }) => {
    try {
      const userId = getSessionUserId();
      const role = userId ? await roleFor(userId) : null;

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

      if (data.name === "set_property_request_status") {
        if (!userId) throw new Error("not_authenticated");

        const requestId = String(data.args?._request_id ?? "");
        const requestedStatus = String(data.args?._status ?? "");

        if (!requestId || !["cancelled", "fulfilled"].includes(requestedStatus)) {
          throw new Error("invalid_request_status");
        }

        const requests = await getMongoCollection<Record<string, unknown>>("property_requests");
        const request = await requests.findOne({ id: requestId });

        if (!request) throw new Error("request_not_found");

        const ownerId = String(request.user_id ?? "");
        let allowed = ownerId === userId;

        if (!allowed && role === "office") {
          const offices = await getMongoCollection<Record<string, unknown>>("offices");
          const office = await offices.findOne({
            owner_id: userId,
            is_deleted: { $ne: true },
          });

          if (office) {
            const offers = await getMongoCollection<Record<string, unknown>>("office_offers");
            const ownOffer = await offers.findOne({
              request_id: requestId,
              office_id: office.id,
            });
            allowed = !!ownOffer;
          }
        }

        if (!allowed) throw new Error("not_request_owner");

        if (requestedStatus === "cancelled" && request.status !== "active") {
          throw new Error("request_not_active");
        }

        if (requestedStatus === "fulfilled" && request.status !== "active") {
          throw new Error("request_not_active");
        }

        const now = new Date();

        await requests.updateOne(
          { id: requestId },
          {
            $set: {
              status: requestedStatus,
              updated_at: now,
              ...(requestedStatus === "fulfilled" ? { fulfilled_at: now } : {}),
            },
          },
        );

        const offers = await getMongoCollection<Record<string, unknown>>("office_offers");
        const relatedOffers = await offers
          .find({ request_id: requestId })
          .project({ office_id: 1 })
          .toArray();

        const officeIds = [
          ...new Set(
            relatedOffers
              .map((offer) => String(offer.office_id ?? ""))
              .filter(Boolean),
          ),
        ];

        const offices = await getMongoCollection<Record<string, unknown>>("offices");
        const affectedOffices = officeIds.length
          ? await offices.find({ id: { $in: officeIds } }).project({ id: 1, owner_id: 1, name: 1 }).toArray()
          : [];

        const notifications = await getMongoCollection<Record<string, unknown>>("notifications");
        const title =
          requestedStatus === "fulfilled"
            ? "تم إكمال الطلب العقاري"
            : "تم إلغاء الطلب العقاري";
        const body =
          requestedStatus === "fulfilled"
            ? "تم تحديد الطلب العقاري كمكتمل، ولم يعد ظاهرًا في سوق الطلبات."
            : "تم إلغاء الطلب العقاري، ولم يعد ظاهرًا في سوق الطلبات.";

        const recipientIds = [
          ...new Set(
            affectedOffices
              .map((office) => String(office.owner_id ?? ""))
              .filter((id) => id && id !== userId),
          ),
        ];

        if (recipientIds.length) {
          await notifications.insertMany(
            recipientIds.map((recipientId) => ({
              id: randomUUID(),
              _id: randomUUID(),
              user_id: recipientId,
              title,
              body,
              type: "property_request",
              link: "/office/requests",
              is_read: false,
              created_at: now,
            })),
          );
        }

        if (ownerId !== userId) {
          await notifications.insertOne({
            id: randomUUID(),
            _id: randomUUID(),
            user_id: ownerId,
            title,
            body,
            type: "property_request",
            link: "/requests",
            is_read: false,
            created_at: now,
          });
        }

        return { data: requestedStatus, error: null };
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

        const offices = await getMongoCollection<Record<string, unknown>>(
          "offices",
        );
        const notifications = await getMongoCollection<Record<string, unknown>>(
          "notifications",
        );

        // أي مكتب موثق في نفس المحافظة يستقبل الطلب في صندوقه،
        // وليس فقط المكاتب التي لديها عقار مطابق منشور بالفعل.
        const rows = await offices
          .find({
            governorate_id: request.governorate_id,
            is_deleted: { $ne: true },
            verification_status: "verified",
            owner_id: { $ne: userId },
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
              title: "عميل يريد التواصل معك",
              body:
                "هناك عميل يريد التواصل معك بخصوص طلب عقاري: " +
                String(request.kind ?? "عقار") +
                " · " +
                String(request.listing ?? "") +
                (request.budget_min != null || request.budget_max != null
                  ? " · الميزانية " +
                    String(request.budget_min ?? "—") +
                    " - " +
                    String(request.budget_max ?? "—")
                  : "") +
                " · " +
                String(request.description ?? "").slice(0, 140),
              type: "property_request",
              link: "/office/requests?tab=market",
              is_read: false,
              created_at: new Date(),
            })),
          );
        }

        return { data: null, error: null };
      }

      if (data.name === "office_market_requests") {
        if (role !== "office" || !userId) throw new Error("not_office_member");

        const offices = await getMongoCollection<Record<string, unknown>>("offices");
        const office = await offices.findOne({
          owner_id: userId,
          is_deleted: { $ne: true },
        });

        if (!office) throw new Error("office_not_found");
        if (!office.governorate_id) return { data: [], error: null };

        const requestsCollection =
          await getMongoCollection<Record<string, unknown>>("property_requests");
        const offersCollection =
          await getMongoCollection<Record<string, unknown>>("office_offers");
        const profilesCollection =
          await getMongoCollection<Record<string, unknown>>("profiles");

        const requests = await requestsCollection
          .find({
            governorate_id: office.governorate_id,
            status: "active",
            expires_at: { $gt: new Date() },
            user_id: { $ne: userId },
          })
          .sort({ created_at: -1 })
          .limit(100)
          .toArray();

        if (!requests.length) return { data: [], error: null };

        const requestIds = requests.map((request) => String(request.id ?? ""));
        const userIds = [
          ...new Set(
            requests
              .map((request) => request.user_id)
              .filter((id): id is string => typeof id === "string"),
          ),
        ];

        const governoratesCollection =
          await getMongoCollection<Record<string, unknown>>("governorates");

        const [offers, profiles, governorate] = await Promise.all([
          offersCollection
            .find({
              office_id: office.id,
              request_id: { $in: requestIds },
            })
            .project({ id: 1, request_id: 1 })
            .toArray(),
          profilesCollection
            .find({ id: { $in: userIds } })
            .project({ id: 1, full_name: 1, phone: 1 })
            .toArray(),
          governoratesCollection.findOne(
            { id: office.governorate_id },
            { projection: { name_ar: 1 } },
          ),
        ]);

        const offerByRequest = new Map(
          offers
            .filter(
              (offer): offer is { id: string; request_id: string } =>
                typeof offer.id === "string" && typeof offer.request_id === "string",
            )
            .map((offer) => [offer.request_id, offer.id]),
        );

        const profileMap = new Map(
          profiles.map((profile) => [
            String(profile.id),
            {
              full_name: String(profile.full_name ?? "عميل"),
              phone: profile.phone ? String(profile.phone) : null,
            },
          ]),
        );

        return {
          data: requests.map((request) => {
            const ownerId = String(request.user_id ?? "");
            const profile = profileMap.get(ownerId);

            return {
              id: String(request.id ?? request._id ?? ""),
              user_id: ownerId,
              kind: request.kind ?? null,
              listing: request.listing ?? null,
              governorate_name: governorate?.name_ar ?? null,
              neighborhood: request.neighborhood ?? null,
              budget_min: request.budget_min ?? null,
              budget_max: request.budget_max ?? null,
              area_min: request.area_min ?? null,
              description: request.description ?? "",
              attachment_url: request.attachment_url ?? null,
              views_count: Number(request.views_count ?? 0),
              created_at: request.created_at ?? null,
              expires_at: request.expires_at ?? null,
              offer_sent: offerByRequest.has(String(request.id ?? request._id ?? "")),
              offer_id: offerByRequest.get(String(request.id ?? request._id ?? "")) ?? null,
              client_name: profile?.full_name ?? "عميل",
              client_phone: profile?.phone ?? null,
            };
          }),
          error: null,
        };
      }

      if (data.name === "respond_property_offer") {
        if (!userId) throw new Error("not_authenticated");
        if (role !== "individual") throw new Error("not_individual");

        const offerId = String(data.args?._offer_id ?? "");
        const requestedStatus = String(data.args?._status ?? "");

        if (!offerId || !["accepted", "rejected"].includes(requestedStatus)) {
          throw new Error("invalid_offer_response");
        }

        const offers = await getMongoCollection<Record<string, unknown>>(
          "office_offers",
        );
        const requests = await getMongoCollection<Record<string, unknown>>(
          "property_requests",
        );

        const offer = await offers.findOne({
          id: offerId,
          status: "sent",
        });

        if (!offer) throw new Error("offer_not_pending");

        const request = await requests.findOne({
          id: offer.request_id,
          user_id: userId,
        });

        if (!request) throw new Error("request_not_found");

        if (request.status !== "active") {
          throw new Error("request_not_active");
        }

        const expiresAt = request.expires_at
          ? new Date(String(request.expires_at))
          : null;

        if (expiresAt && expiresAt.getTime() <= Date.now()) {
          await requests.updateOne(
            { id: request.id, user_id: userId, status: "active" },
            {
              $set: {
                status: "expired",
                updated_at: new Date(),
              },
            },
          );
          throw new Error("request_expired");
        }

        const now = new Date();

        await offers.updateOne(
          { id: offerId, status: "sent" },
          {
            $set: {
              status: requestedStatus,
              updated_at: now,
            },
          },
        );

        if (requestedStatus === "rejected") {
          const officeId = String(offer.office_id ?? "");
          if (officeId) {
            const offices = await getMongoCollection<Record<string, unknown>>("offices");
            const office = await offices.findOne({ id: officeId });

            if (office?.owner_id) {
              await getMongoCollection<Record<string, unknown>>("notifications").insertOne({
                id: randomUUID(),
                _id: randomUUID(),
                user_id: String(office.owner_id),
                title: "تم رفض عرضك",
                body: "تم رفض عرض مكتبك على الطلب العقاري.",
                type: "property_request",
                link: "/office/requests",
                is_read: false,
                created_at: now,
              });
            }
          }
        }

        if (requestedStatus === "accepted") {
          await requests.updateOne(
            { id: request.id, user_id: userId, status: "active" },
            {
              $set: {
                status: "fulfilled",
                fulfilled_at: now,
                updated_at: now,
              },
            },
          );

          await offers.updateMany(
            {
              request_id: request.id,
              id: { $ne: offerId },
              status: "sent",
            },
            {
              $set: {
                status: "rejected",
                updated_at: now,
              },
            },
          );

          const officeId = String(offer.office_id ?? "");
          if (officeId) {
            const offices = await getMongoCollection<Record<string, unknown>>(
              "offices",
            );
            const office = await offices.findOne({ id: officeId });

            if (office?.owner_id) {
              const notifications =
                await getMongoCollection<Record<string, unknown>>(
                  "notifications",
                );

              await notifications.insertOne({
                id: randomUUID(),
                _id: randomUUID(),
                user_id: String(office.owner_id),
                title: "تم قبول عرضك",
                body: "تم قبول عرض مكتبك على الطلب العقاري وإغلاق الطلب كمكتمل.",
                type: "property_request",
                link: "/office/requests",
                is_read: false,
                created_at: now,
              });
            }
          }
        }

        return { data: requestedStatus, error: null };
      }

      if (data.name === "notify_new_viewing_booking") {
        if (!userId || role !== "individual") throw new Error("not_individual");

        const bookingId = String(data.args?._booking_id ?? "");
        if (!bookingId) throw new Error("booking_not_found");

        const bookings = await getMongoCollection<Record<string, unknown>>("viewing_bookings");
        const booking = await bookings.findOne({
          id: bookingId,
          user_id: userId,
        });

        if (!booking) throw new Error("booking_not_found");

        const offices = await getMongoCollection<Record<string, unknown>>("offices");
        const office = await offices.findOne({
          id: booking.office_id,
          is_deleted: { $ne: true },
        });

        if (!office || typeof office.owner_id !== "string") {
          throw new Error("office_not_found");
        }

        const properties = await getMongoCollection<Record<string, unknown>>("properties");
        const property = await properties.findOne({ id: booking.property_id });
        const now = new Date();

        await getMongoCollection<Record<string, unknown>>("notifications").insertOne({
          id: randomUUID(),
          _id: randomUUID(),
          user_id: office.owner_id,
          title: "طلب معاينة جديد",
          body:
            "يوجد طلب معاينة جديد" +
            (property?.title ? " لعقار " + String(property.title) : "") +
            " بتاريخ " +
            String(booking.visit_date ?? "") +
            " الساعة " +
            String(booking.visit_time ?? "").slice(0, 5),
          type: "viewing_booking",
          link: "/office/requests?tab=bookings",
          is_read: false,
          created_at: now,
        });

        return { data: null, error: null };
      }

      if (data.name === "sync_viewing_booking_reminders") {
        if (!userId) throw new Error("not_authenticated");

        const bookings = await getMongoCollection<Record<string, unknown>>("viewing_bookings");
        const offices = await getMongoCollection<Record<string, unknown>>("offices");
        const notifications = await getMongoCollection<Record<string, unknown>>("notifications");
        const properties = await getMongoCollection<Record<string, unknown>>("properties");

        const today = saudiDateKey();
        let userBookingFilter: Record<string, unknown> = { user_id: userId };

        if (role === "office") {
          const office = await offices.findOne({
            owner_id: userId,
            is_deleted: { $ne: true },
          });

          if (!office) return { data: 0, error: null };

          userBookingFilter = { office_id: office.id };
        }

        const candidates = await bookings
          .find({
            ...userBookingFilter,
            status: "accepted",
            visit_date: today,
            reminder_sent_on: { $ne: today },
          })
          .limit(50)
          .toArray();

        let sent = 0;

        for (const booking of candidates) {
          const bookingUserId = String(booking.user_id ?? "");
          const bookingOfficeId = String(booking.office_id ?? "");
          if (!bookingUserId || !bookingOfficeId) continue;

          const appointment = saudiAppointmentDateTime(
            String(booking.visit_date ?? ""),
            String(booking.visit_time ?? ""),
          );
          if (!Number.isFinite(appointment.getTime())) continue;

          const office = await offices.findOne({
            id: bookingOfficeId,
            is_deleted: { $ne: true },
          });
          if (!office) continue;

          const claimed = await bookings.updateOne(
            {
              id: booking.id,
              status: "accepted",
              visit_date: today,
              reminder_sent_on: { $ne: today },
            },
            {
              $set: {
                reminder_sent_on: today,
                updated_at: new Date(),
              },
            },
          );

          if (claimed.modifiedCount !== 1) continue;

          const property = await properties.findOne(
            { id: booking.property_id },
            { projection: { title: 1 } },
          );

          const timeText = String(booking.visit_time ?? "").slice(0, 5);
          const propertyText = property?.title
            ? " لعقار " + String(property.title)
            : "";

          const recipientIds = [
            bookingUserId,
            String(office.owner_id ?? ""),
          ].filter((id, index, ids) => Boolean(id) && ids.indexOf(id) === index);

          if (recipientIds.length) {
            await notifications.insertMany(
              recipientIds.map((recipientId) => ({
                id: randomUUID(),
                _id: randomUUID(),
                user_id: recipientId,
                title: "لديك معاينة اليوم",
                body:
                  "لديك موعد معاينة اليوم الساعة " +
                  timeText +
                  propertyText +
                  ".",
                type: "viewing_booking_reminder",
                link:
                  recipientId === bookingUserId
                    ? "/bookings"
                    : "/office/requests?tab=bookings",
                is_read: false,
                created_at: new Date(),
                booking_id: booking.id,
              })),
            );
          }

          sent += 1;
        }

        return { data: sent, error: null };
      }

      if (data.name === "set_viewing_booking_status") {
        if (!userId) throw new Error("not_authenticated");

        const bookingId = String(data.args?._booking_id ?? "");
        const requestedStatus = String(data.args?._status ?? "");
        const cancelReason = String(data.args?._reason ?? "").trim();

        if (
          !bookingId ||
          !["accepted", "rejected", "completed", "cancelled"].includes(requestedStatus)
        ) {
          throw new Error("invalid_booking_status");
        }

        if (requestedStatus === "cancelled" && (cancelReason.length < 3 || cancelReason.length > 500)) {
          throw new Error("cancel_reason_required");
        }

        const bookings = await getMongoCollection<Record<string, unknown>>("viewing_bookings");
        const booking = await bookings.findOne({ id: bookingId });

        if (!booking) throw new Error("booking_not_found");

        const bookingUserId = String(booking.user_id ?? "");
        const bookingOfficeId = String(booking.office_id ?? "");
        let allowed = bookingUserId === userId;

        const offices = await getMongoCollection<Record<string, unknown>>("offices");
        const bookingOffice = bookingOfficeId
          ? await offices.findOne({
              id: bookingOfficeId,
              is_deleted: { $ne: true },
            })
          : null;
        const office = bookingOffice?.owner_id === userId ? bookingOffice : null;

        const isOfficeOwner = !!office;
        if (isOfficeOwner) allowed = true;

        if (!allowed) throw new Error("not_booking_member");

        if (bookingUserId === userId && requestedStatus !== "cancelled" && requestedStatus !== "completed") {
          throw new Error("not_allowed");
        }

        if (isOfficeOwner && requestedStatus === "cancelled") {
          // Allowed: either side can cancel an active/pending appointment.
        }

        if (
          requestedStatus === "accepted" &&
          String(booking.status ?? "") !== "pending"
        ) {
          throw new Error("booking_not_pending");
        }

        if (
          requestedStatus === "rejected" &&
          String(booking.status ?? "") !== "pending"
        ) {
          throw new Error("booking_not_pending");
        }

        if (
          requestedStatus === "completed" &&
          String(booking.status ?? "") !== "accepted"
        ) {
          throw new Error("booking_not_accepted");
        }

        if (
          requestedStatus === "cancelled" &&
          !["pending", "accepted"].includes(String(booking.status ?? ""))
        ) {
          throw new Error("booking_not_active");
        }

        if (
          requestedStatus === "completed" &&
          saudiAppointmentDateTime(
            String(booking.visit_date ?? ""),
            String(booking.visit_time ?? ""),
          ).getTime() > Date.now()
        ) {
          throw new Error("appointment_not_started");
        }

        const now = new Date();

        await bookings.updateOne(
          { id: bookingId },
          {
            $set: {
              status: requestedStatus,
              ...(requestedStatus === "cancelled"
                ? { cancel_reason: cancelReason, cancelled_at: now }
                : requestedStatus === "completed"
                  ? { completed_at: now }
                  : {}),
              updated_at: now,
            },
          },
        );

        const properties = await getMongoCollection<Record<string, unknown>>("properties");
        const property = await properties.findOne({ id: booking.property_id });
        const notifications = await getMongoCollection<Record<string, unknown>>("notifications");

        const actorLabel = isOfficeOwner ? "المكتب" : "العميل";
        const recipientId = isOfficeOwner
          ? bookingUserId
          : String(bookingOffice?.owner_id ?? "");

        const title =
          requestedStatus === "cancelled"
            ? "تم إلغاء المعاينة من " + actorLabel
            : requestedStatus === "accepted"
              ? "تم قبول حجز المعاينة"
              : requestedStatus === "rejected"
                ? "تم رفض حجز المعاينة"
                : "المعاينة انتهت";

        const baseBody =
          (property?.title ? String(property.title) + " · " : "") +
          "الساعة " +
          String(booking.visit_time ?? "").slice(0, 5);

        const body =
          requestedStatus === "cancelled"
            ? baseBody + " · السبب: " + cancelReason
            : requestedStatus === "completed"
              ? baseBody + " · تم تسجيل المعاينة كمنتهية."
              : baseBody;

        const allRecipients = [
          userId,
          recipientId,
        ].filter((id, index, ids) => Boolean(id) && ids.indexOf(id) === index);

        if (allRecipients.length) {
          await notifications.insertMany(
            allRecipients.map((recipient) => ({
              id: randomUUID(),
              _id: randomUUID(),
              user_id: recipient,
              title,
              body,
              type: "viewing_booking",
              link:
                recipient === bookingUserId
                  ? "/bookings"
                  : "/office/requests?tab=bookings",
              is_read: false,
              created_at: now,
              booking_id: booking.id,
              cancel_reason:
                requestedStatus === "cancelled" ? cancelReason : null,
            })),
          );
        }

        return { data: requestedStatus, error: null };
      }

      if (data.name === "notify_new_property_inquiry") {
        if (!userId) throw new Error("not_authenticated");
        if (role !== "individual") throw new Error("not_individual");

        const inquiryId = String(data.args?._inquiry_id ?? "");
        const inquiries = await getMongoCollection<Record<string, unknown>>(
          "property_inquiries",
        );
        const inquiry = await inquiries.findOne({
          id: inquiryId,
          user_id: userId,
        });

        if (!inquiry) throw new Error("inquiry_not_found");

        const offices = await getMongoCollection<Record<string, unknown>>("offices");
        const office = await offices.findOne({
          id: inquiry.office_id,
          is_deleted: { $ne: true },
        });

        if (!office || typeof office.owner_id !== "string") {
          throw new Error("office_not_found");
        }

        const properties = await getMongoCollection<Record<string, unknown>>("properties");
        const property = await properties.findOne({ id: inquiry.property_id });

        const typeLabel: Record<string, string> = {
          viewing: "معاينة",
          buy: "شراء",
          rent: "استئجار",
          question: "استفسار",
        };

        await getMongoCollection<Record<string, unknown>>("notifications").insertOne({
          id: randomUUID(),
          _id: randomUUID(),
          user_id: office.owner_id,
          title: "شخص يريد التواصل معك",
          body:
            String(inquiry.contact_name ?? "عميل") +
            " يريد التواصل معك بخصوص " +
            String(typeLabel[String(inquiry.type ?? "")] ?? "تواصل") +
            " على " +
            String(property?.title ?? "عقار") +
            (inquiry.message
              ? " · " + String(inquiry.message).slice(0, 140)
              : ""),
          type: "property_inquiry",
          link: "/office/requests?tab=inbox",
          is_read: false,
          created_at: new Date(),
        });

        return { data: null, error: null };
      }

      if (data.name === "send_chat_message") {
        if (!userId) throw new Error("not_authenticated");

        const args = data.args ?? {};
        const conversationId = String(args._conversation_id ?? "");
        const body = String(args._body ?? "").trim();
        const imageUrl =
          args._image_url == null ? null : String(args._image_url).trim() || null;

        if (!conversationId) throw new Error("conversation_not_found");
        if (!body && !imageUrl) throw new Error("message_empty");
        if (body.length > 5000) throw new Error("message_too_long");

        const conversations = await getMongoCollection<Record<string, unknown>>(
          "conversations",
        );
        const conversation = await conversations.findOne({ id: conversationId });

        if (!conversation) throw new Error("conversation_not_found");

        const clientId = String(conversation.user_id ?? "");
        const officeId = String(conversation.office_id ?? "");

        if (!clientId || !officeId) throw new Error("conversation_invalid");

        const offices = await getMongoCollection<Record<string, unknown>>("offices");
        const office = await offices.findOne({
          id: officeId,
          is_deleted: { $ne: true },
        });

        if (!office || String(office.owner_id ?? "") !== userId && userId !== clientId) {
          throw new Error("not_conversation_member");
        }

        const expiresAt = office.plan_expires_at
          ? new Date(String(office.plan_expires_at))
          : null;
        const chatEnabled =
          office.plan === "pro" &&
          (!expiresAt || expiresAt.getTime() > Date.now());

        if (!chatEnabled) throw new Error("chat_not_available");

        const blocks = await getMongoCollection<Record<string, unknown>>(
          "conversation_blocks",
        );
        const blockRows = await blocks
          .find({ conversation_id: conversationId })
          .toArray();

        if (blockRows.length) throw new Error("CHAT_BLOCKED");

        const messageId = randomUUID();
        const now = new Date();

        await getMongoCollection<Record<string, unknown>>("messages").insertOne({
          id: messageId,
          _id: messageId,
          conversation_id: conversationId,
          sender_id: userId,
          body: body || null,
          image_url: imageUrl,
          created_at: now,
          updated_at: now,
        });

        await conversations.updateOne(
          { id: conversationId },
          { $set: { updated_at: now } },
        );

        const recipientId = userId === clientId
          ? String(office.owner_id ?? "")
          : clientId;

        if (recipientId && recipientId !== userId) {
          const profiles = await getMongoCollection<Record<string, unknown>>("profiles");
          const profile = userId === clientId
            ? await profiles.findOne({ id: clientId })
            : null;

          const senderName =
            userId === clientId
              ? String(profile?.full_name ?? "عميل")
              : String(office.name ?? "مكتب عقاري");

          await getMongoCollection<Record<string, unknown>>("notifications").insertOne({
            id: randomUUID(),
            _id: randomUUID(),
            user_id: recipientId,
            title: userId === clientId
              ? "رسالة جديدة من العميل"
              : "رسالة جديدة من المكتب",
            body:
              senderName +
              " أرسل لك رسالة جديدة" +
              (body ? ": " + body.slice(0, 140) : " تحتوي على صورة"),
            type: "chat_message",
            link: userId === clientId
              ? "/office/chat?c=" + encodeURIComponent(conversationId)
              : "/chats?c=" + encodeURIComponent(conversationId),
            is_read: false,
            created_at: now,
          });
        }

        return {
          data: {
            id: messageId,
            conversation_id: conversationId,
            sender_id: userId,
            body: body || null,
            image_url: imageUrl,
            created_at: now,
            read_at: null,
          },
          error: null,
        };
      }

      if (data.name === "set_office_offer_status") {
        if (!userId || role !== "office") throw new Error("not_office_member");

        const offerId = String(data.args?._offer_id ?? "");
        const requestedStatus = String(data.args?._status ?? "");

        if (!offerId || !["completed", "deleted"].includes(requestedStatus)) {
          throw new Error("invalid_offer_status");
        }

        const offices = await getMongoCollection<Record<string, unknown>>("offices");
        const office = await offices.findOne({
          owner_id: userId,
          is_deleted: { $ne: true },
        });
        if (!office) throw new Error("office_not_found");

        const offers = await getMongoCollection<Record<string, unknown>>("office_offers");
        const offer = await offers.findOne({
          id: offerId,
          office_id: office.id,
        });
        if (!offer) throw new Error("offer_not_found");

        const requestId = String(offer.request_id ?? "");
        const requests = await getMongoCollection<Record<string, unknown>>("property_requests");
        const request = requestId
          ? await requests.findOne({ id: requestId })
          : null;

        if (requestedStatus === "deleted") {
          await offers.deleteOne({ id: offerId, office_id: office.id });
          return { data: "deleted", error: null };
        }

        if (!request) throw new Error("request_not_found");
        if (request.status !== "active") throw new Error("request_not_active");

        const now = new Date();

        await offers.updateOne(
          { id: offerId, office_id: office.id },
          {
            $set: {
              status: "completed",
              completed_at: now,
              updated_at: now,
            },
          },
        );

        await requests.updateOne(
          { id: requestId, status: "active" },
          {
            $set: {
              status: "fulfilled",
              fulfilled_at: now,
              updated_at: now,
            },
          },
        );

        const ownerId = String(request.user_id ?? "");
        if (ownerId && ownerId !== userId) {
          await getMongoCollection<Record<string, unknown>>("notifications").insertOne({
            id: randomUUID(),
            _id: randomUUID(),
            user_id: ownerId,
            title: "تم إكمال الطلب العقاري",
            body:
              String(office.name ?? "المكتب العقاري") +
              " حدّد الطلب الذي رد عليه كمكتمل، ولم يعد ظاهرًا في سوق الطلبات.",
            type: "property_request",
            link: "/requests?tab=sent&request=" + encodeURIComponent(requestId),
            is_read: false,
            created_at: now,
          });
        }

        return { data: "completed", error: null };
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

        const properties = await getMongoCollection<Record<string, unknown>>(
          "properties",
        );
        const property = offer.property_id
          ? await properties.findOne({ id: offer.property_id })
          : null;

        const priceText =
          offer.price != null
            ? " · السعر " + String(offer.price) + " ريال"
            : "";

        await getMongoCollection<Record<string, unknown>>(
          "notifications",
        ).insertOne({
          id: randomUUID(),
          _id: randomUUID(),
          user_id: request.user_id,
          title: "مكتب يريد التواصل معك",
          body:
            String(office.name ?? "مكتب عقاري") +
            " أرسل لك عرضًا جديدًا على طلبك العقاري" +
            (property?.title ? " · " + String(property.title) : "") +
            priceText +
            (offer.message ? " · " + String(offer.message).slice(0, 160) : ""),
          type: "property_offer",
          link: "/requests?tab=received&request=" + encodeURIComponent(String(request.id)),
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

      if (data.name === "submit_office_review") {
        if (!userId) throw new Error("not_authenticated");
        if (role !== "individual") throw new Error("not_individual");

        const officeId = String(data.args?._office_id ?? "");
        const rating = Number(data.args?._rating ?? 0);
        const comment =
          data.args?._comment == null
            ? null
            : String(data.args._comment).trim() || null;

        if (!officeId) throw new Error("office_not_found");
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
          throw new Error("invalid_rating");
        }

        const offices = await getMongoCollection<Record<string, unknown>>("offices");
        const office = await offices.findOne({
          id: officeId,
          is_deleted: { $ne: true },
        });

        if (!office) throw new Error("office_not_found");

        if (office.owner_id === userId) {
          throw new Error("cannot_review_own_office");
        }

        const reviews = await getMongoCollection<Record<string, unknown>>(
          "office_reviews",
        );

        const existingReviews = await reviews
          .find({
            office_id: officeId,
            user_id: userId,
          })
          .sort({ created_at: -1 })
          .toArray();

        const now = new Date();
        const existing = existingReviews[0];

        if (existing) {
          await reviews.updateOne(
            { _id: existing._id },
            {
              $set: {
                rating,
                comment,
                updated_at: now,
              },
            },
          );

          if (existingReviews.length > 1) {
            await reviews.deleteMany({
              _id: {
                $in: existingReviews.slice(1).map((row) => row._id),
              },
            });
          }
        } else {
          const id = randomUUID();

          await reviews.insertOne({
            id,
            _id: id,
            office_id: officeId,
            user_id: userId,
            rating,
            comment,
            created_at: now,
            updated_at: now,
          });
        }

        const allReviews = await reviews
          .find({ office_id: officeId })
          .project({ rating: 1 })
          .toArray();

        const count = allReviews.length;
        const average = count
          ? Math.round(
              (allReviews.reduce(
                (sum, item) => sum + Number(item.rating ?? 0),
                0,
              ) /
                count) *
                10,
            ) / 10
          : 0;

        await offices.updateOne(
          { id: officeId },
          {
            $set: {
              rating_avg: average,
              reviews_count: count,
              updated_at: now,
            },
          },
        );

        return {
          data: {
            rating,
            comment,
            rating_avg: average,
            reviews_count: count,
          },
          error: null,
        };
      }

      if (data.name === "toggle_office_follow") {
        if (!userId) throw new Error("not_authenticated");

        const officeId = String(data.args?._office_id ?? "");
        const following = Boolean(data.args?._following);

        if (!officeId) throw new Error("office_not_found");

        const offices = await getMongoCollection<Record<string, unknown>>("offices");
        const office = await offices.findOne({
          id: officeId,
          is_deleted: { $ne: true },
        });

        if (!office) throw new Error("office_not_found");

        const follows = await getMongoCollection<Record<string, unknown>>("follows");
        const existing = await follows
          .find({
            office_id: officeId,
            user_id: userId,
          })
          .sort({ created_at: 1 })
          .toArray();

        if (following) {
          if (existing.length > 1) {
            await follows.deleteMany({
              _id: { $in: existing.slice(1).map((row) => row._id) },
            });
          }

          if (existing.length === 0) {
            const id = randomUUID();

            await follows.insertOne({
              id,
              _id: id,
              office_id: officeId,
              user_id: userId,
              notify: false,
              created_at: new Date(),
              updated_at: new Date(),
            });
          }
        } else if (existing.length) {
          await follows.deleteMany({
            _id: { $in: existing.map((row) => row._id) },
          });
        }

        return { data: { following }, error: null };
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
  .validator((value: unknown) => value as {
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
  .validator((value: unknown) => value as { email: string; token: string })
  .handler(({ data }) => verifyEmailCode(data.email, data.token));

export const authResend = createServerFn({ method: "POST" })
  .validator((value: unknown) => value as { email: string })
  .handler(({ data }) => resendVerification(data.email));

export const authSignIn = createServerFn({ method: "POST" })
  .validator((value: unknown) => value as { email: string; password: string })
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
  .validator((value: unknown) => value as { password?: string; email?: string })
  .handler(async ({ data }) => ({ data: await updateCurrentUser(data), error: null }));

export const authResetPasswordForEmail = createServerFn({ method: "POST" })
  .validator((value: unknown) => value as { email: string; origin: string })
  .handler(async ({ data }) => ({ data: await requestPasswordReset(data.email, data.origin), error: null }));

export const authResetPassword = createServerFn({ method: "POST" })
  .validator((value: unknown) => value as { email: string; token: string; password: string })
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
  .validator((value: unknown) => value as { path: string })
  .handler(async ({ data }) => {
    await deleteMedia(data.path);
    return { data: null, error: null };
  });
