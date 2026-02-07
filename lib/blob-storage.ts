/**
 * Vercel Blob storage helper.
 * Wraps @vercel/blob for uploading and deleting documents.
 */

import { put, del } from "@vercel/blob";

/**
 * Upload a file to Vercel Blob.
 * Returns the public URL of the uploaded blob.
 */
export async function uploadToBlob(
  file: File,
  options?: { folder?: string }
): Promise<string> {
  const pathname = options?.folder
    ? `${options.folder}/${file.name}`
    : file.name;

  const blob = await put(pathname, file, {
    access: "public",
    addRandomSuffix: true,
  });

  return blob.url;
}

/**
 * Delete a blob by its URL.
 */
export async function deleteFromBlob(url: string): Promise<void> {
  await del(url);
}
