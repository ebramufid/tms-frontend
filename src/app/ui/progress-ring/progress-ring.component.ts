import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'tms-progress-ring',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ring" [style.width.px]="size()" [style.height.px]="size()">
      <svg [attr.viewBox]="'0 0 ' + size() + ' ' + size()">
        <circle
          class="ring__track"
          [attr.cx]="size() / 2"
          [attr.cy]="size() / 2"
          [attr.r]="radius()"
          [attr.stroke-width]="strokeWidth()"
          fill="none"
        />
        <circle
          class="ring__value"
          [attr.cx]="size() / 2"
          [attr.cy]="size() / 2"
          [attr.r]="radius()"
          [attr.stroke-width]="strokeWidth()"
          fill="none"
          [attr.stroke-dasharray]="circumference()"
          [attr.stroke-dashoffset]="dashOffset()"
        />
      </svg>
      <div class="ring__label">
        <strong>{{ percent() }}%</strong>
        @if (caption()) {
          <span>{{ caption() }}</span>
        }
      </div>
    </div>
  `,
  styleUrl: './progress-ring.component.scss',
})
export class ProgressRingComponent {
  percent = input.required<number>();
  caption = input<string>('');
  size = input(96);
  strokeWidth = input(9);

  radius = computed(() => (this.size() - this.strokeWidth()) / 2);
  circumference = computed(() => 2 * Math.PI * this.radius());
  dashOffset = computed(() => {
    const clamped = Math.max(0, Math.min(100, this.percent()));
    return this.circumference() * (1 - clamped / 100);
  });
}
