import { apiClient } from './client';

export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED';
export type NotificationChannel = 'EMAIL' | 'SMS' | 'IN_APP';

export interface Notification {
  id: string;
  userId: string | null;
  channel: NotificationChannel;
  template: string;
  payload: Record<string, unknown> | null;
  status: NotificationStatus;
  sentAt: string | null;
  createdAt: string;
  user?: { id: string; fullName: string; email: string } | null;
}

export async function fetchMyNotifications(): Promise<Notification[]> {
  const { data } = await apiClient.get<Notification[]>('/notifications');
  return data;
}

export async function fetchAllNotifications(): Promise<Notification[]> {
  const { data } = await apiClient.get<Notification[]>('/notifications/all');
  return data;
}
