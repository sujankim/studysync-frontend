import { Injectable, signal, computed, effect, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly STORAGE_KEY = 'ss-theme';

  // ─── State ───────────────────────────────────────────────────
  private readonly _theme = signal<Theme>(this.getInitialTheme());

  // ─── Public API ──────────────────────────────────────────────
  readonly currentTheme = this._theme.asReadonly();
  readonly isDark = computed(() => this._theme() === 'dark');
  readonly isLight = computed(() => this._theme() === 'light');

  constructor(@Inject(DOCUMENT) private document: Document) {
    // Apply theme to DOM whenever signal changes
    effect(() => {
      this.applyTheme(this._theme());
    });
  }

  // ─── Toggle ──────────────────────────────────────────────────
  toggle(): void {
    this._theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  setTheme(theme: Theme): void {
    this._theme.set(theme);
  }

  // ─── Private ─────────────────────────────────────────────────
  private getInitialTheme(): Theme {
    // 1. Check localStorage first
    const stored = localStorage.getItem(this.STORAGE_KEY) as Theme | null;
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }

    // 2. Fall back to system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    return prefersDark ? 'dark' : 'light';
  }

  private applyTheme(theme: Theme): void {
    // Set data-theme attribute on <html>
    this.document.documentElement.setAttribute('data-theme', theme);

    // Update meta theme-color (browser toolbar on mobile)
    const metaThemeColor = this.document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#08081a' : '#f5f3ff');
    }

    // Persist to localStorage
    localStorage.setItem(this.STORAGE_KEY, theme);
  }
}
