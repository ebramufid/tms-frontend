export type RequestableRole = 'Instructor' | 'Admin';
export type RoleRequestStatus = 'Pending' | 'Approved' | 'Rejected';

/** Mirrors RoleRequestsController.RoleRequestDto. */
export interface RoleRequest {
  id: number;
  email: string;
  requestedRole: RequestableRole;
  note?: string | null;
  status: RoleRequestStatus;
  requestedAt: string;
  reviewedAt?: string | null;
  reviewedByEmail?: string | null;
  rejectionReason?: string | null;
}
