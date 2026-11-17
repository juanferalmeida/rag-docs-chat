// INGESTA: lee docs/, trocea, calcula embeddings y lo guarda todo en la tabla `chunks`.
// Ejecutar con: node --env-file=.env.local scripts/ingest.mts
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import { embedMany } from "ai";
import { ollama } from "ollama-ai-provider-v2";
import { chunkDocument, type Chunk } from "./chunking.mts";

const DOCS_DIR = "docs";
const BATCH_SIZE = 50; // cuántos trozos mandamos al modelo de una vez

// ─── 1. Trocear todos los documentos ─────────────────────────────────────────
const chunks: Chunk[] = [];
for (const folder of readdirSync(DOCS_DIR)) {
  for (const file of readdirSync(join(DOCS_DIR, folder))) {
    const text = readFileSync(join(DOCS_DIR, folder, file), "utf8");
    chunks.push(...chunkDocument(`${folder}/${file}`, text));
  }
}
console.log(`✂️  ${chunks.length} trozos preparados`);

// ─── 2. Conectar a Postgres ──────────────────────────────────────────────────
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

// Vaciamos la tabla antes de llenarla. Así, si ejecutas el script dos veces,
// no se duplican los trozos.
await db.query("TRUNCATE chunks RESTART IDENTITY");

// ─── 3. Por lotes: embeddings + INSERT ───────────────────────────────────────
for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
  const batch = chunks.slice(i, i + BATCH_SIZE); // ej: trozos 0-49, luego 50-99...

  const { embeddings } = await embedMany({
    model: ollama.textEmbeddingModel("nomic-embed-text"),
    // nomic-embed-text funciona mejor si le dices QUÉ es cada texto:
    // "search_document:" = esto es un documento donde se va a buscar
    values: batch.map((chunk) => `search_document: ${chunk.content}`),
  });

  // Guardamos cada trozo con su embedding. Mismo truco de antes:
  // batch[j] y embeddings[j] van en paralelo (misma posición = mismo trozo)
  for (let j = 0; j < batch.length; j++) {
    await db.query(
      "INSERT INTO chunks (source, content, embedding) VALUES ($1, $2, $3)",
      [batch[j].source, batch[j].content, JSON.stringify(embeddings[j])],
    );
  }

  console.log(`💾 ${Math.min(i + BATCH_SIZE, chunks.length)} / ${chunks.length}`);
}

await db.end();
console.log("✅ Ingesta terminada");
