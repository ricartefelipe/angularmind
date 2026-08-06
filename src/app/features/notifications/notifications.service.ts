import { Injectable, computed, inject, signal } from '@angular/core'
import { firstValueFrom } from 'rxjs'
import { NotificationsApi } from './notifications.api'
import type { NotificationItem } from './types'

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly api = inject(NotificationsApi)

  readonly items = signal<NotificationItem[] | null>(null)
  readonly loading = signal(false)
  readonly mutating = signal(false)
  readonly error = signal<Error | null>(null)
  readonly mutateError = signal<Error | null>(null)

  readonly unreadCount = computed(
    () => (this.items() ?? []).filter((item) => !item.read).length,
  )

  async load(): Promise<void> {
    this.loading.set(true)
    this.error.set(null)
    try {
      const response = await firstValueFrom(this.api.list())
      this.items.set(response.items)
    } catch (err) {
      this.error.set(err instanceof Error ? err : new Error('notifications'))
      this.items.set(null)
    } finally {
      this.loading.set(false)
    }
  }

  async markRead(id: string): Promise<void> {
    this.mutating.set(true)
    this.mutateError.set(null)
    try {
      await firstValueFrom(this.api.markRead(id))
      this.items.set(
        (this.items() ?? []).map((item) => (item.id === id ? { ...item, read: true } : item)),
      )
    } catch (err) {
      this.mutateError.set(err instanceof Error ? err : new Error('markRead'))
    } finally {
      this.mutating.set(false)
    }
  }

  async markAllRead(): Promise<void> {
    this.mutating.set(true)
    this.mutateError.set(null)
    try {
      await firstValueFrom(this.api.markAllRead())
      this.items.set((this.items() ?? []).map((item) => ({ ...item, read: true })))
    } catch (err) {
      this.mutateError.set(err instanceof Error ? err : new Error('markAllRead'))
    } finally {
      this.mutating.set(false)
    }
  }
}
