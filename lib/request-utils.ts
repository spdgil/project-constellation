export interface JsonReadResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  status?: number;
}

export async function readJsonWithLimit<T>(
  request: Request,
  maxBytes: number,
): Promise<JsonReadResult<T>> {
  const lengthHeader = request.headers.get("content-length");
  if (lengthHeader) {
    const parsed = Number.parseInt(lengthHeader, 10);
    if (Number.isFinite(parsed) && parsed > maxBytes) {
      return {
        ok: false,
        error: "Request payload too large",
        status: 413,
      };
    }
  }

  const text = await request.text();
  const size = typeof Buffer !== "undefined"
    ? Buffer.byteLength(text, "utf8")
    : new TextEncoder().encode(text).length;

  if (size > maxBytes) {
    return {
      ok: false,
      error: "Request payload too large",
      status: 413,
    };
  }

  try {
    return { ok: true, data: JSON.parse(text) as T };
  } catch {
    return { ok: false, error: "Invalid JSON", status: 400 };
  }
}
