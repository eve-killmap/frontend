import { z } from "zod";
import { API_BASE } from "@/lib/net/endpoints";
import {
  WarSearchResult,
  WarSearchResultSchema,
} from "@/lib/schema/war-schema";
import { apiFetch } from "@/lib/api/client";

export type WarPartyKind = "alliance" | "corporation";
export interface WarParty {
  kind: WarPartyKind;
  id: number;
  name?: string;
}

export function warSearchUrl(
  aggressor?: WarParty | null,
  defender?: WarParty | null,
): string {
  const parts: string[] = [];
  if (aggressor) parts.push(`aggressor=${aggressor.kind}:${aggressor.id}`);
  if (defender) parts.push(`defender=${defender.kind}:${defender.id}`);
  return `${API_BASE}/wars/search?${parts.join("&")}`;
}

export async function warSearch(
  aggressor?: WarParty | null,
  defender?: WarParty | null,
  signal?: AbortSignal,
): Promise<WarSearchResult[]> {
  if (!aggressor && !defender) return [];
  return apiFetch(
    warSearchUrl(aggressor, defender),
    z.array(WarSearchResultSchema),
    { signal },
  );
}

export async function warDetails(
  ids: number[],
  signal?: AbortSignal,
): Promise<WarSearchResult[]> {
  if (ids.length === 0) return [];
  return apiFetch(`${API_BASE}/wars/details`, z.array(WarSearchResultSchema), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ids),
    signal,
  });
}
