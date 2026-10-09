
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
  appointment_ended: "انتهى موعد المعاينة",
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

        if (related && relation.collection === "offices") {
          const relatedId = String(related.id ?? related._id ?? "");
          const offers = await getMongoCollection<Record<string, unknown>>(
            "office_offers",
          );
          const packages = await getMongoCollection<Record<string, unknown>>(
            "package_catalog",
          );

          const completedOffers = await offers
            .find({
              office_id: relatedId,
              status: "completed",
            })
            .project({ request_id: 1 })
            .toArray();

          related.completed_requests_count = new Set(
            completedOffers
              .map((row) => String(row.request_id ?? ""))
              .filter(Boolean),
          ).size;

          const packageRow = related.package_id
            ? await packages.findOne({ id: String(related.package_id) })
            : null;

          const packageIsPro =
            String(packageRow?.code ?? "") === "pro" ||
            Number(packageRow?.price ?? 0) > 0;

          const packageExpired =
            !!related.plan_expires_at &&
            new Date(String(related.plan_expires_at)).getTime() <= Date.now();

          const isProCurrent = packageRow
            ? packageIsPro && !packageExpired
            : related.plan === "pro" && !packageExpired;

          related.is_pro_current = isProCurrent;
          related.verification_badge =
            isProCurrent && Number(related.completed_requests_count ?? 0) >= 10;
        }

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


function getRequestAttachmentUrl(request: Record<string, unknown>): string | null {
  const candidates: unknown[] = [
    request.attachment_url,
    request.image_url,
    request.photo_url,
    request.image,
    Array.isArray(request.images) ? request.images[0] : null,
    Array.isArray(request.attachments) ? request.attachments[0] : null,
  ];

  for (const candidate of candidates) {
    let value: unknown = candidate;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const record = value as Record<string, unknown>;
      value = record.url ?? record.publicUrl ?? record.public_url ?? record.src ?? record.path;
    }
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    if (
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://") ||
      trimmed.startsWith("//") ||
      trimmed.startsWith("/")
    ) return trimmed;
    if (trimmed.toLowerCase().startsWith("api/media/")) return "/" + trimmed;
    if (/^[a-f0-9]{24}$/i.test(trimmed)) {
      return "/api/media/" + encodeURIComponent(trimmed);
    }
    return trimmed;
  }

  return null;
}

const FREE_OFFICE_PROPERTY_LIMIT = 5;

async function enforceOfficePropertyLimit(
  userId: string | null,
  role: string | null,
  docs: Record<string, unknown>[],
) {
  if (role === "admin") return;
  if (role !== "office" || !userId) {
    throw new Error("فقط المكتب العقاري يمكنه إضافة العقارات.");
  }

  const offices = await getMongoCollection<Record<string, unknown>>("offices");
  const office = await offices.findOne({
    owner_id: userId,
    is_deleted: { $ne: true },
  });
  if (!office) throw new Error("office_not_found");

  const officeId = String(office.id ?? "");
  if (!officeId) throw new Error("office_not_found");
  for (const doc of docs) doc.office_id = officeId;

  const packages = await getMongoCollection<Record<string, unknown>>("package_catalog");
  const packageId = String(office.package_id ?? "");
  const packageRow = packageId
    ? await packages.findOne({ id: packageId })
    : null;
  const now = Date.now();
  const expiresAt = office.plan_expires_at
    ? new Date(String(office.plan_expires_at)).getTime()
    : null;
  const expired = expiresAt != null && Number.isFinite(expiresAt) && expiresAt <= now;
  const packageIsPro = packageRow
    ? String(packageRow.code ?? "") === "pro" || Number(packageRow.price ?? 0) > 0
    : office.plan === "pro";
  const isProCurrent = packageIsPro && !expired;

  const propertyLimit = expired
    ? FREE_OFFICE_PROPERTY_LIMIT
    : packageRow?.property_limit == null
      ? (isProCurrent ? null : FREE_OFFICE_PROPERTY_LIMIT)
      : Number(packageRow.property_limit);

  if (propertyLimit == null) return;
  if (!Number.isFinite(propertyLimit) || propertyLimit < 0) {
    throw new Error("property_limit_configuration_invalid");
  }

  const properties = await getMongoCollection<Record<string, unknown>>("properties");
  const currentCount = await properties.countDocuments({
    office_id: officeId,
    is_deleted: { $ne: true },
  });
  const newCount = docs.filter((doc) => doc.is_deleted !== true).length;
  if (currentCount + newCount > propertyLimit) {
    throw new Error("property_limit:" + String(propertyLimit));
  }
}

async function runDb(input: DbInput) {
  const { userId, role } = await authorize(input);

  if (
    input.collection === "office_offers" &&
    ["update", "upsert", "delete"].includes(input.operation)
  ) {
    throw new Error("تعديل حالة العرض أو إنهاؤه يجب أن يتم من خلال إجراءات العرض المخصصة.");
  }

  if (input.collection === "property_inquiries" &&
      ["update", "upsert", "delete"].includes(input.operation) &&
      role !== "admin") {
    throw new Error("قبول أو رفض طلب التواصل يجب أن يتم من الإجراء المخصص.");
  }

  if (input.collection === "property_requests") {
    if (input.operation === "update") {
      const payload = (input.payload ?? {}) as Record<string, unknown>;
      if (
        role !== "admin" &&
        Object.prototype.hasOwnProperty.call(payload, "status")
      ) {
        throw new Error("تغيير حالة الطلب يجب أن يتم من خلال الإجراء المخصص لصاحب الطلب.");
      }
      if (role !== "admin") {
        if (role !== "individual" || !userId) {
          throw new Error("فقط صاحب الطلب يمكنه تعديله.");
        }
        input.filters = [
          ...(input.filters ?? []),
          { field: "user_id", op: "eq", value: userId },
        ];
      }
    } else if (input.operation === "delete" || input.operation === "upsert") {
      if (role !== "admin") {
        throw new Error("استخدم إجراءات الطلب المخصصة لإلغاء الطلب أو تعديله.");
      }
    }
  }

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

  // Legacy viewing bookings may have no status field. Treat them as pending
  // in queries that request pending appointments, so both sides can still see them.
  const legacyPendingStatusFilter =
    input.collection === "viewing_bookings" && input.operation === "select"
      ? filters.find(
          (filter) =>
            filter.field === "status" &&
            filter.op === "in" &&
            Array.isArray(filter.value) &&
            filter.value.includes("pending"),
        )
      : undefined;
  const queryFilters = legacyPendingStatusFilter
    ? filters.filter((filter) => filter !== legacyPendingStatusFilter)
    : filters;
  const base = buildFilter(queryFilters);
  const orFilter = parseOr(input.or);
  const pendingStatusValues =
    legacyPendingStatusFilter && Array.isArray(legacyPendingStatusFilter.value)
      ? legacyPendingStatusFilter.value
      : [];
  const legacyPendingStatusClause: Record<string, unknown> | null =
    legacyPendingStatusFilter
      ? {
          $or: [
            { status: { $in: pendingStatusValues } },
            { status: { $exists: false } },
            { status: null },
            { status: "" },
          ],
        }
      : null;
  const queryParts: Record<string, unknown>[] = [base];
  if (legacyPendingStatusClause) queryParts.push(legacyPendingStatusClause);
  if (orFilter) queryParts.push(orFilter);
  const mongoQuery: Record<string, unknown> =
    queryParts.length > 1 ? { $and: queryParts } : queryParts[0] ?? {};

  if (input.operation === "select") {
    let cursor = collection.find(mongoQuery);

    for (const order of input.orders ?? []) {
      cursor = cursor.sort(order.field, order.ascending ? 1 : -1);
    }

    if (input.offset && input.offset > 0) cursor = cursor.skip(input.offset);
    if (input.limit != null) cursor = cursor.limit(Math.max(0, input.limit));

    const rows = await cursor.toArray();
    if (input.collection === "viewing_bookings") {
      for (const row of rows) {
        if (!String(row.status ?? "").trim()) row.status = "pending";
      }
    }
    const count = input.count ? await collection.countDocuments(mongoQuery) : null;

    if (input.head) return { data: null, count, error: null };

    if (input.collection === "offices") {
      const offers = await getMongoCollection<Record<string, unknown>>("office_offers");
      const packages = await getMongoCollection<Record<string, unknown>>("package_catalog");

      await Promise.all(
        rows.map(async (office) => {
          const officeId = String(office.id ?? office._id ?? "");
          if (!officeId) return;

          const completedOffers = await offers
            .find({
              office_id: officeId,
              status: "completed",
            })
            .project({ request_id: 1 })
            .toArray();

          office.completed_requests_count = new Set(
            completedOffers
              .map((row) => String(row.request_id ?? ""))
              .filter(Boolean),
          ).size;

          const packageRow = office.package_id
            ? await packages.findOne({ id: String(office.package_id) })
            : null;

          const packageIsPro =
            String(packageRow?.code ?? "") === "pro" ||
            Number(packageRow?.price ?? 0) > 0;

          const packageExpired =
            !!office.plan_expires_at &&
            new Date(String(office.plan_expires_at)).getTime() <= Date.now();

          const isProCurrent = packageRow
            ? packageIsPro && !packageExpired
            : office.plan === "pro" && !packageExpired;

          office.is_pro_current = isProCurrent;
          office.verification_badge =
            isProCurrent && Number(office.completed_requests_count ?? 0) >= 10;
        })
      );
    }

    if (input.collection === "properties") {
      const favorites = await getMongoCollection<Record<string, unknown>>("favorites");
      await Promise.all(
        rows.map(async (property) => {
          const propertyId = String(property.id ?? property._id ?? "");
          if (!propertyId) return;

          property.favorites_count = await favorites.countDocuments({
            property_id: propertyId,
          });
        }),
      );
    }

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

    if (input.collection === "properties") {
      await enforceOfficePropertyLimit(userId, role, docs);
    }

    if (input.collection === "office_offers") {
      if (!userId || role !== "office") {
        throw new Error("فقط المكتب يمكنه إرسال عرض.");
      }

      const offices = await getMongoCollection<Record<string, unknown>>("offices");
      const ownOffice = await offices.findOne({ owner_id: userId, is_deleted: { $ne: true } });
      if (!ownOffice) throw new Error("office_not_found");

      const requests = await getMongoCollection<Record<string, unknown>>("property_requests");
      for (const doc of docs) {
        const requestId = String(doc.request_id ?? "");
        if (!requestId) throw new Error("request_not_found");

        const request = await requests.findOne({ id: requestId, status: "active" });
        if (!request) throw new Error("request_not_active");
        if (String(request.user_id ?? "") === userId) {
          throw new Error("cannot_offer_on_own_request");
        }
        if (request.accepted_offer_id || request.accepted_office_id) {
          throw new Error("request_not_available_for_offers");
        }
        const previousOffer = await collection.findOne({
          request_id: requestId,
          office_id: String(ownOffice.id),
        });
        if (previousOffer) throw new Error("offer_already_submitted");

        const message = String(doc.message ?? "").trim();
        if (message.length < 5 || message.length > 5000) {
          throw new Error("اكتب تفاصيل العرض (5 أحرف على الأقل).");
        }

        const price = doc.price == null || String(doc.price).trim() === "" ? null : Number(doc.price);
        if (price != null && (!Number.isFinite(price) || price < 0)) {
          throw new Error("السعر المقترح غير صالح.");
        }

        doc.office_id = String(ownOffice.id);
        doc.message = message;
        doc.price = price;
        doc.status = "sent";
      }
    }

    if (
      userId &&
      (input.collection === "property_inquiries" ||
        input.collection === "viewing_bookings")
    ) {
      for (const doc of docs) {
        if (role !== "individual") {
          throw new Error("not_individual");
        }

        // Never trust a client-supplied owner id for individual-only submissions.
        doc.user_id = userId;

        if (input.collection === "property_inquiries") {
          const propertyId = String(doc.property_id ?? "");
          const inquiryType = String(doc.type ?? "");

          if (!propertyId || !inquiryType) {
            throw new Error("inquiry_invalid");
          }

          doc.status ??= "new";

          const existing = await collection.findOne({
            user_id: userId,
            property_id: propertyId,
            type: inquiryType,
            status: { $nin: ["completed", "closed"] },
          });

          if (existing) {
            throw new Error("سبق وأرسلت هذا الطلب لهذا العقار.");
          }
        } else {
          const propertyId = String(doc.property_id ?? "");
          const visitDate = String(doc.visit_date ?? "");
          const visitTime = String(doc.visit_time ?? "").slice(0, 5);

          if (!propertyId || !visitDate || !visitTime) {
            throw new Error("booking_invalid");
          }

          const existing = await collection.findOne({
            user_id: userId,
            property_id: propertyId,
            visit_date: visitDate,
            visit_time: visitTime,
            status: { $nin: ["rejected", "cancelled", "completed"] },
          });

          if (existing) {
            throw new Error("يوجد لديك بالفعل حجز معاينة لنفس الموعد على هذا العقار.");
          }
        }
      }
    }

    if (input.collection === "viewing_bookings") {
      for (const doc of docs) {
        doc.status ??= "pending";
      }
    }

    if (input.collection === "property_views") {
      if (role !== "individual") {
        throw new Error("not_individual");
      }

      const properties = await getMongoCollection<Record<string, unknown>>("properties");
      for (const doc of docs) {
        const propertyId = String(doc.property_id ?? "");
        if (!propertyId) throw new Error("property_view_invalid");

        const property = await properties.findOne({
          id: propertyId,
          is_deleted: { $ne: true },
        });
        if (!property) throw new Error("property_not_found");
      }
    }

    if (input.collection === "favorites") {
      if (!userId) throw new Error("يجب تسجيل الدخول لحفظ العقار.");
      if (role !== "individual") throw new Error("not_individual");

      const properties = await getMongoCollection<Record<string, unknown>>("properties");
      for (const doc of docs) {
        const propertyId = String(doc.property_id ?? "");
        if (!propertyId) throw new Error("favorite_invalid");

        const property = await properties.findOne({
          id: propertyId,
          is_deleted: { $ne: true },
        });
        if (!property) throw new Error("property_not_found");

        doc.user_id = userId;
        const existing = await collection.findOne({
          property_id: propertyId,
          user_id: userId,
        });

        if (existing) {
          throw new Error("العقار موجود بالفعل في المفضلة.");
        }
      }
    }

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

    if (input.collection === "property_views") {
      const properties = await getMongoCollection<Record<string, unknown>>("properties");
      await Promise.all(
        docs.map((doc) =>
          properties.updateOne(
            { id: String(doc.property_id) },
            {
              $inc: { views_count: 1 },
              $set: { updated_at: new Date() },
            },
          ),
        ),
      );
    }

    if (input.collection === "favorites") {
      const properties = await getMongoCollection<Record<string, unknown>>("properties");
      await Promise.all(
        [...new Set(docs.map((doc) => String(doc.property_id ?? "")).filter(Boolean))].map(
          async (propertyId) => {
            const count = await collection.countDocuments({ property_id: propertyId });
            await properties.updateOne(
              { id: propertyId },
              {
                $set: {
                  favorites_count: count,
                  updated_at: new Date(),
                },
              },
            );
          },
        ),
      );
    }


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
    if (input.collection === "properties" && role !== "admin") {
      throw new Error("إضافة العقار يجب أن تتم من خلال نموذج إضافة العرض.");
    }
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
    let affectedPropertyIds: string[] = [];

    if (input.collection === "favorites") {
      if (role !== "individual") throw new Error("not_individual");
      const matching = await collection
        .find(mongoQuery)
        .project({ property_id: 1 })
        .toArray();
      affectedPropertyIds = [
        ...new Set(
          matching
            .map((row) => String(row.property_id ?? ""))
            .filter(Boolean),
        ),
      ];
    }

    const result = await collection.deleteMany(mongoQuery);

    if (input.collection === "favorites" && result.deletedCount > 0) {
      const properties = await getMongoCollection<Record<string, unknown>>("properties");
      await Promise.all(
        affectedPropertyIds.map(async (propertyId) => {
          const count = await collection.countDocuments({ property_id: propertyId });
          await properties.updateOne(
            { id: propertyId },
            {
              $set: {
                favorites_count: count,
                updated_at: new Date(),
              },
            },
          );
        }),
      );
    }

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
              avatar_url: args._avatar_url ?? null,
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
                logo_url: args._avatar_url ?? null,
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
        const durationDays = Number(args._duration_days ?? 7);

        if (description.length < 10) {
          throw new Error("description_required");
        }
        if (durationDays !== 7 && durationDays !== 30) {
          throw new Error("request_duration_invalid");
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
          duration_days: durationDays,
          expires_at: new Date(Date.now() + durationDays * 86_400_000),
          status: "active",
          views_count: 0,
          created_at: new Date(),
          updated_at: new Date(),
        });

        return { data: id, error: null };
      }


      if (data.name === "individual_end_property_request") {
        if (!userId || role !== "individual") throw new Error("not_individual");
        const requestId = String(data.args?._request_id ?? "");
        const reason = String(data.args?._reason ?? "").trim().slice(0, 3000);
        if (!requestId) throw new Error("request_not_found");
        const requests = await getMongoCollection<Record<string, unknown>>("property_requests");
        const request = await requests.findOne({ id: requestId, user_id: userId, status: "active" });
        if (!request) throw new Error("request_not_active");
        const now = new Date();
        const offers = await getMongoCollection<Record<string, unknown>>("office_offers");
        const allOffers = await offers.find({ request_id: requestId }).project({ office_id: 1, status: 1 }).toArray();
        const changed = await requests.updateOne(
          { id: requestId, user_id: userId, status: "active" },
          { $set: { status: "ended", end_reason: reason || null, ended_by_user_id: userId, ended_at: now, updated_at: now } },
        );
        if (!changed.modifiedCount) throw new Error("request_not_active");
        await offers.updateMany(
          { request_id: requestId, status: { $in: ["sent", "accepted", "awaiting_confirmation"] } },
          { $set: { status: "ended", ended_at: now, ended_by_user_id: userId, end_reason: reason || null, updated_at: now } },
        );
        const profile = await getMongoCollection<Record<string, unknown>>("profiles")
          .then((profiles) => profiles.findOne({ id: userId }, { projection: { full_name: 1 } }));
        const clientName = String(profile?.full_name ?? "العميل");
        const assignedOfficeId = String(request.accepted_office_id ?? "");
        const officeIds = [...new Set(
          (assignedOfficeId ? [assignedOfficeId] : allOffers.map((offer) => String(offer.office_id ?? "")))
            .filter(Boolean),
        )];
        const offices = await getMongoCollection<Record<string, unknown>>("offices");
        const officeRows = officeIds.length
          ? await offices.find({ id: { $in: officeIds } }).project({ id: 1, owner_id: 1 }).toArray()
          : [];
        const notifications = await getMongoCollection<Record<string, unknown>>("notifications");
        for (const officeRow of officeRows) {
          const recipientId = String(officeRow.owner_id ?? "");
          if (!recipientId) continue;
          await notifications.insertOne({
            id: randomUUID(),
            _id: randomUUID(),
            user_id: recipientId,
            title: "تم إنهاء الطلب بواسطة " + clientName,
            body: "أنهى العميل " + clientName + " الطلب العقاري." +
              (reason ? " السبب: " + reason : " لم يذكر العميل سببًا."),
            type: "property_request_ended",
            link: "/office/requests?tab=sent",
            is_read: false,
            created_at: now,
          });
        }
        return { data: { status: "ended", reason: reason || null }, error: null };
      }

      if (
        data.name === "set_my_property_request_status" ||
        data.name === "set_property_request_status"
      ) {
        if (!userId) throw new Error("not_authenticated");
        if (role !== "individual" && role !== "admin") {
          throw new Error("only_request_owner_can_change_status");
        }

        const requestId = String(data.args?._request_id ?? "");
        const requestedStatus = String(data.args?._status ?? "");

        if (!requestId || !["cancelled", "fulfilled"].includes(requestedStatus)) {
          throw new Error("invalid_request_status");
        }

        const requests = await getMongoCollection<Record<string, unknown>>("property_requests");
        const request = await requests.findOne({ id: requestId });
        if (!request) throw new Error("request_not_found");

        const ownerId = String(request.user_id ?? "");
        if (role !== "admin" && ownerId !== userId) {
          throw new Error("not_request_owner");
        }
        if (request.status !== "active") throw new Error("request_not_active");

        const offers = await getMongoCollection<Record<string, unknown>>("office_offers");

        if (requestedStatus === "fulfilled") {
          const offerAwaitingConfirmation = await offers.findOne({
            request_id: requestId,
            status: { $in: ["accepted", "awaiting_confirmation"] },
          });
          if (offerAwaitingConfirmation) {
            throw new Error("offer_completion_confirmation_required");
          }
        }

        const now = new Date();
        const update = await requests.updateOne(
          { id: requestId, status: "active", ...(role === "admin" ? {} : { user_id: userId }) },
          {
            $set: {
              status: requestedStatus,
              updated_at: now,
              ...(requestedStatus === "fulfilled" ? { fulfilled_at: now } : {}),
              ...(requestedStatus === "cancelled" ? { cancelled_at: now } : {}),
            },
          },
        );

        if (!update.modifiedCount) throw new Error("request_not_active");

        // Once the customer closes their request, remaining offers are ended,
        // not reported as completed because no transaction confirmation exists.
        const changedOffers = await offers
          .find({
            request_id: requestId,
            status: { $in: ["sent", "accepted", "awaiting_confirmation"] },
          })
          .project({ office_id: 1 })
          .toArray();

        await offers.updateMany(
          {
            request_id: requestId,
            status: { $in: ["sent", "accepted", "awaiting_confirmation"] },
          },
          { $set: { status: "ended", ended_at: now, updated_at: now } },
        );

        const officeIds = [
          ...new Set(
            changedOffers
              .map((offer) => String(offer.office_id ?? ""))
              .filter(Boolean),
          ),
        ];
        const offices = await getMongoCollection<Record<string, unknown>>("offices");
        const affectedOffices = officeIds.length
          ? await offices.find({ id: { $in: officeIds } }).project({ id: 1, owner_id: 1 }).toArray()
          : [];
        const notifications = await getMongoCollection<Record<string, unknown>>("notifications");
        const recipients = [
          ...new Set(
            affectedOffices
              .map((office) => String(office.owner_id ?? ""))
              .filter((id) => id && id !== userId),
          ),
        ];

        if (recipients.length) {
          await notifications.insertMany(
            recipients.map((recipientId) => ({
              id: randomUUID(),
              _id: randomUUID(),
              user_id: recipientId,
              title: requestedStatus === "fulfilled" ? "أغلق العميل الطلب كمكتمل" : "ألغى العميل طلبه",
              body: requestedStatus === "fulfilled"
                ? "أغلق العميل الطلب. انتهت العروض المفتوحة دون تسجيلها كصفقات مكتملة."
                : "ألغى العميل الطلب. انتهت العروض المفتوحة المرتبطة به.",
              type: "property_request",
              link: "/office/requests?tab=sent",
              is_read: false,
              created_at: now,
            })),
          );
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
            accepted_offer_id: { $in: [null, ""] },
            accepted_office_id: { $in: [null, ""] },
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
              attachment_url: getRequestAttachmentUrl(request),
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


      if (data.name === "office_property_request_history") {
        if (!userId || role !== "office") throw new Error("not_office_member");
        const office = await getMongoCollection<Record<string, unknown>>("offices")
          .then((offices) => offices.findOne({ owner_id: userId, is_deleted: { $ne: true } }));
        if (!office) throw new Error("office_not_found");
        const officeId = String(office.id ?? "");
        const offersCollection = await getMongoCollection<Record<string, unknown>>("office_offers");
        const requestsCollection = await getMongoCollection<Record<string, unknown>>("property_requests");
        const [offerRows, officePropertyRows] = await Promise.all([
          offersCollection.find({ office_id: officeId }).sort({ updated_at: -1, created_at: -1 }).limit(300).toArray(),
          getMongoCollection<Record<string, unknown>>("properties")
            .then((properties) => properties.find({ office_id: officeId }).project({ id: 1, title: 1 }).toArray()),
        ]);

        const requestIds = [...new Set(offerRows.map((offer) => String(offer.request_id ?? "")).filter(Boolean))];
        const requestRows = requestIds.length
          ? await requestsCollection.find({ id: { $in: requestIds } }).toArray()
          : [];
        const requestById = new Map(requestRows.map((request) => [String(request.id ?? ""), request]));
        const userIds = [...new Set(requestRows.map((request) => String(request.user_id ?? "")).filter(Boolean))];
        const propertyIds = [...new Set(offerRows.map((offer) => String(offer.property_id ?? "")).filter(Boolean))];
        const [profiles, properties] = await Promise.all([
          userIds.length
            ? getMongoCollection<Record<string, unknown>>("profiles")
                .then((collection) => collection.find({ id: { $in: userIds } }).project({ id: 1, full_name: 1 }).toArray())
            : Promise.resolve([]),
          propertyIds.length
            ? getMongoCollection<Record<string, unknown>>("properties")
                .then((collection) => collection.find({ id: { $in: propertyIds } }).project({ id: 1, title: 1 }).toArray())
            : Promise.resolve([]),
        ]);
        const profileById = new Map(profiles.map((profile) => [String(profile.id ?? ""), profile]));
        const propertyById = new Map(properties.map((property) => [String(property.id ?? ""), property]));
        const officePropertyById = new Map(officePropertyRows.map((property) => [String(property.id ?? ""), property]));

        const history = offerRows.map((offer) => {
          const offerId = String(offer.id ?? "");
          const requestId = String(offer.request_id ?? "");
          const request = requestById.get(requestId);
          const profile = request ? profileById.get(String(request.user_id ?? "")) : null;
          const propertyId = String(offer.property_id ?? "");
          const property = propertyById.get(propertyId) ?? officePropertyById.get(propertyId) ?? null;
          const offerStatus = String(offer.status ?? "");
          const requestStatus = String(request?.status ?? "");
          const visibleInHistory =
            ["completed", "ended", "deleted", "rejected", "awaiting_confirmation"].includes(offerStatus) ||
            ["fulfilled", "cancelled", "ended", "expired"].includes(requestStatus);
          if (!visibleInHistory) return null;

          const historyKindLabels: Record<string, string> = {
            land: "أرض",
            villa: "فيلا",
            apartment: "شقة",
            farm: "مزرعة",
            rest_house: "استراحة",
            building: "عمارة",
            shop: "محل",
          };
          const historyListingLabels: Record<string, string> = {
            sale: "للبيع",
            rent: "للإيجار",
          };
          const fallbackTitle = [
            historyKindLabels[String(request?.kind ?? offer.completed_request_kind ?? "")] ?? "طلب عقاري",
            historyListingLabels[String(request?.listing ?? offer.completed_request_listing ?? "")] ?? "",
            String(request?.neighborhood ?? offer.completed_neighborhood ?? ""),
          ].filter(Boolean).join(" — ");
          const title =
            String(offer.completed_property_title ?? "").trim() ||
            String(property?.title ?? "").trim() ||
            fallbackTitle ||
            "طلب عقاري";

          return {
            id: offerId,
            request_id: requestId,
            message: offer.message == null ? null : String(offer.message),
            price: offer.price == null ? null : Number(offer.price),
            status: offerStatus,
            end_reason: offer.end_reason == null ? null : String(offer.end_reason),
            created_at: offer.completed_at ?? offer.ended_at ?? offer.updated_at ?? offer.created_at ?? new Date(),
            property_title: title,
            client_name: String(offer.completed_client_name ?? profile?.full_name ?? "عميل"),
            kind: request?.kind ?? offer.completed_request_kind ?? null,
            listing: request?.listing ?? offer.completed_request_listing ?? null,
            neighborhood: request?.neighborhood ?? offer.completed_neighborhood ?? null,
            budget_min: request?.budget_min ?? null,
            budget_max: request?.budget_max ?? null,
            area_min: request?.area_min ?? null,
            description: String(offer.completed_request_description ?? request?.description ?? ""),
            request_status: requestStatus,
          };
        }).filter(Boolean);

        const inquiries = await getMongoCollection<Record<string, unknown>>("property_inquiries")
          .then((collection) => collection.find({
            office_id: officeId,
            status: { $in: ["rejected", "ended", "completed"] },
          }).sort({ updated_at: -1, responded_at: -1, created_at: -1 }).limit(300).toArray());

        const inquiryPropertyIds = [...new Set(
          inquiries.map((inquiry) => String(inquiry.property_id ?? "")).filter(Boolean),
        )];
        const inquiryProperties = inquiryPropertyIds.length
          ? await getMongoCollection<Record<string, unknown>>("properties")
              .then((collection) => collection.find({ id: { $in: inquiryPropertyIds } })
                .project({ id: 1, title: 1, property_number: 1, kind: 1, listing: 1, neighborhood: 1 })
                .toArray())
          : [];
        const inquiryPropertyById = new Map(
          inquiryProperties.map((property) => [String(property.id ?? ""), property]),
        );

        const inquiryHistory = inquiries.map((inquiry) => {
          const inquiryId = String(inquiry.id ?? "");
          const status = String(inquiry.status ?? "");
          const property = inquiryPropertyById.get(String(inquiry.property_id ?? ""));
          const inquiryTypes: Record<string, string> = {
            viewing: "طلب معاينة",
            buy: "طلب شراء",
            rent: "طلب استئجار",
            question: "استفسار",
          };
          return {
            id: "inquiry:" + inquiryId,
            request_id: "inquiry:" + inquiryId,
            message: null,
            price: null,
            status,
            end_reason: inquiry.end_reason == null ? null : String(inquiry.end_reason),
            created_at: inquiry.updated_at ?? inquiry.responded_at ?? inquiry.created_at ?? new Date(),
            property_title: String(property?.title ?? "طلب تواصل على عقار"),
            client_name: String(inquiry.contact_name ?? "عميل"),
            kind: property?.kind == null ? null : String(property.kind),
            listing: property?.listing == null ? null : String(property.listing),
            neighborhood: property?.neighborhood == null ? null : String(property.neighborhood),
            budget_min: null,
            budget_max: null,
            area_min: null,
            description: String(inquiry.message ?? inquiryTypes[String(inquiry.type ?? "")] ?? "طلب تواصل"),
            request_status: status,
            history_type: "inquiry",
          };
        });

        const combinedHistory = [
          ...history.filter((row) => row !== null),
          ...inquiryHistory,
        ] as Array<Record<string, unknown>>;
        combinedHistory.sort((a, b) => {
          const left = new Date(String(a.created_at ?? 0)).getTime() || 0;
          const right = new Date(String(b.created_at ?? 0)).getTime() || 0;
          return right - left;
        });
        return { data: combinedHistory, error: null };
      }

      if (data.name === "office_accepted_property_requests") {
        if (!userId || role !== "office") throw new Error("not_office_member");
        const offices = await getMongoCollection<Record<string, unknown>>("offices");
        const office = await offices.findOne({ owner_id: userId, is_deleted: { $ne: true } });
        if (!office) throw new Error("office_not_found");
        const officeId = String(office.id ?? "");
        const requestsCollection = await getMongoCollection<Record<string, unknown>>("property_requests");
        const requests = await requestsCollection
          .find({ accepted_office_id: officeId, status: "active" })
          .sort({ updated_at: -1, created_at: -1 })
          .limit(100)
          .toArray();
        if (!requests.length) return { data: [], error: null };
        const acceptedOfferIds = requests
          .map((request) => String(request.accepted_offer_id ?? ""))
          .filter(Boolean);
        const userIds = [...new Set(requests.map((request) => String(request.user_id ?? "")).filter(Boolean))];
        const profiles = await getMongoCollection<Record<string, unknown>>("profiles");
        const offers = await getMongoCollection<Record<string, unknown>>("office_offers");
        const governorates = await getMongoCollection<Record<string, unknown>>("governorates");
        const [offerRows, profileRows, governorate] = await Promise.all([
          acceptedOfferIds.length
            ? offers.find({ id: { $in: acceptedOfferIds }, office_id: officeId }).toArray()
            : Promise.resolve([]),
          profiles.find({ id: { $in: userIds } }).project({ id: 1, full_name: 1, phone: 1 }).toArray(),
          office.governorate_id
            ? governorates.findOne({ id: office.governorate_id }, { projection: { name_ar: 1 } })
            : Promise.resolve(null),
        ]);
        const offerById = new Map(offerRows.map((offer) => [String(offer.id), offer]));
        const profileById = new Map(profileRows.map((profile) => [String(profile.id), profile]));
        return {
          data: requests.map((request) => {
            const requestId = String(request.id ?? "");
            const ownerId = String(request.user_id ?? "");
            const offer = offerById.get(String(request.accepted_offer_id ?? ""));
            const profile = profileById.get(ownerId);
            return {
              id: requestId,
              accepted_offer_id: String(request.accepted_offer_id ?? ""),
              accepted_office_id: officeId,
              user_id: ownerId,
              kind: request.kind ?? null,
              listing: request.listing ?? null,
              governorate_name: governorate?.name_ar ?? null,
              neighborhood: request.neighborhood ?? null,
              budget_min: request.budget_min ?? null,
              budget_max: request.budget_max ?? null,
              area_min: request.area_min ?? null,
              description: request.description ?? "",
              attachment_url: getRequestAttachmentUrl(request),
              created_at: request.created_at ?? null,
              expires_at: request.expires_at ?? null,
              client_name: profile?.full_name ?? "عميل",
              client_phone: profile?.phone ? String(profile.phone) : null,
              offer_message: offer?.message ?? null,
              offer_price: offer?.price ?? null,
              offer_status: offer?.status ?? "accepted",
            };
          }),
          error: null,
        };
      }

      if (data.name === "respond_to_property_offer" || data.name === "respond_property_offer") {
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

        if (requestedStatus === "accepted") {
          if (request.accepted_offer_id || request.accepted_office_id) {
            throw new Error("request_offer_already_accepted");
          }
          const claim = await requests.updateOne(
            {
              id: String(request.id),
              user_id: userId,
              status: "active",
              accepted_offer_id: { $in: [null, ""] },
              accepted_office_id: { $in: [null, ""] },
            },
            {
              $set: {
                accepted_offer_id: offerId,
                accepted_office_id: String(offer.office_id ?? ""),
                offer_accepted_at: now,
                updated_at: now,
              },
            },
          );
          if (!claim.modifiedCount) throw new Error("request_offer_already_accepted");
        }

        const changedOffer = await offers.updateOne(
          { id: offerId, status: "sent" },
          { $set: { status: requestedStatus, updated_at: now } },
        );
        if (!changedOffer.modifiedCount) {
          if (requestedStatus === "accepted") {
            await requests.updateOne(
              { id: String(request.id), user_id: userId, accepted_offer_id: offerId },
              { $unset: { accepted_offer_id: "", accepted_office_id: "", offer_accepted_at: "" } },
            );
          }
          throw new Error("offer_status_changed");
        }

        if (requestedStatus === "accepted") {
          await offers.updateMany(
            { request_id: String(request.id), id: { $ne: offerId }, status: { $in: ["sent", "accepted", "awaiting_confirmation"] } },
            { $set: { status: "ended", ended_at: now, updated_at: now } },
          );
        }

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
          const officeId = String(offer.office_id ?? "");
          if (officeId) {
            const office = await getMongoCollection<Record<string, unknown>>("offices")
              .then((collection) => collection.findOne({ id: officeId }));
            if (office?.owner_id) {
              const clientProfile = await getMongoCollection<Record<string, unknown>>("profiles")
                .then((profiles) => profiles.findOne({ id: userId }, { projection: { full_name: 1 } }));
              const clientName = String(clientProfile?.full_name ?? "العميل");
              await getMongoCollection<Record<string, unknown>>("notifications").then((notifications) =>
                notifications.insertOne({
                  id: randomUUID(),
                  _id: randomUUID(),
                  user_id: String(office.owner_id),
                  title: "تم قبول عرضك وانتقل الطلب إلى طلبات التواصل",
                  body: "قبل العميل " + clientName + " عرض مكتبك. أصبح الطلب خاصًا بمكتبك ويمكنك متابعة تفاصيله وبيانات الاتصال من طلبات التواصل.",
                  type: "property_offer_response",
                  link: "/office/requests?tab=inbox&request=" + encodeURIComponent(String(request.id)),
                  is_read: false,
                  created_at: now,
                }),
              );
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
        const clientName =
          String(booking.contact_name ?? "العميل").trim() || "العميل";
        const contactPhone = String(booking.contact_phone ?? "").trim();

        await getMongoCollection<Record<string, unknown>>("notifications").insertOne({
          id: randomUUID(),
          _id: randomUUID(),
          user_id: office.owner_id,
          title: "طلب معاينة جديد",
          body:
            clientName +
            " أرسل طلب معاينة" +
            (property?.title ? " لعقار " + String(property.title) : "") +
            " · التاريخ " +
            String(booking.visit_date ?? "") +
            " · الساعة " +
            String(booking.visit_time ?? "").slice(0, 5) +
            (contactPhone ? " · رقم التواصل: " + contactPhone : ""),
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
        const now = new Date();
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
          })
          .limit(100)
          .toArray();

        let sent = 0;

        for (const booking of candidates) {
          const bookingUserId = String(booking.user_id ?? "");
          const bookingOfficeId = String(booking.office_id ?? "");
          if (!bookingUserId || !bookingOfficeId) continue;

          const visitDate = String(booking.visit_date ?? "").slice(0, 10);

          const office = await offices.findOne({
            id: bookingOfficeId,
            is_deleted: { $ne: true },
          });
          if (!office) continue;

          // The appointment remains active until the user or office explicitly
          // completes/cancels it. Reaching the appointment time must not change
          // "accepted" to "appointment_ended", otherwise the finish action becomes
          // impossible and the completion-reason flow cannot run.
          // Send the "today" reminder once for confirmed appointments.
          if (
            String(booking.status ?? "") === "accepted" &&
            visitDate === today &&
            booking.reminder_sent_on !== today
          ) {
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
                  updated_at: now,
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
                    "لديك معاينة اليوم " +
                    visitDate +
                    " الساعة " +
                    timeText +
                    " بتوقيت السعودية (UTC+3)" +
                    propertyText +
                    ".",
                  type: "viewing_booking_reminder",
                  link:
                    recipientId === bookingUserId
                      ? "/bookings"
                      : "/office/requests?tab=bookings",
                  is_read: false,
                  created_at: now,
                  booking_id: booking.id,
                })),
              );
            }

            sent += 1;
          }
        }

        return { data: sent, error: null };
      }

      if (data.name === "update_viewing_booking") {
        if (!userId || role !== "individual") throw new Error("not_individual");

        const bookingId = String(data.args?._booking_id ?? "");
        const visitDate = String(data.args?._visit_date ?? "").slice(0, 10);
        const visitTime = String(data.args?._visit_time ?? "").slice(0, 5);
        const contactPhone = String(data.args?._contact_phone ?? "").trim();

        if (!bookingId || !visitDate || !visitTime) {
          throw new Error("booking_update_invalid");
        }

        if (contactPhone.length > 100) {
          throw new Error("contact_invalid");
        }

        const appointment = saudiAppointmentDateTime(visitDate, visitTime);
        if (!Number.isFinite(appointment.getTime()) || appointment.getTime() <= Date.now()) {
          throw new Error("appointment_must_be_future");
        }

        const bookings = await getMongoCollection<Record<string, unknown>>(
          "viewing_bookings",
        );
        const booking = await bookings.findOne({
          id: bookingId,
          user_id: userId,
        });

        if (!booking) throw new Error("booking_not_found");

        const currentStatus =
          String(booking.status ?? "").trim() || "pending";

        if (!["pending", "accepted"].includes(currentStatus)) {
          throw new Error("booking_not_editable");
        }

        const currentAppointment = saudiAppointmentDateTime(
          String(booking.visit_date ?? ""),
          String(booking.visit_time ?? ""),
        );

        if (
          Number.isFinite(currentAppointment.getTime()) &&
          currentAppointment.getTime() <= Date.now()
        ) {
          throw new Error("appointment_already_started");
        }

        const duplicate = await bookings.findOne({
          _id: { $ne: booking._id },
          user_id: userId,
          property_id: booking.property_id,
          visit_date: visitDate,
          visit_time: visitTime,
          status: { $nin: ["rejected", "cancelled", "completed"] },
        });

        if (duplicate) {
          throw new Error("duplicate_booking_time");
        }

        const now = new Date();

        const updateFields: Record<string, unknown> = {
          visit_date: visitDate,
          visit_time: visitTime,
          updated_at: now,
        };

        if (contactPhone) {
          updateFields.contact_phone = contactPhone;
        }

        const updateResult = await bookings.updateOne(
          { id: bookingId, user_id: userId },
          { $set: updateFields },
        );

        if (updateResult.matchedCount !== 1) {
          throw new Error("booking_not_found");
        }

        const offices = await getMongoCollection<Record<string, unknown>>("offices");
        const office = await offices.findOne({
          id: booking.office_id,
          is_deleted: { $ne: true },
        });

        const properties = await getMongoCollection<Record<string, unknown>>("properties");
        const property = await properties.findOne({ id: booking.property_id });

        const officeOwnerId = String(
          office?.owner_id ?? office?.user_id ?? "",
        ).trim();

        if (officeOwnerId) {
          const clientName =
            String(booking.contact_name ?? "العميل").trim() || "العميل";
          const propertyText = property?.title
            ? " لعقار " + String(property.title)
            : "";

          try {
            await getMongoCollection<Record<string, unknown>>(
              "notifications",
            ).insertOne({
              id: randomUUID(),
              _id: randomUUID(),
              user_id: officeOwnerId,
              title: "تم تعديل حجز المعاينة",
              body:
                clientName +
                " عدّل حجز المعاينة" +
                propertyText +
                " · الموعد الجديد " +
                visitDate +
                " الساعة " +
                visitTime +
                " · وسيلة الاتصال: " +
                (contactPhone || "كما هي"),
              type: "viewing_booking_updated",
              link: "/office/requests?tab=bookings",
              is_read: false,
              created_at: now,
              booking_id: booking.id,
            });
          } catch (notificationError) {
            console.error("[viewing-booking-update-notification]", notificationError);
          }
        }

        return {
          data: {
            id: bookingId,
            visit_date: visitDate,
            visit_time: visitTime,
            contact_phone: contactPhone,
          },
          error: null,
        };
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

        if (
          ["cancelled", "rejected"].includes(requestedStatus) &&
          (cancelReason.length < 3 || cancelReason.length > 500)
        ) {
          throw new Error(requestedStatus === "rejected" ? "rejection_reason_required" : "cancel_reason_required");
        }

        if (
          requestedStatus === "completed" &&
          (cancelReason.length < 3 || cancelReason.length > 500)
        ) {
          throw new Error("completion_reason_required");
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

        const currentStatus =
          String(booking.status ?? "").trim() || "pending";

        if (
          requestedStatus === "accepted" &&
          currentStatus !== "pending"
        ) {
          throw new Error("booking_not_pending");
        }

        if (
          requestedStatus === "rejected" &&
          currentStatus !== "pending"
        ) {
          throw new Error("booking_not_pending");
        }

        if (
          requestedStatus === "completed" &&
          currentStatus !== "accepted"
        ) {
          throw new Error("booking_not_accepted");
        }

        if (
          requestedStatus === "completed" &&
          !isOfficeOwner &&
          role !== "individual"
        ) {
          throw new Error("not_individual");
        }

        if (
          requestedStatus === "cancelled" &&
          !["pending", "accepted"].includes(currentStatus)
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
                : requestedStatus === "rejected"
                  ? { cancel_reason: cancelReason, rejected_at: now, rejected_by: userId }
                  : requestedStatus === "completed"
                    ? {
                        completed_at: now,
                        completed_by: userId,
                        completion_reason: cancelReason,
                      }
                    : {}),
              updated_at: now,
            },
          },
        );

        const properties = await getMongoCollection<Record<string, unknown>>("properties");
        const property = await properties.findOne({ id: booking.property_id });
        const notifications = await getMongoCollection<Record<string, unknown>>("notifications");

        const actorLabel = isOfficeOwner ? "المكتب" : "العميل";
        const officeName = String(bookingOffice?.name ?? "المكتب العقاري").trim() || "المكتب العقاري";
        const recipientId = isOfficeOwner
          ? bookingUserId
          : String(
              bookingOffice?.owner_id ??
                bookingOffice?.user_id ??
                "",
            );

        const clientName = String(booking.contact_name ?? "العميل").trim() || "العميل";
        const propertyLabel = property?.title
          ? "عقار " + String(property.title)
          : "العقار";
        const appointmentLabel =
          propertyLabel +
          " · التاريخ " +
          String(booking.visit_date ?? "").slice(0, 10) +
          " · الساعة " +
          String(booking.visit_time ?? "").slice(0, 5) +
          " بتوقيت السعودية (UTC+3)";
        const baseBody =
          appointmentLabel +
          " · العميل: " +
          clientName;

        let title: string;
        let body: string;
        let notificationRecipients: string[];

        if (requestedStatus === "completed") {
          title = "تم إنهاء المعاينة من " + (isOfficeOwner ? officeName : "العميل");
          body =
            (isOfficeOwner ? officeName : "العميل " + clientName) +
            " أنهى المعاينة · " +
            appointmentLabel +
            " · السبب: " +
            cancelReason;
          notificationRecipients = [recipientId];
        } else if (requestedStatus === "accepted") {
          title = "تم قبول طلب المعاينة من " + officeName;
          body =
            officeName +
            " وافق على طلب المعاينة · " +
            appointmentLabel;
          notificationRecipients = [recipientId];
        } else if (requestedStatus === "rejected") {
          title = "تم رفض طلب المعاينة من " + officeName;
          body =
            officeName +
            " رفض طلب المعاينة · " +
            appointmentLabel +
            " · سبب الرفض: " +
            cancelReason;
          notificationRecipients = [recipientId];
        } else {
          title = "تم إلغاء المعاينة من " + actorLabel;
          body = baseBody + " · سبب الإلغاء: " + cancelReason;
          notificationRecipients = [recipientId];
        }

        const allRecipients = notificationRecipients.filter(
          (id, index, ids) => Boolean(id) && ids.indexOf(id) === index,
        );

        if (allRecipients.length) {
          try {
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
                    ? ["rejected", "completed", "cancelled"].includes(requestedStatus)
                      ? "/notifications"
                      : "/bookings"
                    : "/office/requests?tab=bookings",
                is_read: false,
                created_at: now,
                booking_id: booking.id,
                cancel_reason:
                  requestedStatus === "cancelled" ? cancelReason : null,
                completion_reason:
                  requestedStatus === "completed" ? cancelReason : null,
              })),
            );
          } catch (notificationError) {
            console.error("[viewing-booking-notifications]", notificationError);
          }
        }

        return { data: requestedStatus, error: null };
      }

      if (data.name === "individual_update_property_inquiry") {
        if (!userId || role !== "individual") throw new Error("not_individual");

        const inquiryId = String(data.args?._inquiry_id ?? "");
        const requestedStatus = String(data.args?._status ?? "");
        const reason = String(data.args?._reason ?? "").trim().slice(0, 3000);
        if (!inquiryId || !["ended", "completed"].includes(requestedStatus)) {
          throw new Error("invalid_inquiry_status");
        }

        const inquiries = await getMongoCollection<Record<string, unknown>>("property_inquiries");
        const inquiry = await inquiries.findOne({
          id: inquiryId,
          user_id: userId,
          status: "accepted",
        });
        if (!inquiry) throw new Error("طلب التواصل لم يعد مقبولًا أو سبق التعامل معه.");

        const now = new Date();
        const changed = await inquiries.updateOne(
          { id: inquiryId, user_id: userId, status: "accepted" },
          {
            $set: {
              status: requestedStatus,
              updated_at: now,
              ...(requestedStatus === "ended"
                ? { end_reason: reason || null, ended_at: now, ended_by_user_id: userId }
                : { completion_note: reason || null, completed_at: now, completed_by_user_id: userId }),
            },
          },
        );
        if (!changed.modifiedCount) throw new Error("تم التعامل مع طلب التواصل بالفعل.");

        const [office, property, profile] = await Promise.all([
          getMongoCollection<Record<string, unknown>>("offices")
            .then((collection) => collection.findOne({ id: String(inquiry.office_id ?? "") })),
          getMongoCollection<Record<string, unknown>>("properties")
            .then((collection) => collection.findOne({ id: String(inquiry.property_id ?? "") })),
          getMongoCollection<Record<string, unknown>>("profiles")
            .then((collection) => collection.findOne({ id: userId }, { projection: { full_name: 1 } })),
        ]);
        const recipientId = String(office?.owner_id ?? "");
        if (recipientId) {
          const isCompleted = requestedStatus === "completed";
          const message =
            "العميل " + String(profile?.full_name ?? "العميل") +
            (isCompleted ? " أكد اكتمال طلب التواصل" : " أنهى طلب التواصل") +
            (property?.title ? " بخصوص " + String(property.title) : " بخصوص العقار") +
            (!isCompleted && reason ? ". سبب الإنهاء: " + reason : "") +
            (isCompleted && reason ? ". ملاحظة العميل: " + reason : "");
          await getMongoCollection<Record<string, unknown>>("notifications").insertOne({
            id: randomUUID(),
            _id: randomUUID(),
            user_id: recipientId,
            title: isCompleted ? "العميل أكد اكتمال طلب التواصل" : "العميل أنهى طلب التواصل",
            body: message,
            type: isCompleted ? "property_inquiry_completed" : "property_inquiry_ended",
            link: "/office/requests?tab=inbox",
            inquiry_id: inquiryId,
            is_read: false,
            created_at: now,
          });
        }

        return { data: requestedStatus, error: null };
      }

      if (data.name === "set_property_inquiry_status") {
        if (!userId || role !== "office") throw new Error("not_office_member");

        const inquiryId = String(data.args?._inquiry_id ?? "");
        const requestedStatus = String(data.args?._status ?? "");

        if (!inquiryId || !["accepted", "rejected"].includes(requestedStatus)) {
          throw new Error("invalid_inquiry_status");
        }

        const offices = await getMongoCollection<Record<string, unknown>>("offices");
        const office = await offices.findOne({ owner_id: userId, is_deleted: { $ne: true } });
        if (!office) throw new Error("office_not_found");

        const inquiries = await getMongoCollection<Record<string, unknown>>("property_inquiries");
        const inquiry = await inquiries.findOne({ id: inquiryId, office_id: office.id });
        if (!inquiry) throw new Error("inquiry_not_found");
        if (String(inquiry.status ?? "new") !== "new") throw new Error("inquiry_already_handled");

        const now = new Date();
        const updated = await inquiries.updateOne(
          { id: inquiryId, office_id: office.id, status: "new" },
          {
            $set: {
              status: requestedStatus,
              responded_by: userId,
              responded_at: now,
              updated_at: now,
            },
          },
        );
        if (!updated.modifiedCount) throw new Error("inquiry_already_handled");

        try {
          const customerId = String(inquiry.user_id ?? "");
          if (customerId) {
            let propertyTitle = "";
            try {
              const properties = await getMongoCollection<Record<string, unknown>>("properties");
              const property = await properties.findOne({ id: String(inquiry.property_id ?? "") });
              propertyTitle = String(property?.title ?? "");
            } catch (propertyLookupError) {
              console.error("[property-inquiry-response-property]", propertyLookupError);
            }

            await getMongoCollection<Record<string, unknown>>("notifications").then((notifications) =>
              notifications.insertOne({
                id: randomUUID(),
                _id: randomUUID(),
                user_id: customerId,
                title: requestedStatus === "accepted" ? "تم قبول طلب التواصل" : "تم رفض طلب التواصل",
                body:
                  String(office.name ?? "المكتب العقاري") +
                  (requestedStatus === "accepted"
                    ? " وافق على طلب تواصلك"
                    : " لم يتمكن من قبول طلب تواصلك") +
                  (propertyTitle ? " بخصوص " + propertyTitle : " بخصوص العقار"),
                type: "property_inquiry_response",
                link: requestedStatus === "accepted"
                  ? "/requests?tab=received"
                  : "/properties/" + encodeURIComponent(String(inquiry.property_id ?? "")),
                is_read: false,
                created_at: now,
                inquiry_id: inquiryId,
              }),
            );
          }
        } catch (notificationError) {
          // The inquiry status is already committed; a notification failure must not
          // make the user see a false "failed" response for a successful accept/reject.
          console.error("[property-inquiry-response-notification]", notificationError);
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

      if (data.name === "office_request_offer_completion") {
        if (!userId || role !== "office") throw new Error("not_office_member");

        const offerId = String(data.args?._offer_id ?? "");
        if (!offerId) throw new Error("offer_not_found");

        const offices = await getMongoCollection<Record<string, unknown>>("offices");
        const office = await offices.findOne({ owner_id: userId, is_deleted: { $ne: true } });
        if (!office) throw new Error("office_not_found");

        const offers = await getMongoCollection<Record<string, unknown>>("office_offers");
        const offer = await offers.findOne({ id: offerId, office_id: office.id });
        if (!offer) throw new Error("offer_not_found");
        if (offer.status !== "accepted") {
          throw new Error("يجب أن يقبل الفردي العرض أولًا قبل طلب تأكيد إتمام الصفقة.");
        }

        const requests = await getMongoCollection<Record<string, unknown>>("property_requests");
        const request = await requests.findOne({ id: String(offer.request_id ?? ""), status: "active" });
        if (!request) throw new Error("request_not_active");

        if (
          String(request.accepted_office_id ?? "") !== String(office.id) ||
          String(request.accepted_offer_id ?? "") !== offerId
        ) {
          throw new Error("هذا الطلب لم يعد تابعًا لمكتبك.");
        }

        const now = new Date();
        const changed = await offers.updateOne(
          { id: offerId, office_id: office.id, status: "accepted" },
          { $set: { status: "awaiting_confirmation", completion_requested_at: now, updated_at: now } },
        );
        if (!changed.modifiedCount) throw new Error("offer_status_changed");

        const requestOwner = String(request.user_id ?? "");
        if (requestOwner) {
          await getMongoCollection<Record<string, unknown>>("notifications").then((notifications) =>
            notifications.insertOne({
              id: randomUUID(),
              _id: randomUUID(),
              user_id: requestOwner,
              title: "تأكيد إتمام الصفقة",
              body: String(office.name ?? "المكتب العقاري") +
                " أبلغك بإتمام الصفقة. راجع العرض ثم أكّد الإتمام إذا تمت الصفقة فعلًا.",
              type: "property_offer_completion",
              link: "/requests?tab=received",
              is_read: false,
              created_at: now,
            }),
          );
        }

        return { data: "awaiting_confirmation", error: null };
      }

      if (data.name === "office_cancel_accepted_offer") {
        if (!userId || role !== "office") throw new Error("not_office_member");

        const offerId = String(data.args?._offer_id ?? "");
        const reason = String(data.args?._reason ?? "").trim().slice(0, 3000);
        if (!offerId) throw new Error("offer_not_found");
        if (reason.length < 3) throw new Error("اكتب سبب إلغاء العرض (3 أحرف على الأقل).");

        const offices = await getMongoCollection<Record<string, unknown>>("offices");
        const office = await offices.findOne({ owner_id: userId, is_deleted: { $ne: true } });
        if (!office) throw new Error("office_not_found");

        const offers = await getMongoCollection<Record<string, unknown>>("office_offers");
        const offer = await offers.findOne({
          id: offerId,
          office_id: String(office.id),
          status: { $in: ["accepted", "awaiting_confirmation"] },
        });
        if (!offer) throw new Error("هذا العرض لم يعد مقبولًا أو سبق إلغاؤه.");

        const requests = await getMongoCollection<Record<string, unknown>>("property_requests");
        const requestId = String(offer.request_id ?? "");
        const request = await requests.findOne({
          id: requestId,
          status: "active",
          accepted_offer_id: offerId,
          accepted_office_id: String(office.id),
        });
        if (!request) throw new Error("الطلب لم يعد مرتبطًا بهذا العرض.");

        const now = new Date();
        const changedOffer = await offers.updateOne(
          {
            id: offerId,
            office_id: String(office.id),
            status: String(offer.status),
          },
          {
            $set: {
              status: "ended",
              end_reason: reason,
              ended_by_office_id: String(office.id),
              ended_at: now,
              updated_at: now,
            },
          },
        );
        if (!changedOffer.modifiedCount) throw new Error("offer_status_changed");

        const reopenedRequest = await requests.updateOne(
          {
            id: requestId,
            status: "active",
            accepted_offer_id: offerId,
            accepted_office_id: String(office.id),
          },
          {
            $unset: {
              accepted_offer_id: "",
              accepted_office_id: "",
              offer_accepted_at: "",
            },
            $set: { updated_at: now },
          },
        );
        if (!reopenedRequest.modifiedCount) {
          await offers.updateOne(
            { id: offerId, office_id: String(office.id), status: "ended", ended_by_office_id: String(office.id) },
            { $set: { status: String(offer.status), updated_at: now }, $unset: { end_reason: "", ended_by_office_id: "", ended_at: "" } },
          );
          throw new Error("الطلب تغيّرت حالته، حدّث الصفحة وحاول مرة أخرى.");
        }

        const requestOwner = String(request.user_id ?? "");
        if (requestOwner) {
          const notifications = await getMongoCollection<Record<string, unknown>>("notifications");
          await notifications.insertOne({
            id: randomUUID(),
            _id: randomUUID(),
            user_id: requestOwner,
            title: "ألغى المكتب العرض الذي وافقت عليه",
            body:
              "قام مكتب " + String(office.name ?? "عقاري") +
              " بإلغاء عرضه على طلبك. سبب الإلغاء: " + reason,
            type: "property_offer_cancelled",
            link: "/requests?tab=received&offer=" + encodeURIComponent(offerId),
            request_id: requestId,
            offer_id: offerId,
            is_read: false,
            created_at: now,
          });
        }

        return { data: "cancelled", error: null };
      }

      if (data.name === "office_end_offer") {
        if (!userId || role !== "office") throw new Error("not_office_member");

        const offerId = String(data.args?._offer_id ?? "");
        if (!offerId) throw new Error("offer_not_found");

        const offices = await getMongoCollection<Record<string, unknown>>("offices");
        const office = await offices.findOne({ owner_id: userId, is_deleted: { $ne: true } });
        if (!office) throw new Error("office_not_found");

        const offers = await getMongoCollection<Record<string, unknown>>("office_offers");
        const offer = await offers.findOne({ id: offerId, office_id: office.id });
        if (!offer) throw new Error("offer_not_found");
        if (!["sent", "accepted", "awaiting_confirmation"].includes(String(offer.status))) {
          throw new Error("offer_cannot_be_ended");
        }

        const requests = await getMongoCollection<Record<string, unknown>>("property_requests");
        const request = await requests.findOne({ id: String(offer.request_id ?? "") });
        if (!request) throw new Error("request_not_found");

        const now = new Date();
        const changed = await offers.updateOne(
          { id: offerId, office_id: office.id, status: { $in: ["sent", "accepted", "awaiting_confirmation"] } },
          { $set: { status: "ended", ended_at: now, updated_at: now } },
        );
        if (!changed.modifiedCount) throw new Error("offer_status_changed");

        const requestOwner = String(request.user_id ?? "");
        if (requestOwner) {
          await getMongoCollection<Record<string, unknown>>("notifications").then((notifications) =>
            notifications.insertOne({
              id: randomUUID(),
              _id: randomUUID(),
              user_id: requestOwner,
              title: "انتهى عرض المكتب",
              body: String(office.name ?? "المكتب العقاري") +
                " أنهى عرضه. لم تُسجّل الصفقة كمكتملة لعدم وجود تأكيد من الطرفين.",
              type: "property_offer_ended",
              link: "/requests?tab=received",
              is_read: false,
              created_at: now,
            }),
          );
        }

        return { data: "ended", error: null };
      }

      if (data.name === "office_edit_offer") {
        if (!userId || role !== "office") throw new Error("not_office_member");

        const offerId = String(data.args?._offer_id ?? "");
        const message = String(data.args?._message ?? "").trim();
        const rawPrice = data.args?._price;
        const price = rawPrice == null || String(rawPrice).trim() === "" ? null : Number(rawPrice);

        if (!offerId) throw new Error("offer_not_found");
        if (message.length < 5 || message.length > 5000) throw new Error("invalid_offer_message");
        if (price != null && (!Number.isFinite(price) || price < 0)) throw new Error("invalid_offer_price");

        const offices = await getMongoCollection<Record<string, unknown>>("offices");
        const office = await offices.findOne({ owner_id: userId, is_deleted: { $ne: true } });
        if (!office) throw new Error("office_not_found");

        const offers = await getMongoCollection<Record<string, unknown>>("office_offers");
        const offer = await offers.findOne({ id: offerId, office_id: office.id });
        if (!offer) throw new Error("offer_not_found");
        if (offer.status !== "sent") throw new Error("offer_terms_locked");

        const requests = await getMongoCollection<Record<string, unknown>>("property_requests");
        const request = await requests.findOne({ id: String(offer.request_id ?? ""), status: "active" });
        if (!request) throw new Error("request_not_active");

        if (
          String(request.accepted_office_id ?? "") !== String(office.id) ||
          String(request.accepted_offer_id ?? "") !== offerId
        ) {
          throw new Error("هذا الطلب لم يعد تابعًا لمكتبك.");
        }

        const now = new Date();
        await offers.updateOne(
          { id: offerId, office_id: office.id, status: "sent" },
          { $set: { message, price, updated_at: now } },
        );

        return { data: { id: offerId, message, price }, error: null };
      }


      if (data.name === "complete_property_request_with_office") {
        if (!userId || role !== "individual") throw new Error("not_individual");
        const requestId = String(data.args?._request_id ?? "");
        const offerId = String(data.args?._offer_id ?? "");
        if (!requestId || !offerId) throw new Error("request_or_offer_not_found");
        const requests = await getMongoCollection<Record<string, unknown>>("property_requests");
        const request = await requests.findOne({ id: requestId, user_id: userId, status: "active" });
        if (!request) throw new Error("request_not_active");
        if (!request.accepted_offer_id || !request.accepted_office_id) {
          throw new Error("يجب قبول عرض أولًا قبل تسجيل اكتمال الطلب.");
        }
        const offers = await getMongoCollection<Record<string, unknown>>("office_offers");
        const selectedOffer = await offers.findOne({
          id: offerId,
          request_id: requestId,
          status: { $in: ["sent", "accepted", "awaiting_confirmation", "ended"] },
        });
        if (!selectedOffer) throw new Error("اختر مكتبًا سبق أن أرسل عرضًا صالحًا على هذا الطلب.");
        const now = new Date();
        const completedOffer = await offers.updateOne(
          { id: offerId, request_id: requestId, status: String(selectedOffer.status) },
          { $set: { status: "completed", completed_at: now, completed_by_user_id: userId, updated_at: now } },
        );
        if (!completedOffer.modifiedCount) throw new Error("offer_status_changed");
        const completedRequest = await requests.updateOne(
          { id: requestId, user_id: userId, status: "active", accepted_offer_id: String(request.accepted_offer_id) },
          { $set: { status: "fulfilled", completed_offer_id: offerId, completed_office_id: String(selectedOffer.office_id ?? ""), fulfilled_at: now, updated_at: now } },
        );
        if (!completedRequest.modifiedCount) {
          await offers.updateOne(
            { id: offerId, request_id: requestId, status: "completed", completed_by_user_id: userId },
            { $set: { status: String(selectedOffer.status), updated_at: now }, $unset: { completed_at: "", completed_by_user_id: "" } },
          );
          throw new Error("request_not_active");
        }
        await offers.updateMany(
          { request_id: requestId, id: { $ne: offerId }, status: { $in: ["sent", "accepted", "awaiting_confirmation"] } },
          { $set: { status: "ended", ended_at: now, updated_at: now } },
        );
        const profile = await getMongoCollection<Record<string, unknown>>("profiles")
          .then((profiles) => profiles.findOne({ id: userId }, { projection: { full_name: 1 } }));
        const clientName = String(profile?.full_name ?? "العميل");
        const completedProperty = selectedOffer.property_id
          ? await getMongoCollection<Record<string, unknown>>("properties")
              .then((properties) => properties.findOne({ id: String(selectedOffer.property_id) }))
          : null;
        const completedKindLabels: Record<string, string> = {
          land: "أرض",
          villa: "فيلا",
          apartment: "شقة",
          farm: "مزرعة",
          rest_house: "استراحة",
          building: "عمارة",
          shop: "محل",
        };
        const completedListingLabels: Record<string, string> = {
          sale: "للبيع",
          rent: "للإيجار",
        };
        const propertyTitle =
          String(completedProperty?.title ?? "").trim() ||
          [
            completedKindLabels[String(request.kind ?? "")] ?? "عقار",
            completedListingLabels[String(request.listing ?? "")] ?? "",
            request.neighborhood ? String(request.neighborhood) : "",
          ].filter(Boolean).join(" — ");
        await offers.updateOne(
          { id: offerId, request_id: requestId, status: "completed" },
          {
            $set: {
              completed_property_title: propertyTitle,
              completed_client_name: clientName,
              completed_request_description: String(request.description ?? ""),
              completed_neighborhood: request.neighborhood ?? null,
              completed_request_kind: request.kind ?? null,
              completed_request_listing: request.listing ?? null,
              completed_at: now,
              updated_at: now,
            },
          },
        );
        const allOffers = await offers.find({ request_id: requestId }).project({ office_id: 1 }).toArray();
        const officeIds = [...new Set(allOffers.map((item) => String(item.office_id ?? "")).filter(Boolean))];
        const offices = await getMongoCollection<Record<string, unknown>>("offices");
        const affectedOffices = officeIds.length
          ? await offices.find({ id: { $in: officeIds } }).project({ id: 1, owner_id: 1 }).toArray()
          : [];
        const notifications = await getMongoCollection<Record<string, unknown>>("notifications");
        for (const officeRow of affectedOffices) {
          const recipientId = String(officeRow.owner_id ?? "");
          if (!recipientId) continue;
          const isCompletedOffice = String(officeRow.id) === String(selectedOffer.office_id);
          await notifications.insertOne({
            id: randomUUID(),
            _id: randomUUID(),
            user_id: recipientId,
            title: isCompletedOffice
              ? "نهنئك على إتمام " + (String(request.listing ?? "") === "rent" ? "تأجير العقار: " : "بيع العقار: ") + propertyTitle
              : "الطلب مكتمل من خلال مكتب آخر",
            body: isCompletedOffice
              ? "نهنئ مكتبكم على إتمام " +
                (String(request.listing ?? "") === "rent" ? "تأجير" : "بيع") +
                " " + propertyTitle + " للعميل " + clientName +
                (request.description ? ". تفاصيل الطلب: " + String(request.description).slice(0, 600) : "")
              : "أكد العميل " + clientName + " اكتمال الطلب من خلال مكتب آخر. تم إغلاق الطلب وعروضه.",
            type: "property_offer_completed",
            link: "/office/requests?tab=sent",
            is_read: false,
            created_at: now,
          });
        }
        return { data: "completed", error: null };
      }

      if (data.name === "confirm_property_offer_completion") {
        if (!userId || role !== "individual") throw new Error("not_individual");

        const offerId = String(data.args?._offer_id ?? "");
        if (!offerId) throw new Error("offer_not_found");

        const offers = await getMongoCollection<Record<string, unknown>>("office_offers");
        const offer = await offers.findOne({ id: offerId, status: "awaiting_confirmation" });
        if (!offer) throw new Error("offer_not_awaiting_confirmation");

        const requests = await getMongoCollection<Record<string, unknown>>("property_requests");
        const request = await requests.findOne({
          id: String(offer.request_id ?? ""),
          user_id: userId,
          status: "active",
        });
        if (!request) throw new Error("request_not_active");

        const now = new Date();
        const completed = await offers.updateOne(
          { id: offerId, status: "awaiting_confirmation" },
          { $set: { status: "completed", completed_at: now, updated_at: now } },
        );
        if (!completed.modifiedCount) throw new Error("offer_status_changed");

        const closed = await requests.updateOne(
          { id: String(request.id), user_id: userId, status: "active" },
          { $set: { status: "fulfilled", fulfilled_at: now, updated_at: now } },
        );
        if (!closed.modifiedCount) throw new Error("request_not_active");

        const remainingOffers = await offers
          .find({
            request_id: String(request.id),
            id: { $ne: offerId },
            status: { $in: ["sent", "accepted", "awaiting_confirmation"] },
          })
          .project({ office_id: 1 })
          .toArray();

        await offers.updateMany(
          {
            request_id: String(request.id),
            id: { $ne: offerId },
            status: { $in: ["sent", "accepted", "awaiting_confirmation"] },
          },
          { $set: { status: "ended", ended_at: now, updated_at: now } },
        );

        const officeIds = [
          ...new Set(remainingOffers.map((item) => String(item.office_id ?? "")).filter(Boolean)),
          String(offer.office_id ?? ""),
        ].filter(Boolean);
        const offices = await getMongoCollection<Record<string, unknown>>("offices");
        const affectedOffices = await offices
          .find({ id: { $in: officeIds } })
          .project({ id: 1, owner_id: 1 })
          .toArray();
        const notifications = await getMongoCollection<Record<string, unknown>>("notifications");

        for (const affectedOffice of affectedOffices) {
          const recipientId = String(affectedOffice.owner_id ?? "");
          if (!recipientId) continue;
          const isWinningOffice = String(affectedOffice.id) === String(offer.office_id);
          await notifications.insertOne({
            id: randomUUID(),
            _id: randomUUID(),
            user_id: recipientId,
            title: isWinningOffice ? "أكد العميل إتمام الصفقة" : "أُغلق طلب العميل",
            body: isWinningOffice
              ? "أكد العميل إتمام الصفقة؛ تم تسجيل عرضك والطلب كمكتمل."
              : "أكمل العميل الطلب من خلال عرض آخر. تم إنهاء عرضك دون اعتباره صفقة مكتملة.",
            type: "property_offer_completed",
            link: "/office/requests?tab=sent",
            is_read: false,
            created_at: now,
          });
        }

        return { data: "completed", error: null };
      }

      if (data.name === "set_office_offer_status") {
        if (!userId || role !== "office") throw new Error("not_office_member");

        const offerId = String(data.args?._offer_id ?? "");
        const requestedStatus = String(data.args?._status ?? "");
        if (!offerId || !["completed", "deleted"].includes(requestedStatus)) {
          throw new Error("invalid_offer_status");
        }

        const offices = await getMongoCollection<Record<string, unknown>>("offices");
        const office = await offices.findOne({ owner_id: userId, is_deleted: { $ne: true } });
        if (!office) throw new Error("office_not_found");

        const offers = await getMongoCollection<Record<string, unknown>>("office_offers");
        const offer = await offers.findOne({ id: offerId, office_id: office.id });
        if (!offer) throw new Error("offer_not_found");

        if (requestedStatus === "completed") {
          throw new Error("لا يمكن تسجيل العرض كمكتمل قبل تأكيد الفردي. استخدم إبلاغ بإتمام الصفقة.");
        }

        // Keep the old delete action for compatibility with older clients.
        await offers.deleteOne({ id: offerId, office_id: office.id });
        return { data: "deleted", error: null };
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

        if (request.accepted_offer_id && String(request.accepted_offer_id) !== offerId) {
          throw new Error("request_not_available_for_offers");
        }
        const notifications = await getMongoCollection<Record<string, unknown>>("notifications");
        const priorNumberedOffers = await notifications
          .find({
            user_id: request.user_id,
            type: "property_offer",
            title: /^طلب مستلم جديد \d+$/,
          })
          .project({ title: 1 })
          .toArray();
        const offerNumber =
          Math.max(
            0,
            ...priorNumberedOffers.map((item) => {
              const match = String(item.title ?? "").match(/^طلب مستلم جديد (\d+)$/);
              return match ? Number(match[1]) : 0;
            }),
          ) + 1;
        await notifications.insertOne({
          id: randomUUID(),
          _id: randomUUID(),
          user_id: request.user_id,
          title: "طلب مستلم جديد " + offerNumber,
          body:
            String(office.name ?? "مكتب عقاري") +
            " أرسل لك عرضًا جديدًا على طلبك العقاري" +
            (property?.title ? " · " + String(property.title) : "") +
            priceText +
            (offer.message ? " · " + String(offer.message).slice(0, 160) : ""),
          type: "property_offer",
          link: "/requests?tab=received&request=" + encodeURIComponent(String(request.id)) +
            "&offer=" + encodeURIComponent(offerId),
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


export const getOfficeViewingClientDetails = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => value as {
    officeId: string;
    bookingIds: string[];
  })
  .handler(async ({ data }) => {
    const userId = getSessionUserId();
    if (!userId) throw new Error("يجب تسجيل الدخول.");

    const officeId = String(data.officeId ?? "").trim();
    const bookingIds = Array.isArray(data.bookingIds)
      ? [...new Set(
          data.bookingIds
            .filter((id): id is string => typeof id === "string")
            .map((id) => id.trim())
            .filter(Boolean),
        )].slice(0, 100)
      : [];

    if (!officeId || !bookingIds.length) return { clients: [] };

    const offices = await getMongoCollection<Record<string, unknown>>("offices");
    const office = await offices.findOne({
      id: officeId,
      owner_id: userId,
      is_deleted: { $ne: true },
    });

    const staff = office
      ? null
      : await (await getMongoCollection<Record<string, unknown>>("office_staff"))
          .findOne({ office_id: officeId, user_id: userId, is_active: true });

    if (!office && !staff) throw new Error("not_office_member");

    const bookingCollection = await getMongoCollection<Record<string, unknown>>(
      "viewing_bookings",
    );
    const bookings = await bookingCollection
      .find({
        office_id: officeId,
        $or: [
          { id: { $in: bookingIds } },
          { _id: { $in: bookingIds } },
        ],
      })
      .project({ _id: 1, id: 1, user_id: 1, contact_name: 1, contact_phone: 1 })
      .toArray();

    const userIds = [
      ...new Set(
        bookings
          .map((booking) => booking.user_id)
          .filter((id): id is string => typeof id === "string" && !!id.trim()),
      ),
    ];

    if (!userIds.length) {
      return {
        clients: bookings.map((booking) => ({
          bookingId: String(booking.id ?? booking._id ?? ""),
          fullName: typeof booking.contact_name === "string" &&
              !["عميل", "العميل"].includes(booking.contact_name.trim())
            ? booking.contact_name.trim()
            : "",
          phone: typeof booking.contact_phone === "string" ? booking.contact_phone : null,
        })),
      };
    }

    const [users, profiles] = await Promise.all([
      (await getMongoCollection<Record<string, unknown>>("users"))
        .find({ _id: { $in: userIds } })
        .project({ _id: 1, full_name: 1, phone: 1 })
        .toArray(),
      (await getMongoCollection<Record<string, unknown>>("profiles"))
        .find({ id: { $in: userIds } })
        .project({ _id: 1, id: 1, full_name: 1, phone: 1 })
        .toArray(),
    ]);

    const userById = new Map(
      users.map((user) => [String(user._id), user]),
    );
    const profileById = new Map(
      profiles.map((profile) => [String(profile.id ?? profile._id), profile]),
    );
    const textValue = (value: unknown) =>
      typeof value === "string" ? value.trim() : "";
    const nameValue = (value: unknown) => {
      const name = textValue(value);
      return name && !["عميل", "العميل"].includes(name) ? name : "";
    };

    return {
      clients: bookings.map((booking) => {
        const bookingId = String(booking.id ?? booking._id ?? "");
        const linkedUserId = String(booking.user_id ?? "");
        const user = userById.get(linkedUserId);
        const profile = profileById.get(linkedUserId);
        const savedName = textValue(booking.contact_name);
        const nameIsFallback = !savedName || ["عميل", "العميل"].includes(savedName);

        return {
          bookingId,
          fullName:
            nameValue(profile?.full_name) ||
            nameValue(user?.full_name) ||
            (nameIsFallback ? "" : savedName),
          phone:
            textValue(booking.contact_phone) ||
            textValue(profile?.phone) ||
            textValue(user?.phone) ||
            null,
        };
      }),
    };
  });

export const removeMedia = createServerFn({ method: "POST" })
  .validator((value: unknown) => value as { path: string })
  .handler(async ({ data }) => {
    await deleteMedia(data.path);
    return { data: null, error: null };
  });
