const DEFAULT_NOTIFICATION_API_BASE_URLS = ['http://localhost:8084', 'http://localhost:8094'];
const configuredNotificationApiBaseUrl = import.meta.env.VITE_NOTIFICATION_API_BASE_URL?.trim();
const NOTIFICATION_API_BASE_URLS = [configuredNotificationApiBaseUrl, ...DEFAULT_NOTIFICATION_API_BASE_URLS].filter(
  (value, index, list) => value && list.indexOf(value) === index,
);

const buildUrl = (baseUrl, path) => `${baseUrl}${path}`;

const parseMessage = (data) => {
  if (typeof data?.message === 'string' && data.message.trim()) {
    return data.message;
  }
  return 'Notification request failed.';
};

export const notificationRequest = async (path, options = {}) => {
  let connectionError = null;
  let responseError = null;

  for (const [index, baseUrl] of NOTIFICATION_API_BASE_URLS.entries()) {
    let response;
    try {
      response = await fetch(buildUrl(baseUrl, path), {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers ?? {}),
        },
      });
    } catch {
      connectionError = new Error('Cannot connect to notification service.');
      continue;
    }

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      responseError = new Error(parseMessage(data));
      if (response.status === 404 && index < NOTIFICATION_API_BASE_URLS.length - 1) {
        continue;
      }
      throw responseError;
    }

    return data;
  }

  throw responseError || connectionError || new Error('Cannot connect to notification service.');
};

export const fetchNotifications = () => notificationRequest('/api/notifications');

export const fetchNotificationSummary = () => notificationRequest('/api/notifications/summary');

export const createNotification = (payload) =>
  notificationRequest('/api/notifications', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const sendAppointmentSuccessNotification = (payload) =>
  notificationRequest('/api/notifications/events/appointment-success', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const sendNotificationById = (notificationId) =>
  notificationRequest(`/api/notifications/${notificationId}/send`, { method: 'POST' });

export const updateNotificationStatus = (notificationId, status) =>
  notificationRequest(`/api/notifications/${notificationId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

export const updateNotificationReadStatus = (notificationId, read) =>
  notificationRequest(`/api/notifications/${notificationId}/read-status`, {
    method: 'PATCH',
    body: JSON.stringify({ read }),
  });

export const deleteNotificationById = (notificationId) =>
  notificationRequest(`/api/notifications/${notificationId}`, { method: 'DELETE' });
