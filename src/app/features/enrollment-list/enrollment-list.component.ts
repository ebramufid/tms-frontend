import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EnrollmentStore } from '../../core/store/enrollment.store';
import { EnrollmentStatus } from '../../core/models/enrollment.model';
import { EmptyStateComponent } from '../../ui/empty-state/empty-state.component';

type StatusFilter = 'All' | EnrollmentStatus;

const STATUS_FILTERS: readonly StatusFilter[] = ['All', 'Pending', 'Approved', 'Rejected'];

/**
 * Angular v22 signal-based component, matching the rest of the app.
 * Rebuilt without Angular Material's `mat-table`/`mat-sort` to keep the
 * dependency surface small and the look fully custom — sorting/filtering
 * is implemented directly with signals + computed().
 */
@Component({
  selector: 'app-enrollment-list',
  standalone: true,
  imports: [DatePipe, FormsModule, EmptyStateComponent],
  templateUrl: './enrollment-list.component.html',
  styleUrl: './enrollment-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnrollmentListComponent {
  store = inject(EnrollmentStore);

  // Strongly typed as StatusFilter[] so the template's @for loop infers
  // `option` as StatusFilter, not `string` — fixes TS2345 when passed to
  // setFilter().
  readonly statusFilters = STATUS_FILTERS;

  statusFilter = signal<StatusFilter>('All');
  sortDescending = signal(true);

  filteredSorted = computed(() => {
    const filter = this.statusFilter();
    let rows = this.store.entities();

    if (filter !== 'All') {
      rows = rows.filter((r) => r.status === filter);
    }

    rows = [...rows].sort((a, b) => {
      const diff = new Date(a.enrolledAt).getTime() - new Date(b.enrolledAt).getTime();
      return this.sortDescending() ? -diff : diff;
    });

    return rows;
  });

  constructor() {
    this.store.loadEnrollments();
    this.store.listenForLiveUpdates();
  }

  setFilter(filter: StatusFilter): void {
    this.statusFilter.set(filter);
  }

  toggleSort(): void {
    this.sortDescending.update((v) => !v);
  }

  approve(id: number): void {
    this.store.approveEnrollment(id);
  }
}
