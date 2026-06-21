import { apiClient } from "../../shared/api/client.js";

export type ServerNotification = {
  notification_id: number;
  type: string;
  title: string;
  content: string;
  is_read: boolean;
  data: {
    target?: string;
    reflection_date?: string;
  };
  created_at: string;
};

export async function fetchNotifications() {
  const { data } = await apiClient.get<ServerNotification[]>("/notifications/");
  return data;
}

export async function markNotificationRead(notificationId: number) {
  const { data } = await apiClient.patch<ServerNotification>(
    `/notifications/${notificationId}/read/`,
  );
  return data;
}
