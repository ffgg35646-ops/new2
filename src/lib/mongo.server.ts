import { del as deleteBlob, get as getBlob, put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { GridFSBucket, MongoClient, type Collection, type Db, type Document } from "mongodb";

let clientPromise: Promise<MongoClient> | undefined;
let indexesPromise: Promise<void> | undefined;

function getConfig() {
  const uri = process.env["MONGODB_URI"];
  const dbName = process.env["MONGODB_DB_NAME"] || "aqar_albatin";
  if (!uri) throw new Error("MONGODB_URI is missing.");
  return { uri, dbName };
}

async function createMongoIndexes(db: Db) {
  await Promise.all([
    db.collection<any>("users").createIndex({ email: 1 }, { unique: true }),
    db.collection("profiles").createIndex({ id: 1 }, { unique: true }),
    db.collection<any>("user_roles").createIndex({ user_id: 1, role: 1 }, { unique: true }),
    db.collection("notifications").createIndex({ user_id: 1, created_at: -1 }),
    db.collection("media_objects").createIndex({ id: 1 }, { unique: true }),
    db.collection("properties").createIndex({ property_number: 1 }),
    db.collection("properties").createIndex({
      office_id: 1,
      is_published: 1,
      is_deleted: 1,
      created_at: -1,
    }),
    db.collection("properties").createIndex({
      is_published: 1,
      is_deleted: 1,
      created_at: -1,
    }),
  ]);
}

export async function getMongoDb(): Promise<Db> {
  const { uri, dbName } = getConfig();
  if (!clientPromise) {
    const client = new MongoClient(uri, {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 10_000,
    });
    clientPromise = client.connect();
  }

  const db = (await clientPromise).db(dbName);

  if (!indexesPromise) {
    indexesPromise = createMongoIndexes(db).catch((error) => {
      indexesPromise = undefined;
      throw error;
    });
  }

  await indexesPromise;
  return db;
}

export async function getMongoCollection<T extends Document = Document>(
  name: string,
): Promise<Collection<any> & { readonly __recordType?: T }> {
  // The application uses a mixed legacy schema (UUID strings and ObjectIds).
  // Keep the collection boundary dynamic; request validators and server-side
  // authorization enforce the application schema before any write.
  return (await getMongoDb()).collection<any>(name) as Collection<any> & {
    readonly __recordType?: T;
  };
}

export async function ensureMongoIndexes() {
  const db = await getMongoDb();
  await createMongoIndexes(db);
}

function getBlobReadWriteToken(): string | null {
  const token = process.env["BLOB_READ_WRITE_TOKEN"]?.trim();
  return token || null;
}

function isAllowedMediaContentType(value: unknown): value is string {
  return typeof value === "string" &&
    ["image/jpeg", "image/png", "image/webp", "application/pdf", "text/plain"].includes(value);
}

async function resolveMediaAccess(
  db: Db,
  id: string,
  ownerId: string,
  visibility: unknown,
  viewerId: string | null,
) {
  const mediaPaths = [id, "/api/media/" + id, "/api/media/" + encodeURIComponent(id)];
  const referencedOffice = await db.collection<any>("offices").findOne(
    {
      $or: [
        { fal_license_url: { $in: mediaPaths } },
        { real_estate_license_url: { $in: mediaPaths } },
      ],
    },
    { projection: { owner_id: 1 } },
  );

  const isPrivate = visibility === "private" || !!referencedOffice;
  if (!isPrivate) return { isPrivate: false, allowed: true };

  const expectedOwner = String(referencedOffice?.owner_id ?? ownerId ?? "");
  let isAdmin = false;
  if (viewerId) {
    const [adminUser, adminRole] = await Promise.all([
      db.collection<any>("users").findOne(
        { _id: viewerId, role: "admin" },
        { projection: { _id: 1 } },
      ),
      db.collection<any>("user_roles").findOne(
        { user_id: viewerId, role: "admin" },
        { projection: { _id: 1 } },
      ),
    ]);
    isAdmin = !!adminUser || !!adminRole;
  }

  return {
    isPrivate: true,
    allowed: !!viewerId && !!expectedOwner && (viewerId === expectedOwner || isAdmin),
  };
}

/**
 * Store media in private Vercel Blob when its token is configured; otherwise use
 * MongoDB GridFS. Both providers are served through the existing /api/media/:id route.
 * The GridFS fallback keeps uploads working in local/test deployments without Blob secrets.
 */
export async function storeMedia(
  fileName: string,
  mimeType: string,
  bytes: Buffer,
  ownerId: string,
  visibility: "public" | "private" = "public",
): Promise<{ id: string; url: string }> {
  const token = getBlobReadWriteToken();

  if (!token) {
    const db = await getMongoDb();
    const bucket = new GridFSBucket(db, { bucketName: "media" });
    const upload = bucket.openUploadStream(fileName, {
      metadata: {
        ownerId,
        visibility,
        contentType: mimeType,
      },
    });

    await new Promise<void>((resolve, reject) => {
      upload.once("error", reject);
      upload.once("finish", resolve);
      upload.end(bytes);
    });

    const id = String(upload.id);
    return { id, url: "/api/media/" + encodeURIComponent(id) };
  }

  const id = randomUUID();
  const safeName =
    fileName
      .split(/[\\/]/)
      .pop()
      ?.replace(/[^a-zA-Z0-9._-]+/g, "_")
      .slice(-100) || "file";
  const pathname = "media/" + id + "/" + safeName;
  const body = new Blob([Uint8Array.from(bytes).buffer as ArrayBuffer], {
    type: mimeType,
  });

  // The Blob store must be private; public images are still delivered through
  // /api/media while sensitive files retain the owner/admin access check.
  const blob = await put(pathname, body, {
    access: "private",
    token,
    contentType: mimeType,
    addRandomSuffix: false,
    cacheControlMaxAge: 60 * 60 * 24 * 30,
  });

  try {
    const db = await getMongoDb();
    await db.collection("media_objects").insertOne({
      id,
      blob_url: blob.url,
      pathname: blob.pathname,
      original_name: fileName,
      owner_id: ownerId,
      visibility,
      content_type: mimeType,
      created_at: new Date(),
      storage_provider: "vercel-blob",
    });
  } catch (error) {
    try {
      await deleteBlob(blob.url, { token });
    } catch (cleanupError) {
      console.error("[Vercel Blob] failed to clean up orphaned upload", cleanupError);
    }
    throw error;
  }

  return { id, url: "/api/media/" + encodeURIComponent(id) };
}

export async function readMedia(id: string, viewerId: string | null = null) {
  const db = await getMongoDb();

  // New files live in Vercel Blob; check metadata first and keep legacy GridFS URLs working.
  const stored = await db.collection<any>("media_objects").findOne({ id });
  if (stored) {
    const access = await resolveMediaAccess(
      db,
      id,
      String(stored.owner_id ?? ""),
      stored.visibility,
      viewerId,
    );
    if (!access.allowed) return null;

    const token = getBlobReadWriteToken();
    if (token) {
      const result = await getBlob(String(stored.blob_url), {
        access: "private",
        token,
      });

      if (result?.statusCode === 200 && result.stream) {
        const body = Buffer.from(await new Response(result.stream).arrayBuffer());
        return {
          body,
          contentType: isAllowedMediaContentType(stored.content_type)
            ? stored.content_type
            : "application/octet-stream",
          fileName: typeof stored.original_name === "string" ? stored.original_name : "file",
          isPrivate: access.isPrivate,
        };
      }
    }

    // If no Blob token is configured (or this Blob copy is unavailable), try
    // the same ID in GridFS. This also preserves legacy files whose GridFS
    // originals were intentionally retained during the migration.
  }

  // Backward compatibility for files uploaded before the Vercel Blob migration.
  const bucket = new GridFSBucket(db, { bucketName: "media" });
  const { ObjectId } = await import("mongodb");
  if (!ObjectId.isValid(id)) return null;

  const objectId = new ObjectId(id);
  const files = await db.collection("media.files").find({ _id: objectId }).limit(1).toArray();
  const file = files[0];
  if (!file) return null;

  const access = await resolveMediaAccess(
    db,
    id,
    String(file.metadata?.ownerId ?? ""),
    file.metadata?.visibility,
    viewerId,
  );
  if (!access.allowed) return null;

  const stream = bucket.openDownloadStream(objectId);
  const chunks: Buffer[] = [];

  return await new Promise<{
    body: Buffer;
    contentType: string;
    fileName: string;
    isPrivate: boolean;
  }>((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("error", reject);
    stream.on("end", () =>
      resolve({
        body: Buffer.concat(chunks),
        contentType: isAllowedMediaContentType(file.metadata?.contentType)
          ? file.metadata.contentType
          : "application/octet-stream",
        fileName: typeof file.filename === "string" ? file.filename : "file",
        isPrivate: access.isPrivate,
      }),
    );
  });
}

export async function deleteMedia(id: string, ownerId: string) {
  const db = await getMongoDb();
  const stored = await db.collection<any>("media_objects").findOne({ id });

  if (stored) {
    if (String(stored.owner_id ?? "") !== ownerId) return false;
    const token = getBlobReadWriteToken();
    if (!token) {
      throw new Error("Cannot delete this older Blob-backed file because BLOB_READ_WRITE_TOKEN is missing.");
    }
    await deleteBlob(String(stored.blob_url), { token });
    await db.collection("media_objects").deleteOne({ id, owner_id: ownerId });
    return true;
  }

  // Allow deletion of legacy GridFS media until migration is complete.
  const bucket = new GridFSBucket(db, { bucketName: "media" });
  const { ObjectId } = await import("mongodb");
  if (!ObjectId.isValid(id)) return false;

  const objectId = new ObjectId(id);
  const file = await db.collection("media.files").findOne(
    { _id: objectId },
    { projection: { "metadata.ownerId": 1 } },
  );
  if (!file || String(file.metadata?.ownerId ?? "") !== ownerId) return false;

  await bucket.delete(objectId);
  return true;
}
