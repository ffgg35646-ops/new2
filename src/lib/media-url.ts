const BUCKET = "property-media";

function extractLegacyPath(value: string): string | null {
  if (!value) return null;

  if (value.startsWith(`storage://${BUCKET}/`)) {
    return value.slice(`storage://${BUCKET}/`.length);
  }

  return null;
}

function mediaUrl(id: string) {
  return "/api/media/" + encodeURIComponent(id);
}

export function storageRef(path: string) {
  return mediaUrl(path);
}

export async function resolveMediaUrl(
  value: string | null | undefined,
) {
  if (!value) return null;

  if (value.startsWith("/api/media/")) {
    return value;
  }

  const legacyPath = extractLegacyPath(value);
  if (legacyPath) {
    return mediaUrl(legacyPath);
  }

  return value;
}
