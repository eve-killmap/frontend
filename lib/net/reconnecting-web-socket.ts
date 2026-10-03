export interface ReconnectingWebSocketHandlers {
  onOpen?: () => void;
  onMessage: (data: string) => void;
  onClose?: () => void;
}

export const RECONNECT_BASE_MS = 1000;
export const RECONNECT_MAX_MS = 30_000;
export const RECONNECT_MAX_JITTER_MS = 1000;

export function reconnectDelay(
  attempt: number,
  random: () => number = Math.random,
): number {
  const exponential = Math.min(
    RECONNECT_BASE_MS * 2 ** attempt,
    RECONNECT_MAX_MS,
  );
  return exponential + random() * RECONNECT_MAX_JITTER_MS;
}

export function connectReconnectingWebSocket(
  url: string,
  handlers: ReconnectingWebSocketHandlers,
): () => void {
  let destroyed = false;
  let activeWs: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let reconnectAttempt = 0;

  function connect() {
    if (destroyed) return;

    const ws = new WebSocket(url);
    activeWs = ws;

    ws.onopen = () => {
      reconnectAttempt = 0;
      handlers.onOpen?.();
    };
    ws.onmessage = (e) => handlers.onMessage(e.data);
    ws.onclose = () => {
      handlers.onClose?.();
      if (!destroyed) {
        const delay = reconnectDelay(reconnectAttempt);
        reconnectAttempt += 1;
        reconnectTimer = setTimeout(connect, delay);
      }
    };
    ws.onerror = () => ws.close();
  }

  connect();

  return () => {
    destroyed = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (activeWs) {
      activeWs.onopen = null;
      activeWs.onmessage = null;
      activeWs.onclose = null;
      activeWs.onerror = null;
      activeWs.close();
    }
    handlers.onClose?.();
  };
}
