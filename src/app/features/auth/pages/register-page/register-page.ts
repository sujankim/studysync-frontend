import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ThemeService } from '../../../../core/services/theme.service';

@Component({
  selector: 'app-register-page',
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './register-page.html',
  styleUrl: './register-page.scss',
})
export class RegisterPage {
  private readonly authService = inject(AuthService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  readonly themeService = inject(ThemeService);

  loading = signal(false);
  hidePassword = signal(true);

  // Theme-aware background image
  bgImage = computed(() =>
    this.themeService.isDark() ? '/images/auth-dark.png' : '/images/auth-light.png',
  );

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    username: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-Z0-9_]+$/),
      ],
    ],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  get nameControl() {
    return this.form.get('name');
  }
  get usernameControl() {
    return this.form.get('username');
  }
  get emailControl() {
    return this.form.get('email');
  }
  get passwordControl() {
    return this.form.get('password');
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);

    this.authService.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.notification.success('Account created! Welcome to StudySync 🎓');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.notification.error(err.error?.message || 'Registration failed. Please try again.');
        this.loading.set(false);
      },
    });
  }
}
