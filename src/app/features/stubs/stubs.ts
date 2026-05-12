import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-stub-page',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './stubs.html',
  styleUrl: './stubs.scss',
})
export class StubPage {
  readonly router = inject(Router);
}
