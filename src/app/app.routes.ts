import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // ─── PUBLIC ───────────────────────────────────────────────
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing-page/landing-page')
        .then((m) => m.LandingPage),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login-page/login-page')
        .then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/pages/register-page/register-page')
        .then((m) => m.RegisterPage),
  },

  // ─── PROTECTED — inside App Shell ─────────────────────────
  {
    path: '',
    loadComponent: () =>
      import('./layout/app-shell/app-shell')
        .then((m) => m.AppShell),
    canActivate: [authGuard],
    children: [
      // Default redirect
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard-page/dashboard-page').then(
            (m) => m.DashboardPage,
          ),
      },

      // ── Stubs — built in later phases ──────────────────
      {
        path: 'rooms',
        loadComponent: () =>
          import('./features/rooms/pages/rooms-page/rooms-page')
            .then((m) => m.RoomsPage),
      },
      {
        path: 'messages',
        loadComponent: () =>
          import('./features/stubs/stubs')
            .then((m) => m.StubPage),
      },
      {
        path: 'resources',
        loadComponent: () =>
          import('./features/stubs/stubs')
            .then((m) => m.StubPage),
      },
      {
        path: 'calendar',
        loadComponent: () =>
          import('./features/stubs/stubs')
            .then((m) => m.StubPage),
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./features/stubs/stubs')
            .then((m) => m.StubPage),
      },
      {
        path: 'leaderboard',
        loadComponent: () =>
          import('./features/stubs/stubs')
            .then((m) => m.StubPage),
      },
      {
        path: 'friends',
        loadComponent: () =>
          import('./features/stubs/stubs')
            .then((m) => m.StubPage),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/stubs/stubs')
            .then((m) => m.StubPage),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/stubs/stubs')
            .then((m) => m.StubPage),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/stubs/stubs')
            .then((m) => m.StubPage),
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
