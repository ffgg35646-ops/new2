import {
  experimental_createQueryPersister,
} from "@tanstack/query-persist-client-core";

const storage =
  typeof window !== "undefined"
    ? window.localStorage
    : undefined;

export const appQueryPersister =
  experimental_createQueryPersister({
    storage,

    // اسم منفصل للكاش الجديد.
    prefix: "aqar-batin-query-v2",

    // احتفظ بالبيانات المحفوظة حتى 24 ساعة.
    // staleTime هو الذي يحدد هل نحتاج تحديثًا في الخلفية.
    maxAge: 24 * 60 * 60_000,

    // لو البيانات قديمة، اسمح بإعادة تحميلها.
    refetchOnRestore: true,
  });

export async function clearPersistedQueryCache() {
  try {
    await appQueryPersister.removeQueries({});
  } catch {
    // الكاش اختياري.
  }
}
