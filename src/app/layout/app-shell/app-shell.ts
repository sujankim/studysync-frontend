import {
  Component,
  inject,
  signal,
  computed,
  HostListener,
  PLATFORM_ID,
  Inject,
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { ThemeToggle } from '../../shared/components/theme-toggle/theme-toggle';

interface NavItem {
  icon: string;
  label: string;
  route: string;
  badge?: number | null;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule,
    MatBadgeModule,
    ThemeToggle,
  ],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class AppShell {
  readonly authService  = inject(AuthService);
  readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);

  // ─── Sidebar State ────────────────────────────────────────
  isCollapsed = signal(false);
  isMobile    = signal(false);
  mobileOpen  = signal(false);

  // ─── Current User ─────────────────────────────────────────
  user = this.authService.currentUser;

  //  safe computed for avatar letter
  avatarLetter = computed(() => {
    const name = this.user()?.name;
    return name ? name.charAt(0).toUpperCase() : 'U';
  });

  //  safe computed for first name
  firstName = computed(() => {
    const name = this.user()?.name;
    if (!name) return 'there';
    const parts = name.split(' ');
    return parts[0] ?? name;
  });

  // ─── Navigation Items ─────────────────────────────────────
  navItems: NavItem[] = [
    { icon: 'dashboard',           label: 'Dashboard',     route: '/dashboard'     },
    { icon: 'meeting_room',        label: 'Study Rooms',   route: '/rooms'         },
    { icon: 'chat_bubble_outline', label: 'Messages',      route: '/messages',     badge: 3 },
    { icon: 'folder_open',         label: 'Resources',     route: '/resources'     },
    { icon: 'calendar_month',      label: 'Calendar',      route: '/calendar'      },
    { icon: 'bar_chart',           label: 'Analytics',     route: '/analytics'     },
    { icon: 'leaderboard',         label: 'Leaderboard',   route: '/leaderboard'   },
    { icon: 'group',               label: 'Friends',       route: '/friends'       },
    { icon: 'notifications_none',  label: 'Notifications', route: '/notifications', badge: 8 },
    { icon: 'settings',            label: 'Settings',      route: '/settings'      },
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    if (isPlatformBrowser(this.platformId)) {
      this.checkMobile(window.innerWidth);
    }
  }

  //  use window.innerWidth directly (no $event.target)
  @HostListener('window:resize')
  onResize() {
    this.checkMobile(window.innerWidth);
  }

  private checkMobile(width: number): void {
    const mobile = width < 768;
    this.isMobile.set(mobile);
    if (mobile) {
      this.isCollapsed.set(true);
      this.mobileOpen.set(false);
    } else {
      this.isCollapsed.set(false);
      this.mobileOpen.set(false);
    }
  }

  toggleCollapse(): void {
    if (this.isMobile()) {
      this.mobileOpen.update(v => !v);
    } else {
      this.isCollapsed.update(v => !v);
    }
  }

  closeMobileMenu(): void {
    if (this.isMobile()) {
      this.mobileOpen.set(false);
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
