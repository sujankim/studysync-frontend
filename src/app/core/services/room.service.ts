import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  StudyRoomResponse,
  CreateRoomRequest,
  RoomMemberResponse,
  PageResponse,
} from '../models/room.model'
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RoomService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/rooms`;

  // ─── Browse ────────────────────────────────────────────────
  browseRooms(
    topic?: string,
    search?: string,
    page = 0,
    size = 12,
  ): Observable<PageResponse<StudyRoomResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);

    if (topic && topic !== 'All Topics') {
      params = params.set('topic', topic);
    }
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<PageResponse<StudyRoomResponse>>(this.apiUrl, { params });
  }

  // ─── My Rooms ──────────────────────────────────────────────
  getMyRooms(): Observable<StudyRoomResponse[]> {
    return this.http.get<StudyRoomResponse[]>(`${this.apiUrl}/my`);
  }

  // ─── Single Room ───────────────────────────────────────────
  getRoomById(roomId: number): Observable<StudyRoomResponse> {
    return this.http.get<StudyRoomResponse>(`${this.apiUrl}/${roomId}`);
  }

  // ─── Create ────────────────────────────────────────────────
  createRoom(request: CreateRoomRequest): Observable<StudyRoomResponse> {
    return this.http.post<StudyRoomResponse>(this.apiUrl, request);
  }

  // ─── Join ──────────────────────────────────────────────────
  joinRoom(roomId: number): Observable<StudyRoomResponse> {
    return this.http.post<StudyRoomResponse>(`${this.apiUrl}/${roomId}/join`, {});
  }

  joinByInviteCode(code: string): Observable<StudyRoomResponse> {
    return this.http.post<StudyRoomResponse>(`${this.apiUrl}/join/invite/${code}`, {});
  }

  // ─── Leave ─────────────────────────────────────────────────
  leaveRoom(roomId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${roomId}/leave`);
  }

  // ─── Delete ────────────────────────────────────────────────
  deleteRoom(roomId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${roomId}`);
  }

  // ─── Members ───────────────────────────────────────────────
  getRoomMembers(roomId: number): Observable<RoomMemberResponse[]> {
    return this.http.get<RoomMemberResponse[]>(`${this.apiUrl}/${roomId}/members`);
  }
}
