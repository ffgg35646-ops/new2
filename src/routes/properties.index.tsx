import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/properties/")({
  beforeLoad: () => {
    throw redirect({ to: "/home" });
  },
  component: () => null,
});
