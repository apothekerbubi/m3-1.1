// Node >=18 (ESM). Läuft mit: node scripts/inventory.mjs > FILES_OVERVIEW.md

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const APP = path.join(SRC, "app");
const IGNORES = new Set(["node_modules", ".next", "dist", ".git", ".turbo", "coverage"]);

const EXT_RX = /\.(tsx?|jsx?|json|md|css)$/i;
const API_METHOD_RX = /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)/g;
const TOP_COMMENT_RX = /^\s*(\/\*[\s\S]*?\*\/|(?:(?:\/\/.*)\n?)+)/;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORES.has(name.name)) continue;
    const p = path.join(dir, name.name);
    if (name.isDirectory()) walk(p, out);
    else if (EXT_RX.test(name.name)) out.push(p);
  }
  return out;
}

function readTopComment(file) {
  try {
    const txt = fs.readFileSync(file, "utf8");
    const m = txt.match(TOP_COMMENT_RX);
    if (!m) return "";
    const raw = m[1]
      .replace(/^\/\*|\*\/$/g, "")
      .split("\n")
      .map(l => l.replace(/^\s*\*?\s?/, "").replace(/^\/\/\s?/, ""))
      .join("\n")
      .trim();
    return raw.split("\n").find(Boolean) || "";
  } catch { return ""; }
}

function rel(p) { return p.replace(ROOT + path.sep, ""); }

function routeFromAppPath(p) {
  const seg = p.replace(APP, "").replace(/\/(page|layout|route|loading|error)\.(t|j)sx?$/, "");
  return seg === "" ? "/" : seg;
}

function classify(file) {
  const r = rel(file);
  if (r.startsWith("src/app/")) {
    if (/\/route\.(t|j)sx?$/.test(r)) return "api";
    if (/\/page\.tsx$/.test(r)) return "page";
    if (/\/layout\.tsx$/.test(r)) return "layout";
    if (/\/(loading|error)\.tsx$/.test(r)) return RegExp.$1;
    return "app-other";
  }
  if (r.startsWith("src/components/")) return "component";
  if (r.startsWith("src/lib/")) return "lib";
  if (r.startsWith("src/data/")) return "data";
  if (r.startsWith("public/")) return "asset";
  return "other";
}

function methodsIn(file) {
  const txt = fs.readFileSync(file, "utf8");
  const methods = new Set();
  let m; while ((m = API_METHOD_RX.exec(txt))) methods.add(m[1]);
  return [...methods].sort();
}

const files = walk(SRC);

const pages = [], layouts = [], apis = [], components = [], libs = [], data = [], others = [];

for (const f of files) {
  const kind = classify(f);
  const size = fs.statSync(f).size;
  const top = readTopComment(f);

  if (kind === "page") pages.push({ route: routeFromAppPath(f), file: rel(f), desc: top, size });
  else if (kind === "layout") layouts.push({ route: routeFromAppPath(f), file: rel(f), desc: top, size });
  else if (kind === "api") apis.push({ route: routeFromAppPath(f), file: rel(f), methods: methodsIn(f), desc: top, size });
  else if (kind === "component") components.push({ name: path.basename(f).replace(/\.(t|j)sx$/, ""), file: rel(f), desc: top, size });
  else if (kind === "lib") libs.push({ file: rel(f), desc: top, size });
  else if (kind === "data") data.push({ file: rel(f), desc: top, size });
  else others.push({ file: rel(f), desc: top, size });
}

pages.sort((a,b)=>a.route.localeCompare(b.route));
layouts.sort((a,b)=>a.route.localeCompare(b.route));
apis.sort((a,b)=>a.route.localeCompare(b.route));
components.sort((a,b)=>a.name.localeCompare(b.name));
libs.sort((a,b)=>a.file.localeCompare(b.file));
data.sort((a,b)=>a.file.localeCompare(b.file));
others.sort((a,b)=>a.file.localeCompare(b.file));

function kb(n){ return (n/1024).toFixed(1)+" KB"; }

console.log(`# Projekt-Inventar

> Automatisch erzeugt von \`scripts/inventory.mjs\`.

---

## App-Routen (Pages)
| Route | Datei | Beschreibung | Größe |
|---|---|---:|---:|`);
for (const p of pages) console.log(`| \`${p.route}\` | \`${p.file}\` | ${p.desc || "–"} | ${kb(p.size)} |`);

console.log(`
## Layouts
| Route | Datei | Beschreibung | Größe |
|---|---|---:|---:|`);
for (const p of layouts) console.log(`| \`${p.route}\` | \`${p.file}\` | ${p.desc || "–"} | ${kb(p.size)} |`);

console.log(`
## API-Routen
| Route | Methoden | Datei | Beschreibung | Größe |
|---|---|---|---|---:|`);
for (const a of apis) {
  const m = a.methods.length ? a.methods.join(", ") : "–";
  console.log(`| \`${a.route}\` | ${m} | \`${a.file}\` | ${a.desc || "–"} | ${kb(a.size)} |`);
}

console.log(`
## UI-Komponenten
| Name | Datei | Beschreibung | Größe |
|---|---|---|---:|`);
for (const c of components) console.log(`| \`${c.name}\` | \`${c.file}\` | ${c.desc || "–"} | ${kb(c.size)} |`);

console.log(`
## Lib/Utilities
| Datei | Beschreibung | Größe |
|---|---|---:|`);
for (const l of libs) console.log(`| \`${l.file}\` | ${l.desc || "–"} | ${kb(l.size)} |`);

console.log(`
## Daten
| Datei | Beschreibung | Größe |
|---|---|---:|`);
for (const d of data) console.log(`| \`${d.file}\` | ${d.desc || "–"} | ${kb(d.size)} |`);

if (others.length) {
  console.log(`
## Sonstiges
| Datei | Beschreibung | Größe |
|---|---|---:|`);
  for (const o of others) console.log(`| \`${o.file}\` | ${o.desc || "–"} | ${kb(o.size)} |`);
}

const jsonOut = {
  generatedAt: new Date().toISOString(),
  pages, layouts, apis, components, libs, data, others,
};
fs.writeFileSync(path.join(ROOT, "FILES_OVERVIEW.json"), JSON.stringify(jsonOut, null, 2));
