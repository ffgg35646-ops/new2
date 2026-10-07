import { GridFSBucket, MongoClient, type Db, type Document } from "mongodb";

let clientPromise: Promise<MongoClient> | undefined;

function getConfig() {
  const uri = process.env["MONGODB_URI"];
  const dbName = process.env["MONGODB_DB_NAME"] || "aqar_albatin";
  if (!uri) throw new Error("MONGODB_URI is missing.");
  return { uri, dbName };
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
  return (await clientPromise).db(dbName);
}

export async function getMongoCollection<T extends Document = Document>(name: string) {
  return (await getMongoDb()).collection<T>(name);
}

export async function ensureMongoIndexes() {
  const db = await getMongoDb();
  await Promise.all([
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
    db.collection("profiles").createIndex({ id: 1 }, { unique: true }),
    db.collection("user_roles").createIndex({ user_id: 1, role: 1 }, { unique: true }),
    db.collection("notifications").createIndex({ user_id: 1, created_at: -1 }),
    db.collection("properties").createIndex({ is_published: 1, is_deleted: 1, created_at: -1 }),
  ]);
}

export async function storeMedia(fileName: string, mimeType: string, bytes: Buffer) {
  const db = await getMongoDb();
  const bucket = new GridFSBucket(db, { bucketName: "media" });

  return await new Promise<string>((resolve, reject) => {
    const upload = bucket.openUploadStream(fileName, {
      contentType: mimeType,
      metadata: { originalName: fileName },
    });
    upload.once("error", reject);
    upload.once("finish", () => resolve(String(upload.id)));
    upload.end(bytes);
  });
}

export async function readMedia(id: string) {
  const db = await getMongoDb();
  const bucket = new GridFSBucket(db, { bucketName: "media" });
  const { ObjectId } = await import("mongodb");

  if (!ObjectId.isValid(id)) return null;

  const objectId = new ObjectId(id);
  const files = await db.collection("media.files").find({ _id: objectId }).limit(1).toArray();
  if (!files[0]) return null;

  const stream = bucket.openDownloadStream(objectId);
  const chunks: Buffer[] = [];

  return await new Promise<{ body: Buffer; contentType: string; fileName: string }>((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("error", reject);
    stream.on("end", () =>
      resolve({
        body: Buffer.concat(chunks),
        contentType: typeof files[0]?.contentType === "string" ? files[0].contentType : "application/octet-stream",
        fileName: typeof files[0]?.filename === "string" ? files[0].filename : "file",
      }),
    );
  });
}

export async function deleteMedia(id: string) {
  const db = await getMongoDb();
  const bucket = new GridFSBucket(db, { bucketName: "media" });
  const { ObjectId } = await import("mongodb");
  if (!ObjectId.isValid(id)) return false;
  await bucket.delete(new ObjectId(id));
  return true;
}
