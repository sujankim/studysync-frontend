import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, UserResponse } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = environment.apiUrl;

  // ─── State ────────────────────────────────────────────────
  // Access token: memory only (never localStorage — XSS risk)
  private readonly _accessToken = signal<string | null>(null);
  private readonly _currentUser = signal<UserResponse | null>(null);

  // Track if we've tried to restore the session yet
  // This prevents the guard from redirecting BEFORE we check the cookie
  private readonly _sessionRestored = signal(false);

  // ─── Public Read-Only ─────────────────────────────────────
  readonly currentUser = this._currentUser.asReadonly();
  readonly sessionRestored = this._sessionRestored.asReadonly();

  readonly isLoggedIn = computed(
    () => this._accessToken() !== null && this._currentUser() !== null,
  );

  readonly isPro = computed(() => this._currentUser()?.plan === 'PRO');

  // ─── Session Restore ──────────────────────────────────────
  // Called ONCE when the app starts (in AppComponent)
  // Tries to use the HttpOnly refresh cookie to get a new access token
  // If it works  → user is silently logged in (stays on current page)
  // If it fails  → signals stay null (user goes to /login normally)
  tryRestoreSession(): Observable<AuthResponse | null> {
    return this.http
      .post<AuthResponse>(
        `${this.apiUrl}/auth/refresh`,
        {},
        {
          withCredentials: true, // ← send the HttpOnly cookie
        },
      )
      .pipe(
        tap((response) => {
          // Refresh succeeded → restore session
          this.setSession(response);
          this._sessionRestored.set(true);
        }),
        catchError(() => {
          // Refresh failed → no valid cookie → just mark as restored
          // Don't redirect here — let the guard handle it
          this._sessionRestored.set(true);
          return of(null);
        }),
      );
  }

  // ─── Auth Endpoints ───────────────────────────────────────
  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/register`, request, {
        withCredentials: true,
      })
      .pipe(tap((response) => this.setSession(response)));
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/login`, request, {
        withCredentials: true, // ← receive the HttpOnly refresh cookie
      })
      .pipe(tap((response) => this.setSession(response)));
  }

  refresh(): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(
        `${this.apiUrl}/auth/refresh`,
        {},
        {
          withCredentials: true,
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
          withCredentials: true, // ← send cookie so server clears it
        },
      )
      .subscribe({
        complete: () => this.clearSession(),
      });
  }

  // ─── Token Access (for interceptor) ──────────────────────
  getAccessToken(): string | null {
    return this._accessToken();
  }

  // ─── Private ──────────────────────────────────────────────
  private setSession(response: AuthResponse): void {
    this._accessToken.set(response.accessToken);
    this._currentUser.set(response.user);
  }

  clearSession(): void {
    this._accessToken.set(null);
    this._currentUser.set(null);
    this._sessionRestored.set(true);
    this.router.navigate(['/login']);
  }
}
