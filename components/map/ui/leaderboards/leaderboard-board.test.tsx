import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  LeaderboardBoard,
  LeaderboardBoardSkeleton,
} from "./leaderboard-board";
import { LEADERBOARD_LIMIT } from "@/lib/map/leaderboards";

const entries = Array.from({ length: LEADERBOARD_LIMIT }, (_, i) => ({
  id: 90000000 + i,
  name: `Pilot ${i + 1}`,
  kills: 100 - i,
}));

const countRows = (html: string) => (html.match(/<li/g) ?? []).length;

describe("LeaderboardBoardSkeleton", () => {
  it("reserves one row per leaderboard entry so the loaded grid is the same height", () => {
    const loaded = renderToStaticMarkup(
      <LeaderboardBoard
        kind="character"
        label="Characters"
        entries={entries}
        onSelect={() => {}}
      />,
    );
    const skeleton = renderToStaticMarkup(
      <LeaderboardBoardSkeleton label="Characters" />,
    );
    expect(countRows(skeleton)).toBe(LEADERBOARD_LIMIT);
    expect(countRows(skeleton)).toBe(countRows(loaded));
  });

  it("keeps the board heading so the header block matches the loaded board", () => {
    const skeleton = renderToStaticMarkup(
      <LeaderboardBoardSkeleton label="Weapons" />,
    );
    expect(skeleton).toContain("Weapons");
    expect(skeleton).toContain("mb-1.5");
  });

  it("gives every row the same 24px image box the loaded rows use", () => {
    const skeleton = renderToStaticMarkup(
      <LeaderboardBoardSkeleton label="Ships" />,
    );
    expect((skeleton.match(/size-6/g) ?? []).length).toBe(LEADERBOARD_LIMIT);
  });
});
