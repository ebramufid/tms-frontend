import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'tms-toast-host',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast-stack" role="status" aria-live="polite">
      @for (toast of notifications.toasts(); track toast.id) {
        <div class="toast" [class]="'toast--' + toast.tone">
          <span class="toast__icon">
            @switch (toast.tone) {
              @case ('success') { ✓ }
              @case ('error') { ✕ }
              @case ('warning') { ! }
              @default { i }
            }
          </span>
          <div class="toast__body">
            <p class="toast__title">{{ toast.title }}</p>
            @if (toast.message) {
              <p class="toast__message">{{ toast.message }}</p>
            }
          </div>
          <button
            type="button"
            class="toast__close"
            (click)="notifications.dismissToast(toast.id)"
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      }
    </div>
  `,
  styleUrl: './toast-host.component.scss',
})
export class ToastHostComponent {
  notifications = inject(NotificationService);
}
