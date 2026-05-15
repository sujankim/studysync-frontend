import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormsModule, // ✅ Fix 4 — added
  FormBuilder,
  Validators,
} from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotificationService } from '../../../../core/services/notification.service';
import { ROOM_TOPICS } from '../../../../core/models/room.model';
import { RoomService } from '../../../../core/services/room.service';

@Component({
  selector: 'app-create-room-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule, // ✅ Fix 4 — added
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './create-room-dialog.html',
  styleUrl: './create-room-dialog.scss',
})
export class CreateRoomDialog {
  private readonly roomService = inject(RoomService);
  private readonly notification = inject(NotificationService);
  private readonly dialogRef = inject(MatDialogRef<CreateRoomDialog>);
  private readonly fb = inject(FormBuilder);

  loading = signal(false);

  topics = ROOM_TOPICS.filter((t) => t !== 'All Topics');

  tagInput = '';
  tags = signal<string[]>([]);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(500)]],
    topic: ['', [Validators.required]],
    isPrivate: [false],
    maxMembers: [50, [Validators.min(2), Validators.max(200)]],
  });

  addTag(input: HTMLInputElement) {
    const tag = input.value.trim().toLowerCase().replace(/\s+/g, '-');
    if (tag && this.tags().length < 5 && !this.tags().includes(tag)) {
      this.tags.update((t) => [...t, tag]);
    }
    input.value = '';
    this.tagInput = '';
  }

  removeTag(tag: string) {
    this.tags.update((t) => t.filter((x) => x !== tag));
  }

  onTagKeydown(event: KeyboardEvent, input: HTMLInputElement) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addTag(input);
    }
    if (event.key === 'Backspace' && !input.value && this.tags().length > 0) {
      this.tags.update((t) => t.slice(0, -1));
    }
  }

  onSubmit() {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);

    const v = this.form.getRawValue();

    this.roomService
      .createRoom({
        name: v.name,
        description: v.description || undefined,
        topic: v.topic,
        tags: this.tags(),
        isPrivate: v.isPrivate,
        maxMembers: v.maxMembers,
      })
      .subscribe({
        next: (room) => {
          this.notification.success(`Room "${room.name}" created! 🎉`);
          this.dialogRef.close(room);
        },
        error: (err) => {
          this.notification.error(err.error?.message || 'Failed to create room');
          this.loading.set(false);
        },
      });
  }
}
