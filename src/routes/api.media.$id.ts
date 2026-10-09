import { createFileRoute } from "@tanstack/react-router";
import { readMedia } from "@/lib/mongo.server";
import { getSessionUserId } from "@/lib/session.server";

export const Route = createFileRoute("/api/media/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const id = params.id;
        if (!id) return new Response("Not found", { status: 404 });

        try {
          const media = await readMedia(id, getSessionUserId());
          if (!media) return new Response("Not found", { status: 404 });

          return new Response(media.body as unknown as BodyInit, {
            status: 200,
            headers: {
              "Content-Type": media.contentType,
              "X-Content-Type-Options": "nosniff",
              "Cache-Control": "public, max-age=31536000, immutable",
              "Content-Disposition": "inline; filename*=UTF-8''" + encodeURIComponent(media.fileName),
            },
          });
        } catch (error) {
          console.error("[Mongo media]", error);
          return new Response("Failed to load media", { status: 500 });
        }
      },
    },
  },
});
