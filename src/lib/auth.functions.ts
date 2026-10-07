import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getMongoCollection } from "@/lib/mongo.server";

export const resolveEmailForPhone = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ phone: z.string().min(6).max(20) }).parse(data),
  )
  .handler(async ({ data }) => {
    const profiles = await getMongoCollection<Record<string, unknown>>("profiles");
    const row = await profiles.findOne({ phone: data.phone });

    return {
      email: typeof row?.email === "string" ? row.email : null,
    };
  });
