export type EnrollmentStatus = 'Pending' | 'Approved' | 'Rejected';

export interface Enrollment {
  id: number;
  studentId: number;
  studentName: string;
  courseId: number;
  courseName: string;
  status: EnrollmentStatus;
  enrolledAt: string;
}
