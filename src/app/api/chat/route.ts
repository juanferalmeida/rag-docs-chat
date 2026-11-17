import {
  streamText,
  type UIMessage,
  convertToModelMessages,
  createUIMessageStreamResponse,
  toUIMessageStream,
} from "ai";

import { ollama } from "ollama-ai-provider-v2";

export async function POST(req: Request) {
  // 1. Leemos los mensajes que manda la página
  const { messages }: { messages: UIMessage[] } = await req.json();

  // 2. Se los pasamos al modelo (convertidos a su formato)
  const result = streamText({
    model: ollama("llama3.2"),
    messages: await convertToModelMessages(messages),
  });

  // 3. Devolvemos la respuesta en streaming (va llegando poco a poco)
  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}
