/**
 * List row from the TMS API — mirrors `CourseResponseDto` on `GET /api/v1/courses`.
 * ASP.NET Core defaults to camelCase JSON (`id`, `maxCapacity`, …).
 */
export interface Course {
  id: number;
  code: string;
  title: string;
  maxCapacity: number;
  enrollmentCount: number;
}

/** Envelope for `GET /api/v1/courses` — TMS API `PagedResponse<T>` contract. */
export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

/** One link from `CourseDetailDto.Links` on `GET /api/v1/courses/{id}`. */
export interface CourseLink {
  href: string;
  rel: string;
  method: string;
}

/** Detail payload — mirrors `CourseDetailDto` (list rows do not include `links`). */
export interface CourseDetail extends Course {
  links: readonly CourseLink[];
}
