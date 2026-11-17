// Experimento: ¿los embeddings ponen "cerca" las frases con significado parecido?
// Ejecutar con: node scripts/embeddings-demo.mts
import { embedMany, cosineSimilarity } from "ai";
import { ollama } from "ollama-ai-provider-v2";

const pregunta = "¿Cómo instalo React?";

const frases = [
  "Pasos para instalar React en tu proyecto",
  "Ejecuta npm install react para añadirlo",
  "Los hooks permiten usar estado en componentes",
  "Receta de paella valenciana",
];

// 1. Convertimos todas las frases en listas de números (embeddings)
const { embeddings } = await embedMany({
  model: ollama.textEmbeddingModel("nomic-embed-text"),
  values: [pregunta, ...frases],
});

const [embPregunta, ...embFrases] = embeddings;

console.log(`Cada texto se convierte en ${embPregunta.length} números.`);
console.log(`Los 5 primeros de la pregunta: [${embPregunta.slice(0, 5).map((n) => n.toFixed(3)).join(", ")}, ...]\n`);

// 2. Medimos lo "cerca" que está cada frase de la pregunta (1 = idéntico, 0 = nada que ver)
console.log(`Pregunta: "${pregunta}"\n`);
frases.forEach((frase, i) => {
  const parecido = cosineSimilarity(embPregunta, embFrases[i]);
  console.log(`${parecido.toFixed(3)}  ←  "${frase}"`);
});
