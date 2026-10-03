import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  connectReconnectingWebSocket,
  reconnectDelay,
  RECONNECT_BASE_MS,
  RECONNECT_MAX_MS,
  RECONNECT_MAX_JITTER_MS,
} from "@/lib/net/reconnecting-web-socket";

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  url: string;
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  closed = false;
  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }
  close() {
    this.closed = true;
    this.onclose?.();
  }
  simulateOpen() {
    this.onopen?.();
  }
  simulateMessage(data: string) {
    this.onmessage?.({ data });
  }
  simulateError() {
    this.onerror?.();
  }
  simulateServerClose() {
    this.onclose?.();
  }
}

describe("connectReconnectingWebSocket", () => {
  let originalWS: typeof WebSocket;
  beforeEach(() => {
    FakeWebSocket.instances = [];
    originalWS = globalThis.WebSocket;
    // @ts-expect-error test double
    globalThis.WebSocket = FakeWebSocket;
    vi.useFakeTimers();
  });
  afterEach(() => {
    globalThis.WebSocket = originalWS;
    vi.useRealTimers();
  });

  it("connects to the url and forwards open + message", () => {
    const onOpen = vi.fn();
    const onMessage = vi.fn();
    connectReconnectingWebSocket("ws://x/y", { onOpen, onMessage });
    expect(FakeWebSocket.instances).toHaveLength(1);
    expect(FakeWebSocket.instances[0].url).toBe("ws://x/y");
    FakeWebSocket.instances[0].simulateOpen();
    expect(onOpen).toHaveBeenCalledOnce();
    FakeWebSocket.instances[0].simulateMessage('{"a":1}');
    expect(onMessage).toHaveBeenCalledWith('{"a":1}');
  });

  it("reconnects after the base delay following a server close and calls onClose", () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
    const onClose = vi.fn();
    connectReconnectingWebSocket("ws://x", { onMessage: vi.fn(), onClose });
    FakeWebSocket.instances[0].simulateServerClose();
    expect(onClose).toHaveBeenCalledOnce();
    expect(FakeWebSocket.instances).toHaveLength(1);
    vi.advanceTimersByTime(RECONNECT_BASE_MS);
    expect(FakeWebSocket.instances).toHaveLength(2);
    randomSpy.mockRestore();
  });

  it("backs off exponentially across successive closes and resets to the base delay after a successful open", () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
    connectReconnectingWebSocket("ws://x", { onMessage: vi.fn() });

    FakeWebSocket.instances[0].simulateServerClose();
    vi.advanceTimersByTime(RECONNECT_BASE_MS - 1);
    expect(FakeWebSocket.instances).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(FakeWebSocket.instances).toHaveLength(2);

    FakeWebSocket.instances[1].simulateServerClose();
    vi.advanceTimersByTime(RECONNECT_BASE_MS * 2 - 1);
    expect(FakeWebSocket.instances).toHaveLength(2);
    vi.advanceTimersByTime(1);
    expect(FakeWebSocket.instances).toHaveLength(3);

    FakeWebSocket.instances[2].simulateOpen();
    FakeWebSocket.instances[2].simulateServerClose();
    vi.advanceTimersByTime(RECONNECT_BASE_MS - 1);
    expect(FakeWebSocket.instances).toHaveLength(3);
    vi.advanceTimersByTime(1);
    expect(FakeWebSocket.instances).toHaveLength(4);

    randomSpy.mockRestore();
  });

  it("closes the socket on error", () => {
    connectReconnectingWebSocket("ws://x", { onMessage: vi.fn() });
    const ws = FakeWebSocket.instances[0];
    ws.simulateError();
    expect(ws.closed).toBe(true);
  });

  it("teardown detaches handlers, closes, calls onClose once, and does not reconnect", () => {
    const onClose = vi.fn();
    const teardown = connectReconnectingWebSocket("ws://x", {
      onMessage: vi.fn(),
      onClose,
    });
    const ws = FakeWebSocket.instances[0];
    teardown();
    expect(ws.closed).toBe(true);
    expect(onClose).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(RECONNECT_MAX_MS + RECONNECT_MAX_JITTER_MS);
    expect(FakeWebSocket.instances).toHaveLength(1);
  });
});

describe("reconnectDelay", () => {
  it("returns the base delay plus jitter for the first attempt (attempt 0)", () => {
    expect(reconnectDelay(0, () => 0)).toBe(RECONNECT_BASE_MS);
    expect(reconnectDelay(0, () => 1)).toBe(
      RECONNECT_BASE_MS + RECONNECT_MAX_JITTER_MS,
    );
  });

  it("grows exponentially with the attempt number", () => {
    expect(reconnectDelay(1, () => 0)).toBe(RECONNECT_BASE_MS * 2);
    expect(reconnectDelay(2, () => 0)).toBe(RECONNECT_BASE_MS * 4);
    expect(reconnectDelay(3, () => 0)).toBe(RECONNECT_BASE_MS * 8);
  });

  it("caps the exponential part at the max delay", () => {
    expect(reconnectDelay(10, () => 0)).toBe(RECONNECT_MAX_MS);
    expect(reconnectDelay(10, () => 1)).toBe(
      RECONNECT_MAX_MS + RECONNECT_MAX_JITTER_MS,
    );
  });
});
