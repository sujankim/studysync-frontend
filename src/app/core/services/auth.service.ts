import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, UserResponse } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = environment.apiUrl;

  // ─── State (in-memory — never localStorage for access tokens) ───
  private readonly _accessToken = signal<string | null>(null);
  private readonly _currentUser = signal<UserResponse | null>(null);

  // ─── Public computed signals ────────────────────────────────────
  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoggedIn = computed(
    () => this._accessToken() !== null && this._currentUser() !== null,
  );
  readonly isPro = computed(() => this._currentUser()?.plan === 'PRO');

  // ─── Auth Endpoints ─────────────────────────────────────────────

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/register`, request)
      .pipe(tap((response) => this.setSession(response)));
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/login`, request, {
        withCredentials: true, // receive HttpOnly refresh token cookie
      })
      .pipe(tap((response) => this.setSession(response)));
  }

  refresh(): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(
        `${this.apiUrl}/auth/refresh`,
        {},
        {
          withCredentials: true, // send the HttpOnly refresh token cookie
        },
      )
      .pipe(tap((response) => this.setSession(response)));
  }

  logout(): void {
    this.http
      .post(
        `${this.apiUrl}/auth/logout`,
        {},
        {
          withCredentials: true,
        },
      )
      .subscribe({
        complete: () => this.clearSession(),
      });
  }

  // ─── Token Access (for interceptor) ────────────────────────────
  getAccessToken(): string | null {
    return this._accessToken();
  }

  // ─── Session Management ─────────────────────────────────────────
  private setSession(response: AuthResponse): void {
    this._accessToken.set(response.accessToken);
    this._currentUser.set(response.user);
  }

  clearSession(): void {
    this._accessToken.set(null);
    this._currentUser.set(null);
    this.router.navigate(['/login']);
  }
}
