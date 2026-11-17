"use client"; // useChat usa estado → tiene que ser un Client Component

import { useState } from "react";
import { useChat } from "@ai-sdk/react";

export default function Home() {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState("");

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
      {/* 1. Pintamos cada mensaje de la conversación */}
      {messages.map((message) => (
        <div key={message.id}>
          <strong>{message.role === "user" ? "Tú" : "IA"}:</strong>{" "}
          {message.parts.map((part, i) =>
            part.type === "text" ? <span key={i}>{part.text}</span> : null,
          )}
        </div>
      ))}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!input.trim()) return; // no mandamos mensajes vacíos
          // 2. Mandamos el mensaje y vaciamos el input
          sendMessage({ text: input });
          setInput("");
        }}
      >
        <input
          className="w-full rounded border p-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu pregunta..."
          // 3. Bloqueamos el input mientras la IA está respondiendo
          disabled={status !== "ready"}
        />
      </form>
    </main>
  );
}
