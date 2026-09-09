import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CourseStore } from '../../core/store/course.store';
import { AuthService } from '../../core/services/auth.service';
import { CourseCardComponent } from '../../ui/course-card/course-card.component';
import { EmptyStateComponent } from '../../ui/empty-state/empty-state.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CourseCardComponent, EmptyStateComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  store = inject(CourseStore);
  authService = inject(AuthService);

  totalCourses = computed(() => this.store.entities().length);
  totalSeats = computed(() =>
    this.store.entities().reduce((sum, c) => sum + c.maxCapacity, 0),
  );
  openCourses = computed(
    () => this.store.entities().filter((c) => c.enrollmentCount < c.maxCapacity).length,
  );

  constructor() {
    this.store.loadCourses();
  }
}
