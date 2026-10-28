import { createHash, randomBytes } from "node:crypto";

/**
 * Upload hardening (blueprint §8): the client-declared MIME type is never
 * trusted. Magic bytes decide, sizes are capped and stored names are opaque.
 */

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export interface SniffResult {
  ok: boolean;
  kind?: "jpeg" | "png" | "webp" | "gif" | "heif" | "pdf";
  mime?: string;
  reason?: string;
}

export function sniffMagicBytes(bytes: Uint8Array): SniffResult {
  if (bytes.length < 12) return { ok: false, reason: "File too small to identify" };
  const hex = Buffer.from(bytes.subarray(0, 16)).toString("hex");
  const ascii = (start: number, len: number) =>
    Buffer.from(bytes.subarray(start, start + len)).toString("latin1");

  if (hex.startsWith("ffd8ff")) return { ok: true, kind: "jpeg", mime: "image/jpeg" };
  if (hex.startsWith("89504e470d0a1a0a")) return { ok: true, kind: "png", mime: "image/png" };
  if (hex.startsWith("47494638")) return { ok: true, kind: "gif", mime: "image/gif" };
  if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP")
    return { ok: true, kind: "webp", mime: "image/webp" };
  if (ascii(4, 8) === "ftyp") {
    const brand = ascii(8, 4);
    if (["heic", "heix", "hevc", "mif1", "msf1", "avif"].includes(brand))
      return { ok: true, kind: "heif", mime: `image/${brand === "avif" ? "avif" : "heic"}` };
  }
  if (ascii(0, 5) === "%PDF-") return { ok: true, kind: "pdf", mime: "application/pdf" };

  return {
    ok: false,
    reason: `Unrecognised file signature (${hex.slice(0, 8)}…). Allowed: JPEG, PNG, WEBP, GIF, HEIC/AVIF, PDF.`,
  };
}

export function validateUpload(
  declaredType: string,
  bytes: Uint8Array,
): { ok: true; kind: string; mime: string; internalName: string; sha256: string } | { ok: false; reason: string } {
  if (bytes.length > MAX_UPLOAD_BYTES) {
    return { ok: false, reason: `File exceeds the ${MAX_UPLOAD_BYTES / 1024 / 1024} MB limit` };
  }
  if (bytes.length === 0) return { ok: false, reason: "Empty file" };

  const sniff = sniffMagicBytes(bytes);
  if (!sniff.ok || !sniff.kind || !sniff.mime) {
    return { ok: false, reason: sniff.reason ?? "Unsupported file" };
  }
  if (declaredType && declaredType !== "application/octet-stream" && declaredType !== sniff.mime) {
    // Recorded, not fatal: browsers frequently send generic types.
  }

  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const internalName = `sg16/${sha256.slice(0, 2)}/${sha256.slice(2, 10)}-${randomBytes(4).toString("hex")}.${sniff.kind === "jpeg" ? "jpg" : sniff.kind}`;
  return { ok: true, kind: sniff.kind, mime: sniff.mime, internalName, sha256 };
}

export function sha256Hex(input: string | Uint8Array): string {
  return createHash("sha256").update(input).digest("hex");
}
