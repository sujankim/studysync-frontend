import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { filter, map, take } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // The problem without this:
  // 1. Page refreshes
  // 2. Guard runs IMMEDIATELY (sessionRestored = false)
  // 3. isLoggedIn() = false (token not restored yet)
  // 4. Guard redirects to /login — WRONG!
  //
  // The fix:
  // Wait until sessionRestored = true BEFORE checking isLoggedIn
  // This gives tryRestoreSession() time to complete first

  return toObservable(authService.sessionRestored).pipe(
    // Skip the initial false value — wait for true
    filter((restored) => restored === true),

    // Only take the first true value (don't keep listening)
    take(1),

    // Now that session is restored, check if logged in
    map(() => {
      if (authService.isLoggedIn()) {
        return true; // ← allow navigation
      }
      // Not logged in → go to login page
      router.navigate(['/login']);
      return false;
    }),
  );
};
