import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import type { NotificationsResponse } from './types'

@Injectable({ providedIn: 'root' })
export class NotificationsApi {
  private readonly http = inject(HttpClient)

  list() {
    return this.http.get<NotificationsResponse>('/api/v1/notifications')
  }

  markRead(id: string) {
    return this.http.post<void>(`/api/v1/notifications/${id}/read`, {})
  }

  markAllRead() {
    return this.http.post<void>('/api/v1/notifications/read-all', {})
  }
}
