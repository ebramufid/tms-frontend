import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleRequestService } from '../../core/services/role-request.service';
import { NotificationService } from '../../core/services/notification.service';
import { RoleRequest, RoleRequestStatus } from '../../core/models/role-request.model';
import { EmptyStateComponent } from '../../ui/empty-state/empty-state.component';

type Filter = 'Pending' | 'Approved' | 'Rejected' | 'All';

const FILTERS: readonly Filter[] = ['Pending', 'Approved', 'Rejected', 'All'];

@Component({
  selector: 'app-admin-role-requests',
  standalone: true,
  imports: [DatePipe, FormsModule, EmptyStateComponent],
  templateUrl: './admin-role-requests.component.html',
  styleUrl: './admin-role-requests.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminRoleRequestsComponent {
  private service = inject(RoleRequestService);
  private notifications = inject(NotificationService);

  readonly filters = FILTERS;
  filter = signal<Filter>('Pending');

  requests = signal<RoleRequest[]>([]);
  loading = signal(true);
  processingId = signal<number | null>(null);

  rejectingId = signal<number | null>(null);
  rejectionReason = '';

  pendingCount = computed(() => this.requests().filter((r) => r.status === 'Pending').length);

  constructor() {
    this.load();
  }

  setFilter(filter: Filter): void {
    this.filter.set(filter);
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    const status = this.filter() === 'All' ? undefined : (this.filter() as RoleRequestStatus);

    this.service.list(status).subscribe({
      next: (requests) => {
        this.requests.set(requests);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notifications.push('error', 'Could not load role requests');
      },
    });
  }

  approve(request: RoleRequest): void {
    this.processingId.set(request.id);
    this.service.approve(request.id).subscribe({
      next: () => {
        this.processingId.set(null);
        this.notifications.push(
          'success',
          'Request approved',
          `${request.email} is now ${request.requestedRole}.`,
        );
        this.load();
      },
      error: (err) => {
        this.processingId.set(null);
        this.notifications.push('error', 'Could not approve', err?.error?.detail);
      },
    });
  }

  startReject(request: RoleRequest): void {
    this.rejectingId.set(request.id);
    this.rejectionReason = '';
  }

  cancelReject(): void {
    this.rejectingId.set(null);
  }

  confirmReject(request: RoleRequest): void {
    this.processingId.set(request.id);
    this.service.reject(request.id, this.rejectionReason || undefined).subscribe({
      next: () => {
        this.processingId.set(null);
        this.rejectingId.set(null);
        this.notifications.push('info', 'Request rejected', `${request.email}'s request was declined.`);
        this.load();
      },
      error: (err) => {
        this.processingId.set(null);
        this.notifications.push('error', 'Could not reject', err?.error?.detail);
      },
    });
  }
}
