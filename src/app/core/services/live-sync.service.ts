import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface EnrollmentStatusEvent {
  id: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface EnrollmentCreatedEvent {
  enrollmentId: number;
  studentId: number;
  courseCode: string;
}

/**
 * Fixed from the original `@Service()` bug (not a real Angular decorator).
 *
 * Also fixed a genuine mismatch: `EnrollmentAdminController.Approve`
 * broadcasts `ReceiveEnrollmentStatusUpdated` through `TmsHub` at
 * `/hubs/tms` (already correct in the original code), but the
 * `EnrollStudentCommand` handler fires a *separate* `EnrollmentCreated`
 * event through `EnrollmentHub` at `/hubs/enrollments` — a hub the
 * frontend never connected to. We now connect to both. `/hubs/enrollments`
 * is only mapped when the API runs in Development, so that connection is
 * allowed to fail silently in production.
 */
@Injectable({ providedIn: 'root' })
export class LiveSyncService {
  private platformId = inject(PLATFORM_ID);

  private tmsConnection: HubConnection | null = null;
  private enrollmentHubConnection: HubConnection | null = null;

  private eventsSubject = new Subject<EnrollmentStatusEvent>();
  events$ = this.eventsSubject.asObservable();

  private enrollmentCreatedSubject = new Subject<EnrollmentCreatedEvent>();
  enrollmentCreated$ = this.enrollmentCreatedSubject.asObservable();

  private courseDeletedSubject = new Subject<number>();
  courseDeleted$ = this.courseDeletedSubject.asObservable();

  connectionState = signal<'connected' | 'reconnecting' | 'disconnected'>('disconnected');

  connect(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.connectTmsHub();
    this.connectEnrollmentHub();
  }

  private connectTmsHub(): void {
    if (this.tmsConnection) return;

    this.tmsConnection = new HubConnectionBuilder()
      .withUrl(environment.hubUrl)
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .configureLogging(LogLevel.Warning)
      .build();

    this.tmsConnection.on(
      'ReceiveEnrollmentStatusUpdated',
      (enrollmentId: string, status: 'Pending' | 'Approved' | 'Rejected') => {
        this.eventsSubject.next({ id: enrollmentId, status });
      },
    );

    this.tmsConnection.on('CourseDeleted', (courseId: number) => {
      this.courseDeletedSubject.next(courseId);
    });

    this.tmsConnection.onreconnecting(() => this.connectionState.set('reconnecting'));
    this.tmsConnection.onreconnected(() => this.connectionState.set('connected'));
    this.tmsConnection.onclose(() => this.connectionState.set('disconnected'));

    this.tmsConnection
      .start()
      .then(() => this.connectionState.set('connected'))
      .catch((err) => console.error('TmsHub connection error:', err));
  }

  private connectEnrollmentHub(): void {
    if (this.enrollmentHubConnection) return;

    this.enrollmentHubConnection = new HubConnectionBuilder()
      .withUrl(environment.liveHubUrl)
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .configureLogging(LogLevel.Warning)
      .build();

    this.enrollmentHubConnection.on(
      'EnrollmentCreated',
      (payload: EnrollmentCreatedEvent) => {
        this.enrollmentCreatedSubject.next(payload);
      },
    );

    // Only mapped in Development on the API — failing here in production
    // is expected and should not surface as an app-breaking error.
    this.enrollmentHubConnection.start().catch(() => {
      /* hub not available in this environment — safe to ignore */
    });
  }
}
