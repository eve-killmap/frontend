import { z } from "zod";
import { API_BASE } from "@/lib/net/endpoints";
import { useApiHealthStore } from "@/stores/api-health-store";

const HealthSchema = z.object({ status: z.string() });

export async function checkApiHealth(timeoutMs = 10000): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}/health`, {
      signal: controller.signal,
    });
    if (!res.ok) return false;
    return HealthSchema.parse(await res.json()).status === "ok";
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

let resultPromise: Promise<boolean> | null = null;

export function startHealthCheck(): Promise<boolean> {
  if (!resultPromise)
    resultPromise = checkApiHealth().then((healthy) => {
      useApiHealthStore.getState().setHealthy(healthy);
      return healthy;
    });
  return resultPromise;
}
