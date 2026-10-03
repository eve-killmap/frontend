import { z } from "zod";

export interface WarSearchResult {
  war_id: number;
  declared: number | null;
  started: number | null;
  finished: number | null;
  retracted: number | null;
  mutual: boolean;
  aggressor_corporation_id: number | null;
  aggressor_alliance_id: number | null;
  defender_corporation_id: number | null;
  defender_alliance_id: number | null;
  ally_corporation_ids: number[];
  ally_alliance_ids: number[];
}

export const WarSearchResultSchema: z.ZodType<WarSearchResult> = z.object({
  war_id: z.number(),
  declared: z.number().nullable(),
  started: z.number().nullable(),
  finished: z.number().nullable(),
  retracted: z.number().nullable(),
  mutual: z.boolean(),
  aggressor_corporation_id: z.number().nullable(),
  aggressor_alliance_id: z.number().nullable(),
  defender_corporation_id: z.number().nullable(),
  defender_alliance_id: z.number().nullable(),
  ally_corporation_ids: z.array(z.number()),
  ally_alliance_ids: z.array(z.number()),
});
