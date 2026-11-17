// Trocea un documento Markdown en "chunks" (trozos) listos para convertir en embeddings.

export type Chunk = {
  source: string; // archivo de origen, ej: "react/rendering-lists.md"
  content: string; // el texto del trozo (con el título de la página delante)
};

const MAX_CHARS = 2000; // tamaño máximo aproximado de un trozo

// ─── 1. Sacar el título de la página ─────────────────────────────────────────
function getTitle(text: string, fallback: string): string {
  const match =
    text.match(/^title:\s*(.+)$/m) ?? // React y Next:  "title: Passing Props..."
    text.match(/<docs-decorative-header title="([^"]+)"/) ?? // Angular
    text.match(/^# (.+)$/m); // Markdown normal: "# Título"
  return match ? match[1].trim() : fallback;
}

// ─── 2. Limpiar el "ruido" ───────────────────────────────────────────────────
// Quitamos cosas que son para pintar la web, no contenido.
// OJO: dentro de los bloques de código (```) no tocamos nada,
// porque ahí <div> o <Button> SÍ son contenido.
function clean(text: string): string {
  text = text.replace(/^---\n[\s\S]*?\n---\n/, ""); // cabecera "--- title: ... ---"

  let inCode = false;
  const lines: string[] = [];

  for (let line of text.split("\n")) {
    if (line.trim().startsWith("```")) inCode = !inCode; // entramos/salimos de un bloque de código

    if (!inCode) {
      line = line
        .replace(/\{\/\*.*?\*\/\}/g, "") // {/*ancla*/}  (anclas de React)
        .replace(/<!--.*?-->/g, ""); // <!-- comentarios -->
      // Línea que solo es una etiqueta, ej: "<Intro>", "</Sandpack>"
      if (/^\s*<\/?[A-Za-z][^>]*>\s*$/.test(line)) continue;
    }
    lines.push(line);
  }
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim(); // quita líneas vacías de sobra
}

// ─── 3. Cortar por títulos ## y ### ──────────────────────────────────────────
function splitByHeadings(text: string): string[] {
  const sections: string[] = [];
  let current: string[] = [];
  let inCode = false;

  for (const line of text.split("\n")) {
    if (line.trim().startsWith("```")) inCode = !inCode;
    // Un título nuevo (fuera de código) cierra la sección anterior
    if (!inCode && /^#{2,3} /.test(line) && current.length > 0) {
      sections.push(current.join("\n").trim());
      current = [];
    }
    current.push(line);
  }
  sections.push(current.join("\n").trim());
  return sections.filter((s) => s.length > 0);
}

// ─── 4. Si una sección es muy larga, cortarla por párrafos ───────────────────
function splitLongSection(section: string): string[] {
  if (section.length <= MAX_CHARS) return [section];

  const parts: string[] = [];
  let current = "";
  for (const paragraph of section.split("\n\n")) {
    if (current.length + paragraph.length > MAX_CHARS && current.length > 0) {
      parts.push(current.trim());
      current = "";
    }
    current += paragraph + "\n\n";
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

// ─── Todo junto ──────────────────────────────────────────────────────────────
export function chunkDocument(source: string, rawText: string): Chunk[] {
  const title = getTitle(rawText, source);
  const text = clean(rawText);

  return splitByHeadings(text)
    .flatMap(splitLongSection)
    .filter((piece) => piece.length > 50) // descartamos trozos casi vacíos
    .map((piece) => ({
      source,
      // Ponemos el título delante para que el trozo no pierda el contexto
      content: `${title}\n\n${piece}`,
    }));
}
