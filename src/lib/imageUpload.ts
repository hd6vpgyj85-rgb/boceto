import { supabase } from "./supabase";

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen");
  ctx.drawImage(bitmap, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo comprimir la imagen"))),
      "image/jpeg",
      JPEG_QUALITY
    );
  });
}

export async function uploadProductImage(file: File): Promise<string> {
  const blob = await compressImage(file);
  const fileName = `${crypto.randomUUID()}.jpg`;
  const path = `products/${fileName}`;

  const { error } = await supabase.storage.from("product-images").upload(path, blob, {
    contentType: "image/jpeg",
    cacheControl: "31536000",
  });

  if (error) throw error;

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadImageFromUrl(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  const file = new File([blob], "import.jpg", { type: blob.type || "image/jpeg" });
  return uploadProductImage(file);
}

export async function uploadReviewImage(file: File): Promise<string> {
  const blob = await compressImage(file);
  const fileName = `${crypto.randomUUID()}.jpg`;
  const path = `reviews/${fileName}`;

  const { error } = await supabase.storage.from("product-images").upload(path, blob, {
    contentType: "image/jpeg",
    cacheControl: "31536000",
  });

  if (error) throw error;

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}
