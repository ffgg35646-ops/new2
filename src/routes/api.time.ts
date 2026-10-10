import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/time")({
  server: {
    handlers: {
      GET: async () =>
        Response.json(
          { now: Date.now() },
          {
            headers: {
              "Cache-Control": "no-store, no-cache, must-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            },
          },
        ),
    },
  },
});
