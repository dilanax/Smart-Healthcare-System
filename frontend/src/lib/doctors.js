const DEFAULT_DOCTOR_API_BASE_URL = 'http://localhost:8082';
const DOCTOR_API_BASE_URL =
  import.meta.env.VITE_DOCTOR_API_BASE_URL?.trim() || DEFAULT_DOCTOR_API_BASE_URL;

const buildUrl = (path) => `${DOCTOR_API_BASE_URL}${path}`;

const parseResponse = async (response) => {
  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data?.message || 'Doctor service request failed.';
    throw new Error(message);
  }

  return data;
};

export const fetchDoctorProfiles = async () => {
  const response = await fetch(buildUrl('/api/doctors'));
  return parseResponse(response);
};

export const createDoctorProfile = async (payload) => {
  const response = await fetch(buildUrl('/api/doctors'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
};

export const updateDoctorProfile = async (id, payload) => {
  const response = await fetch(buildUrl(`/api/doctors/${id}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
};

export const deleteDoctorProfile = async (id) => {
  const response = await fetch(buildUrl(`/api/doctors/${id}`), {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete doctor profile.');
  }
};
