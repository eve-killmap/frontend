import { LiveKill } from "@/lib/schema/base-schema";
import { createKillFeedStore } from "../create-kill-feed-store";

export interface KillFlash {
  id: number;
  systemId: number;
  shipTypeId: number;
  at: number;
}

export const useKillFeedStore = createKillFeedStore<LiveKill, KillFlash>({
  makeFlash: (kill) => ({
    id: kill.killmail_id,
    systemId: kill.solar_system_id,
    shipTypeId: kill.v_ship_type_id,
    at: Date.now(),
  }),
});
