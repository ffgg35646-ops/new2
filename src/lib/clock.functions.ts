import { createServerFn } from "@tanstack/react-start";

/** Returns the server's current epoch time without depending on the client clock. */
export const getServerTime = createServerFn({ method: "GET" })
  .handler(() => ({ now: Date.now() }));
