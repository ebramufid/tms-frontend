import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { RoleRequestService } from '../../core/services/role-request.service';
import { RequestableRole } from '../../core/models/role-request.model';

type Mode = 'login' | 'register';
type SignupRole = 'Student' | RequestableRole;

interface DemoAccount {
  role: string;
  email: string;
  password: string;
}

interface RoleOption {
  value: SignupRole;
  label: string;
  description: string;
  icon: string;
}

// Matches the accounts DataSeeder.SeedAsync creates on the backend
// (Development only — see Program.cs). Shown here so a fresh clone has an
// obvious way in without digging through backend source.
const DEMO_ACCOUNTS: DemoAccount[] = [
  { role: 'Admin', email: 'admin@tms.local', password: 'Password123!' },
  { role: 'Instructor', email: 'instructor3@cotbe.edu.et', password: 'Instructor3@TMS2026!' },
  { role: 'Student', email: 'abebe.student@cotbe.edu.et', password: 'Student@2026!' },
];

// Every account is created as Student, full stop — AuthController.Register
// on the backend hardcodes this and never accepts a role from the client.
// Picking "Instructor" or "Admin" here does NOT grant that role: it files a
// RoleRequest that an existing Admin has to approve. There is no
// self-service way to become Instructor/Admin — that's intentional
// (see RoleRequestsController for why).
const ROLE_OPTIONS: RoleOption[] = [
  {
    value: 'Student',
    label: 'Student',
    description: 'Browse courses and enroll',
    icon: '🎓',
  },
  {
    value: 'Instructor',
    label: 'Instructor',
    description: 'Requires Admin approval',
    icon: '📘',
  },
  {
    value: 'Admin',
    label: 'Admin',
    description: 'Requires Admin approval',
    icon: '🛡️',
  },
];

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private authService = inject(AuthService);
  private roleRequestService = inject(RoleRequestService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notifications = inject(NotificationService);

  mode = signal<Mode>(this.route.snapshot.routeConfig?.path === 'register' ? 'register' : 'login');

  readonly demoAccounts = DEMO_ACCOUNTS;
  readonly roleOptions = ROLE_OPTIONS;

  fillDemo(demo: DemoAccount): void {
    this.username = demo.email;
    this.password = demo.password;
    this.errorMessage.set('');
  }

  // Login fields
  username = '';
  password = '';

  // Register fields
  firstName = '';
  lastName = '';
  registerEmail = '';
  registerPassword = '';
  selectedRole = signal<SignupRole>('Student');
  roleNote = '';

  loading = signal(false);
  errorMessage = signal('');
  registerSuccess = signal(false);
  registerSuccessMessage = signal('');

  setMode(mode: Mode): void {
    this.mode.set(mode);
    this.errorMessage.set('');
    this.registerSuccess.set(false);
  }

  selectRole(role: SignupRole): void {
    this.selectedRole.set(role);
  }

  async login(): Promise<void> {
    if (!this.username || !this.password) return;

    this.loading.set(true);
    this.errorMessage.set('');

    try {
      await this.authService.login({ email: this.username, password: this.password });

      const role = this.authService.currentUser()?.role;
      this.notifications.push('success', 'Welcome back', undefined, { feed: false });

      if (role === 'Admin') {
        await this.router.navigate(['/admin/courses']);
      } else if (role === 'Instructor') {
        await this.router.navigate(['/instructor']);
      } else {
        await this.router.navigate(['/dashboard']);
      }
    } catch {
      this.errorMessage.set('Invalid username or password.');
    } finally {
      this.loading.set(false);
    }
  }

  async register(): Promise<void> {
    if (!this.firstName || !this.lastName || !this.registerEmail || !this.registerPassword) return;

    this.loading.set(true);
    this.errorMessage.set('');

    try {
      await this.authService.register({
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.registerEmail,
        password: this.registerPassword,
      });

      const requestedRole = this.selectedRole();

      if (requestedRole === 'Student') {
        this.registerSuccessMessage.set('Account created! Redirecting you to sign in…');
        this.registerSuccess.set(true);
        this.notifications.push(
          'success',
          'Account created',
          'You can now sign in with your new account.',
          { feed: false },
        );

        this.username = this.registerEmail;
        this.password = '';
        setTimeout(() => this.setMode('login'), 1200);
        return;
      }

      // Non-Student pick: the account is still created as Student (the
      // backend never grants a role at registration), so we log the new
      // account in ourselves, file the role request on its behalf, and
      // land it on the Student dashboard where the pending-request banner
      // explains what happens next.
      await this.authService.login({
        email: this.registerEmail,
        password: this.registerPassword,
      });

      try {
        await new Promise<void>((resolve, reject) => {
          this.roleRequestService.create(requestedRole, this.roleNote || undefined).subscribe({
            next: () => resolve(),
            error: reject,
          });
        });
      } catch {
        // Account creation still succeeded even if the role request failed
        // to file (e.g. a stray duplicate) — don't block the redirect on it.
      }

      this.notifications.push(
        'success',
        'Account created',
        `You're registered as a Student. Your request to become an ${requestedRole} is pending approval.`,
      );

      await this.router.navigate(['/dashboard']);
    } catch (err: unknown) {
      const errors = (err as { error?: { errors?: string[] } })?.error?.errors;
      this.errorMessage.set(
        errors?.length ? errors.join(' ') : 'Could not create the account. Please try again.',
      );
    } finally {
      this.loading.set(false);
    }
  }
}
