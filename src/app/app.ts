import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HealthResponse, HealthService } from './core/services/health.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected readonly title = signal('studysync-frontend');
  private readonly healthService = inject(HealthService);


  health = signal<HealthResponse | null>(null);
  error = signal<string | null>(null);
  loading = signal<boolean>(true);

  ngOnInit(): void {
    this.healthService.checkHealth().subscribe({
      next: (data) => {
        this.health.set(data);
        this.loading.set(false);
        console.log('✅ Backend connected:', data);
      },
      error: (err) => {
        this.error.set('Cannot connect to backend. Is it running on port 8080?');
        this.loading.set(false);
        console.error('❌ Backend error:', err);
      },
    });
  }
}
