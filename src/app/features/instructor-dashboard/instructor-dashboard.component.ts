import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EnrollmentStore } from '../../core/store/enrollment.store';
import { CourseStore } from '../../core/store/course.store';
import { EnrollmentListComponent } from '../enrollment-list/enrollment-list.component';
import { EnrollmentSummaryComponent } from '../enrollment-summary/enrollment-summary.component';
import { AnalyticsChartComponent } from '../../ui/analytics-chart/analytics-chart.component';
import { StatWidgetComponent } from '../../ui/stat-widget/stat-widget.component';

@Component({
  selector: 'app-instructor-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    EnrollmentListComponent,
    EnrollmentSummaryComponent,
    AnalyticsChartComponent,
    StatWidgetComponent,
  ],
  templateUrl: './instructor-dashboard.component.html',
  styleUrl: './instructor-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstructorDashboardComponent {
  enrollmentStore = inject(EnrollmentStore);
  courseStore = inject(CourseStore);

  constructor() {
    this.courseStore.loadCourses();
  }
}
