import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { EnrollmentStore } from '../../core/store/enrollment.store';

@Component({
  selector: 'tms-enrollment-summary',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="summary-widget">
      <div class="summary-widget__item">
        <span class="summary-widget__dot summary-widget__dot--pending"></span>
        <div>
          <strong>{{ store.pendingCount() }}</strong>
          <span>Pending</span>
        </div>
      </div>
      <div class="summary-widget__item">
        <span class="summary-widget__dot summary-widget__dot--approved"></span>
        <div>
          <strong>{{ store.approvedCount() }}</strong>
          <span>Approved</span>
        </div>
      </div>
      <div class="summary-widget__item">
        <span class="summary-widget__dot summary-widget__dot--rejected"></span>
        <div>
          <strong>{{ store.rejectedCount() }}</strong>
          <span>Rejected</span>
        </div>
      </div>
    </div>
  `,
  styleUrl: './enrollment-summary.component.scss',
})
export class EnrollmentSummaryComponent {
  // Same store, same singleton instance — no fetch call needed here at all.
  // This component never calls loadEnrollments(); it just reads whatever
  // the list component already loaded into the shared store.
  store = inject(EnrollmentStore);
}
