import { z } from "zod";
import { API_BASE } from "@/lib/net/endpoints";
import { apiFetch } from "@/lib/api/client";

export type EntityKind = "character" | "corporation" | "alliance" | "faction";

export interface EntityResult {
  id: number;
  name: string;
  ticker: string | null;
  image_url: string;
  member_count?: number | null;
  date_founded?: number | null;
}

const EntityResultSchema: z.ZodType<EntityResult> = z.object({
  id: z.number(),
  name: z.string(),
  ticker: z.string().nullable(),
  image_url: z.string(),
  member_count: z.number().nullable().optional(),
  date_founded: z.number().nullable().optional(),
});

export function entityAutocompleteUrl(
  kind: EntityKind,
  q: string,
  limit = 30,
): string {
  const params = new URLSearchParams({ kind, q, limit: String(limit) });
  return `${API_BASE}/autocomplete/entities?${params.toString()}`;
}

export async function autocompleteEntities(
  kind: EntityKind,
  q: string,
  signal?: AbortSignal,
): Promise<EntityResult[]> {
  if (q.length < 3) return [];
  return apiFetch(entityAutocompleteUrl(kind, q), z.array(EntityResultSchema), {
    signal,
  });
}

export interface TypeResult {
  id: number;
  name: string;
  image_url: string;
}

const TypeResultSchema: z.ZodType<TypeResult> = z.object({
  id: z.number(),
  name: z.string(),
  image_url: z.string(),
});

export function weaponAutocompleteUrl(q: string, limit = 30): string {
  const params = new URLSearchParams({ q, limit: String(limit) });
  return `${API_BASE}/autocomplete/weapons?${params.toString()}`;
}

export async function autocompleteWeapons(
  q: string,
  signal?: AbortSignal,
): Promise<TypeResult[]> {
  if (q.length < 3) return [];
  return apiFetch(weaponAutocompleteUrl(q), z.array(TypeResultSchema), {
    signal,
  });
}

export function shipAutocompleteUrl(q: string, limit = 30): string {
  const params = new URLSearchParams({ q, limit: String(limit) });
  return `${API_BASE}/autocomplete/ships?${params.toString()}`;
}

export async function autocompleteShips(
  q: string,
  signal?: AbortSignal,
): Promise<TypeResult[]> {
  if (q.length < 3) return [];
  return apiFetch(shipAutocompleteUrl(q), z.array(TypeResultSchema), {
    signal,
  });
}
