import { z } from "zod";
import { API_BASE } from "@/lib/net/endpoints";
import { apiFetch } from "@/lib/api/client";

export interface UniverseName {
  category: "type" | "faction" | "character" | "corporation" | "alliance";
  name: string;
  ticker: string | null;
  image_url: string;
}

const UniverseNameSchema: z.ZodType<UniverseName> = z.object({
  category: z.enum(["type", "faction", "character", "corporation", "alliance"]),
  name: z.string(),
  ticker: z.string().nullable(),
  image_url: z.string(),
});

const UniverseNamesResponseSchema: z.ZodType<Record<string, UniverseName>> =
  z.record(z.string(), UniverseNameSchema);

export function mapUniverseNames(
  raw: Record<string, UniverseName>,
): Record<number, UniverseName> {
  const out: Record<number, UniverseName> = {};
  for (const [id, v] of Object.entries(raw)) out[Number(id)] = v;
  return out;
}

export async function resolveNames(
  ids: number[],
  signal?: AbortSignal,
): Promise<Record<number, UniverseName>> {
  if (ids.length === 0) return {};
  const raw = await apiFetch(
    `${API_BASE}/universe/names`,
    UniverseNamesResponseSchema,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ids),
      signal,
    },
  );
  return mapUniverseNames(raw);
}
