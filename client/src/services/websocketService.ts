/**
 * WebSocket service for real-time updates
 */
export class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: number = 1000; // Start with 1 second
  private reconnectTimer: number | null = null;
  private messageHandlers: Map<string, ((data: any) => void)[]> = new Map();
  private userId: string | null = null;

  /**
   * Connect to the WebSocket server
   */
  public connect(userId: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        console.log('WebSocket already connected');
        resolve(true);
        return;
      }

      // Store user ID for reconnection
      this.userId = userId;

      // Determine WebSocket URL based on environment
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

      // In development with Vite, we need to handle the proxy correctly
      // The browser is at localhost:5174, but the server is at localhost:5000
      let wsUrl;
      if (import.meta.env.DEV) {
        // For development, use the relative path which will be handled by the proxy
        wsUrl = `${protocol}//${window.location.host}/ws`;
        console.log('WebSocket connecting to:', wsUrl);
      } else {
        // In production, use the same host as the page
        wsUrl = `${protocol}//${window.location.host}/ws`;
      }

      try {
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.reconnectTimeout = 1000;

          // Send authentication message
          this.send({
            type: 'auth',
            userId
          });

          resolve(true);
        };

        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            // Handle ping messages
            if (data.type === 'ping') {
              this.send({ type: 'pong' });
              return;
            }

            // Dispatch message to handlers
            this.dispatchMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.socket.onclose = () => {
          console.log('WebSocket disconnected');
          this.socket = null;

          // Attempt to reconnect
          this.attemptReconnect();

          resolve(false);
        };

        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.socket?.close();
        };
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        this.attemptReconnect();
        resolve(false);
      }
    });
  }

  /**
   * Attempt to reconnect to the WebSocket server
   */
  private attemptReconnect() {
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts && this.userId) {
      console.log(`Attempting to reconnect (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})...`);

      this.reconnectTimer = window.setTimeout(() => {
        this.reconnectAttempts++;
        this.connect(this.userId!);
        // Exponential backoff
        this.reconnectTimeout = Math.min(this.reconnectTimeout * 2, 30000); // Max 30 seconds
      }, this.reconnectTimeout);
    } else {
      console.log('Max reconnect attempts reached or no user ID');
    }
  }

  /**
   * Send a message to the WebSocket server
   */
  public send(data: any): boolean {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
      return true;
    }
    return false;
  }

  /**
   * Register a handler for a specific message type
   */
  public on(type: string, handler: (data: any) => void): void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);
  }

  /**
   * Remove a handler for a specific message type
   */
  public off(type: string, handler: (data: any) => void): void {
    if (this.messageHandlers.has(type)) {
      const handlers = this.messageHandlers.get(type)!;
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Dispatch a message to registered handlers
   */
  private dispatchMessage(data: any): void {
    const type = data.type;
    if (this.messageHandlers.has(type)) {
      this.messageHandlers.get(type)!.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in WebSocket handler for type ${type}:`, error);
        }
      });
    }

    // Also dispatch to 'all' handlers
    if (this.messageHandlers.has('all')) {
      this.messageHandlers.get('all')!.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('Error in WebSocket "all" handler:', error);
        }
      });
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.userId = null;
    this.messageHandlers.clear();
    console.log('WebSocket disconnected');
  }

  /**
   * Check if the WebSocket is connected
   */
  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
}

// Create a singleton instance
export const websocketService = new WebSocketService();

export default websocketService;
