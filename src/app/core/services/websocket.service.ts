import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { MessageResponse, TypingResponse } from '../models/chat.model';

// Connection states — so the UI knows what's happening
export type WsStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private readonly authService = inject(AuthService);

  // The STOMP client — this is our "phone"
  private client?: Client;

  // Active subscriptions — we need to track them to cancel later
  private subscriptions: StompSubscription[] = [];

  // Connection status signal — UI reads this to show connected/disconnected
  readonly status = signal<WsStatus>('DISCONNECTED');

  // ─── Connect ─────────────────────────────────────────────
  // Call this when user opens a room
  connect(): void {
    // Don't connect if already connected
    if (this.client?.connected) return;

    this.status.set('CONNECTING');

    this.client = new Client({
      // SockJS creates the underlying connection
      // Falls back to HTTP long-polling if WebSocket not available
      webSocketFactory: () => new SockJS(`${environment.apiUrl.replace('/api', '')}/ws`),

      // Attach JWT token so the server knows who we are
      // This is read by our WebSocketAuthInterceptor on the server
      connectHeaders: {
        Authorization: `Bearer ${this.authService.getAccessToken() ?? ''}`,
      },

      // How often to send a "I'm still here" ping to keep connection alive
      // 10 seconds = reasonable for our use case
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,

      // Called when connection is successfully established
      onConnect: () => {
        this.status.set('CONNECTED');
        console.log('✅ WebSocket connected');
      },

      // Called when connection is lost unexpectedly
      // STOMP will automatically try to reconnect
      onDisconnect: () => {
        this.status.set('DISCONNECTED');
        console.log('WebSocket disconnected');
      },

      // Called on any error
      onStompError: (frame) => {
        this.status.set('ERROR');
        console.error('WebSocket error:', frame);
      },

      // Wait 3 seconds before trying to reconnect after failure
      reconnectDelay: 3000,
    });

    // Actually start the connection
    this.client.activate();
  }

  // ─── Disconnect ──────────────────────────────────────────
  // Call this when user leaves the room
  disconnect(): void {
    // Cancel all active subscriptions first
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];

    // Deactivate the STOMP client
    this.client?.deactivate();
    this.status.set('DISCONNECTED');
  }

  // ─── Subscribe to room messages ──────────────────────────
  // Registers a callback — called every time a new message arrives
  // Returns a function to cancel the subscription
  subscribeToRoom(roomId: number, onMessage: (msg: MessageResponse) => void): () => void {
    if (!this.client?.connected) return () => {};

    const sub = this.client.subscribe(
      // The STOMP destination — matches what the server broadcasts to
      `/topic/room/${roomId}`,
      // Called every time a message arrives on this topic
      (frame: IMessage) => {
        // frame.body is the JSON string — parse it into our type
        const message: MessageResponse = JSON.parse(frame.body);
        onMessage(message);
      },
    );

    this.subscriptions.push(sub);

    // Return a cleanup function
    return () => sub.unsubscribe();
  }

  // ─── Subscribe to typing indicators ──────────────────────
  subscribeToTyping(roomId: number, onTyping: (typing: TypingResponse) => void): () => void {
    if (!this.client?.connected) return () => {};

    const sub = this.client.subscribe(`/topic/room/${roomId}/typing`, (frame: IMessage) => {
      const typing: TypingResponse = JSON.parse(frame.body);
      onTyping(typing);
    });

    this.subscriptions.push(sub);
    return () => sub.unsubscribe();
  }

  // ─── Send a message ───────────────────────────────────────
  // Sends to /app/room/{roomId}/send on the server
  sendMessage(roomId: number, content: string): void {
    if (!this.client?.connected) return;

    this.client.publish({
      // Destination matches @MessageMapping("/room/{roomId}/send")
      destination: `/app/room/${roomId}/send`,
      // body = JSON string of our payload
      body: JSON.stringify({ content }),
    });
  }

  // ─── Send typing indicator ────────────────────────────────
  sendTyping(roomId: number, isTyping: boolean): void {
    if (!this.client?.connected) return;

    this.client.publish({
      destination: `/app/room/${roomId}/typing`,
      body: JSON.stringify({ isTyping }),
    });
  }

  // ─── Cleanup when service is destroyed ───────────────────
  ngOnDestroy(): void {
    this.disconnect();
  }
}
