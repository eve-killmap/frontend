import { z } from "zod";
import { apiFetch, singleFlight } from "@/lib/api/client";
import { BACKEND_BASE_URL } from "@/lib/net/endpoints";

const TypeNamesSchema = z.record(z.string(), z.string());

export function loadShipTypeNames(): Promise<Map<number, string>> {
  return singleFlight("ship-type-names", () =>
    apiFetch(
      `${BACKEND_BASE_URL}/static/type/typeNames.json`,
      TypeNamesSchema,
      {
        cache: "no-cache",
      },
    ).then((data) => {
      const map = new Map<number, string>();
      for (const [id, name] of Object.entries(data)) map.set(Number(id), name);
      return map;
    }),
  );
}
