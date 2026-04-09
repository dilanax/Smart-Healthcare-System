const DEFAULT_API_BASE_URL = 'http://localhost:8083';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL;
const PENDING_AUTH_KEY = 'healthcare_pending_auth';
const AUTH_USER_KEY = 'healthcare_auth_user';

const buildUrl = (path) => `${API_BASE_URL}${path}`;

const normalizeCredentials = (payload) => ({
  ...payload,
  email: payload?.email?.trim().toLowerCase() ?? '',
  password: payload?.password ?? '',
});

const parseMessage = (data) => {
  if (typeof data?.message === 'string' && data.message.trim()) {
    return data.message;
  }

  return 'Something went wrong. Please try again.';
};

export const apiRequest = async (path, options = {}) => {
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
    throw new Error('Cannot connect to the server. Check backend and try again.');
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  const message = parseMessage(data);
  
  // Check for error indicators in the response
  const errorMessages = [
    'unauthorized',
    'invalid',
    'not found',
    'failed',
    'error',
    'already exists',
    'expired',
    'inactive',
  ];
  
  const isErrorMessage = errorMessages.some(err => 
    message.toLowerCase().includes(err)
  );
  
  const isOk = response.ok && !isErrorMessage;

  if (!isOk) {
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return data;
};

export const registerUser = (payload) =>
  apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const loginUser = (payload) =>
  apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(normalizeCredentials(payload)),
  });

export const verifyOtp = (payload) =>
  apiRequest('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const fetchUsers = (accessToken) =>
  apiRequest('/api/auth/users', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

export const fetchUserById = (accessToken, userId) =>
  apiRequest(`/api/auth/user/${userId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

export const updateUser = (accessToken, userId, payload) =>
  apiRequest(`/api/auth/user/${userId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

export const deleteUser = (accessToken, userId) =>
  apiRequest(`/api/auth/user/${userId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

export const setPendingAuth = (value) => {
  sessionStorage.setItem(PENDING_AUTH_KEY, JSON.stringify(value));
};

export const getPendingAuth = () => {
  const value = sessionStorage.getItem(PENDING_AUTH_KEY);
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    sessionStorage.removeItem(PENDING_AUTH_KEY);
    return null;
  }
};

export const clearPendingAuth = () => {
  sessionStorage.removeItem(PENDING_AUTH_KEY);
};

export const storeUser = (user) => {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

export const getStoredUser = () => {
  const value = localStorage.getItem(AUTH_USER_KEY);
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    localStorage.removeItem(AUTH_USER_KEY);
    return null;
  }
};

export const clearStoredUser = () => {
  localStorage.removeItem(AUTH_USER_KEY);
};
