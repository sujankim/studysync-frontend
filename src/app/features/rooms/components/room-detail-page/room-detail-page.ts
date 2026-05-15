import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

import { WebSocketService } from '../../../../core/services/websocket.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

import { MessageResponse, TypingResponse } from '../../../../core/models/chat.model';
import {
  StudyRoomResponse,
  RoomMemberResponse,
  getTopicEmoji,
} from '../../../../core/models/room.model';
import { ChatService } from '../../../../core/services/chat.service';
import { RoomService } from '../../../../core/services/room.service';

@Component({
  selector: 'app-room-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './room-detail-page.html',
  styleUrl: './room-detail-page.scss',
})
export class RoomDetailPage implements OnInit, OnDestroy, AfterViewChecked {
  // ─── Injected Services ───────────────────────────────────
  private readonly route = inject(ActivatedRoute);
  readonly wsService = inject(WebSocketService);
  private readonly chatService = inject(ChatService);
  private readonly roomService = inject(RoomService);
  private readonly authService = inject(AuthService);
  private readonly notification = inject(NotificationService);

  // ─── DOM Reference for auto-scroll ───────────────────────
  @ViewChild('messageList') messageListRef!: ElementRef<HTMLDivElement>;

  // ─── State ────────────────────────────────────────────────
  room = signal<StudyRoomResponse | null>(null);
  members = signal<RoomMemberResponse[]>([]);
  messages = signal<MessageResponse[]>([]);
  loadingRoom = signal(true);
  loadingHistory = signal(true);

  // Message input field value
  messageText = '';

  // Typing indicators — map of userId → timeout ID
  // We auto-clear the indicator after 3 seconds of no activity
  typingUsers = signal<Map<number, TypingResponse>>(new Map());

  // Is there more history to load? (pagination)
  hasMoreHistory = signal(false);
  historyPage = signal(0);

  // Should we auto-scroll to bottom?
  // Yes when new messages arrive, No when loading old history
  private shouldScrollToBottom = true;

  // Typing debounce timer
  private typingTimer?: ReturnType<typeof setTimeout>;
  private isTypingSent = false;

  // WebSocket cleanup functions
  private unsubMessage?: () => void;
  private unsubTyping?: () => void;

  // Current user
  readonly currentUser = this.authService.currentUser;

  // Room ID from the URL
  readonly roomId = computed(() =>
    Number(this.route.snapshot.paramMap.get('roomId')));

  // Typing text shown in UI e.g. "Sujan is typing..."
  readonly typingText = computed(() => {
    const users = Array.from(this.typingUsers().values());
    // Don't show the current user's own typing indicator
    const others = users.filter((u) =>
      u.userId !== this.currentUser()?.id);

    if (others.length === 0) return '';
    if (others.length === 1) return `${others[0].name} is typing...`;
    if (others.length === 2) return `${others[0].name} and ${others[1].name} are typing...`;
    return 'Several people are typing...';
  });

  // Topic emoji
  getEmoji(): string {
    return this.room() ? getTopicEmoji(this.room()!.topic) : '📚';
  }

  // ─── Lifecycle ────────────────────────────────────────────
  ngOnInit(): void {
    this.loadRoom();
  }

  // After every change detection cycle check if we need to scroll
  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
    }
  }

  ngOnDestroy(): void {
    // Cancel subscriptions
    this.unsubMessage?.();
    this.unsubTyping?.();

    // Disconnect WebSocket
    this.wsService.disconnect();

    // Clear any pending timers
    clearTimeout(this.typingTimer);
  }

  // ─── Load Room ────────────────────────────────────────────
  private loadRoom(): void {
    this.loadingRoom.set(true);

    this.roomService.getRoomById(this.roomId()).subscribe({
      next: (room) => {
        this.room.set(room);
        this.loadingRoom.set(false);

        // Load members and history in parallel
        this.loadMembers();
        this.loadHistory();

        // Connect to WebSocket AFTER we have room data
        this.connectWebSocket();
      },
      error: () => {
        this.loadingRoom.set(false);
        this.notification.error('Room not found');
      },
    });
  }

  // ─── Load Members ─────────────────────────────────────────
  private loadMembers(): void {
    this.roomService.getRoomMembers(this.roomId()).subscribe({
      next: (members) => this.members.set(members),
      error: () => {},
    });
  }

  // ─── Load Chat History ────────────────────────────────────
  loadHistory(append = false): void {
    this.loadingHistory.set(true);

    // When loading MORE history (scroll to top), don't auto-scroll
    if (append) this.shouldScrollToBottom = false;

    this.chatService.getChatHistory(this.roomId(), this.historyPage()).subscribe({
      next: (page) => {
        // Server returns newest first → reverse for display (oldest at top)
        const reversed = [...page.content].reverse();

        if (append) {
          // Prepend older messages to the top of the list
          this.messages.update((msgs) => [...reversed, ...msgs]);
        } else {
          // First load — just set the messages and scroll to bottom
          this.messages.set(reversed);
          this.shouldScrollToBottom = true;
        }

        this.hasMoreHistory.set(!page.last);
        this.loadingHistory.set(false);
      },
      error: () => this.loadingHistory.set(false),
    });
  }

  // Load previous page of messages
  loadOlderMessages(): void {
    this.historyPage.update((p) => p + 1);
    this.loadHistory(true);
  }

  // ─── WebSocket Setup ──────────────────────────────────────
  private connectWebSocket(): void {
    // Step 1: Connect to the WebSocket server
    this.wsService.connect();

    // Wait for connection then subscribe to room topics
    // We retry because connection takes a moment
    const setupSubscriptions = () => {
      if (this.wsService.status() === 'CONNECTED') {
        this.subscribeToMessages();
        this.subscribeToTyping();
      } else {
        // Try again in 500ms
        setTimeout(setupSubscriptions, 500);
      }
    };

    setTimeout(setupSubscriptions, 500);
  }

  // Subscribe to new messages in this room
  private subscribeToMessages(): void {
    this.unsubMessage = this.wsService.subscribeToRoom(
      this.roomId(),
      (message: MessageResponse) => {
        // New message arrived via WebSocket
        this.messages.update((msgs) => [...msgs, message]);
        this.shouldScrollToBottom = true;
      },
    );
  }

  // Subscribe to typing indicators
  private subscribeToTyping(): void {
    this.unsubTyping = this.wsService.subscribeToTyping(this.roomId(), (typing: TypingResponse) => {
      if (typing.isTyping) {
        // Add user to typing map
        this.typingUsers.update((map) => {
          const newMap = new Map(map);
          newMap.set(typing.userId, typing);
          return newMap;
        });
      } else {
        // Remove user from typing map
        this.typingUsers.update((map) => {
          const newMap = new Map(map);
          newMap.delete(typing.userId);
          return newMap;
        });
      }
    });
  }

  // ─── Send Message ─────────────────────────────────────────
  sendMessage(): void {
    const content = this.messageText.trim();
    if (!content) return;

    // Send via WebSocket
    this.wsService.sendMessage(this.roomId(), content);

    // Clear the input
    this.messageText = '';

    // Stop typing indicator
    this.stopTyping();
  }

  // Handle Enter key to send
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevent newline
      this.sendMessage();
    }
  }

  // ─── Typing Indicator ─────────────────────────────────────
  onInputChange(): void {
    if (!this.isTypingSent) {
      // Start typing — send once
      this.wsService.sendTyping(this.roomId(), true);
      this.isTypingSent = true;
    }

    // Reset the stop-typing timer (debounce 2 seconds)
    clearTimeout(this.typingTimer);
    this.typingTimer = setTimeout(() => {
      this.stopTyping();
    }, 2000);
  }

  private stopTyping(): void {
    if (this.isTypingSent) {
      this.wsService.sendTyping(this.roomId(), false);
      this.isTypingSent = false;
    }
    clearTimeout(this.typingTimer);
  }

  // ─── Scroll to Bottom ─────────────────────────────────────
  private scrollToBottom(): void {
    try {
      const el = this.messageListRef?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
    this.shouldScrollToBottom = false;
  }

  // ─── Helpers ──────────────────────────────────────────────

  // Is this message from the current user?
  isOwnMessage(message: MessageResponse): boolean {
    return message.sender.id === this.currentUser()?.id;
  }

  // Show sender name/avatar only for first message in a group
  // (when the same person sends multiple messages in a row)
  shouldShowSender(messages: MessageResponse[], index: number): boolean {
    if (index === 0) return true;
    return messages[index - 1].sender.id !== messages[index].sender.id;
  }

  // Format timestamp — "2:30 PM" or "Yesterday 2:30 PM"
  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    if (diffDays === 0) return timeStr;
    if (diffDays === 1) return `Yesterday ${timeStr}`;
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${timeStr}`;
  }

  // Get number of online members
  onlineCount = computed(() => this.members().filter((m) => m.isOnline).length);
}
