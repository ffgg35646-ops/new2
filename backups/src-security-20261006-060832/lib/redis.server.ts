
import { Redis } from "@upstash/redis";

let redis: Redis | null | undefined;

function getRedis() {
  if (redis !== undefined) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    redis = null;
    return redis;
  }

  redis = new Redis({ url, token });
  return redis;
}

export async function cachedServerData<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  const client = getRedis();

  if (!client) {
    return loader();
  }

  try {
    const cached = await client.get<T>(key);

    if (cached !== null && cached !== undefined) {
      return cached;
    }
  } catch {
    // لو Redis وقع، التطبيق يكمل مباشرة من Supabase.
  }

  const fresh = await loader();

  try {
    await client.set(key, fresh, { ex: ttlSeconds });
  } catch {
    // فشل الكاش لا يجب أن يفشل الطلب الأساسي.
  }

  return fresh;
}
