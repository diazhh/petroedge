/**
 * useWebSocket Hook
 * 
 * Hook de React para gestionar conexiones WebSocket en componentes.
 */

import { useEffect, useCallback, useRef } from 'react';
import { wsClient, type ServerToClientEvents } from '@/lib/websocket';
import { useAuthStore } from '@/stores/authStore';

/**
 * Hook para conectar/desconectar WebSocket automáticamente
 */
export function useWebSocketConnection() {
  const { accessToken, isAuthenticated } = useAuthStore();
  const isConnectedRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated && accessToken && !isConnectedRef.current) {
      wsClient.connect(accessToken);
      isConnectedRef.current = true;
    }

    return () => {
      if (isConnectedRef.current) {
        wsClient.disconnect();
        isConnectedRef.current = false;
      }
    };
  }, [isAuthenticated, accessToken]);

  return {
    isConnected: wsClient.isConnected(),
    client: wsClient,
  };
}

/**
 * Hook para suscribirse a eventos de un pozo
 */
export function useWellWebSocket(wellId: string | undefined) {
  const { client } = useWebSocketConnection();

  useEffect(() => {
    if (!wellId || !client.isConnected()) return;

    client.subscribeToWell(wellId);

    return () => {
      client.unsubscribe(`well:${wellId}`);
    };
  }, [wellId, client]);

  const on = useCallback(
    <K extends keyof ServerToClientEvents>(
      event: K,
      callback: ServerToClientEvents[K]
    ) => {
      client.on(event, callback);
      return () => client.off(event, callback);
    },
    [client]
  );

  return { on, client };
}

/**
 * Hook para suscribirse a eventos de un campo
 */
export function useFieldWebSocket(fieldId: string | undefined) {
  const { client } = useWebSocketConnection();

  useEffect(() => {
    if (!fieldId || !client.isConnected()) return;

    client.subscribeToField(fieldId);

    return () => {
      client.unsubscribe(`field:${fieldId}`);
    };
  }, [fieldId, client]);

  const on = useCallback(
    <K extends keyof ServerToClientEvents>(
      event: K,
      callback: ServerToClientEvents[K]
    ) => {
      client.on(event, callback);
      return () => client.off(event, callback);
    },
    [client]
  );

  return { on, client };
}

/**
 * Hook para suscribirse a eventos de un asset
 */
export function useAssetWebSocket(assetId: string | undefined) {
  const { client } = useWebSocketConnection();

  useEffect(() => {
    if (!assetId || !client.isConnected()) return;

    client.subscribeToAsset(assetId);

    return () => {
      client.unsubscribe(`asset:${assetId}`);
    };
  }, [assetId, client]);

  const on = useCallback(
    <K extends keyof ServerToClientEvents>(
      event: K,
      callback: ServerToClientEvents[K]
    ) => {
      client.on(event, callback);
      return () => client.off(event, callback);
    },
    [client]
  );

  return { on, client };
}

/**
 * Hook para suscribirse a alarmas del tenant
 */
export function useAlarmsWebSocket() {
  const { client } = useWebSocketConnection();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user?.tenantId || !client.isConnected()) return;

    client.subscribeToAlarms(user.tenantId);

    return () => {
      client.unsubscribe(`alarms:${user.tenantId}`);
    };
  }, [user?.tenantId, client]);

  const on = useCallback(
    <K extends keyof ServerToClientEvents>(
      event: K,
      callback: ServerToClientEvents[K]
    ) => {
      client.on(event, callback);
      return () => client.off(event, callback);
    },
    [client]
  );

  const acknowledgeAlarm = useCallback(
    (alarmId: string) => {
      client.acknowledgeAlarm(alarmId);
    },
    [client]
  );

  return { on, acknowledgeAlarm, client };
}

/**
 * Hook genérico para escuchar eventos WebSocket
 */
export function useWebSocketEvent<K extends keyof ServerToClientEvents>(
  event: K,
  callback: ServerToClientEvents[K],
  deps: any[] = []
) {
  const { client } = useWebSocketConnection();

  useEffect(() => {
    if (!client.isConnected()) return;

    client.on(event, callback);

    return () => {
      client.off(event, callback);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, client, ...deps]);
}
