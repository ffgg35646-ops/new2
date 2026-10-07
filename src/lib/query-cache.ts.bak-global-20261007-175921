
import { experimental_createQueryPersister } from "@tanstack/query-persist-client-core";

const storage =
  typeof window !== "undefined" ? window.localStorage : undefined;

export const appQueryPersister = experimental_createQueryPersister({
  storage,
  prefix: "aqar-batin-query-v1",
  maxAge: 1000 * 60 * 60 * 24,
  refetchOnRestore: true,
});

export async function clearPersistedQueryCache() {
  try {
    await appQueryPersister.removeQueries({});
  } catch {
    // الكاش المحلي ليس جزءًا من صحة التطبيق.
  }
}
