import { useEffect, useRef } from "react";
import {
  connectReconnectingWebSocket,
  type ReconnectingWebSocketHandlers,
} from "@/lib/net/reconnecting-web-socket";

export function useReconnectingWebSocket(
  url: string,
  handlers: ReconnectingWebSocketHandlers,
): void {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    return connectReconnectingWebSocket(url, {
      onOpen: () => handlersRef.current.onOpen?.(),
      onMessage: (data) => handlersRef.current.onMessage(data),
      onClose: () => handlersRef.current.onClose?.(),
    });
  }, [url]);
}
