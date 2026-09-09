import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { EnrollmentService } from '../../core/services/enrollment.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-enrollment-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './enrollment-form.component.html',
  styleUrl: './enrollment-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnrollmentFormComponent {
  private fb = inject(FormBuilder);
  private enrollmentService = inject(EnrollmentService);
  private notifications = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  submitting = signal(false);
  submitError = signal('');
  submitted = signal(false);

  form = this.fb.nonNullable.group({
    courseCode: this.fb.nonNullable.control('', Validators.required),
    // Dynamic backup courses — the student can offer alternates in case
    // the primary course is full when the request is processed.
    backupCourses: this.fb.array<ReturnType<FormBuilder['control']>>([]),
  });

  constructor() {
    const prefill = this.route.snapshot.queryParamMap.get('courseCode');
    if (prefill) {
      this.form.controls.courseCode.setValue(prefill);
    }
  }

  get backupCourses(): FormArray {
    return this.form.controls.backupCourses;
  }

  addBackupCourse(): void {
    this.backupCourses.push(this.fb.nonNullable.control('', Validators.required));
  }

  removeBackupCourse(index: number): void {
    this.backupCourses.removeAt(index);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { courseCode } = this.form.getRawValue();

    this.submitting.set(true);
    this.submitError.set('');

    // Note: EnrollStudentCommand takes { studentId, courseCode }, but
    // EnrollmentsController (V2) ignores the studentId in the body and
    // resolves the real student from the logged-in account's JWT — so we
    // don't collect or send a studentId here at all. `backupCourses` is
    // gathered as a UX nicety but isn't sent either, since the backend has
    // no batching endpoint. Both are documented hooks for a future backend
    // change (student self-service linking, batch/priority enrollment).
    this.enrollmentService.create(0, courseCode).subscribe({
      next: () => {
        this.submitting.set(false);
        this.submitted.set(true);
        this.notifications.push('success', 'Enrollment request sent', `Requested ${courseCode}.`);
        setTimeout(() => this.router.navigate(['/dashboard']), 1400);
      },
      error: (err) => {
        this.submitting.set(false);

        if (err?.status === 403) {
          // No Student record is linked to this account yet — the backend
          // returns a bare 403 with no detail in this case.
          this.submitError.set(
            "Your account isn't linked to a student record yet, so enrollment can't be processed. Contact an administrator to link your account.",
          );
        } else {
          this.submitError.set(
            err?.error?.detail ?? 'Could not submit the enrollment. Please check the course code and try again.',
          );
        }
      },
    });
  }
}
