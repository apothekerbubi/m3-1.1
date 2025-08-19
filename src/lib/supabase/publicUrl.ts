export function publicImageUrl(path: string, bucket = "cases") {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL; // z.B. https://paipgrtwdfakzxhsuqog.supabase.co
  if (!base) throw new Error("NEXT_PUBLIC_SUPABASE_URL fehlt");

  // 1) Bereits absolute URL? -> unverändert zurückgeben
  if (/^https?:\/\//i.test(path)) return path;

  // 2) Pfad säubern
  const cleaned = path.replace(/^\/+/, "");

  // 3) Wenn path wie "<bucket>/<objekt>" aussieht, nimm den ersten Teil als Bucket
  const parts = cleaned.split("/");
  let finalBucket = bucket;
  let objectPath = cleaned;

  if (parts.length > 1 && parts[0] !== bucket) {
    finalBucket = parts[0];             // z.B. "Roentgen"
    objectPath = parts.slice(1).join("/"); // z.B. "Spannungspneumothorax.png"
  }

  // 4) Sicher encodieren (Leerzeichen/Umlaute)
  const encoded = objectPath.split("/").map(encodeURIComponent).join("/");

  return `${base}/storage/v1/object/public/${finalBucket}/${encoded}`;
}