import { supabase } from "./supabase";

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

/** Redimensiona y comprime una imagen en el navegador antes de subirla. */
export function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("No se pudo procesar la imagen"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("No se pudo comprimir la imagen"));
        },
        "image/jpeg",
        JPEG_QUALITY,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("No se pudo leer la imagen"));
    };

    img.src = objectUrl;
  });
}

/**
 * Comprime y sube una imagen al bucket público "product-images".
 * `folder` agrupa por tipo: products, reviews, banner, levels, categories, logo.
 */
export async function uploadImage(file: File, folder: string): Promise<string> {
  const blob = await compressImage(file);
  const fileName = `${folder}/${crypto.randomUUID()}.jpg`;

  const { error } = await supabase.storage.from("product-images").upload(fileName, blob, {
    contentType: "image/jpeg",
    cacheControl: "31536000",
  });

  if (error) throw error;

  const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
  return data.publicUrl;
}

export async function deleteImageByUrl(url: string): Promise<void> {
  const marker = "/product-images/";
  const index = url.indexOf(marker);
  if (index === -1) return;
  const path = url.slice(index + marker.length);
  await supabase.storage.from("product-images").remove([path]);
}
