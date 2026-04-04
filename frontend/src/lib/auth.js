const AUTH_API_BASE_URL = import.meta.env.VITE_AUTH_API_BASE_URL?.trim() || 'http://localhost:8082';
const DOCTOR_API_BASE_URL = import.meta.env.VITE_DOCTOR_API_BASE_URL?.trim() || 'http://localhost:8083';
const PENDING_AUTH_KEY = 'healthcare_pending_auth';
const AUTH_USER_KEY = 'healthcare_auth_user';

const buildUrl = (baseUrl, path) => `${baseUrl}${path}`;

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

export const apiRequest = async (baseUrl, path, options = {}) => {
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
    throw new Error(`Cannot connect to ${baseUrl}. Check backend and try again.`);
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
  apiRequest(AUTH_API_BASE_URL, '/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const loginUser = (payload) =>
  apiRequest(AUTH_API_BASE_URL, '/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(normalizeCredentials(payload)),
  });

export const verifyOtp = (payload) =>
  apiRequest(AUTH_API_BASE_URL, '/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const fetchUsers = (accessToken) =>
  apiRequest(AUTH_API_BASE_URL, '/api/auth/users', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

export const fetchUserById = (accessToken, userId) =>
  apiRequest(AUTH_API_BASE_URL, `/api/auth/user/${userId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

export const updateUser = (accessToken, userId, payload) =>
  apiRequest(AUTH_API_BASE_URL, `/api/auth/user/${userId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

export const updateUserProfile = (userId, payload) =>
  apiRequest(AUTH_API_BASE_URL, `/api/auth/profile/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

export const deleteUser = (accessToken, userId) =>
  apiRequest(AUTH_API_BASE_URL, `/api/auth/user/${userId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

export const fetchDoctors = () =>
  apiRequest(DOCTOR_API_BASE_URL, '/api/doctors', {
    method: 'GET',
  });

export const fetchDoctorSummary = () =>
  apiRequest(DOCTOR_API_BASE_URL, '/api/doctors/summary', {
    method: 'GET',
  });

export const createDoctor = (payload) =>
  apiRequest(DOCTOR_API_BASE_URL, '/api/doctors', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateDoctor = (doctorId, payload) =>
  apiRequest(DOCTOR_API_BASE_URL, `/api/doctors/${doctorId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

export const updateDoctorStatus = (doctorId, status) =>
  apiRequest(DOCTOR_API_BASE_URL, `/api/doctors/${doctorId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

export const updateDoctorVerification = (doctorId, verified) =>
  apiRequest(DOCTOR_API_BASE_URL, `/api/doctors/${doctorId}/verification`, {
    method: 'PATCH',
    body: JSON.stringify({ verified }),
  });

export const deleteDoctor = (doctorId) =>
  apiRequest(DOCTOR_API_BASE_URL, `/api/doctors/${doctorId}`, {
    method: 'DELETE',
  });

export const fetchVideoConsultationsByPatientEmail = (patientEmail) =>
  apiRequest(DOCTOR_API_BASE_URL, `/api/video-consultations/patient/${encodeURIComponent(patientEmail)}`, {
    method: 'GET',
  });

export const fetchVideoConsultationsByDoctorId = (doctorId) =>
  apiRequest(DOCTOR_API_BASE_URL, `/api/video-consultations/doctor/${doctorId}`, {
    method: 'GET',
  });

export const fetchScheduledVideoConsultationsByDoctorId = (doctorId) =>
  apiRequest(DOCTOR_API_BASE_URL, `/api/video-consultations/doctor/${doctorId}/scheduled`, {
    method: 'GET',
  });

export const fetchVideoConsultationById = (id) =>
  apiRequest(DOCTOR_API_BASE_URL, `/api/video-consultations/${id}`, {
    method: 'GET',
  });

export const createVideoConsultation = (payload) =>
  apiRequest(DOCTOR_API_BASE_URL, '/api/video-consultations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateVideoConsultation = (id, payload) =>
  apiRequest(DOCTOR_API_BASE_URL, `/api/video-consultations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

export const deleteVideoConsultation = (id) =>
  apiRequest(DOCTOR_API_BASE_URL, `/api/video-consultations/${id}`, {
    method: 'DELETE',
  });

export const generateVideoLink = (platform) =>
  apiRequest(DOCTOR_API_BASE_URL, `/api/video-consultations/generate-link?platform=${encodeURIComponent(platform)}`, {
    method: 'POST',
  });

export const getPatientDetails = (email) =>
  apiRequest(DOCTOR_API_BASE_URL, `/api/patient-details/email/${encodeURIComponent(email)}`, {
    method: 'GET',
  });

export const createPatientDetails = (payload) =>
  apiRequest(DOCTOR_API_BASE_URL, '/api/patient-details', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updatePatientDetails = (email, payload) =>
  apiRequest(DOCTOR_API_BASE_URL, `/api/patient-details/email/${encodeURIComponent(email)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

export const deletePatientDetails = (email) =>
  apiRequest(DOCTOR_API_BASE_URL, `/api/patient-details/email/${encodeURIComponent(email)}`, {
    method: 'DELETE',
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
