import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Course, CourseDetail, PagedResponse } from '../models/course.model';

@Injectable({ providedIn: 'root' })
export class CourseService {
  private http = inject(HttpClient);

  private readonly base = `${environment.apiUrl}/courses`;
  private readonly managementBase = `${environment.managementApiUrl}/courses`;

  /** Public catalogue — GET /api/v1/courses */
  getAll() {
    return this.http
      .get<PagedResponse<Course>>(this.base, {
        params: new HttpParams().set('page', '1').set('pageSize', '50'),
      })
      .pipe(map((response) => response.items));
  }

  /**
   * Public course detail — GET /api/v1/courses/{id}.
   * Fixed from the previous implementation, which re-fetched the whole
   * catalogue and filtered client-side (losing the HATEOAS `links`).
   */
  getById(id: number) {
    return this.http.get<CourseDetail>(`${this.base}/${id}`).pipe(
      map((course) => course ?? null),
    );
  }

  /** Admin/Instructor management — PUT /api/v2/courses/{id} */
  update(id: number, title: string, maxCapacity?: number) {
    return this.http.put<Course>(`${this.managementBase}/${id}`, {
      title,
      ...(maxCapacity !== undefined ? { maxCapacity } : {}),
    });
  }

  /** Admin/Instructor management — DELETE /api/v2/courses/{id} */
  delete(id: number) {
    return this.http.delete(`${this.managementBase}/${id}`);
  }

  /** Admin/Instructor management — POST /api/v2/courses */
  create(code: string, title: string, maxCapacity: number) {
    return this.http.post<Course>(this.managementBase, {
      code,
      title,
      maxCapacity,
    });
  }
}
