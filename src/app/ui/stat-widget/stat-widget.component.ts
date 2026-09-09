import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type StatTone = 'accent' | 'success' | 'warning' | 'danger' | 'neutral';

@Component({
  selector: 'tms-stat-widget',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="stat-widget" [class]="'stat-widget--' + tone()">
      <div class="stat-widget__icon">
        <ng-content select="[icon]" />
      </div>
      <div class="stat-widget__body">
        <p class="stat-widget__label">{{ label() }}</p>
        <p class="stat-widget__value">{{ value() }}</p>
        @if (description()) {
          <p class="stat-widget__description">{{ description() }}</p>
        }
      </div>
      @if (trend() !== null) {
        <span class="stat-widget__trend" [class.is-down]="trend()! < 0">
          {{ trend()! >= 0 ? '↑' : '↓' }} {{ trendLabel() }}
        </span>
      }
    </article>
  `,
  styleUrl: './stat-widget.component.scss',
})
export class StatWidgetComponent {
  label = input.required<string>();
  value = input.required<string | number>();
  description = input<string>('');
  tone = input<StatTone>('accent');
  trend = input<number | null>(null);
  trendLabel = input<string>('');
}
