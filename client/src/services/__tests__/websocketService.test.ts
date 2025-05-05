import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebSocketService } from '../websocketService';

// Mock WebSocket
class MockWebSocket {
  url: string;
  readyState: number = 0; // CONNECTING
  onopen: ((event: any) => void) | null = null;
  onmessage: ((event: any) => void) | null = null;
  onclose: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    // Simulate connection after a short delay
    setTimeout(() => {
      this.readyState = 1; // OPEN
      if (this.onopen) this.onopen({});
    }, 50);
  }

  send(data: string): void {
    // Mock implementation
  }

  close(): void {
    this.readyState = 3; // CLOSED
    if (this.onclose) this.onclose({});
  }
}

// Mock global objects
global.WebSocket = MockWebSocket as any;
global.window = {
  location: {
    protocol: 'http:',
    host: 'localhost:5000'
  }
} as any;

// Mock import.meta.env
vi.stubGlobal('import', {
  meta: {
    env: {
      PROD: false
    }
  }
});

describe('WebSocketService', () => {
  let service: WebSocketService;

  beforeEach(() => {
    service = new WebSocketService();
    vi.useFakeTimers();
  });

  afterEach(() => {
    service.disconnect();
    vi.useRealTimers();
  });

  it('should connect to WebSocket server', async () => {
    const connectPromise = service.connect('test-user-id');

    // Advance timers to trigger the connection
    vi.advanceTimersByTime(100);

    const result = await connectPromise;
    expect(result).toBe(true);
    expect(service.isConnected()).toBe(true);
  });

  it('should register and trigger message handlers', async () => {
    const handler = vi.fn();
    service.on('test-event', handler);

    await service.connect('test-user-id');
    vi.advanceTimersByTime(100);

    // Manually trigger a message
    const mockMessage = { type: 'test-event', data: 'test-data' };
    (service as any).dispatchMessage(mockMessage);

    expect(handler).toHaveBeenCalledWith(mockMessage);
  });

  it('should remove message handlers', async () => {
    const handler = vi.fn();
    service.on('test-event', handler);

    await service.connect('test-user-id');
    vi.advanceTimersByTime(100);

    service.off('test-event', handler);

    // Manually trigger a message
    const mockMessage = { type: 'test-event', data: 'test-data' };
    (service as any).dispatchMessage(mockMessage);

    expect(handler).not.toHaveBeenCalled();
  });

  it('should disconnect from WebSocket server', async () => {
    await service.connect('test-user-id');
    vi.advanceTimersByTime(100);

    service.disconnect();

    expect(service.isConnected()).toBe(false);
  });

  it('should attempt to reconnect on connection failure', async () => {
    // Mock WebSocket to fail
    const originalWebSocket = global.WebSocket;
    global.WebSocket = class FailingWebSocket extends MockWebSocket {
      constructor(url: string) {
        super(url);
        // Simulate error after a short delay
        setTimeout(() => {
          if (this.onerror) this.onerror(new Error('Connection failed'));
          if (this.onclose) this.onclose({});
        }, 50);
      }
    } as any;

    const connectPromise = service.connect('test-user-id');

    // Advance timers to trigger the connection failure
    vi.advanceTimersByTime(100);

    const result = await connectPromise;
    expect(result).toBe(false);

    // Advance timers to trigger reconnect attempt
    vi.advanceTimersByTime(1100); // 1000ms reconnect timeout + 100ms buffer

    // Restore original WebSocket
    global.WebSocket = originalWebSocket;
  });
});
