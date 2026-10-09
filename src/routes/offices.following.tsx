import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/offices/following")({
  beforeLoad: () => {
    throw redirect({ to: "/offices" });
  },
});
