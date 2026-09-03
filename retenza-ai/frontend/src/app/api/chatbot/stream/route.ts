import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Appel direct vers Express (port 5000) depuis le serveur Next.js
  const expressResponse = await fetch("http://127.0.0.1:5000/api/chatbot/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!expressResponse.ok || !expressResponse.body) {
    return new Response(
      `data: ${JSON.stringify({ type: "error", content: "Erreur de connexion au backend." })}\n\n`,
      {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      }
    );
  }

  // Pipe du flux SSE Express → navigateur via ReadableStream
  const stream = new ReadableStream({
    async start(controller) {
      const reader = expressResponse.body!.getReader();
      const decoder = new TextDecoder("utf-8");

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          // Transmettre chaque chunk tel quel au navigateur
          controller.enqueue(value);
        }
      } catch (err) {
        controller.enqueue(
          new TextEncoder().encode(
            `data: ${JSON.stringify({ type: "error", content: "Flux interrompu." })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
