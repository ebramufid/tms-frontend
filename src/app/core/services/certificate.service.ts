import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Certificate } from '../models/certificate.model';

/**
 * Wraps `CertificatesController` (`/api/certificates`). No backend changes
 * required — this simply gives the frontend a typed way to reach an
 * endpoint that already existed but was never called from the UI.
 */
@Injectable({ providedIn: 'root' })
export class CertificateService {
  private http = inject(HttpClient);
  private readonly base = '/api/certificates';

  getByStudent(studentId: number): Observable<Certificate[]> {
    return this.http.get<Certificate[]>(`${this.base}/by-student/${studentId}`);
  }

  getByCourse(courseId: number): Observable<Certificate[]> {
    return this.http.get<Certificate[]>(`${this.base}/by-course/${courseId}`);
  }
}
