import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Course } from '../../core/models/course.model';

const ACCENTS = ['violet', 'blue', 'green', 'amber', 'rose', 'cyan'] as const;

@Component({
  selector: 'tms-course-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './course-card.component.html',
  styleUrl: './course-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseCardComponent {
  course = input.required<Course>();
  enrollClicked = output<Course>();

  initials = computed(() => this.course().code.split('-')[0].slice(0, 2));

  accent = computed(() => {
    const hash = this.course()
      .code.split('')
      .reduce((a, c) => a + c.charCodeAt(0), 0);
    return ACCENTS[hash % ACCENTS.length];
  });

  isFull = computed(() => this.course().enrollmentCount >= this.course().maxCapacity);

  percentFull = computed(() => {
    const c = this.course();
    if (c.maxCapacity <= 0) return 0;
    return Math.min(100, Math.round((c.enrollmentCount / c.maxCapacity) * 100));
  });
}
