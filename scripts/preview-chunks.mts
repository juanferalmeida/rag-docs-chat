// Muestra cómo quedan los trozos, SIN guardar nada en la base de datos.
// Ejecutar con: node scripts/preview-chunks.mts
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { chunkDocument } from "./chunking.mts";

const DOCS_DIR = "docs";

let total = 0;
for (const folder of readdirSync(DOCS_DIR)) {
  // folder = "react", "angular", "nextjs"
  for (const file of readdirSync(join(DOCS_DIR, folder))) {
    const source = `${folder}/${file}`;
    const text = readFileSync(join(DOCS_DIR, folder, file), "utf8");
    const chunks = chunkDocument(source, text);
    console.log(`${String(chunks.length).padStart(3)} trozos  ←  ${source}`);
    total += chunks.length;
  }
}
console.log(`\nTOTAL: ${total} trozos`);

// Enseñamos un trozo de ejemplo entero
const ejemplo = chunkDocument(
  "react/passing-props-to-a-component.md",
  readFileSync("docs/react/passing-props-to-a-component.md", "utf8"),
)[1];
console.log("\n─── Ejemplo de trozo ───────────────────────────");
console.log(ejemplo.content);
console.log("────────────────────────────────────────────────");
