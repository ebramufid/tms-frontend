import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'tms-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty-state">
      <div class="empty-state__icon">{{ icon() }}</div>
      <h3>{{ title() }}</h3>
      <p>{{ description() }}</p>
      <ng-content />
    </div>
  `,
  styleUrl: './empty-state.component.scss',
})
export class EmptyStateComponent {
  icon = input('🔍');
  title = input.required<string>();
  description = input('');
}
