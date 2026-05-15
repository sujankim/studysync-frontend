import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from './core/services/theme.service';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected readonly title = signal('studysync-frontend');
  private readonly themeService = inject(ThemeService);
  private readonly authService = inject(AuthService);

  ngOnInit(): void {
    // On every app start / page refresh:
    // 1. Try to use the HttpOnly refresh cookie to restore the session
    // 2. If it works  → user stays logged in silently
    // 3. If it fails  → guard redirects to /login
    // 4. Either way   → sessionRestored = true → guard proceeds
    this.authService.tryRestoreSession().subscribe();
  }
}
