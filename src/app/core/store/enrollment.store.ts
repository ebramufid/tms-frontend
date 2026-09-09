import { computed, inject } from '@angular/core';
import { signalStore, withComputed, withMethods, patchState, withState } from '@ngrx/signals';
import { withEntities, setAllEntities, updateEntity } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, concatMap, switchMap, tap, catchError, EMPTY, merge, map } from 'rxjs';
import { EnrollmentService } from '../services/enrollment.service';
import { LiveSyncService } from '../services/live-sync.service';
import { NotificationService } from '../services/notification.service';
import { Enrollment } from '../models/enrollment.model';

export const EnrollmentStore = signalStore(
  { providedIn: 'root' },

  withState({ isLoading: false, error: null as string | null }),

  withEntities<Enrollment>(),

  withComputed((store) => ({
    pendingCount: computed(() => store.entities().filter((e) => e.status === 'Pending').length),
    approvedCount: computed(() => store.entities().filter((e) => e.status === 'Approved').length),
    rejectedCount: computed(() => store.entities().filter((e) => e.status === 'Rejected').length),
  })),

  withMethods(
    (
      store,
      api = inject(EnrollmentService),
      sync = inject(LiveSyncService),
      notifications = inject(NotificationService),
    ) => ({
      seed(rows: Enrollment[]) {
        patchState(store, setAllEntities(rows));
      },

      loadEnrollments: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          concatMap(() =>
            api.getAll().pipe(
              tap((rows) => patchState(store, setAllEntities(rows), { isLoading: false })),
              catchError((err) => {
                patchState(store, { isLoading: false, error: err.message });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      // id is a `number` here — matches the real backend's int Enrollment.Id.
      approveEnrollment: rxMethod<number>(
        pipe(
          tap((id) => {
            patchState(store, updateEntity({ id, changes: { status: 'Approved' } }));
          }),
          concatMap((id) =>
            api.approve(id).pipe(
              tap(() => {
                notifications.push('success', 'Enrollment approved', `Enrollment #${id} was approved.`, {
                  toast: true,
                  feed: true,
                });
              }),
              catchError(() => {
                patchState(store, updateEntity({ id, changes: { status: 'Pending' } }));
                patchState(store, {
                  error: 'Server rejected the approval. Check enrollment constraints.',
                });
                notifications.push(
                  'error',
                  'Approval failed',
                  'The server rejected the approval. Check enrollment constraints.',
                );
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      /**
       * Bridges both real-time SignalR event streams into store state:
       * `ReceiveEnrollmentStatusUpdated` (TmsHub, fired on approve) and
       * `EnrollmentCreated` (EnrollmentHub, fired on new enrollment). Each
       * live update also raises a toast so instructors see activity land
       * without refreshing.
       */
      listenForLiveUpdates: rxMethod<void>(
        pipe(
          tap(() => sync.connect()),
          switchMap(() =>
            merge(
              sync.events$.pipe(
                tap((event) => {
                  patchState(
                    store,
                    updateEntity({ id: Number(event.id), changes: { status: event.status } }),
                  );
                  notifications.push(
                    'info',
                    'Enrollment status updated',
                    `Enrollment #${event.id} is now ${event.status}.`,
                  );
                }),
                map(() => void 0),
              ),
              sync.enrollmentCreated$.pipe(
                tap((event) => {
                  notifications.push(
                    'info',
                    'New enrollment request',
                    `Student #${event.studentId} requested ${event.courseCode}.`,
                  );
                }),
                map(() => void 0),
              ),
            ),
          ),
        ),
      ),
    }),
  ),
);
