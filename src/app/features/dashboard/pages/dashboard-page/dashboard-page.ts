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
import {
  StudyRoomResponse,
  getTopicEmoji, // ✅ Fix 3 — imported
} from '../../../../core/models/room.model';
import { RoomService } from '../../../../core/services/room.service';

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
  private readonly roomService = inject(RoomService);

  stats = signal<DashboardStats | null>(null);
  loading = signal(true);

  @ViewChild('weeklyChart') weeklyChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('streakChart') streakChartRef!: ElementRef<HTMLCanvasElement>;

  private weeklyChart?: Chart;
  private streakChart?: Chart;

  readonly onlineFriends = MOCK_ONLINE_FRIENDS;
  readonly leaderboard = MOCK_LEADERBOARD;

  // signal used correctly as signal<T>
  myRooms = signal<StudyRoomResponse[]>([]);

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

  todayDate = computed(() =>
    new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }),
  );

  ngOnInit(): void {
    this.loadStats();
    this.roomService.getMyRooms().subscribe({
      next: (rooms) => this.myRooms.set(rooms.slice(0, 4)),
      error: () => {},
    });
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.weeklyChart?.destroy();
    this.streakChart?.destroy();
  }

  loadStats(): void {
    this.loading.set(true);

    this.dashboardService.getStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);
        setTimeout(() => {
          this.buildWeeklyChart(data);
          this.buildStreakChart(data);
        }, 50);
      },
      error: () => {
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

  // getTopicEmoji now imported, no error
  getEmojiForRoom(topic: string): string {
    return getTopicEmoji(topic);
  }

  private buildWeeklyChart(data: DashboardStats): void {
    if (!this.weeklyChartRef?.nativeElement) return;
    this.weeklyChart?.destroy();

    const isDark = this.themeService.isDark();
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(124,58,237,0.08)';
    const labelColor = isDark ? '#94a3b8' : '#5b5b8a';
    const ctx = this.weeklyChartRef.nativeElement.getContext('2d')!;

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
              label: (c) => ` ${c.parsed.y} min`,
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

    this.streakChart = new Chart(this.streakChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        datasets: [
          {
            data: [pct, 100 - pct],
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
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
      },
    });
  }

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
