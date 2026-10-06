import { a as hashKey, c as partialMatchKey, i as notifyManager, o as matchQuery } from "../tanstack__query-core.mjs";
//#region node_modules/@tanstack/query-persist-client-core/build/modern/createPersister.js
var PERSISTER_KEY_PREFIX = "tanstack-query";
/**
* Warning: experimental feature.
* This utility function enables fine-grained query persistence.
* Simple add it as a `persister` parameter to `useQuery` or `defaultOptions` on `queryClient`.
*
* ```
* useQuery({
queryKey: ['myKey'],
queryFn: fetcher,
persister: createPersister({
storage: localStorage,
}),
})
```
*/
function experimental_createQueryPersister({ storage, buster = "", maxAge = 864e5, serialize = JSON.stringify, deserialize = JSON.parse, prefix = PERSISTER_KEY_PREFIX, refetchOnRestore = true, filters }) {
	function isExpiredOrBusted(persistedQuery) {
		if (persistedQuery.state.dataUpdatedAt) {
			const expired = Date.now() - persistedQuery.state.dataUpdatedAt > maxAge;
			const busted = persistedQuery.buster !== buster;
			if (expired || busted) return true;
			return false;
		}
		return true;
	}
	async function retrieveQuery(queryHash, afterRestoreMacroTask) {
		if (storage != null) {
			const storageKey = `${prefix}-${queryHash}`;
			try {
				const storedData = await storage.getItem(storageKey);
				if (storedData != null) {
					let persistedQuery;
					try {
						persistedQuery = await deserialize(storedData);
					} catch {
						await storage.removeItem(storageKey);
						return;
					}
					if (isExpiredOrBusted(persistedQuery)) await storage.removeItem(storageKey);
					else {
						if (afterRestoreMacroTask) notifyManager.schedule(() => afterRestoreMacroTask(persistedQuery));
						return persistedQuery.state.data;
					}
				}
			} catch (err) {
				await storage.removeItem(storageKey);
			}
		}
	}
	async function persistQueryByKey(queryKey, queryClient) {
		if (storage != null) {
			const query = queryClient.getQueryCache().find({ queryKey });
			if (query) await persistQuery(query);
		}
	}
	async function persistQuery(query) {
		if (storage != null) {
			const storageKey = `${prefix}-${query.queryHash}`;
			storage.setItem(storageKey, await serialize({
				state: query.state,
				queryKey: query.queryKey,
				queryHash: query.queryHash,
				buster
			}));
		}
	}
	async function persisterFn(queryFn, ctx, query) {
		const matchesFilter = filters ? matchQuery(filters, query) : true;
		if (matchesFilter && query.state.data === void 0 && storage != null) {
			const restoredData = await retrieveQuery(query.queryHash, (persistedQuery) => {
				query.setState({
					dataUpdatedAt: persistedQuery.state.dataUpdatedAt,
					errorUpdatedAt: persistedQuery.state.errorUpdatedAt
				});
				if (refetchOnRestore === "always" || refetchOnRestore === true && query.isStale()) query.fetch();
			});
			if (restoredData !== void 0) return Promise.resolve(restoredData);
		}
		const queryFnResult = await queryFn(ctx);
		if (matchesFilter && storage != null) notifyManager.schedule(() => {
			persistQuery(query);
		});
		return Promise.resolve(queryFnResult);
	}
	async function persisterGc() {
		if (storage?.entries) {
			const storageKeyPrefix = `${prefix}-`;
			const entries = await storage.entries();
			for (const [key, value] of entries) if (key.startsWith(storageKeyPrefix)) {
				let persistedQuery;
				try {
					persistedQuery = await deserialize(value);
				} catch {
					await storage.removeItem(key);
					continue;
				}
				if (isExpiredOrBusted(persistedQuery)) await storage.removeItem(key);
			}
		}
	}
	async function restoreQueries(queryClient, filters = {}) {
		const { exact, queryKey } = filters;
		if (storage?.entries) {
			const storageKeyPrefix = `${prefix}-`;
			const entries = await storage.entries();
			for (const [key, value] of entries) if (key.startsWith(storageKeyPrefix)) {
				let persistedQuery;
				try {
					persistedQuery = await deserialize(value);
				} catch {
					await storage.removeItem(key);
					continue;
				}
				if (isExpiredOrBusted(persistedQuery)) {
					await storage.removeItem(key);
					continue;
				}
				if (queryKey) {
					if (exact) {
						if (persistedQuery.queryHash !== hashKey(queryKey)) continue;
					} else if (!partialMatchKey(persistedQuery.queryKey, queryKey)) continue;
				}
				queryClient.setQueryData(persistedQuery.queryKey, persistedQuery.state.data, { updatedAt: persistedQuery.state.dataUpdatedAt });
			}
		}
	}
	async function removeQueries(filters = {}) {
		const { exact, queryKey } = filters;
		if (storage?.entries) {
			const entries = await storage.entries();
			const storageKeyPrefix = `${prefix}-`;
			for (const [key, value] of entries) if (key.startsWith(storageKeyPrefix)) {
				if (!queryKey) {
					await storage.removeItem(key);
					continue;
				}
				let persistedQuery;
				try {
					persistedQuery = await deserialize(value);
				} catch {
					await storage.removeItem(key);
					continue;
				}
				if (exact) {
					if (persistedQuery.queryHash !== hashKey(queryKey)) continue;
				} else if (!partialMatchKey(persistedQuery.queryKey, queryKey)) continue;
				await storage.removeItem(key);
			}
		}
	}
	return {
		persisterFn,
		persistQuery,
		persistQueryByKey,
		retrieveQuery,
		persisterGc,
		restoreQueries,
		removeQueries
	};
}
//#endregion
export { experimental_createQueryPersister as t };
