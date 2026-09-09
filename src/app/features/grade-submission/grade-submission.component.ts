import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GradeService } from '../../core/services/grade.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-grade-submission',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './grade-submission.component.html',
  styleUrl: './grade-submission.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GradeSubmissionComponent {
  private fb = inject(FormBuilder);
  private gradeService = inject(GradeService);
  private notifications = inject(NotificationService);

  submitting = signal(false);
  submitError = signal('');
  lastResult = signal<{ id: string } | null>(null);

  form = this.fb.nonNullable.group({
    studentId: this.fb.nonNullable.control(0, [Validators.required, Validators.min(1)]),
    courseId: this.fb.nonNullable.control(0, [Validators.required, Validators.min(1)]),
    score: this.fb.nonNullable.control(0, [Validators.required, Validators.min(0), Validators.max(100)]),
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.submitError.set('');
    this.lastResult.set(null);

    this.gradeService.postGrade(this.form.getRawValue()).subscribe({
      next: (result) => {
        this.submitting.set(false);
        this.lastResult.set({ id: result.id });
        this.notifications.push('success', 'Grade submitted', `Grade recorded (ref ${result.id}).`);
        this.form.reset({ studentId: 0, courseId: 0, score: 0 });
      },
      error: (err) => {
        this.submitting.set(false);
        this.submitError.set(
          err?.error?.detail ?? 'Could not submit the grade. Please check the values and try again.',
        );
      },
    });
  }
}
