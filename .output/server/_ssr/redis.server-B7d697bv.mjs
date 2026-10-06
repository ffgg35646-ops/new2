import { t as Redis2 } from "../_libs/uncrypto+unenv+upstash__redis.mjs";
import processModule from "node:process";
//#region node_modules/.nitro/vite/services/ssr/assets/redis.server-B7d697bv.js
var redis;
function getRedis() {
	if (redis !== void 0) return redis;
	const url = processModule.env.UPSTASH_REDIS_REST_URL;
	const token = processModule.env.UPSTASH_REDIS_REST_TOKEN;
	if (!url || !token) {
		redis = null;
		return redis;
	}
	redis = new Redis2({
		url,
		token
	});
	return redis;
}
async function cachedServerData(key, ttlSeconds, loader) {
	const client = getRedis();
	if (!client) return loader();
	try {
		const cached = await client.get(key);
		if (cached !== null && cached !== void 0) return cached;
	} catch {}
	const fresh = await loader();
	try {
		await client.set(key, fresh, { ex: ttlSeconds });
	} catch {}
	return fresh;
}
//#endregion
export { cachedServerData };
