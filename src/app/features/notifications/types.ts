export type NotificationItem = {
  id: string
  title: string
  body: string
  read: boolean
  createdAt: string
}

export type NotificationsResponse = {
  items: NotificationItem[]
}
