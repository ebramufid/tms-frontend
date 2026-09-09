import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
    title: 'TMS · Training Management System',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/student-dashboard/student-dashboard.component').then(
        (m) => m.StudentDashboardComponent,
      ),
    canActivate: [authGuard],
    title: 'TMS · Dashboard',
  },
  {
    path: 'courses/:id',
    loadComponent: () =>
      import('./features/course-detail/course-detail.component').then(
        (m) => m.CourseDetailComponent,
      ),
    title: 'TMS · Course',
  },
  {
    path: 'enroll',
    loadComponent: () =>
      import('./features/enrollment-form/enrollment-form.component').then(
        (m) => m.EnrollmentFormComponent,
      ),
    title: 'TMS · Enroll',
  },
  {
    path: 'instructor',
    loadComponent: () =>
      import('./features/instructor-dashboard/instructor-dashboard.component').then(
        (m) => m.InstructorDashboardComponent,
      ),
    canActivate: [roleGuard('Instructor')],
    title: 'TMS · Instructor',
  },
  {
    path: 'grade-submission',
    loadComponent: () =>
      import('./features/grade-submission/grade-submission.component').then(
        (m) => m.GradeSubmissionComponent,
      ),
    canActivate: [roleGuard('Instructor')],
    title: 'TMS · Grade Submission',
  },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then((m) => m.LoginComponent),
    title: 'TMS · Login',
  },
  {
    // New: public registration was already supported by the backend
    // (`POST /api/v1/auth/register`) but had no route in the old frontend.
    path: 'register',
    loadComponent: () => import('./features/login/login.component').then((m) => m.LoginComponent),
    title: 'TMS · Create account',
  },
  {
    path: 'admin/courses',
    loadComponent: () =>
      import('./features/admin-course-list/admin-course-list.component').then(
        (m) => m.AdminCourseListComponent,
      ),
    canActivate: [roleGuard('Admin')],
    title: 'TMS · Course Management',
  },
  {
    path: 'admin/role-requests',
    loadComponent: () =>
      import('./features/admin-role-requests/admin-role-requests.component').then(
        (m) => m.AdminRoleRequestsComponent,
      ),
    canActivate: [roleGuard('Admin')],
    title: 'TMS · Role Requests',
  },
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./features/unauthorized/unauthorized.component').then(
        (m) => m.UnauthorizedComponent,
      ),
    title: 'TMS · Unauthorized',
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then((m) => m.NotFoundComponent),
    title: 'TMS · Not found',
  },
];
