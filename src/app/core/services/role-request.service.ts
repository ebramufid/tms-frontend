import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RequestableRole, RoleRequest, RoleRequestStatus } from '../models/role-request.model';

@Injectable({ providedIn: 'root' })
export class RoleRequestService {
  private http = inject(HttpClient);
  private readonly base = '/api/role-requests';

  create(requestedRole: RequestableRole, note?: string): Observable<RoleRequest> {
    return this.http.post<RoleRequest>(this.base, { requestedRole, note });
  }

  /** The current account's most recent request, or null if it has never made one. */
  mine(): Observable<RoleRequest | null> {
    return new Observable((subscriber) => {
      this.http.get<RoleRequest>(`${this.base}/mine`).subscribe({
        next: (r) => {
          subscriber.next(r);
          subscriber.complete();
        },
        error: (err) => {
          if (err.status === 404) {
            subscriber.next(null);
            subscriber.complete();
          } else {
            subscriber.error(err);
          }
        },
      });
    });
  }

  list(status?: RoleRequestStatus): Observable<RoleRequest[]> {
    const url = status ? `${this.base}?status=${status}` : this.base;
    return this.http.get<RoleRequest[]>(url);
  }

  approve(id: number): Observable<RoleRequest> {
    return this.http.post<RoleRequest>(`${this.base}/${id}/approve`, {});
  }

  reject(id: number, reason?: string): Observable<RoleRequest> {
    return this.http.post<RoleRequest>(`${this.base}/${id}/reject`, { reason });
  }
}
