import {
  streamText,
  type UIMessage,
  convertToModelMessages,
  createUIMessageStreamResponse,
  toUIMessageStream,
} from "ai";

import { ollama } from "ollama-ai-provider-v2";
import { searchDocs } from "@/lib/search";

export async function POST(req: Request) {
  // 1. Leemos los mensajes que manda la página
  const { messages }: { messages: UIMessage[] } = await req.json();

  // 2. 🆕 Sacamos el texto de la ÚLTIMA pregunta del usuario
  const lastMessage = messages[messages.length - 1];
  const question = lastMessage.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join(" ");

  // 3. 🆕 Buscamos los trozos de documentación más parecidos
  const results = await searchDocs(question);

  // 4. 🆕 Juntamos los trozos en un solo texto, indicando de qué archivo viene cada uno
  const context = results
    .map((r) => `[Fuente: ${r.source}]\n${r.content}`)
    .join("\n\n---\n\n");

  // 5. Llamamos al modelo, ahora CON instrucciones (system) y los apuntes
  const result = streamText({
    model: ollama("llama3.2"),
    system: `Eres un asistente que responde preguntas sobre documentación de React, Angular y Next.js.

Responde SOLO con la información de la documentación que tienes abajo.
Si la respuesta no está en la documentación, di que no lo sabes. No te lo inventes.
Al final de tu respuesta, indica las fuentes que has usado.
Responde en el mismo idioma en que te pregunta el usuario.

DOCUMENTACIÓN:
${context}`,
    messages: await convertToModelMessages(messages),
  });

  // 6. Devolvemos la respuesta en streaming (va llegando poco a poco)
  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}
