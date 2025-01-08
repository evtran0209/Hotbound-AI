export class WebSocketManager {
    private ws: WebSocket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectTimeout = 1000; // Start with 1 second
    private isConnecting = false;
  
    constructor(
      private url: string,
      private onMessage: (event: MessageEvent) => void,
      private onStatusChange: (status: 'connected' | 'disconnected' | 'reconnecting') => void
    ) {}
  
    async connect() {
      if (this.isConnecting) return;
      this.isConnecting = true;
  
      try {
        this.ws = new WebSocket(this.url);
        
        this.ws.onopen = () => {
          this.onStatusChange('connected');
          this.reconnectAttempts = 0;
          this.reconnectTimeout = 1000;
          this.isConnecting = false;
        };
  
        this.ws.onmessage = this.onMessage;
  
        this.ws.onclose = () => {
          this.onStatusChange('disconnected');
          this.attemptReconnect();
        };
  
        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.ws?.close();
        };
      } catch (error) {
        this.isConnecting = false;
        console.error('WebSocket connection error:', error);
        this.attemptReconnect();
      }
    }
  
    private attemptReconnect() {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        return;
      }
  
      this.onStatusChange('reconnecting');
      this.reconnectAttempts++;
      this.reconnectTimeout *= 2; // Exponential backoff
  
      setTimeout(() => {
        this.connect();
      }, this.reconnectTimeout);
    }
  
    send(data: string | ArrayBuffer | Blob) {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(data);
      } else {
        console.error('WebSocket is not connected');
      }
    }
  
    disconnect() {
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
    }
  }