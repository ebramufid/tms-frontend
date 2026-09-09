/** Mirrors `CertificateResponseDto` — GET /api/certificates/by-student/{studentId}. */
export interface Certificate {
  id: number;
  serialNumber: string;
  issuedAt: string;
  studentId: number;
  courseId: number;
}

/** Mirrors `TranscriptState` on the backend (JSON string enum). */
export type TranscriptState = 'Queued' | 'Processing' | 'Ready' | 'Failed';

/** Mirrors `TranscriptStatus` — POST/GET /api/v2/transcripts. */
export interface TranscriptStatus {
  reportId: string;
  studentId: number;
  state: TranscriptState;
  requestedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  downloadUrl?: string | null;
  errorMessage?: string | null;
}
