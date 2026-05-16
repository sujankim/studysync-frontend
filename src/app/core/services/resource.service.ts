import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ResourceResponse, ResourceType } from '../models/resource.model';

@Injectable({ providedIn: 'root' })
export class ResourceService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  // ─── Upload File ───────────────────────────────────────────
  // Uses FormData — not JSON — because we're sending a binary file
  uploadFile(
    roomId: number,
    file: File,
    title: string,
    description?: string,
  ): Observable<ResourceResponse> {
    // FormData = the browser's way to send files over HTTP
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    if (description) formData.append('description', description);

    return this.http.post<ResourceResponse>(
      `${this.apiUrl}/rooms/${roomId}/resources/upload`,
      formData,
      // ✅ Do NOT set Content-Type manually for FormData
      // Angular + browser sets it automatically with the correct boundary
    );
  }

  // ─── Add Link ──────────────────────────────────────────────
  addLink(
    roomId: number,
    title: string,
    url: string,
    description?: string,
  ): Observable<ResourceResponse> {
    let params = new HttpParams().set('title', title).set('url', url);

    if (description) params = params.set('description', description);

    return this.http.post<ResourceResponse>(`${this.apiUrl}/rooms/${roomId}/resources/link`, null, {
      params,
    });
  }

  // ─── Get Resources ─────────────────────────────────────────
  getResources(roomId: number, type?: ResourceType): Observable<ResourceResponse[]> {
    let params = new HttpParams();
    if (type) params = params.set('type', type);

    return this.http.get<ResourceResponse[]>(`${this.apiUrl}/rooms/${roomId}/resources`, {
      params,
    });
  }

  // ─── My Uploads ────────────────────────────────────────────
  getMyUploads(roomId: number): Observable<ResourceResponse[]> {
    return this.http.get<ResourceResponse[]>(`${this.apiUrl}/rooms/${roomId}/resources/my`);
  }

  // ─── Delete ────────────────────────────────────────────────
  deleteResource(roomId: number, resourceId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/rooms/${roomId}/resources/${resourceId}`);
  }
}
