import { ChangeDetectionStrategy, Component, input, computed } from '@angular/core';
import { Enrollment } from '../../core/models/enrollment.model';

interface CourseBreakdown {
  courseName: string;
  total: number;
  approved: number;
  pending: number;
  percentOfMax: number;
}

@Component({
  selector: 'tms-analytics-chart',
  standalone: true,
  templateUrl: './analytics-chart.component.html',
  styleUrl: './analytics-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsChartComponent {
  data = input.required<Enrollment[]>();

  breakdown = computed<CourseBreakdown[]>(() => {
    const rows = this.data();
    const byCourse = new Map<string, { approved: number; pending: number }>();

    for (const row of rows) {
      const entry = byCourse.get(row.courseName) ?? { approved: 0, pending: 0 };
      if (row.status === 'Approved') entry.approved++;
      else if (row.status === 'Pending') entry.pending++;
      byCourse.set(row.courseName, entry);
    }

    const results = Array.from(byCourse.entries()).map(([courseName, counts]) => ({
      courseName,
      total: counts.approved + counts.pending,
      approved: counts.approved,
      pending: counts.pending,
      percentOfMax: 0,
    }));

    const max = Math.max(...results.map((r) => r.total), 1);
    return results.map((r) => ({ ...r, percentOfMax: (r.total / max) * 100 }));
  });
}
