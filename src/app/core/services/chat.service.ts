import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MessageResponse } from '../models/chat.model';

// Handles HTTP calls for chat (history loading)
// Real-time messages use WebSocketService directly
@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  // Load message history — newest first from server
  // We reverse them in the component so oldest shows at top
  getChatHistory(
    roomId: number,
    page = 0,
    size = 50,
  ): Observable<{ content: MessageResponse[]; last: boolean }> {
    return this.http.get<{ content: MessageResponse[]; last: boolean }>(
      `${this.apiUrl}/rooms/${roomId}/messages`,
      { params: { page, size } },
    );
  }
}
