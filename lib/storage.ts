import { supabase } from "./supabase";

export async function uploadPostPhoto(userId: string, file: File): Promise<string> {
  // Compress on client
  const compressed = await compressImage(file);
  const ext = "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("posts")
    .upload(path, compressed, { contentType: "image/jpeg", upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from("posts").getPublicUrl(path);
  return data.publicUrl;
}

export async function deletePostPhoto(url: string): Promise<void> {
  // Extract path from URL: ...storage/v1/object/public/posts/userId/file.jpg
  const match = url.match(/\/posts\/(.+)$/);
  if (!match) return;
  const path = match[1];
  await supabase.storage.from("posts").remove([path]);
}

function compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("Compression failed"))),
          "image/jpeg",
          quality
        );
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
