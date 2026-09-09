import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

/**
 * Same redirect-on-401 behaviour as the original, plus a value-add: any
 * failed request (excluding auth/login/refresh, which already show inline
 * form errors) now also raises a toast via NotificationService, so backend
 * failures are visible even from places that don't have their own error UI.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const notifications = inject(NotificationService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const detailMessage: string =
        err.error?.detail ?? 'A system error occurred. Please try again.';

      const isAuthEndpoint =
        req.url.includes('/auth/login') ||
        req.url.includes('/auth/register') ||
        req.url.includes('/auth/refresh');

      if (err.status === 401) {
        if (!isAuthEndpoint) {
          router.navigate(['/login']);
        }
      } else if (!isAuthEndpoint && err.status !== 0) {
        notifications.push('error', 'Request failed', detailMessage, {
          toast: true,
          feed: false,
        });
        console.error('API Error Response:', detailMessage);
      }

      return throwError(() => err);
    }),
  );
};
