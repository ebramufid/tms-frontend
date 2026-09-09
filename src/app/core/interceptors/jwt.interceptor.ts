import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { from, switchMap, catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.getAccessToken();

  if (!token) {
    return next(req);
  }

  const authenticatedRequest = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });

  return next(authenticatedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (
        error.status !== 401 ||
        req.url.includes('/auth/refresh') ||
        req.url.includes('/auth/login')
      ) {
        return throwError(() => error);
      }

      return from(auth.refresh()).pipe(
        switchMap((refreshed) => {
          if (!refreshed) {
            router.navigate(['/login']);
            return throwError(() => error);
          }

          const newToken = auth.getAccessToken();
          if (!newToken) {
            router.navigate(['/login']);
            return throwError(() => error);
          }

          const retryRequest = req.clone({
            setHeaders: { Authorization: `Bearer ${newToken}` },
          });

          return next(retryRequest);
        }),

        catchError((refreshError) => {
          auth.logout();
          router.navigate(['/login']);
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
