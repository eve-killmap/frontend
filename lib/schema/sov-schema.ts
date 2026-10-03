import { z } from "zod";

export interface SovereigntyResponse {
  updated_at: number;
  adm_available: boolean;
  owner_kinds: number[];
  owner_ids: number[];
  owner_names: (string | null)[];
  owner_tickers: (string | null)[];
  system_ids: number[];
  owner_idx: number[];
  adm: number[];
}

export const SovereigntyResponseSchema: z.ZodType<SovereigntyResponse> =
  z.object({
    updated_at: z.number(),
    adm_available: z.boolean(),
    owner_kinds: z.array(z.number()),
    owner_ids: z.array(z.number()),
    owner_names: z.array(z.string().nullable()),
    owner_tickers: z.array(z.string().nullable()),
    system_ids: z.array(z.number()),
    owner_idx: z.array(z.number()),
    adm: z.array(z.number()),
  });
