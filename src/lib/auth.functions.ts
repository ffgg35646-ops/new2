import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Phone-based account lookup is intentionally disabled: it would reveal private
// email addresses to unauthenticated callers. Sign-in uses email only.
export const resolveEmailForPhone = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ phone: z.string().min(6).max(20) }).parse(data),
  )
  .handler(async () => ({ email: null }));
