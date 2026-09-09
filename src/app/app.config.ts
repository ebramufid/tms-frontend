import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import {
  provideHttpClient,
  withInterceptors,
  withXhr,
  withXsrfConfiguration,
} from '@angular/common/http';

import { routes } from './app.routes';

import { credentialsInterceptor } from './core/interceptors/credentials.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),

    provideRouter(
      routes,
      withComponentInputBinding(),
      // Native View Transitions API — smooth, GPU-accelerated cross-fades
      // between routes with zero extra dependencies (no @angular/animations).
      withViewTransitions({
        skipInitialTransition: true,
      }),
    ),

    provideHttpClient(
      withXhr(),

      withInterceptors([credentialsInterceptor, errorInterceptor, jwtInterceptor]),

      withXsrfConfiguration({
        cookieName: 'XSRF-TOKEN',
        headerName: 'X-XSRF-TOKEN',
      }),
    ),
  ],
};
