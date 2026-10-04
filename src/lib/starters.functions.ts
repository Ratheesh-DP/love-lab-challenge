import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateStarters } from "./starters.server";

export const getStarters = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        interests: z.string().trim().min(3).max(1500),
        match: z.string().trim().min(3).max(2000),
        theory: z.enum(["practical", "adventurous"]),
        picked: z.array(z.string().max(300)).max(10).default([]),
        written: z.array(z.string().max(300)).max(10).default([]),
      })
      .parse(d),
  )
  .handler(async ({ data }) => ({ starters: await generateStarters(data) }));
