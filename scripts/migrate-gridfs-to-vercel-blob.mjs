import { del, head, put } from "@vercel/blob";
import { GridFSBucket, MongoClient } from "mongodb";

const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || "aqar_albatin";
const token = process.env.BLOB_READ_WRITE_TOKEN;
const dryRun = process.argv.includes("--dry-run");
const deleteGridFs = process.argv.includes("--delete-gridfs");

if (!mongoUri) throw new Error("MONGODB_URI is required.");
if (!dryRun && !token) {
  throw new Error("BLOB_READ_WRITE_TOKEN is required. Connect a private Vercel Blob store first.");
}
if (dryRun && deleteGridFs) {
  throw new Error("Do not combine --dry-run with --delete-gridfs.");
}

const client = new MongoClient(mongoUri, { maxPoolSize: 5 });
const allowedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain",
]);

function safeName(value) {
  return String(value || "file")
    .split(/[\\/]/)
    .pop()
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .slice(-100) || "file";
}

async function readGridFs(bucket, id) {
  const chunks = [];
  await new Promise((resolve, reject) => {
    const stream = bucket.openDownloadStream(id);
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("error", reject);
    stream.on("end", resolve);
  });
  return Buffer.concat(chunks);
}

async function main() {
  await client.connect();
  const db = client.db(dbName);
  const bucket = new GridFSBucket(db, { bucketName: "media" });
  const files = await db.collection("media.files").find({}).sort({ _id: 1 }).toArray();
  const mediaObjects = db.collection("media_objects");
  let migrated = 0;
  let skipped = 0;
  let wouldMigrate = 0;
  let deleted = 0;

  console.log(
    `Found ${files.length} GridFS file(s). Mode: ${dryRun ? "dry-run" : "copy"}${deleteGridFs ? " + delete legacy files" : ""}.`,
  );

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const id = String(file._id);
    const existing = await mediaObjects.findOne({ id });

    if (existing) {
      skipped += 1;
      if (deleteGridFs) {
        if (!existing.blob_url) {
          throw new Error(`Refusing to delete legacy file ${id}: Blob metadata has no URL.`);
        }
        // Verify the destination exists before deleting the original copy.
        await head(String(existing.blob_url), { token });
        await bucket.delete(file._id);
        deleted += 1;
      }
      continue;
    }

    if (dryRun) {
      wouldMigrate += 1;
      continue;
    }

    const contentType = allowedTypes.has(file.metadata?.contentType)
      ? file.metadata.contentType
      : "application/octet-stream";
    const originalName = String(file.metadata?.originalName || file.filename || "file");
    const visibility = file.metadata?.visibility === "private" ? "private" : "public";
    const bytes = await readGridFs(bucket, file._id);
    const pathname = `media/legacy/${id}/${safeName(originalName)}`;
    const blob = await put(
      pathname,
      new Blob([Uint8Array.from(bytes).buffer], { type: contentType }),
      {
        access: "private",
        token,
        contentType,
        addRandomSuffix: false,
        cacheControlMaxAge: 60 * 60 * 24 * 30,
        multipart: bytes.length > 5 * 1024 * 1024,
      },
    );

    try {
      await mediaObjects.insertOne({
        id,
        blob_url: blob.url,
        pathname: blob.pathname,
        original_name: originalName,
        owner_id: String(file.metadata?.ownerId ?? ""),
        visibility,
        content_type: contentType,
        created_at: file.uploadDate ?? new Date(),
        storage_provider: "vercel-blob",
        migrated_from_gridfs: true,
      });
    } catch (error) {
      try {
        await del(blob.url, { token });
      } catch (cleanupError) {
        console.error("Failed to clean up orphaned Blob:", cleanupError);
      }
      throw error;
    }

    migrated += 1;
    console.log(`[${index + 1}/${files.length}] Migrated ${id} (${bytes.length} bytes)`);

    if (deleteGridFs) {
      await bucket.delete(file._id);
      deleted += 1;
    }
  }

  console.log(
    JSON.stringify(
      { total: files.length, migrated, skipped, wouldMigrate, deletedGridFsFiles: deleted },
      null,
      2,
    ),
  );
}

try {
  await main();
} finally {
  await client.close();
}
