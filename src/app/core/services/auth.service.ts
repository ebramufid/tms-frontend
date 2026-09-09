import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TmsUser {
  email: string;
  displayName: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

/**
 * Talks to AuthController (`/api/v1/auth/...`). The backend also sets
 * HttpOnly `tms_access_token` / `tms_refresh_token` cookies, but those
 * aren't consumed by the JwtBearer scheme — the API only reads the
 * `Authorization: Bearer <token>` header, so we keep tokens client-side
 * (sessionStorage) and attach them ourselves via the jwt interceptor.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/auth`;

  private accessToken = signal<string | null>(null);
  private refreshToken = signal<string | null>(null);

  currentUser = signal<TmsUser | null>(null);

  constructor() {
    this.restoreSession();
  }

  getAccessToken(): string | null {
    return this.accessToken();
  }

  isAuthenticated(): boolean {
    return this.accessToken() !== null;
  }

  hasRole(role: string): boolean {
    const user = this.currentUser();
    return user?.role === role || user?.role === 'Admin';
  }

  async login(credentials: LoginRequest): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<AuthResponse>(`${this.base}/login`, credentials),
    );
    this.setSession(res);
  }

  async register(payload: RegisterRequest): Promise<void> {
    await firstValueFrom(
      this.http.post<{ message: string }>(`${this.base}/register`, payload),
    );
  }

  async refresh(): Promise<boolean> {
    const refreshToken = this.refreshToken();
    if (!refreshToken) return false;

    try {
      const res = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.base}/refresh`, { refreshToken }),
      );
      this.setSession(res);
      return true;
    } catch {
      this.logout();
      return false;
    }
  }

  logout(): void {
    this.accessToken.set(null);
    this.refreshToken.set(null);
    this.currentUser.set(null);
    sessionStorage.removeItem('tms_access_token');
    sessionStorage.removeItem('tms_refresh_token');
  }

  private setSession(res: AuthResponse): void {
    this.accessToken.set(res.accessToken);
    this.refreshToken.set(res.refreshToken);

    sessionStorage.setItem('tms_access_token', res.accessToken);
    sessionStorage.setItem('tms_refresh_token', res.refreshToken);

    this.setCurrentUser(res.accessToken);
  }

  private restoreSession(): void {
    const accessToken = sessionStorage.getItem('tms_access_token');
    const refreshToken = sessionStorage.getItem('tms_refresh_token');

    if (!accessToken || !refreshToken) return;

    this.accessToken.set(accessToken);
    this.refreshToken.set(refreshToken);

    try {
      this.setCurrentUser(accessToken);
    } catch {
      this.logout();
    }
  }

  private setCurrentUser(token: string): void {
    const payload = JSON.parse(atob(token.split('.')[1]));

    this.currentUser.set({
      email: payload.email || payload.sub,
      displayName: payload.name || payload.email || 'User',
      role:
        payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
        payload.role ||
        'Student',
    });
  }
}
