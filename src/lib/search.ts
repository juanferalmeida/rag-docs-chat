// BÚSQUEDA: dada una pregunta, devuelve los trozos de documentación más parecidos.
import pg from "pg";
import { embed } from "ai";
import { ollama } from "ollama-ai-provider-v2";

// Pool = un grupo de conexiones a Postgres que se reutilizan entre peticiones
// (abrir una conexión nueva cada vez sería lento)
const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export type SearchResult = {
  source: string;
  content: string;
  similarity: number; // 1 = idéntico, 0 = nada que ver
};

export async function searchDocs(question: string, limit = 3): Promise<SearchResult[]> {
  // 1. Pregunta → números (igual que en la ingesta, pero con "search_query:")
  const { embedding } = await embed({
    model: ollama.textEmbeddingModel("nomic-embed-text"),
    value: `search_query: ${question}`,
  });

  // 2. Pedimos a Postgres los trozos más cercanos
  //    <=> = distancia entre embeddings (pequeña = parecidos)
  //    1 - distancia = parecido (para que se lea como en el experimento)
  const { rows } = await db.query<SearchResult>(
    `SELECT source, content, 1 - (embedding <=> $1) AS similarity
     FROM chunks
     ORDER BY embedding <=> $1
     LIMIT $2`,
    [JSON.stringify(embedding), limit],
  );

  return rows;
}
