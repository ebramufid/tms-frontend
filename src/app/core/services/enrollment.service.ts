import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Enrollment } from '../models/enrollment.model';

/**
 * Fixed from the original: the class used a non-existent `@Service()`
 * decorator (not a real Angular API) which would fail to compile — this
 * is `@Injectable({ providedIn: 'root' })` like every other service.
 */
@Injectable({ providedIn: 'root' })
export class EnrollmentService {
  private http = inject(HttpClient);

  // Deliberately unversioned — EnrollmentAdminController is NOT under
  // api/v{version}/... or api/courses/{courseId}/...
  private readonly baseUrl = '/api/enrollments';
  // EnrollStudentCommand lives on the v2 (MediatR/CQRS) surface.
  private readonly createUrl = `${environment.managementApiUrl}/enrollments`;

  getAll(): Observable<Enrollment[]> {
    return this.http.get<Enrollment[]>(this.baseUrl);
  }

  approve(id: number): Observable<Enrollment> {
    return this.http.post<Enrollment>(`${this.baseUrl}/${id}/approve`, {});
  }

  /**
   * Matches EnrollStudentCommand exactly: POST /api/v2/enrollments,
   * { studentId, courseCode } in the body — course identified by code, not id.
   */
  create(studentId: number, courseCode: string): Observable<unknown> {
    return this.http.post(this.createUrl, { studentId, courseCode });
  }
}
