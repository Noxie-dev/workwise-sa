/**
 * WebSocket Server for WorkWise SA
 *
 * This module implements a WebSocket server for real-time updates and notifications.
 * For detailed documentation, see /server/docs/websocket.md or visit /api-docs in the browser.
 *
 * @module WebSocketServer
 */

import { Server as HttpServer } from 'http';
import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './utils/logger';

interface Client {
  id: string;
  userId?: string;
  ws: WebSocket;
  isAlive: boolean;
}

interface UpdateMessage {
  type: 'job' | 'skill' | 'market';
  message: string;
  timestamp: Date;
}

export class WebSocketServer {
  private wss: WebSocket.Server;
  private clients: Map<string, Client> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(server: HttpServer) {
    this.wss = new WebSocket.Server({ server });
    this.initialize();
  }

  private initialize() {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('WebSocket connection established');
      const clientId = uuidv4();
      const client: Client = {
        id: clientId,
        ws,
        isAlive: true
      };

      this.clients.set(clientId, client);
      logger.info({
        message: `WebSocket client connected`,
        clientId,
        totalClients: this.clients.size
      });

      // Handle messages from clients
      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message);

          // Handle authentication/identification
          if (data.type === 'auth' && data.userId) {
            client.userId = data.userId;
            logger.info({
              message: `WebSocket client authenticated`,
              clientId,
              userId: data.userId
            });

            // Send welcome message
            this.sendToClient(clientId, {
              type: 'system',
              message: 'Connected to real-time updates',
              timestamp: new Date(),
              docsUrl: '/api-docs#tag/WebSocket'
            });
          }

          // Handle pong messages (keep-alive)
          if (data.type === 'pong') {
            client.isAlive = true;
          }
        } catch (error) {
          logger.error({
            message: 'Error parsing WebSocket message',
            clientId,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      });

      // Handle disconnection
      ws.on('close', () => {
        this.clients.delete(clientId);
        logger.info({
          message: `WebSocket client disconnected`,
          clientId,
          remainingClients: this.clients.size
        });
      });

      // Handle errors
      ws.on('error', (error) => {
        logger.error({
          message: `WebSocket client error`,
          clientId,
          error: error instanceof Error ? error.message : String(error)
        });
        this.clients.delete(clientId);
      });

      // Send initial ping to verify connection
      ws.send(JSON.stringify({
        type: 'ping',
        docsUrl: '/api-docs#tag/WebSocket'
      }));
    });

    // Add error handler for the server
    this.wss.on('error', (error: Error) => {
      logger.error({
        message: 'WebSocket server error',
        error: error.message,
        stack: error.stack
      });
    });

    // Set up ping interval to keep connections alive and detect dead connections
    this.pingInterval = setInterval(() => {
      this.clients.forEach((client, id) => {
        if (!client.isAlive) {
          client.ws.terminate();
          this.clients.delete(id);
          console.log(`Client ${id} terminated due to inactivity`);
          return;
        }

        client.isAlive = false;
        client.ws.send(JSON.stringify({ type: 'ping' }));
      });
    }, 30000); // Check every 30 seconds
  }

  /**
   * Send a message to a specific client
   */
  public sendToClient(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  /**
   * Send a message to a specific user (may have multiple clients)
   */
  public sendToUser(userId: string, message: any) {
    let sent = false;
    this.clients.forEach((client) => {
      if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
        sent = true;
      }
    });
    return sent;
  }

  /**
   * Broadcast a message to all connected clients
   */
  public broadcast(message: any) {
    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }

  /**
   * Send a job update to a specific user
   */
  public sendJobUpdate(userId: string, message: string) {
    const update: UpdateMessage = {
      type: 'job',
      message,
      timestamp: new Date()
    };
    return this.sendToUser(userId, update);
  }

  /**
   * Send a skill update to a specific user
   */
  public sendSkillUpdate(userId: string, message: string) {
    const update: UpdateMessage = {
      type: 'skill',
      message,
      timestamp: new Date()
    };
    return this.sendToUser(userId, update);
  }

  /**
   * Send a market update to a specific user
   */
  public sendMarketUpdate(userId: string, message: string) {
    const update: UpdateMessage = {
      type: 'market',
      message,
      timestamp: new Date()
    };
    return this.sendToUser(userId, update);
  }

  /**
   * Close the WebSocket server
   */
  public close() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    this.wss.close();

    // Close all client connections
    this.clients.forEach((client) => {
      client.ws.terminate();
    });

    this.clients.clear();
  }
}

export default WebSocketServer;
