import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Chart, registerables } from 'chart.js';
import { AuthService } from '../../../../core/services/auth.service';
import { ThemeService } from '../../../../core/services/theme.service';
import {
  DashboardStats,
  MOCK_ONLINE_FRIENDS,
  MOCK_LEADERBOARD,
} from '../../../../core/models/dashboard.model';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { TotalMinutesPipe } from '../../../../shared/pipes/total-minutes.pipe';

// Register all Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatButtonModule, TotalMinutesPipe],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
})
export class DashboardPage implements OnInit, AfterViewInit, OnDestroy {
  private readonly dashboardService = inject(DashboardService);
  private readonly authService = inject(AuthService);
  readonly themeService = inject(ThemeService);

  // ─── State ────────────────────────────────────────────────
  stats = signal<DashboardStats | null>(null);
  loading = signal(true);

  // ─── Chart refs ───────────────────────────────────────────
  @ViewChild('weeklyChart') weeklyChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('streakChart') streakChartRef!: ElementRef<HTMLCanvasElement>;

  private weeklyChart?: Chart;
  private streakChart?: Chart;

  // ─── Mocks (TODO: Phase 11 Friends, Phase 8 Leaderboard) ──
  readonly onlineFriends = MOCK_ONLINE_FRIENDS;
  readonly leaderboard = MOCK_LEADERBOARD;

  // ─── My Rooms (TODO: Phase 5 Rooms API) ───────────────────
  readonly myRooms = [
    { id: 1, name: 'Java Champions', members: 24, topic: 'Java', emoji: '☕', color: 'amber' },
    { id: 2, name: 'DSA Grind', members: 18, topic: 'DSA', emoji: '🧮', color: 'purple' },
    {
      id: 3,
      name: 'System Design Hub',
      members: 15,
      topic: 'System Design',
      emoji: '🏗️',
      color: 'cyan',
    },
    {
      id: 4,
      name: 'Spring Boot Ninjas',
      members: 12,
      topic: 'Spring Boot',
      emoji: '🍃',
      color: 'green',
    },
  ];

  // ─── User greeting ────────────────────────────────────────
  user = this.authService.currentUser;

  greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  });

  firstName = computed(() => {
    const name = this.user()?.name;
    if (!name) return 'there';
    return name.split(' ')[0];
  });

  todayDate = computed(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  });

  // ─── Lifecycle ────────────────────────────────────────────
  ngOnInit(): void {
    this.loadStats();
  }

  ngAfterViewInit(): void {
    // Charts drawn after data loads (see loadStats)
  }

  ngOnDestroy(): void {
    this.weeklyChart?.destroy();
    this.streakChart?.destroy();
  }

  // ─── Load Data ────────────────────────────────────────────
  loadStats(): void {
    this.loading.set(true);
    this.dashboardService.getStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);
        // Small delay to ensure canvas elements are rendered
        setTimeout(() => {
          this.buildWeeklyChart(data);
          this.buildStreakChart(data);
        }, 50);
      },
      error: () => {
        // Load with zeroed data so charts still render
        const empty: DashboardStats = {
          studyTimeToday: '0m',
          studyMinutesToday: 0,
          studyTimeChangePercent: 0,
          studyTimeUp: true,
          roomsJoined: 0,
          roomsJoinedThisWeek: 0,
          resourcesShared: 0,
          resourcesThisWeek: 0,
          currentStreak: 0,
          longestStreak: 0,
          totalStudyDays: 0,
          totalStudyMinutes: 0,
          weekDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          weeklyMinutes: [0, 0, 0, 0, 0, 0, 0],
          userName: this.user()?.name ?? '',
          userPlan: this.user()?.plan ?? 'FREE',
        };
        this.stats.set(empty);
        this.loading.set(false);
        setTimeout(() => {
          this.buildWeeklyChart(empty);
          this.buildStreakChart(empty);
        }, 50);
      },
    });
  }

  // ─── Charts ───────────────────────────────────────────────
  private buildWeeklyChart(data: DashboardStats): void {
    if (!this.weeklyChartRef?.nativeElement) return;
    this.weeklyChart?.destroy();

    const isDark = this.themeService.isDark();
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(124,58,237,0.08)';
    const labelColor = isDark ? '#94a3b8' : '#5b5b8a';

    const ctx = this.weeklyChartRef.nativeElement.getContext('2d')!;

    // Purple gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, 'rgba(124,58,237,0.35)');
    gradient.addColorStop(1, 'rgba(124,58,237,0.0)');

    this.weeklyChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.weekDays,
        datasets: [
          {
            data: data.weeklyMinutes,
            borderColor: '#7c3aed',
            backgroundColor: gradient,
            borderWidth: 2.5,
            pointRadius: 4,
            pointBackgroundColor: '#7c3aed',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverRadius: 6,
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isDark ? '#151530' : '#fff',
            titleColor: labelColor,
            bodyColor: '#7c3aed',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(124,58,237,0.15)',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: (ctx) => ` ${ctx.parsed.y} min`,
            },
          },
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: { color: labelColor, font: { size: 12 } },
            border: { display: false },
          },
          y: {
            grid: { color: gridColor },
            ticks: {
              color: labelColor,
              font: { size: 11 },
              callback: (v) => `${v}m`,
            },
            border: { display: false },
            beginAtZero: true,
          },
        },
      },
    });
  }

  private buildStreakChart(data: DashboardStats): void {
    if (!this.streakChartRef?.nativeElement) return;
    this.streakChart?.destroy();

    const pct =
      data.longestStreak > 0 ? Math.min((data.currentStreak / data.longestStreak) * 100, 100) : 0;
    const remaining = 100 - pct;

    this.streakChart = new Chart(this.streakChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        datasets: [
          {
            data: [pct, remaining],
            backgroundColor: [
              '#7c3aed',
              this.themeService.isDark() ? 'rgba(255,255,255,0.06)' : 'rgba(124,58,237,0.08)',
            ],
            borderWidth: 0,
            hoverBorderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '78%',
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
      },
    });
  }

  // ─── Helpers ──────────────────────────────────────────────
  getRoomColor(color: string): string {
    const map: Record<string, string> = {
      purple: 'var(--ss-stat-purple-bg)',
      cyan: 'var(--ss-stat-cyan-bg)',
      amber: 'var(--ss-stat-amber-bg)',
      green: 'var(--ss-stat-green-bg)',
    };
    return map[color] ?? 'var(--ss-stat-purple-bg)';
  }
}
