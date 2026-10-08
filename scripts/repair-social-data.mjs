import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || "aqar_albatin";

if (!uri) throw new Error("MONGODB_URI is required");

const client = new MongoClient(uri);
await client.connect();

try {
  const db = client.db(dbName);

  const follows = db.collection("follows");
  const followGroups = await follows
    .aggregate([
      {
        $group: {
          _id: { user_id: "$user_id", office_id: "$office_id" },
          ids: { $push: "$_id" },
          count: { $sum: 1 },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ])
    .toArray();

  let deletedFollows = 0;

  for (const group of followGroups) {
    const [keep, ...duplicates] = group.ids;
    if (!keep || !duplicates.length) continue;

    const result = await follows.deleteMany({
      _id: { $in: duplicates },
    });
    deletedFollows += result.deletedCount;
  }

  const reviews = db.collection("office_reviews");
  const reviewGroups = await reviews
    .aggregate([
      {
        $group: {
          _id: { user_id: "$user_id", office_id: "$office_id" },
          ids: { $push: "$_id" },
          count: { $sum: 1 },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ])
    .toArray();

  let deletedReviews = 0;

  for (const group of reviewGroups) {
    const ids = group.ids || [];
    if (ids.length < 2) continue;

    const result = await reviews.deleteMany({
      _id: { $in: ids.slice(1) },
    });
    deletedReviews += result.deletedCount;
  }

  const offices = db.collection("offices");
  const officeRows = await offices.find({}, { projection: { id: 1 } }).toArray();

  for (const office of officeRows) {
    const rows = await reviews
      .find({ office_id: office.id }, { projection: { rating: 1 } })
      .toArray();

    const count = rows.length;
    const average = count
      ? Math.round(
          (rows.reduce((sum, row) => sum + Number(row.rating || 0), 0) / count) * 10,
        ) / 10
      : 0;

    await offices.updateOne(
      { id: office.id },
      {
        $set: {
          rating_avg: average,
          reviews_count: count,
          updated_at: new Date(),
        },
      },
    );
  }

  console.log("Social data repair completed.");
  console.log("Deleted duplicate follows:", deletedFollows);
  console.log("Deleted duplicate reviews:", deletedReviews);
} finally {
  await client.close();
}
