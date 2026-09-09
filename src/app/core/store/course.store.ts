import { inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { signalStore, withMethods, withState, patchState } from '@ngrx/signals';
import { withEntities, removeEntity, setAllEntities } from '@ngrx/signals/entities';

import { Course } from '../models/course.model';
import { CourseService } from '../services/course.service';

import { catchError, EMPTY } from 'rxjs';

type CourseStoreState = {
  createError: string | null;
  updateError: string | null;
  deleteError: string | null;

  creatingCourse: boolean;
  updatingCourseId: number | null;
  deletingCourseId: number | null;
};

export const CourseStore = signalStore(
  { providedIn: 'root' },

  withEntities<Course>(),

  withState<CourseStoreState>({
    createError: null,
    updateError: null,
    deleteError: null,

    creatingCourse: false,
    updatingCourseId: null,
    deletingCourseId: null,
  }),

  withMethods((store, svc = inject(CourseService)) => ({
    // ============================================================
    // LOAD
    // ============================================================
    loadCourses() {
      svc.getAll().subscribe({
        next: (courses) => {
          patchState(store, setAllEntities(courses));
        },
        error: (err) => {
          console.error('Failed to load courses:', err);
        },
      });
    },

    // ============================================================
    // CREATE
    // ============================================================
    createCourse(code: string, title: string, maxCapacity: number) {
      patchState(store, { creatingCourse: true, createError: null });

      svc.create(code, title, maxCapacity).subscribe({
        next: (course) => {
          patchState(store, setAllEntities([...store.entities(), course]));
          patchState(store, { creatingCourse: false });
        },

        error: (err: HttpErrorResponse) => {
          patchState(store, {
            creatingCourse: false,
            createError:
              err.status === 409
                ? 'A course with this code already exists.'
                : 'Unable to create the course. Please try again.',
          });
          console.error('Course creation failed:', err);
        },
      });
    },

    // ============================================================
    // UPDATE
    // ============================================================
    updateCourse(id: number, title: string, maxCapacity?: number) {
      const previousSnapshot = store.entities();

      patchState(store, { updatingCourseId: id, updateError: null });

      // Optimistic update.
      patchState(
        store,
        setAllEntities(
          previousSnapshot.map((course) =>
            course.id === id
              ? { ...course, title, ...(maxCapacity !== undefined ? { maxCapacity } : {}) }
              : course,
          ),
        ),
      );

      svc
        .update(id, title, maxCapacity)
        .pipe(
          catchError((err: HttpErrorResponse) => {
            // Backend rejected the update — restore the previous state.
            patchState(store, setAllEntities(previousSnapshot));

            let message: string;
            switch (err.status) {
              case 403:
                message = 'You do not have permission to edit this course.';
                break;
              case 404:
                message = 'This course no longer exists.';
                break;
              case 400:
                message = 'The course information is invalid.';
                break;
              default:
                message = 'Unable to update the course. Please try again.';
                break;
            }

            patchState(store, { updateError: message, updatingCourseId: null });
            console.error('Update failed. Course restored.', err);
            return EMPTY;
          }),
        )
        .subscribe({
          next: () => {
            patchState(store, { updatingCourseId: null, updateError: null });
          },
          error: (err) => {
            console.error('Unexpected update error:', err);
          },
        });
    },

    // ============================================================
    // DELETE
    // ============================================================
    deleteCourse(id: number) {
      const previousSnapshot = store.entities();

      patchState(store, { deletingCourseId: id, deleteError: null });

      // Optimistic delete.
      patchState(store, removeEntity(id));

      svc
        .delete(id)
        .pipe(
          catchError((err: HttpErrorResponse) => {
            patchState(store, setAllEntities(previousSnapshot));

            let message: string;
            switch (err.status) {
              case 403:
                message = 'You do not have permission to delete this course.';
                break;
              case 404:
                message = 'This course no longer exists.';
                break;
              case 409:
                message = 'This course cannot be deleted because students are enrolled.';
                break;
              default:
                message = 'Unable to delete the course. Please try again.';
                break;
            }

            patchState(store, { deleteError: message, deletingCourseId: null });
            console.error('Delete course failed:', err);
            return EMPTY;
          }),
        )
        .subscribe({
          next: () => {
            patchState(store, { deletingCourseId: null, deleteError: null });
          },
          complete: () => {
            patchState(store, { deletingCourseId: null });
          },
        });
    },

    // ============================================================
    // CLEAR ERRORS
    // ============================================================
    clearCreateError() {
      patchState(store, { createError: null });
    },
    clearUpdateError() {
      patchState(store, { updateError: null });
    },
    clearDeleteError() {
      patchState(store, { deleteError: null });
    },
  })),
);
