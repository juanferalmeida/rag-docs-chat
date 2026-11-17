// Prueba la búsqueda desde la terminal.
// Ejecutar con: node --env-file=.env.local scripts/search-demo.mts "tu pregunta"
import { searchDocs } from "../src/lib/search.ts";

const question = process.argv[2] ?? "What is a custom hook?";
console.log(`🔍 Pregunta: "${question}"\n`);

const results = await searchDocs(question);

results.forEach((r, i) => {
  console.log(`#${i + 1}  parecido: ${Number(r.similarity).toFixed(3)}  ←  ${r.source}`);
  // Enseñamos solo el principio del trozo, en una línea
  console.log(`    "${r.content.replace(/\s+/g, " ").slice(0, 150)}..."\n`);
});

process.exit(0); // cerramos el pool de conexiones para que el script termine
