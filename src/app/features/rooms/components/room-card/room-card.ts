import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { getTopicEmoji, StudyRoomResponse } from '../../../../core/models/room.model';

@Component({
  selector: 'app-room-card',
  imports: [CommonModule, RouterLink, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './room-card.html',
  styleUrl: './room-card.scss',
})
export class RoomCard {
  @Input({ required: true }) room!: StudyRoomResponse;
  @Output() joinClicked = new EventEmitter<StudyRoomResponse>();
  @Output() leaveClicked = new EventEmitter<StudyRoomResponse>();
  @Output() deleteClicked = new EventEmitter<StudyRoomResponse>();

  getEmoji(): string {
    return getTopicEmoji(this.room.topic);
  }

  get memberPercent(): number {
    return Math.round((this.room.memberCount / this.room.maxMembers) * 100);
  }

  get isOwner(): boolean {
    return this.room.memberRole === 'OWNER';
  }
}
