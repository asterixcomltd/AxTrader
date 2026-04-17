// AxTrader WebSocket Client Stub
// Connect/disconnect/reconnect logic for future real-time signal delivery.
// Currently a no-op stub — wire up a real endpoint when available.

const WS_URL = ''; // Set this to your WebSocket endpoint when ready
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_DELAY = 30000;

class WsClient {
  constructor(url) {
    this.url = url;
    this._ws = null;
    this._reconnectTimer = null;
    this._reconnectDelay = RECONNECT_DELAY;
    this._listeners = {};
    this._connected = false;
  }

  connect() {
    if (!this.url) {
      console.log('[WS] No endpoint configured — running in stub mode.');
      return;
    }
    if (this._ws && this._ws.readyState === WebSocket.OPEN) return;

    try {
      this._ws = new WebSocket(this.url);

      this._ws.onopen = () => {
        this._connected = true;
        this._reconnectDelay = RECONNECT_DELAY;
        this._emit('connected');
      };

      this._ws.onmessage = (event) => {
        let data;
        try { data = JSON.parse(event.data); } catch { data = event.data; }
        this._emit('message', data);
      };

      this._ws.onclose = () => {
        this._connected = false;
        this._emit('disconnected');
        this._scheduleReconnect();
      };

      this._ws.onerror = (err) => {
        this._emit('error', err);
      };
    } catch (err) {
      console.error('[WS] Connection failed:', err);
      this._scheduleReconnect();
    }
  }

  disconnect() {
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }
    if (this._ws) {
      this._ws.close();
      this._ws = null;
    }
    this._connected = false;
    this._emit('disconnected');
  }

  send(data) {
    if (!this._ws || this._ws.readyState !== WebSocket.OPEN) {
      console.warn('[WS] Cannot send — not connected.');
      return;
    }
    this._ws.send(typeof data === 'string' ? data : JSON.stringify(data));
  }

  on(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(callback);
  }

  off(event, callback) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
  }

  isConnected() {
    return this._connected;
  }

  _scheduleReconnect() {
    if (this._reconnectTimer) return;
    this._reconnectTimer = setTimeout(() => {
      this._reconnectTimer = null;
      this._reconnectDelay = Math.min(this._reconnectDelay * 2, MAX_RECONNECT_DELAY);
      console.log(`[WS] Reconnecting in ${this._reconnectDelay}ms...`);
      this.connect();
    }, this._reconnectDelay);
  }

  _emit(event, data) {
    (this._listeners[event] || []).forEach(cb => {
      try { cb(data); } catch {}
    });
  }
}

// Singleton
let wsInstance = null;

export function initWebSocket() {
  if (!wsInstance) {
    wsInstance = new WsClient(WS_URL);
  }
  return wsInstance;
}

export function getWsClient() {
  return wsInstance;
}
