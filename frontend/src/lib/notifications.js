const DEFAULT_NOTIFICATION_API_BASE_URL = 'http://localhost:8094';
const NOTIFICATION_API_BASE_URL =
  import.meta.env.VITE_NOTIFICATION_API_BASE_URL?.trim() || DEFAULT_NOTIFICATION_API_BASE_URL;

const buildUrl = (path) => `${NOTIFICATION_API_BASE_URL}${path}`;

const parseMessage = (data) => {
  if (typeof data?.message === 'string' && data.message.trim()) {
    return data.message;
  }
  return 'Notification request failed.';
};

const notificationRequest = async (path, options = {}) => {
  let response;
  try {
    response = await fetch(buildUrl(path), {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
    });
  } catch {
    throw new Error('Cannot connect to notification service.');
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(parseMessage(data));
  }

  return data;
};

export const fetchNotifications = () => notificationRequest('/api/notifications');

export const fetchNotificationSummary = () => notificationRequest('/api/notifications/summary');

export const sendNotificationById = (notificationId) =>
  notificationRequest(`/api/notifications/${notificationId}/send`, { method: 'POST' });

export const updateNotificationStatus = (notificationId, status) =>
  notificationRequest(`/api/notifications/${notificationId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

export const deleteNotificationById = (notificationId) =>
  notificationRequest(`/api/notifications/${notificationId}`, { method: 'DELETE' });
