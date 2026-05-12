import {
  AfterViewInit,
  Component,
  Inject,
  inject,
  OnDestroy,
  PLATFORM_ID,
  signal,
  computed,
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ThemeToggle } from '../../../shared/components/theme-toggle/theme-toggle';
import { ThemeService } from '../../../core/services/theme.service';

interface StudyRoom {
  id: number;
  name: string;
  members: number;
  topic: string;
  emoji: string;
  color: string;
  level: string;
}

interface Feature {
  icon: string;
  title: string;
  description: string;
  color: string;
}

interface Stat {
  value: string;
  label: string;
  emoji: string;
}

interface NavLink {
  label: string;
  fragment: string;
}

@Component({
  selector: 'app-landing-page',
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    ThemeToggle,
  ],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.scss',
})
export class LandingPage implements AfterViewInit, OnDestroy {
  private readonly router = inject(Router);
  readonly themeService   = inject(ThemeService);

  isScrolled     = signal(false);
  mobileMenuOpen = signal(false);

  // ✅ Computed — switches image based on active theme
  heroImage = computed(() =>
    this.themeService.isDark()
      ? '/images/bg-dark.png'
      : '/images/bg-light.png'
  );

  private scrollListener = () => {
    this.isScrolled.set(window.scrollY > 20);
  };

  // TODO: blog/about → wire to real routes when pages are built
  navLinks: NavLink[] = [
    { label: 'Features', fragment: 'features' },
    { label: 'Rooms',    fragment: 'rooms' },
    { label: 'Pricing',  fragment: 'pricing' },
    { label: 'Blog',     fragment: 'blog' },
    { label: 'About',    fragment: 'about' },
  ];

  // TODO: replace with API call — Phase 3 (Rooms browse)
  popularRooms: StudyRoom[] = [
    { id: 1, name: 'Java Developers',  members: 5240, topic: 'Java',          emoji: '☕',  color: 'amber',  level: 'All Levels' },
    { id: 2, name: 'DSA & Algorithms', members: 4880, topic: 'DSA',           emoji: '🧮',  color: 'purple', level: 'Intermediate' },
    { id: 3, name: 'System Design',    members: 3760, topic: 'System Design', emoji: '🏗️', color: 'cyan',   level: 'Advanced' },
    { id: 4, name: 'Web Development',  members: 3080, topic: 'Frontend',      emoji: '🌐',  color: 'green',  level: 'All Levels' },
  ];

  // Static — no API needed
  features: Feature[] = [
    { icon: 'meeting_room',          title: 'Topic-Based Study Rooms',  description: 'Join rooms organized by topic — Java, DSA, System Design, and more. Find your people.',       color: 'purple' },
    { icon: 'chat',                  title: 'Real-Time Collaboration',   description: 'Chat, share resources, and study live with peers. No more studying alone.',                   color: 'cyan'   },
    { icon: 'local_fire_department', title: 'Study Streaks',             description: 'Build daily habits with streak tracking. Stay motivated, stay consistent.',                   color: 'amber'  },
    { icon: 'bar_chart',             title: 'Learning Analytics',        description: 'Track study time, session history, and progress with beautiful dashboards.',                 color: 'green'  },
    { icon: 'folder_shared',         title: 'Shared Resources',          description: 'Upload and access PDFs, notes, and links shared by room members.',                           color: 'purple' },
    { icon: 'leaderboard',           title: 'Leaderboards',              description: 'Compete with peers on weekly study time. Accountability that actually works.',               color: 'cyan'   },
  ];

  // TODO: replace with real API — Phase 7 (Analytics)
  stats: Stat[] = [
    { value: '50K+',   label: 'Active Learners', emoji: '👥' },
    { value: '1,200+', label: 'Study Rooms',     emoji: '🏠' },
    { value: '2.4M+',  label: 'Study Minutes',   emoji: '⏱️' },
    { value: '98%',    label: 'Satisfaction',    emoji: '⭐' },
  ];

  previewAvatars: string[] = [
    'https://i.pravatar.cc/32?img=1',
    'https://i.pravatar.cc/32?img=2',
    'https://i.pravatar.cc/32?img=3',
    'https://i.pravatar.cc/32?img=4',
    'https://i.pravatar.cc/32?img=5',
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('scroll', this.scrollListener, { passive: true });
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('scroll', this.scrollListener);
    }
  }

  scrollToSection(fragment: string): void {
    const el = document.getElementById(fragment);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    this.mobileMenuOpen.set(false);
  }

  scrollToRooms(): void {
    this.scrollToSection('rooms');
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}
