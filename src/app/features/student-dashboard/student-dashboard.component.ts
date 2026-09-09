import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CourseStore } from '../../core/store/course.store';
import { CourseCardComponent } from '../../ui/course-card/course-card.component';
import { EmptyStateComponent } from '../../ui/empty-state/empty-state.component';
import { StatWidgetComponent } from '../../ui/stat-widget/stat-widget.component';
import { ProgressRingComponent } from '../../ui/progress-ring/progress-ring.component';
import { CertificateService } from '../../core/services/certificate.service';
import { TranscriptService } from '../../core/services/transcript.service';
import { NotificationService } from '../../core/services/notification.service';
import { RoleRequestService } from '../../core/services/role-request.service';
import { Certificate, TranscriptStatus } from '../../core/models/certificate.model';
import { RoleRequest } from '../../core/models/role-request.model';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    CourseCardComponent,
    EmptyStateComponent,
    StatWidgetComponent,
    ProgressRingComponent,
  ],
  templateUrl: './student-dashboard.component.html',
  styleUrl: './student-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentDashboardComponent {
  store = inject(CourseStore);
  private certificateService = inject(CertificateService);
  private transcriptService = inject(TranscriptService);
  private notifications = inject(NotificationService);
  private roleRequestService = inject(RoleRequestService);

  // Populated on init if the logged-in account has ever filed a role
  // request (see the register flow in LoginComponent). Null means it
  // never has one — not that one is loading.
  roleRequest = signal<RoleRequest | null>(null);

  // The demo app never wired a real logged-in student to a numeric Student
  // entity (the JWT carries an Identity user id, not a Students.Id — those
  // are separate tables on the backend). Rather than fake it silently, we
  // let the student type in their Student ID once to unlock the
  // certificates/transcript widgets — same trade-off the original
  // student-dashboard already made with a hardcoded demo name/credits.
  studentIdInput = signal<number | null>(null);
  studentName = signal('Liya Kebede');
  earnedCredits = signal(42);
  creditsGoal = signal(60);

  searchTerm = signal('');

  filteredCourses = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const courses = this.store.entities();
    if (!term) return courses;
    return courses.filter(
      (c) => c.title.toLowerCase().includes(term) || c.code.toLowerCase().includes(term),
    );
  });

  creditsPercent = computed(() =>
    Math.min(100, Math.round((this.earnedCredits() / this.creditsGoal()) * 100)),
  );

  isEligibleForGraduation = computed(() => this.earnedCredits() >= this.creditsGoal());
  creditsRemaining = computed(() => Math.max(0, this.creditsGoal() - this.earnedCredits()));

  graduationModalOpen = signal(false);

  openGraduationModal(): void {
    this.graduationModalOpen.set(true);
  }

  closeGraduationModal(): void {
    this.graduationModalOpen.set(false);
  }

  // Certificates panel state
  certificates = signal<Certificate[]>([]);
  certificatesLoading = signal(false);
  certificatesLoaded = signal(false);

  // Transcript request widget state
  transcriptStatus = signal<TranscriptStatus | null>(null);
  transcriptLoading = signal(false);
  private pollHandle: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.store.loadCourses();
    this.roleRequestService.mine().subscribe({
      next: (request) => this.roleRequest.set(request),
      error: () => this.roleRequest.set(null),
    });
  }

  loadCertificates(): void {
    const id = this.studentIdInput();
    if (!id) return;

    this.certificatesLoading.set(true);
    this.certificateService.getByStudent(id).subscribe({
      next: (certs) => {
        this.certificates.set(certs);
        this.certificatesLoading.set(false);
        this.certificatesLoaded.set(true);
      },
      error: () => {
        this.certificatesLoading.set(false);
        this.certificatesLoaded.set(true);
        this.certificates.set([]);
      },
    });
  }

  requestTranscript(): void {
    const id = this.studentIdInput();
    if (!id) return;

    this.transcriptLoading.set(true);
    this.transcriptStatus.set(null);

    const idempotencyKey = `transcript-${id}-${Date.now()}`;

    this.transcriptService.request(id, idempotencyKey).subscribe({
      next: (status) => {
        this.transcriptStatus.set(status);
        this.transcriptLoading.set(false);
        this.notifications.push('info', 'Transcript requested', 'We\u2019ll notify you when it\u2019s ready.', {
          feed: false,
        });
        this.pollTranscriptStatus(status.reportId);
      },
      error: () => {
        this.transcriptLoading.set(false);
        this.notifications.push('error', 'Transcript request failed', 'Please try again.', {
          feed: false,
        });
      },
    });
  }

  private pollTranscriptStatus(reportId: string): void {
    if (this.pollHandle) clearTimeout(this.pollHandle);

    this.pollHandle = setTimeout(() => {
      this.transcriptService.getStatus(reportId).subscribe({
        next: (status) => {
          this.transcriptStatus.set(status);

          if (status.state === 'Ready') {
            this.notifications.push('success', 'Transcript ready', 'Your transcript has finished generating.');
          } else if (status.state === 'Failed') {
            this.notifications.push('error', 'Transcript failed', status.errorMessage ?? 'Please try again.');
          } else {
            this.pollTranscriptStatus(reportId);
          }
        },
        error: () => {
          /* stop polling silently on error */
        },
      });
    }, 1500);
  }
}
