/**
 * Client-side text extraction from uploaded files.
 * Supports PDF (via pdfjs-dist) and plain text files.
 *
 * pdfjs-dist is loaded via dynamic import to avoid SSR errors
 * (it references browser-only globals like DOMMatrix at module scope).
 */

/** Supported MIME types for upload. */
export const ACCEPTED_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/csv",
] as const;

/** File extensions shown in the accept attribute. */
export const ACCEPTED_EXTENSIONS = ".pdf,.txt,.md,.csv";

/** Max file size: 20 MB */
export const MAX_FILE_SIZE = 20 * 1024 * 1024;

/** Lazily-loaded pdfjs-dist module (cached after first import). */
let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;

async function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((mod) => {
      mod.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url
      ).toString();
      return mod;
    });
  }
  return pdfjsPromise;
}

/** Extract text content from a File object. */
export async function extractTextFromFile(file: File): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 20 MB.`
    );
  }

  if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
    return extractTextFromPdf(file);
  }

  // Plain text, markdown, CSV — read as UTF-8
  return file.text();
}

/** Extract text from a PDF file using pdfjs-dist. */
async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjsLib = await getPdfjs();
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  const pageTexts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items
      .filter((item) => "str" in item && typeof (item as Record<string, unknown>).str === "string")
      .map((item) => (item as Record<string, unknown>).str as string);
    pageTexts.push(strings.join(" "));
  }

  return pageTexts.join("\n\n");
}
