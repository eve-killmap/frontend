import { LiveKill } from "@/lib/schema/base-schema";
import { createKillFeedStore } from "../create-kill-feed-store";

export interface SystemKillFlash {
  id: number;
  x: number;
  y: number;
  z: number;
  shipTypeId: number;
  at: number;
}

export const useSystemKillFeedStore = createKillFeedStore<
  LiveKill,
  SystemKillFlash
>({
  makeFlash: (kill) => ({
    id: kill.killmail_id,
    x: kill.x,
    y: kill.y,
    z: kill.z,
    shipTypeId: kill.v_ship_type_id,
    at: Date.now(),
  }),
});
