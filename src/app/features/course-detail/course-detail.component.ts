import { ChangeDetectionStrategy, Component, inject, input, signal, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CourseService } from '../../core/services/course.service';
import { CourseDetail } from '../../core/models/course.model';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './course-detail.component.html',
  styleUrl: './course-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseDetailComponent {
  // Bound directly from the route param via withComponentInputBinding().
  id = input.required<string>();

  private courseService = inject(CourseService);

  course = signal<CourseDetail | null>(null);
  loading = signal(true);
  notFound = signal(false);

  constructor() {
    effect(() => {
      const courseId = Number(this.id());
      if (!courseId) return;

      this.loading.set(true);
      this.notFound.set(false);

      // Fixed: previously fetched the whole list and filtered client-side,
      // losing the HATEOAS `links`. Now calls GET /api/v1/courses/{id} directly.
      this.courseService.getById(courseId).subscribe({
        next: (detail) => {
          this.course.set(detail);
          this.loading.set(false);
        },
        error: () => {
          this.notFound.set(true);
          this.loading.set(false);
        },
      });
    });
  }

  enrollLink(course: CourseDetail): string | null {
    return course.links.find((l) => l.rel === 'enroll')?.href ?? null;
  }
}
