const DB_NAME = "aqar-pending-signup";
const STORE_NAME = "files";
const AVATAR_KEY = "profile-avatar";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

type StoredAvatar = {
  blob: Blob;
  fileName: string;
  mimeType: string;
  lastModified: number;
  savedAt: number;
};

function openAvatarDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("المتصفح لا يدعم حفظ الصورة مؤقتًا."));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("تعذّر حفظ الصورة مؤقتًا."));
    request.onblocked = () =>
      reject(new Error("أغلق تبويبًا آخر للموقع ثم حاول اختيار الصورة مجددًا."));
  });
}

/** Keep the selected image on this device until email verification creates a session. */
export async function savePendingSignupAvatar(file: File): Promise<void> {
  const db = await openAvatarDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(
      {
        blob: file.slice(0, file.size, file.type),
        fileName: file.name || "profile-avatar",
        mimeType: file.type,
        lastModified: file.lastModified,
        savedAt: Date.now(),
      } satisfies StoredAvatar,
      AVATAR_KEY,
    );

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error ?? new Error("تعذّر حفظ الصورة مؤقتًا."));
    };
    transaction.onabort = () => {
      db.close();
      reject(transaction.error ?? new Error("تعذّر حفظ الصورة مؤقتًا."));
    };
  });
}

/** Return the selected image only while the temporary copy is still fresh. */
export async function getPendingSignupAvatar(): Promise<File | null> {
  const db = await openAvatarDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(AVATAR_KEY);

    request.onsuccess = () => {
      const record = request.result as StoredAvatar | undefined;
      if (
        !record ||
        !(record.blob instanceof Blob) ||
        typeof record.fileName !== "string" ||
        typeof record.mimeType !== "string" ||
        typeof record.savedAt !== "number" ||
        Date.now() - record.savedAt > MAX_AGE_MS
      ) {
        store.delete(AVATAR_KEY);
        resolve(null);
        return;
      }

      resolve(new File([record.blob], record.fileName, {
        type: record.mimeType,
        lastModified: record.lastModified,
      }));
    };

    transaction.onerror = () => {
      db.close();
      reject(transaction.error ?? new Error("تعذّر استعادة الصورة المختارة."));
    };
    transaction.oncomplete = () => db.close();
  });
}

export async function clearPendingSignupAvatar(): Promise<void> {
  const db = await openAvatarDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(AVATAR_KEY);

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error ?? new Error("تعذّر حذف الصورة المؤقتة."));
    };
    transaction.onabort = () => {
      db.close();
      reject(transaction.error ?? new Error("تعذّر حذف الصورة المؤقتة."));
    };
  });
}
