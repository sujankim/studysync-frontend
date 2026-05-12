import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Landing
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing-page/landing-page').then((m) => m.LandingPage),
  },
  // Default → redirect to login
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  // Auth routes (public)
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login-page/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/pages/register-page/register-page').then((m) => m.RegisterPage),
  },

  // Protected shell (Phase 4)
  /*{
    path: '',
    loadComponent: () => import('./layout/app-shell/app-shell').then((m) => m.AppShell),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard-page/dashboard-page').then(
            (m) => m.DashboardPage,
          ),
      },*/
  {
    path: 'rooms',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/rooms/pages/rooms-page/rooms-page').then((m) => m.RoomsPage),
  },
  /*  ],
  },*/

  // Fallback
  { path: '**', redirectTo: '' },
];
