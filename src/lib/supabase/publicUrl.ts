const SUPABASE_PREFIX = "storage/v1/object/public/";

export function publicImageUrl(path: string, bucket = "cases") {
  const rawBase = process.env.NEXT_PUBLIC_SUPABASE_URL; // z.B. https://paipgrtwdfakzxhsuqog.supabase.co
  if (!rawBase) throw new Error("NEXT_PUBLIC_SUPABASE_URL fehlt");

  // Nutzer:innen tragen die URL mitunter mit Leerzeichen oder trailing Slashes ein.
  const base = rawBase.trim().replace(/\/+$/, "");
  if (!base) throw new Error("NEXT_PUBLIC_SUPABASE_URL ist leer");

  const trimmed = path.trim();

  // 1) Bereits absolute URL? -> unverändert zurückgeben
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  // 2) Bereits Supabase-Relative URL? -> Prefix entfernen
  let objectPath = trimmed.replace(/^\/+/, "");

  if (objectPath.startsWith(SUPABASE_PREFIX)) {
    objectPath = objectPath.slice(SUPABASE_PREFIX.length);
  } else if (objectPath.startsWith(`/${SUPABASE_PREFIX}`)) {
    objectPath = objectPath.slice(SUPABASE_PREFIX.length + 1);
  } else if (objectPath.startsWith("object/public/")) {
    objectPath = objectPath.slice("object/public/".length);
  } else if (objectPath.startsWith("public/")) {
    objectPath = objectPath.slice("public/".length);
  }

  // 3) Bucket-Duplikate entfernen (aber Bucket nicht automatisch ändern)
  if (objectPath.startsWith(`${bucket}/`)) {
    objectPath = objectPath.slice(bucket.length + 1);
  }

  // 4) Sicher encodieren (Leerzeichen/Umlaute)
  const encoded = objectPath
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  if (!encoded) {
    throw new Error(`Ungültiger Supabase-Pfad: "${path}"`);
  }

  return `${base}/storage/v1/object/public/${bucket}/${encoded}`;
}
