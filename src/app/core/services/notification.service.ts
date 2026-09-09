import { Injectable, signal } from '@angular/core';

export type NotificationTone = 'info' | 'success' | 'warning' | 'error';

export interface AppNotification {
  id: number;
  tone: NotificationTone;
  title: string;
  message?: string;
  createdAt: Date;
  /** Toasts auto-dismiss; feed items (read: false) persist in the bell menu. */
  read: boolean;
}

let nextId = 1;

/**
 * Value-add feature: a lightweight, dependency-free event bus for toasts
 * and a persistent notification feed. Fed by the error interceptor (API
 * failures) and by LiveSyncService (SignalR events) so real backend
 * activity — enrollment approvals, new signups, course changes — surfaces
 * to the user without any new endpoints.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly toasts = signal<AppNotification[]>([]);
  readonly feed = signal<AppNotification[]>([]);

  readonly unreadCount = signal(0);

  push(tone: NotificationTone, title: string, message?: string, opts?: { toast?: boolean; feed?: boolean }): void {
    const showToast = opts?.toast ?? true;
    const addToFeed = opts?.feed ?? true;

    const notification: AppNotification = {
      id: nextId++,
      tone,
      title,
      message,
      createdAt: new Date(),
      read: false,
    };

    if (showToast) {
      this.toasts.update((list) => [...list, notification]);
      setTimeout(() => this.dismissToast(notification.id), 5000);
    }

    if (addToFeed) {
      this.feed.update((list) => [notification, ...list].slice(0, 30));
      this.unreadCount.update((n) => n + 1);
    }
  }

  dismissToast(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  markAllRead(): void {
    this.feed.update((list) => list.map((n) => ({ ...n, read: true })));
    this.unreadCount.set(0);
  }

  clearFeed(): void {
    this.feed.set([]);
    this.unreadCount.set(0);
  }
}
