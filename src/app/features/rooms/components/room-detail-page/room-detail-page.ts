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
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { WebSocketService } from '../../../../core/services/websocket.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

import { MessageResponse, TypingResponse } from '../../../../core/models/chat.model';
import {
  StudyRoomResponse,
  RoomMemberResponse,
  getTopicEmoji,
} from '../../../../core/models/room.model';
import {
  ResourceResponse,
  ResourceFilter,
  RESOURCE_TYPE_CONFIG,
  formatFileSize,
} from '../../../../core/models/resource.model';
import {ChatService} from "../../../../core/services/chat.service";
import {RoomService} from "../../../../core/services/room.service";
import {ResourceService} from "../../../../core/services/resource.service";

// Which tab is active in the room detail page
export type RoomTab = 'chat' | 'resources' | 'members';

@Component({
  selector: 'app-room-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressBarModule,
  ],
  templateUrl: './room-detail-page.html',
  styleUrl: './room-detail-page.scss',
})
export class RoomDetailPage implements OnInit, OnDestroy, AfterViewChecked {
  // ─── Services ─────────────────────────────────────────────
  private readonly route = inject(ActivatedRoute);
  readonly wsService = inject(WebSocketService);
  private readonly chatService = inject(ChatService);
  private readonly roomService = inject(RoomService);
  private readonly resourceService = inject(ResourceService);
  private readonly authService = inject(AuthService);
  private readonly notification = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  // ─── DOM ──────────────────────────────────────────────────
  @ViewChild('messageList') messageListRef!: ElementRef<HTMLDivElement>;
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  // ─── State ────────────────────────────────────────────────
  room = signal<StudyRoomResponse | null>(null);
  members = signal<RoomMemberResponse[]>([]);
  messages = signal<MessageResponse[]>([]);
  resources = signal<ResourceResponse[]>([]);

  loadingRoom = signal(true);
  loadingHistory = signal(true);
  loadingResources = signal(false);
  uploadProgress = signal(false); // true while file is uploading

  // Active tab
  activeTab = signal<RoomTab>('chat');

  // Resource filter
  resourceFilter = signal<ResourceFilter>('ALL');

  // Message input
  messageText = '';
  typingUsers = signal<Map<number, TypingResponse>>(new Map());
  hasMoreHistory = signal(false);
  historyPage = signal(0);
  private shouldScrollToBottom = true;
  private typingTimer?: ReturnType<typeof setTimeout>;
  private isTypingSent = false;
  private unsubMessage?: () => void;
  private unsubTyping?: () => void;

  // Link form
  linkForm = this.fb.nonNullable.group({
    title: ['', [Validators.required]],
    url: ['', [Validators.required]],
    description: [''],
  });
  showLinkForm = signal(false);
  showUploadForm = signal(false);
  uploadTitle = '';
  uploadDescription = '';

  // Current user
  readonly currentUser = this.authService.currentUser;

  // Room ID from URL
  readonly roomId = computed(() => Number(this.route.snapshot.paramMap.get('roomId')));

  // Typing text
  readonly typingText = computed(() => {
    const others = Array.from(this.typingUsers().values()).filter(
      (u) => u.userId !== this.currentUser()?.id,
    );
    if (others.length === 0) return '';
    if (others.length === 1) return `${others[0].name} is typing...`;
    if (others.length === 2) return `${others[0].name} and ${others[1].name} are typing...`;
    return 'Several people are typing...';
  });

  // Filtered resources based on active filter tab
  readonly filteredResources = computed(() => {
    const filter = this.resourceFilter();
    const all = this.resources();
    if (filter === 'ALL') return all;
    return all.filter((r) => r.type === filter);
  });

  // Online member count
  readonly onlineCount = computed(() => this.members().filter((m) => m.isOnline).length);

  // Expose helpers to template
  readonly resourceTypeConfig = RESOURCE_TYPE_CONFIG;
  readonly formatFileSize = formatFileSize;
  readonly resourceFilters: ResourceFilter[] = ['ALL', 'PDF', 'IMAGE', 'VIDEO', 'LINK', 'DOCUMENT'];

  setResourceFilter(filter: ResourceFilter): void {
    this.resourceFilter.set(filter);
  }

  getEmoji(): string {
    return this.room() ? getTopicEmoji(this.room()!.topic) : '📚';
  }

  // ─── Lifecycle ────────────────────────────────────────────
  ngOnInit(): void {
    this.loadRoom();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom && this.activeTab() === 'chat') {
      this.scrollToBottom();
    }
  }

  ngOnDestroy(): void {
    this.unsubMessage?.();
    this.unsubTyping?.();
    this.wsService.disconnect();
    clearTimeout(this.typingTimer);
  }

  // ─── Load Room ────────────────────────────────────────────
  private loadRoom(): void {
    this.loadingRoom.set(true);

    this.roomService.getRoomById(this.roomId()).subscribe({
      next: (room) => {
        this.room.set(room);
        this.loadingRoom.set(false);
        this.loadMembers();
        this.loadHistory();
        this.loadResources();
        this.connectWebSocket();
      },
      error: () => {
        this.loadingRoom.set(false);
        this.notification.error('Room not found');
      },
    });
  }

  private loadMembers(): void {
    this.roomService.getRoomMembers(this.roomId()).subscribe({
      next: (m) => this.members.set(m),
      error: () => {},
    });
  }

  loadHistory(append = false): void {
    this.loadingHistory.set(true);
    if (append) this.shouldScrollToBottom = false;

    this.chatService.getChatHistory(this.roomId(), this.historyPage()).subscribe({
      next: (page) => {
        const reversed = [...page.content].reverse();
        if (append) {
          this.messages.update((msgs) => [...reversed, ...msgs]);
        } else {
          this.messages.set(reversed);
          this.shouldScrollToBottom = true;
        }
        this.hasMoreHistory.set(!page.last);
        this.loadingHistory.set(false);
      },
      error: () => this.loadingHistory.set(false),
    });
  }

  loadOlderMessages(): void {
    this.historyPage.update((p) => p + 1);
    this.loadHistory(true);
  }

  // ─── Load Resources ───────────────────────────────────────
  loadResources(): void {
    this.loadingResources.set(true);

    this.resourceService.getResources(this.roomId()).subscribe({
      next: (resources) => {
        this.resources.set(resources);
        this.loadingResources.set(false);
      },
      error: () => this.loadingResources.set(false),
    });
  }

  // ─── WebSocket ────────────────────────────────────────────
  private connectWebSocket(): void {
    this.wsService.connect();

    const setup = () => {
      if (this.wsService.status() === 'CONNECTED') {
        this.subscribeToMessages();
        this.subscribeToTyping();
      } else {
        setTimeout(setup, 500);
      }
    };
    setTimeout(setup, 500);
  }

  private subscribeToMessages(): void {
    this.unsubMessage = this.wsService.subscribeToRoom(this.roomId(), (msg: MessageResponse) => {
      this.messages.update((msgs) => [...msgs, msg]);
      this.shouldScrollToBottom = true;
    });
  }

  private subscribeToTyping(): void {
    this.unsubTyping = this.wsService.subscribeToTyping(this.roomId(), (typing: TypingResponse) => {
      this.typingUsers.update((map) => {
        const m = new Map(map);
        if (typing.isTyping) {
          m.set(typing.userId, typing);
        } else {
          m.delete(typing.userId);
        }
        return m;
      });
    });
  }

  // ─── Chat ─────────────────────────────────────────────────
  sendMessage(): void {
    const content = this.messageText.trim();
    if (!content) return;
    this.wsService.sendMessage(this.roomId(), content);
    this.messageText = '';
    this.stopTyping();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  onInputChange(): void {
    if (!this.isTypingSent) {
      this.wsService.sendTyping(this.roomId(), true);
      this.isTypingSent = true;
    }
    clearTimeout(this.typingTimer);
    this.typingTimer = setTimeout(() => this.stopTyping(), 2000);
  }

  private stopTyping(): void {
    if (this.isTypingSent) {
      this.wsService.sendTyping(this.roomId(), false);
      this.isTypingSent = false;
    }
    clearTimeout(this.typingTimer);
  }

  private scrollToBottom(): void {
    try {
      const el = this.messageListRef?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
    this.shouldScrollToBottom = false;
  }

  isOwnMessage(msg: MessageResponse): boolean {
    return msg.sender.id === this.currentUser()?.id;
  }

  shouldShowSender(messages: MessageResponse[], index: number): boolean {
    if (index === 0) return true;
    return messages[index - 1].sender.id !== messages[index].sender.id;
  }

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
    return `${date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })} ${timeStr}`;
  }

  // ─── Resources ────────────────────────────────────────────

  // Trigger file picker
  triggerFileUpload(): void {
    this.fileInputRef?.nativeElement.click();
  }

  // Called when user picks a file
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Show upload form to let user set title/description
    this.uploadTitle = file.name.replace(/\.[^/.]+$/, ''); // strip extension
    this.uploadDescription = '';
    this.showUploadForm.set(true);

    // Store the file for when they click confirm
    this._selectedFile = file;

    // Reset input so same file can be selected again
    input.value = '';
  }

  // Store selected file temporarily
  private _selectedFile?: File;

  confirmUpload(): void {
    if (!this._selectedFile) return;
    this.showUploadForm.set(false);
    this.uploadProgress.set(true);

    this.resourceService
      .uploadFile(
        this.roomId(),
        this._selectedFile,
        this.uploadTitle,
        this.uploadDescription || undefined,
      )
      .subscribe({
        next: (resource) => {
          this.resources.update((r) => [resource, ...r]);
          this.notification.success(`"${resource.title}" uploaded successfully!`);
          this.uploadProgress.set(false);
          this._selectedFile = undefined;
        },
        error: (err) => {
          this.notification.error(err.error?.message || 'Upload failed. Please try again.');
          this.uploadProgress.set(false);
          this._selectedFile = undefined;
        },
      });
  }

  cancelUpload(): void {
    this.showUploadForm.set(false);
    this._selectedFile = undefined;
  }

  // Submit link form
  submitLink(): void {
    if (this.linkForm.invalid) return;

    const { title, url, description } = this.linkForm.getRawValue();

    this.resourceService.addLink(this.roomId(), title, url, description || undefined).subscribe({
      next: (resource) => {
        this.resources.update((r) => [resource, ...r]);
        this.notification.success('Link added!');
        this.linkForm.reset();
        this.showLinkForm.set(false);
      },
      error: (err) => {
        this.notification.error(err.error?.message || 'Failed to add link.');
      },
    });
  }

  // Delete a resource
  deleteResource(resource: ResourceResponse): void {
    if (!confirm(`Delete "${resource.title}"?`)) return;

    this.resourceService.deleteResource(this.roomId(), resource.id).subscribe({
      next: () => {
        this.resources.update((r) => r.filter((x) => x.id !== resource.id));
        this.notification.success('Resource deleted.');
      },
      error: (err) => {
        this.notification.error(err.error?.message || 'Failed to delete resource.');
      },
    });
  }

  // Can this user delete the resource?
  canDelete(resource: ResourceResponse): boolean {
    const uid = this.currentUser()?.id;
    if (!uid) return false;
    // Uploader can always delete
    if (resource.uploadedBy.id === uid) return true;
    // Room owner can also delete
    return this.room()?.memberRole === 'OWNER';
  }

  // Open resource in new tab
  openResource(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
