import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="status-page fade-up">
      <div class="status-page__icon">🧭</div>
      <h1>Page not found</h1>
      <p>The page you're looking for doesn't exist or may have moved.</p>
      <a routerLink="/" class="status-page__cta">Back to home</a>
    </div>
  `,
  styleUrl: './not-found.component.scss',
})
export class NotFoundComponent {}
