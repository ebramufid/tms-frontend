import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TranscriptStatus } from '../models/certificate.model';

/**
 * Wraps `V2/TranscriptsController` — a background-worker + bounded-channel
 * async job flow that already exists on the backend (`Queued` ->
 * `Processing` -> `Ready`/`Failed`) but had no frontend caller at all.
 * Powers the "Request transcript" live-status widget on the student
 * dashboard — no API schema changes needed.
 */
@Injectable({ providedIn: 'root' })
export class TranscriptService {
  private http = inject(HttpClient);
  private readonly base = `${environment.managementApiUrl}/transcripts`;

  request(studentId: number, idempotencyKey: string): Observable<TranscriptStatus> {
    const headers = new HttpHeaders({ 'Idempotency-Key': idempotencyKey });
    return this.http.post<TranscriptStatus>(this.base, { studentId }, { headers });
  }

  getStatus(reportId: string): Observable<TranscriptStatus> {
    return this.http.get<TranscriptStatus>(`${this.base}/${reportId}/status`);
  }
}
