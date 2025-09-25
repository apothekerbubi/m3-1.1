export function publicImageUrl(path: string, bucket = "cases") {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL; // z.B. https://paipgrtwdfakzxhsuqog.supabase.co
  if (!base) throw new Error("NEXT_PUBLIC_SUPABASE_URL fehlt");

  // 1) Bereits absolute URL? -> unverändert zurückgeben
  if (/^https?:\/\//i.test(path)) return path;

  // 2) Pfad säubern
  const cleaned = path.replace(/^\/+/, "");

  let objectPath = cleaned;

  // 3) Falls der Pfad bereits mit dem Bucket beginnt, Prefix entfernen
  if (objectPath.startsWith(`${bucket}/`)) {
    objectPath = objectPath.slice(bucket.length + 1);
  }

  // 4) Sicher encodieren (Leerzeichen/Umlaute)
  const encoded = objectPath.split("/").map(encodeURIComponent).join("/");

  return `${base}/storage/v1/object/public/${bucket}/${encoded}`;
}