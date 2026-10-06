import { supabase } from "@/integrations/supabase/client";

const BUCKET = "property-media";

function extractPath(value: string): string | null {
  if (!value) return null;

  // الرابط الجديد:
  // storage://property-media/user/folder/file.jpg
  if (value.startsWith(`storage://${BUCKET}/`)) {
    return value.slice(`storage://${BUCKET}/`.length);
  }

  try {
    const url = new URL(value);

    const marker = `/storage/v1/object/`;

    const index = url.pathname.indexOf(marker);

    if (index === -1) return null;

    const rest = url.pathname.slice(
      index + marker.length,
    );

    const prefixes = [
      `sign/${BUCKET}/`,
      `public/${BUCKET}/`,
      `authenticated/${BUCKET}/`,
    ];

    for (const prefix of prefixes) {
      if (rest.startsWith(prefix)) {
        return decodeURIComponent(
          rest.slice(prefix.length),
        );
      }
    }
  } catch {}

  return null;
}

export function storageRef(path: string) {
  return `storage://${BUCKET}/${path}`;
}

export async function resolveMediaUrl(
  value: string | null | undefined,
) {
  if (!value) return null;

  const path = extractPath(value);

  // رابط خارجي عادي
  if (!path) {
    return value;
  }

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60 * 24);

  if (error) {
    console.warn(
      "[media] failed to refresh signed url",
      error,
    );
    return null;
  }

  return data.signedUrl;
}
