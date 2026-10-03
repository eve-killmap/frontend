import { BACKEND_BASE_URL } from "@/lib/net/endpoints";
import { SystemsData } from "@/lib/schema/map-schema";
import { SystemsDataSchema } from "@/lib/schema/map-schema.zod";
import { apiFetch, singleFlight } from "@/lib/api/client";

export function systemsUrl(): string {
  return `${BACKEND_BASE_URL}/static/universe/systems.json`;
}

let cached: SystemsData | null = null;

export function peekSystems(): SystemsData | null {
  return cached;
}

export function fetchSystemsCached(): Promise<SystemsData> {
  if (cached) return Promise.resolve(cached);
  return singleFlight("systems", () =>
    apiFetch(systemsUrl(), SystemsDataSchema, { cache: "no-cache" }),
  ).then((data) => {
    cached = data;
    return data;
  });
}
