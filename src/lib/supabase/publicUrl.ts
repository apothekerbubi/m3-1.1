export type ResolvedStoragePath =
  | { kind: "absolute"; src: string }
  | { kind: "storage"; bucket: string; objectPath: string };

export function resolveStoragePath(
  path: string,
  bucket = "cases"
): ResolvedStoragePath {
  if (/^https?:\/\//i.test(path)) {
    return { kind: "absolute", src: path };
  }

  const cleaned = path.replace(/^\/+/, "");
  const parts = cleaned.split("/");

  if (parts.length > 1 && parts[0] !== bucket) {
    return {
      kind: "storage",
      bucket: parts[0],
      objectPath: parts.slice(1).join("/"),
    };
  }

  return {
    kind: "storage",
    bucket,
    objectPath: cleaned,
  };
}

export function publicImageUrl(path: string, bucket = "cases") {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL; // z.B. https://paipgrtwdfakzxhsuqog.supabase.co
  if (!base) throw new Error("NEXT_PUBLIC_SUPABASE_URL fehlt");

  const resolved = resolveStoragePath(path, bucket);
  if (resolved.kind === "absolute") {
    return resolved.src;
  }

  const encoded = resolved.objectPath
    .split("/")
    .map(encodeURIComponent)
    .join("/");

  return `${base}/storage/v1/object/public/${resolved.bucket}/${encoded}`;
}