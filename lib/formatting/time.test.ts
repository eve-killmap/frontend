import { describe, it, expect, vi, afterEach } from "vitest";
import {
  nowSeconds,
  secondsToDate,
  formatRelativeTime,
  formatAbsoluteUTC,
} from "@/lib/formatting/time";

afterEach(() => {
  vi.useRealTimers();
});

describe("nowSeconds", () => {
  it("returns the current time floored to whole seconds", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-02T00:00:00.750Z"));
    expect(nowSeconds()).toBe(
      Math.floor(Date.parse("2026-07-02T00:00:00Z") / 1000),
    );
  });
});

describe("secondsToDate", () => {
  it("converts epoch seconds to a Date at millisecond scale", () => {
    const epoch = 1_600_000_000;
    expect(secondsToDate(epoch).getTime()).toBe(epoch * 1000);
  });
});

describe("formatRelativeTime", () => {
  const now = Date.parse("2026-07-02T00:00:00Z");
  const at = (secondsAgo: number) => Math.floor(now / 1000) - secondsAgo;

  it("reports just now for <=1s", () => {
    expect(formatRelativeTime(at(1), now)).toBe("just now");
  });
  it("reports seconds", () => {
    expect(formatRelativeTime(at(30), now)).toBe("30 seconds ago");
  });
  it("reports singular minute", () => {
    expect(formatRelativeTime(at(60), now)).toBe("1 minute ago");
  });
  it("reports hours", () => {
    expect(formatRelativeTime(at(3 * 3600), now)).toBe("3 hours ago");
  });
  it("reports days", () => {
    expect(formatRelativeTime(at(2 * 86400), now)).toBe("2 days ago");
  });
  it("reports years", () => {
    expect(formatRelativeTime(at(400 * 86400), now)).toBe("1 year ago");
  });
  it("reports plural minutes", () => {
    expect(formatRelativeTime(at(120), now)).toBe("2 minutes ago");
  });
  it("reports singular hour", () => {
    expect(formatRelativeTime(at(3600), now)).toBe("1 hour ago");
  });
  it("reports singular day", () => {
    expect(formatRelativeTime(at(86400), now)).toBe("1 day ago");
  });
  it("reports singular month", () => {
    expect(formatRelativeTime(at(45 * 86400), now)).toBe("1 month ago");
  });
  it("reports plural months", () => {
    expect(formatRelativeTime(at(75 * 86400), now)).toBe("2 months ago");
  });
  it("reports plural years", () => {
    expect(formatRelativeTime(at(800 * 86400), now)).toBe("2 years ago");
  });
  it("clamps future timestamps to just now", () => {
    expect(formatRelativeTime(Math.floor(now / 1000) + 1000, now)).toBe(
      "just now",
    );
  });
});

describe("formatAbsoluteUTC", () => {
  it("formats epoch seconds as YYYY-MM-DD HH:MM in UTC", () => {
    const epoch = Math.floor(Date.parse("2026-07-02T13:05:00Z") / 1000);
    expect(formatAbsoluteUTC(epoch)).toBe("2026-07-02 13:05");
  });
  it("zero-pads single-digit month, day, and hour", () => {
    const epoch = Math.floor(Date.parse("2026-03-05T04:07:00Z") / 1000);
    expect(formatAbsoluteUTC(epoch)).toBe("2026-03-05 04:07");
  });
});
