import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CourseStore } from '../../core/store/course.store';
import { Course } from '../../core/models/course.model';
import { EmptyStateComponent } from '../../ui/empty-state/empty-state.component';

@Component({
  selector: 'app-admin-course-list',
  standalone: true,
  imports: [FormsModule, EmptyStateComponent],
  templateUrl: './admin-course-list.component.html',
  styleUrl: './admin-course-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCourseListComponent {
  store = inject(CourseStore);

  createPanelOpen = signal(false);
  editingCourse = signal<Course | null>(null);

  newCode = '';
  newTitle = '';
  newCapacity = 25;

  editTitle = '';
  editCapacity = 0;

  totalSeats = computed(() =>
    this.store.entities().reduce((sum, c) => sum + c.maxCapacity, 0),
  );
  totalEnrolled = computed(() =>
    this.store.entities().reduce((sum, c) => sum + c.enrollmentCount, 0),
  );

  constructor() {
    this.store.loadCourses();
  }

  openCreatePanel(): void {
    this.newCode = '';
    this.newTitle = '';
    this.newCapacity = 25;
    this.store.clearCreateError();
    this.createPanelOpen.set(true);
  }

  closeCreatePanel(): void {
    this.createPanelOpen.set(false);
  }

  submitCreate(): void {
    if (!this.newCode || !this.newTitle || !this.newCapacity) return;
    this.store.createCourse(this.newCode, this.newTitle, this.newCapacity);
    this.createPanelOpen.set(false);
  }

  startEdit(course: Course): void {
    this.editingCourse.set(course);
    this.editTitle = course.title;
    this.editCapacity = course.maxCapacity;
    this.store.clearUpdateError();
  }

  cancelEdit(): void {
    this.editingCourse.set(null);
  }

  submitEdit(): void {
    const course = this.editingCourse();
    if (!course || !this.editTitle) return;
    this.store.updateCourse(course.id, this.editTitle, this.editCapacity);
    this.editingCourse.set(null);
  }

  remove(course: Course): void {
    if (confirm(`Delete "${course.title}"? This cannot be undone.`)) {
      this.store.deleteCourse(course.id);
    }
  }
}
