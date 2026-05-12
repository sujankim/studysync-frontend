import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardStats, StudySessionResponse } from '../models/dashboard.model';


@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard`);
  }

  startSession(roomId?: number, roomName?: string): Observable<StudySessionResponse> {
    return this.http.post<StudySessionResponse>(`${this.apiUrl}/sessions/start`, {
      roomId: roomId ?? null,
      roomName: roomName ?? null,
    });
  }

  endSession(): Observable<StudySessionResponse> {
    return this.http.post<StudySessionResponse>(`${this.apiUrl}/sessions/end`, {});
  }

  getActiveSession(): Observable<StudySessionResponse | null> {
    return this.http.get<StudySessionResponse | null>(`${this.apiUrl}/sessions/active`);
  }
}
