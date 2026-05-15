import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NotificationService } from '../../../../core/services/notification.service';
import { CreateRoomDialog } from '../../components/create-room-dialog/create-room-dialog';
import { RoomCard } from '../../components/room-card/room-card';
import { StudyRoomResponse, ROOM_TOPICS } from '../../../../core/models/room.model';
import { RoomService } from '../../../../core/services/room.service';

type ActiveTab = 'all' | 'my';

@Component({
  selector: 'app-rooms-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    // ✅ Fix 1 — RouterLink removed (not used in template)
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    RoomCard,
  ],
  templateUrl: './rooms-page.html',
  styleUrl: './rooms-page.scss',
})
export class RoomsPage implements OnInit {
  private readonly roomService = inject(RoomService);
  private readonly notification = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  allRooms = signal<StudyRoomResponse[]>([]);
  myRooms = signal<StudyRoomResponse[]>([]);
  loading = signal(true);
  myLoading = signal(true);

  activeTab = signal<ActiveTab>('all');
  activeTopic = signal('All Topics');
  searchQuery = signal('');

  currentPage = signal(0);
  totalPages = signal(0);
  totalItems = signal(0);

  readonly topics = ROOM_TOPICS;

  private searchSubject = new Subject<string>();

  constructor() {
    this.searchSubject
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((q) => {
        this.searchQuery.set(q);
        this.currentPage.set(0);
        this.loadAllRooms();
      });
  }

  ngOnInit() {
    this.loadAllRooms();
    this.loadMyRooms();
  }

  loadAllRooms() {
    this.loading.set(true);
    this.roomService
      .browseRooms(this.activeTopic(), this.searchQuery(), this.currentPage())
      .subscribe({
        next: (page) => {
          this.allRooms.set(page.content);
          this.totalPages.set(page.totalPages);
          this.totalItems.set(page.totalElements);
          this.loading.set(false);
        },
        error: () => {
          this.notification.error('Failed to load rooms. Please try again.');
          this.loading.set(false);
        },
      });
  }

  loadMyRooms() {
    this.myLoading.set(true);
    this.roomService.getMyRooms().subscribe({
      next: (rooms) => {
        this.myRooms.set(rooms);
        this.myLoading.set(false);
      },
      error: () => this.myLoading.set(false),
    });
  }

  onSearch(q: string) {
    this.searchSubject.next(q);
  }

  onTopicFilter(topic: string) {
    this.activeTopic.set(topic);
    this.currentPage.set(0);
    this.loadAllRooms();
  }

  openCreateDialog() {
    const ref = this.dialog.open(CreateRoomDialog, {
      maxWidth: '95vw',
      panelClass: 'ss-dialog-panel',
      disableClose: false,
    });

    ref.afterClosed().subscribe((newRoom) => {
      if (newRoom) {
        this.allRooms.update((rooms) => [newRoom, ...rooms]);
        this.myRooms.update((rooms) => [newRoom, ...rooms]);
        this.totalItems.update((n) => n + 1);
      }
    });
  }

  onJoin(room: StudyRoomResponse) {
    this.roomService.joinRoom(room.id).subscribe({
      next: (updated) => {
        this.notification.success(`Joined "${updated.name}"! 🎉`);
        this.updateRoom(updated);
        this.myRooms.update((rooms) => [updated, ...rooms]);
      },
      error: (err) => {
        this.notification.error(err.error?.message || 'Failed to join room');
      },
    });
  }

  onLeave(room: StudyRoomResponse) {
    this.roomService.leaveRoom(room.id).subscribe({
      next: () => {
        this.notification.info(`Left "${room.name}"`);
        this.updateRoom({ ...room, isMember: false, memberRole: null });
        this.myRooms.update((rooms) => rooms.filter((r) => r.id !== room.id));
      },
      error: (err) => {
        this.notification.error(err.error?.message || 'Failed to leave room');
      },
    });
  }

  onDelete(room: StudyRoomResponse) {
    if (!confirm(`Delete "${room.name}"? This cannot be undone.`)) return;

    this.roomService.deleteRoom(room.id).subscribe({
      next: () => {
        this.notification.success(`"${room.name}" has been deleted.`);
        this.allRooms.update((rooms) => rooms.filter((r) => r.id !== room.id));
        this.myRooms.update((rooms) => rooms.filter((r) => r.id !== room.id));
        this.totalItems.update((n) => n - 1);
      },
      error: (err) => {
        this.notification.error(err.error?.message || 'Failed to delete room');
      },
    });
  }

  prevPage() {
    if (this.currentPage() > 0) {
      this.currentPage.update((p) => p - 1);
      this.loadAllRooms();
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.update((p) => p + 1);
      this.loadAllRooms();
    }
  }

  private updateRoom(updated: StudyRoomResponse) {
    this.allRooms.update((rooms) => rooms.map((r) => (r.id === updated.id ? updated : r)));
  }
}
