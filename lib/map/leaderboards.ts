import { FilterCondition } from "@/lib/filter/types";
import { makeUid } from "@/lib/filter/uid";
import {
  allianceLogoUrl,
  characterPortraitUrl,
  corporationLogoUrl,
  shipIconUrl,
} from "@/lib/eve/eve-images";
import { LeaderboardEntry } from "@/lib/schema/map-schema";

export const LEADERBOARD_WINDOWS = [
  { key: "all", label: "All" },
  { key: "1d", label: "Day" },
  { key: "7d", label: "Week" },
  { key: "30d", label: "Month" },
  { key: "6m", label: "6 Mo" },
  { key: "1y", label: "Year" },
] as const;

export type LeaderboardWindow = (typeof LEADERBOARD_WINDOWS)[number]["key"];

export const LEADERBOARD_ROLES = [
  { key: "attacker", label: "Kills" },
  { key: "victim", label: "Losses" },
] as const;

export type LeaderboardRole = (typeof LEADERBOARD_ROLES)[number]["key"];

export const LEADERBOARD_SCOPES = [
  { key: "all", label: "NPCs & Players" },
  { key: "players", label: "Players Only" },
] as const;

export type LeaderboardScope = (typeof LEADERBOARD_SCOPES)[number]["key"];

export const LEADERBOARD_KINDS = [
  { key: "character", label: "Characters" },
  { key: "corporation", label: "Corporations" },
  { key: "alliance", label: "Alliances" },
  { key: "faction", label: "Factions" },
  { key: "ship", label: "Ships" },
  { key: "weapon", label: "Weapons" },
] as const;

export type LeaderboardKind = (typeof LEADERBOARD_KINDS)[number]["key"];

export const LEADERBOARD_LIMIT = 10;

export function leaderboardsPath(
  timeWindow: LeaderboardWindow,
  role: LeaderboardRole,
  scope: LeaderboardScope,
): string {
  return `/stats/leaderboards?window=${timeWindow}&role=${role}&scope=${scope}&limit=${LEADERBOARD_LIMIT}`;
}

export function leaderboardImageUrl(kind: LeaderboardKind, id: number): string {
  switch (kind) {
    case "character":
      return characterPortraitUrl(id);
    case "corporation":
    case "faction":
      return corporationLogoUrl(id);
    case "alliance":
      return allianceLogoUrl(id);
    case "ship":
    case "weapon":
      return shipIconUrl(id, 64);
  }
}

export function leaderboardEntryLabel(entry: LeaderboardEntry): string {
  return entry.name ?? `#${entry.id}`;
}

export function leaderboardFilterCondition(
  kind: LeaderboardKind,
  role: LeaderboardRole,
  entry: LeaderboardEntry,
): FilterCondition {
  return {
    uid: makeUid(),
    attribute: kind,
    side: kind === "weapon" ? undefined : role,
    values: [
      {
        id: entry.id,
        name: leaderboardEntryLabel(entry),
        image_url: leaderboardImageUrl(kind, entry.id),
        ticker: entry.ticker ?? null,
      },
    ],
  };
}
