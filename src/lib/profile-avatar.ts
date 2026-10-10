export async function prepareProfileAvatar(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = new Image();
    image.src = objectUrl;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("تعذّر قراءة الصورة."));
    });

    const maxDimension = 640;
    const scale = Math.min(
      1,
      maxDimension / Math.max(image.naturalWidth, image.naturalHeight),
    );
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("تعذّر تجهيز الصورة.");

    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function profileAvatarFileFromDataUrl(dataUrl: string): File {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([\s\S]+)$/.exec(dataUrl);
  if (!match) throw new Error("صورة البروفايل المؤقتة غير صالحة.");

  const mimeType = match[1] ?? "image/jpeg";
  const encoded = match[2];
  if (!encoded) throw new Error("بيانات صورة البروفايل غير مكتملة.");
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  const extension = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
  return new File([bytes], `profile-avatar.${extension}`, { type: mimeType });
}
