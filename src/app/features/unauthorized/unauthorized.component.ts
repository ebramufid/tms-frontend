import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="status-page fade-up">
      <div class="status-page__icon">🔒</div>
      <h1>Unauthorized</h1>
      <p>You do not have permission to access this page.</p>
      <a routerLink="/" class="status-page__cta">Back to home</a>
    </div>
  `,
  styleUrl: './unauthorized.component.scss',
})
export class UnauthorizedComponent {}
