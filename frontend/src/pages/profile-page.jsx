import { useEffect, useRef, useState } from 'react';
import { fetchUserById, getStoredUser, storeUser, updateUser } from '../lib/auth';
import Navbar from '../components/navbar';

const STORAGE_KEY_PRESCRIPTIONS = 'doctor_prescriptions';

const buildJitsiCallUrl = (roomName, displayName) =>
  `https://meet.jit.si/${encodeURIComponent(roomName)}#userInfo.displayName=${encodeURIComponent(displayName)}&config.startWithVideoMuted=false&config.startWithAudioMuted=false&config.prejoinPageEnabled=false`;

const buildDoctorImageUrl = (appointment = {}) => {
  const providedImage = appointment?.doctorImageUrl || appointment?.imageUrl || appointment?.doctorProfileImage;
  if (providedImage) return providedImage;

  const seed = encodeURIComponent(
    `${appointment?.doctorFirstName || 'doctor'}-${appointment?.doctorLastName || 'profile'}-${appointment?.doctorId || appointment?.doctorUserId || '0'}`
  );

  return `https://i.pravatar.cc/160?u=${seed}`;
};

const getMediaPermissionError = (error) => {
  if (error?.name === 'NotAllowedError') return 'Camera/Microphone permission denied.';
  if (error?.name === 'NotFoundError') return 'No camera device found.';
  return 'Unable to access camera/microphone on this browser.';
};

const formatDate = (value, options = {}) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString(undefined, options);
};

const formatTime = (value, options = {}) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleTimeString([], options);
};

const readResponseMessage = async (response, fallbackMessage) => {
  try {
    const data = await response.json();
    if (typeof data?.message === 'string' && data.message.trim()) {
      return data.message;
    }
  } catch {
    try {
      const text = await response.text();
      if (text?.trim()) return text.trim();
    } catch {
      return fallbackMessage;
    }
  }

  return fallbackMessage;
};

const coalesce = (...values) => values.find((value) => value !== undefined && value !== null && value !== '');

const toEditableString = (value) => (value === undefined || value === null ? '' : String(value));

const normalizeUserDetails = (rawUser = {}, fallbackUser = {}) => {
  const firstName = toEditableString(coalesce(rawUser.firstName, fallbackUser.firstName));
  const lastName = toEditableString(coalesce(rawUser.lastName, fallbackUser.lastName));
  const fallbackName = toEditableString(coalesce(rawUser.name, fallbackUser.name)).trim();
  const nameParts = fallbackName ? fallbackName.split(/\s+/) : [];

  return {
    ...fallbackUser,
    ...rawUser,
    firstName: firstName || nameParts[0] || '',
    lastName: lastName || nameParts.slice(1).join(' '),
    email: toEditableString(coalesce(rawUser.email, fallbackUser.email)),
    phoneNumber: toEditableString(coalesce(rawUser.phoneNumber, fallbackUser.phoneNumber, rawUser.phone, fallbackUser.phone)),
    age: toEditableString(coalesce(rawUser.age, fallbackUser.age)),
    gender: toEditableString(coalesce(rawUser.gender, fallbackUser.gender)),
  };
};

const buildEditForm = (details = {}, fallbackUser = {}) => {
  const normalized = normalizeUserDetails(details, fallbackUser);
  return {
    firstName: normalized.firstName,
    lastName: normalized.lastName,
    phoneNumber: normalized.phoneNumber,
    age: normalized.age,
    gender: normalized.gender,
  };
};

const revokeBlobUrl = (url) => {
  if (typeof url === 'string' && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

const NOTICE_STYLES = {
  success: {
    shell: 'border-emerald-200/70 bg-gradient-to-r from-emerald-50 via-white to-teal-50 text-emerald-900',
    glow: 'from-emerald-500 to-teal-500',
    iconWrap: 'bg-emerald-100 text-emerald-700',
    badge: 'bg-emerald-600 text-white',
    action: 'text-emerald-700 hover:bg-emerald-100/80',
    label: 'Success',
    icon: 'check',
  },
  error: {
    shell: 'border-rose-200/70 bg-gradient-to-r from-rose-50 via-white to-orange-50 text-rose-900',
    glow: 'from-rose-500 to-orange-500',
    iconWrap: 'bg-rose-100 text-rose-700',
    badge: 'bg-rose-600 text-white',
    action: 'text-rose-700 hover:bg-rose-100/80',
    label: 'Action Needed',
    icon: 'alert',
  },
  info: {
    shell: 'border-sky-200/70 bg-gradient-to-r from-sky-50 via-white to-cyan-50 text-sky-900',
    glow: 'from-sky-500 to-cyan-500',
    iconWrap: 'bg-sky-100 text-sky-700',
    badge: 'bg-sky-600 text-white',
    action: 'text-sky-700 hover:bg-sky-100/80',
    label: 'Heads Up',
    icon: 'info',
  },
};

const Icon = ({ name, className = 'h-5 w-5' }) => {
  const commonProps = {
    className,
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24',
    'aria-hidden': 'true',
  };

  if (name === 'mail') {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 6h16v12H4z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="m4 8 8 6 8-6" />
      </svg>
    );
  }

  if (name === 'phone') {
    return (
      <svg {...commonProps}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          d="M6.6 3.8h2.8l1.4 3.5-1.8 1.8a16.2 16.2 0 0 0 6 6l1.8-1.8 3.5 1.4v2.8a1.6 1.6 0 0 1-1.6 1.6A15.7 15.7 0 0 1 4.9 5.4 1.6 1.6 0 0 1 6.6 3.8Z"
        />
      </svg>
    );
  }

  if (name === 'user') {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 20a8 8 0 0 1 16 0" />
      </svg>
    );
  }

  if (name === 'edit') {
    return (
      <svg {...commonProps}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          d="m16.5 3.5 4 4L8 20H4v-4L16.5 3.5Z"
        />
      </svg>
    );
  }

  if (name === 'doctor') {
    return (
      <svg {...commonProps}>
        <circle cx="12" cy="7.5" r="3.2" strokeWidth="1.7" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M6.7 18.8a5.3 5.3 0 0 1 10.6 0" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M16.9 5.1h3.6" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M18.7 3.3v3.6" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M9.3 12.3v2.1" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M14.7 12.3v2.1" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M9.3 13.4h5.4" />
      </svg>
    );
  }

  if (name === 'calendar') {
    return (
      <svg {...commonProps}>
        <rect x="4" y="5" width="16" height="15" rx="2" strokeWidth="1.8" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 3v4m8-4v4M4 10h16" />
      </svg>
    );
  }

  if (name === 'check') {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m5 12 4 4L19 6" />
      </svg>
    );
  }

  if (name === 'alert') {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" d="M12 8v5" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" d="M12 16h.01" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.9"
          d="M10.3 3.8 2.9 17a2 2 0 0 0 1.75 3h14.7a2 2 0 0 0 1.75-3L13.7 3.8a2 2 0 0 0-3.4 0Z"
        />
      </svg>
    );
  }

  if (name === 'info') {
    return (
      <svg {...commonProps}>
        <circle cx="12" cy="12" r="8.5" strokeWidth="1.9" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" d="M12 10.5V16" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" d="M12 8h.01" />
      </svg>
    );
  }

  if (name === 'pill') {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="m9 9 6 6" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          d="M8.5 19.5a4.6 4.6 0 0 1-6.5-6.5l4.5-4.5a4.6 4.6 0 0 1 6.5 6.5ZM15.5 12.5a4.6 4.6 0 0 1 6.5-6.5"
        />
      </svg>
    );
  }

  if (name === 'video') {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 7h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="m17 10 3-2v8l-3-2" />
      </svg>
    );
  }

  return null;
};

const InputField = ({ label, type = 'text', value, onChange }) => (
  <div className="space-y-2">
    <label className="pl-2 text-xs font-black uppercase tracking-widest text-slate-400">{label}</label>
    <input
      type={type}
      className="w-full rounded-2xl bg-slate-50 p-4 font-bold text-slate-800 outline-none transition-all placeholder:text-slate-300 focus:ring-4 ring-teal-500/20"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={`Enter ${label.toLowerCase()}`}
    />
  </div>
);

const ProfilePage = ({ navigate, currentUser }) => {
  const [userDetails, setUserDetails] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);
  const [avatarNotice, setAvatarNotice] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [mediaStatus, setMediaStatus] = useState('');
  const [profilePicUrl, setProfilePicUrl] = useState('');
  const [activeTab, setActiveTab] = useState('appointments');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    age: '',
    gender: '',
  });

  const avatarUploadRef = useRef(null);

  const getAccessToken = () => {
    const candidate = currentUser?.accessToken || currentUser?.token || localStorage.getItem('healthcare_auth_token') || '';
    return typeof candidate === 'string' ? candidate.replace(/^["']|["']$/g, '') : '';
  };

  const getCurrentUserId = () => currentUser?.userId ?? currentUser?.id ?? userDetails?.userId ?? userDetails?.id ?? null;

  const getAppointmentId = (appointment) => appointment?.appointmentId ?? appointment?.id;
  const canJoinTelemedicine = (appointment) => String(appointment?.status || '').toUpperCase() === 'CONFIRMED';
  const showNotice = (type, message) => {
    setNotice({ type, message, id: Date.now() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateProfilePicUrl = (nextUrl) => {
    setProfilePicUrl((previousUrl) => {
      revokeBlobUrl(previousUrl);
      return nextUrl;
    });
  };

  useEffect(() => {
    if (!notice) return undefined;

    const timer = window.setTimeout(() => {
      setNotice(null);
    }, 6000);

    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!avatarNotice) return undefined;

    const timer = window.setTimeout(() => {
      setAvatarNotice(null);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [avatarNotice]);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const token = getAccessToken();
        const actualUserId = getCurrentUserId();

        try {
          const picRes = await fetch(`http://localhost:8083/api/patients/profile/${actualUserId}/picture`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
          });

          if (picRes.ok) {
            const blob = await picRes.blob();
            if (blob.size > 0) {
              updateProfilePicUrl(URL.createObjectURL(blob));
            }
          }
        } catch {
          console.warn('Could not fetch profile picture.');
        }

        try {
          const userData = await fetchUserById(token, actualUserId);
          setUserDetails(normalizeUserDetails(userData?.data || userData, currentUser));
        } catch {
          console.warn('Auth Service offline.');
          setUserDetails(normalizeUserDetails({}, currentUser));
          showNotice('info', 'Profile details could not be fully loaded, so fallback account data is being shown.');
        }

        try {
          const apptRes = await fetch(`http://localhost:8085/api/appointments?patientId=${actualUserId}`);
          if (apptRes.ok) {
            const apptsData = await apptRes.json();
            setAppointments(Array.isArray(apptsData) ? apptsData : apptsData.data || []);
          }
        } catch {
          console.warn('Appointment Service offline.');
        }

        try {
          const allPrescriptions = JSON.parse(localStorage.getItem(STORAGE_KEY_PRESCRIPTIONS) || '[]');
          const mine = Array.isArray(allPrescriptions)
            ? allPrescriptions.filter((item) => Number(item?.patientId) === Number(actualUserId))
            : [];
          setPrescriptions(mine);
        } catch {
          setPrescriptions([]);
        }
      } catch {
        setError('Some data could not be loaded.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, navigate]);

  useEffect(() => {
    if (!userDetails) return;

    setEditForm(buildEditForm(userDetails, currentUser));
  }, [currentUser, userDetails]);

  useEffect(() => () => revokeBlobUrl(profilePicUrl), [profilePicUrl]);

  const handleAvatarClick = () => {
    if (avatarUploadRef.current) avatarUploadRef.current.click();
  };

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    updateProfilePicUrl(URL.createObjectURL(file));
    setAvatarNotice({ type: 'info', message: 'Uploading your new profile picture...' });

    const token = getAccessToken();
    const actualUserId = getCurrentUserId();
    const formData = new FormData();
    formData.append('file', file);

    if (!token || !actualUserId) {
      showNotice('error', 'Your session is missing. Please log in again.');
      setAvatarNotice({ type: 'error', message: 'Upload failed. Please log in again.' });
      return;
    }

    try {
      const res = await fetch(`http://localhost:8083/api/patients/profile/${actualUserId}/picture`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        showNotice('success', 'Profile picture updated!');
        setAvatarNotice({ type: 'success', message: 'Profile picture updated successfully.' });
      } else {
        const message = await readResponseMessage(res, 'Failed to save profile picture.');
        showNotice('error', message);
        setAvatarNotice({ type: 'error', message });
      }
    } catch {
      showNotice('error', 'Network error.');
      setAvatarNotice({ type: 'error', message: 'Network error while uploading picture.' });
    } finally {
      e.target.value = '';
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    const token = getAccessToken();
    const actualUserId = getCurrentUserId();
    const trimmedPayload = {
      firstName: editForm.firstName.trim(),
      lastName: editForm.lastName.trim(),
      phoneNumber: editForm.phoneNumber.trim(),
      gender: editForm.gender.trim(),
    };
    const cleanPayload = {
      ...trimmedPayload,
      age: editForm.age === '' || editForm.age === null ? null : Number.parseInt(editForm.age, 10),
    };

    if (!cleanPayload.firstName || !cleanPayload.lastName) {
      showNotice('error', 'First name and last name are required.');
      return;
    }

    if (!token || !actualUserId) {
      showNotice('error', 'Your session is missing. Please log in again.');
      return;
    }

    if (cleanPayload.age !== null && Number.isNaN(cleanPayload.age)) {
      showNotice('error', 'Please enter a valid age.');
      return;
    }

    try {
      const updatedResponse = await updateUser(token, actualUserId, cleanPayload);
      const mergedUserDetails = normalizeUserDetails(updatedResponse?.data || cleanPayload, {
        ...currentUser,
        ...userDetails,
        ...cleanPayload,
        name: `${cleanPayload.firstName} ${cleanPayload.lastName}`.trim(),
      });

      setUserDetails(mergedUserDetails);
      setEditForm(buildEditForm(mergedUserDetails, mergedUserDetails));
      storeUser({
        ...(getStoredUser() || {}),
        ...currentUser,
        ...mergedUserDetails,
        accessToken: currentUser?.accessToken || currentUser?.token || token,
        userId: actualUserId,
        name: `${mergedUserDetails.firstName} ${mergedUserDetails.lastName}`.trim(),
      });
      showNotice('success', 'Profile updated!');
      setIsEditing(false);
    } catch (updateError) {
      showNotice('error', updateError.message || 'Failed to update profile.');
    }
  };

  const checkMediaPermissions = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMediaStatus('Camera unavailable');
      showNotice('error', 'Browser does not support camera API.');
      return false;
    }

    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
      cameraStream.getTracks().forEach((track) => track.stop());
      setMediaStatus('Camera ready');
      return true;
    } catch (err) {
      const message = getMediaPermissionError(err);
      setMediaStatus(message);
      showNotice('error', message);
      return false;
    }
  };

  const startTelemedicineCall = async (appointment) => {
    const appointmentId = getAppointmentId(appointment);
    if (!appointmentId) {
      showNotice('error', 'Appointment ID missing.');
      return;
    }

    const allowed = await checkMediaPermissions();
    if (!allowed) return;

    setActiveCall({ appointment, roomName: `healthcare-appt-${appointmentId}` });
  };

  const generateActivityHistory = () => {
    const history = [];

    if (userDetails?.createdAt) {
      history.push({
        id: 'acc-create',
        title: 'Joined HealthCare+',
        date: new Date(userDetails.createdAt),
        icon: 'check',
        color: 'bg-blue-100 text-blue-600',
      });
    } else {
      history.push({
        id: 'acc-create',
        title: 'Account Activated',
        date: new Date(Date.now() - 864000000),
        icon: 'check',
        color: 'bg-blue-100 text-blue-600',
      });
    }

    appointments.forEach((appt) => {
      history.push({
        id: `appt-${getAppointmentId(appt) || appt.doctorLastName || 'unknown'}`,
        title: `Consultation with Dr. ${appt.doctorLastName || 'Doctor'}`,
        date: new Date(appt.appointmentDate),
        icon: 'calendar',
        color: 'bg-teal-100 text-teal-600',
      });
    });

    prescriptions.forEach((rx) => {
      history.push({
        id: `rx-${rx.id || rx.issuedAt || 'unknown'}`,
        title: `Received Prescription for ${rx.diagnosis || 'Treatment'}`,
        date: new Date(rx.issuedAt),
        icon: 'pill',
        color: 'bg-purple-100 text-purple-600',
      });
    });

    return history
      .filter((item) => !Number.isNaN(item.date.getTime()))
      .sort((a, b) => b.date - a.date);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Navbar navigate={navigate} currentUser={currentUser} />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      <Navbar navigate={navigate} currentUser={currentUser} />

      <div className="absolute left-0 top-0 z-0 h-64 w-full bg-gradient-to-r from-teal-600 to-cyan-600" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-28 sm:px-6 lg:px-8">
        {notice ? (
          <div className="mb-6">
            {(() => {
              const style = NOTICE_STYLES[notice.type] || NOTICE_STYLES.info;
              return (
                <div className={`relative overflow-hidden rounded-3xl border shadow-[0_18px_50px_-28px_rgba(15,23,42,0.35)] ${style.shell}`}>
                  <div className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${style.glow}`} />
                  <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/40 blur-2xl" />
                  <div className="relative flex items-start gap-4 px-5 py-4 sm:px-6">
                    <div className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm ${style.iconWrap}`}>
                      <Icon name={style.icon} className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${style.badge}`}>
                          {style.label}
                        </span>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Profile Center
                        </span>
                      </div>
                      <p className="text-sm font-semibold leading-6 text-slate-800 sm:text-[15px]">
                        {notice.message}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setNotice(null)}
                      className={`shrink-0 rounded-xl px-3 py-2 text-xs font-black uppercase tracking-[0.16em] transition ${style.action}`}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-xl">
              <div className="relative mb-6 inline-block">
                <div className="mx-auto h-40 w-40 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-xl">
                  <img
                    src={profilePicUrl || `https://ui-avatars.com/api/?name=${userDetails?.firstName || 'User'}&background=14b8a6&color=fff&size=200`}
                    className="h-full w-full object-cover"
                    alt="Profile"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  className="absolute bottom-1 right-1 z-50 flex h-11 w-11 items-center justify-center rounded-full border-4 border-white bg-teal-500 text-white shadow-lg transition-transform hover:scale-110 hover:bg-teal-600"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </button>
              </div>

              <input
                type="file"
                accept="image/*"
                ref={avatarUploadRef}
                onChange={handleProfilePicUpload}
                className="hidden"
              />

              {avatarNotice ? (
                <div
                  className={`mb-4 rounded-2xl border px-4 py-3 text-sm font-semibold ${
                    (NOTICE_STYLES[avatarNotice.type] || NOTICE_STYLES.info).shell
                  }`}
                >
                  {avatarNotice.message}
                </div>
              ) : null}

              <h1 className="text-2xl font-black tracking-tight text-slate-800">
                {userDetails?.firstName || currentUser?.name || 'Patient'} {userDetails?.lastName || ''}
              </h1>
              <span className="mt-2 mb-4 inline-block rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">
                ID: #{currentUser?.userId}
              </span>

              <div className="my-6 h-px w-full bg-slate-100" />

              <div className="space-y-4 text-left">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                    <Icon name="mail" className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address</p>
                    <p className="break-all text-sm font-bold text-slate-800">{userDetails?.email || currentUser?.email || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-500">
                    <Icon name="phone" className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mobile Phone</p>
                    <p className="text-sm font-bold text-slate-800">{userDetails?.phoneNumber || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-500">
                    <Icon name="user" className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Demographics</p>
                    <p className="text-sm font-bold text-slate-800">
                      {userDetails?.age ? `${userDetails.age} yrs` : 'Age N/A'} | {userDetails?.gender || 'Gender N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditing((previous) => !previous)}
                className={`mt-8 w-full rounded-xl py-3 font-bold transition-all ${
                  isEditing
                    ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    : 'bg-slate-900 text-white shadow-lg hover:bg-slate-800'
                }`}
              >
                {isEditing ? 'Cancel Editing' : 'Edit Profile Details'}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-8">
            {isEditing ? (
              <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
                  <h2 className="mb-6 flex items-center gap-3 text-2xl font-black text-slate-800">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                      <Icon name="edit" className="h-5 w-5" />
                    </span>
                    Update Personal Details
                  </h2>

                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <InputField
                        label="First Name"
                        value={editForm.firstName}
                        onChange={(value) => setEditForm((previous) => ({ ...previous, firstName: value }))}
                      />
                      <InputField
                        label="Last Name"
                        value={editForm.lastName}
                        onChange={(value) => setEditForm((previous) => ({ ...previous, lastName: value }))}
                      />
                      <InputField
                        label="Phone Number"
                        value={editForm.phoneNumber}
                        onChange={(value) => setEditForm((previous) => ({ ...previous, phoneNumber: value }))}
                      />
                      <InputField
                        label="Age"
                        type="number"
                        value={editForm.age}
                        onChange={(value) => setEditForm((previous) => ({ ...previous, age: value }))}
                      />

                      <div className="space-y-2 md:col-span-2">
                        <label className="pl-2 text-xs font-black uppercase tracking-widest text-slate-400">Gender</label>
                        <select
                          className="w-full cursor-pointer appearance-none rounded-2xl bg-slate-50 p-4 font-bold text-slate-800 outline-none transition-all focus:ring-4 ring-teal-500/20"
                          value={editForm.gender || ''}
                          onChange={(e) => setEditForm((previous) => ({ ...previous, gender: e.target.value }))}
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end border-t border-slate-100 pt-6">
                      <button
                        type="submit"
                        className="rounded-xl bg-teal-600 px-10 py-4 font-black text-white shadow-lg transition-colors hover:bg-teal-700"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
              </div>
            ) : (
              <div>
                  {error ? (
                    <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                      {error}
                    </div>
                  ) : null}

                  <div className="mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-slate-100 bg-white p-2 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setActiveTab('appointments')}
                      className={`flex-1 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                        activeTab === 'appointments' ? 'bg-teal-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      Appointments
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('prescriptions')}
                      className={`flex-1 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                        activeTab === 'prescriptions' ? 'bg-teal-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      Prescriptions
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('history')}
                      className={`flex-1 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                        activeTab === 'history' ? 'bg-teal-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      Activity History
                    </button>
                  </div>

                  {activeTab === 'appointments' ? (
                    <div className="space-y-6">
                      {activeCall ? (
                        <div className="rounded-3xl border-4 border-slate-800 bg-slate-900 p-4 shadow-2xl">
                          <div className="mb-4 flex items-center justify-between px-2">
                            <div className="text-white">
                              <h3 className="flex items-center gap-2 text-lg font-bold">
                                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                Live Consultation
                              </h3>
                              <p className="text-xs text-slate-400">
                                Dr. {activeCall.appointment?.doctorFirstName || ''} {activeCall.appointment?.doctorLastName || ''}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setActiveCall(null)}
                              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-600"
                            >
                              End Session
                            </button>
                          </div>

                          <div className="h-[500px] w-full overflow-hidden rounded-2xl bg-black">
                            <iframe
                              src={buildJitsiCallUrl(activeCall.roomName, userDetails?.firstName || currentUser?.name || 'Patient')}
                              allow="camera *; microphone *; fullscreen *; display-capture *; autoplay *"
                              className="h-full w-full border-0"
                              title="Telemedicine"
                            />
                          </div>
                        </div>
                      ) : null}

                      {appointments.length === 0 ? (
                        <div className="rounded-3xl border border-slate-100 bg-white p-12 text-center shadow-sm">
                          <span className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-teal-600">
                            <Icon name="calendar" className="h-8 w-8" />
                          </span>
                          <h3 className="mb-2 text-xl font-bold text-slate-800">No Appointments Yet</h3>
                          <p className="mb-6 text-slate-500">You haven&apos;t booked any medical consultations.</p>
                          <button
                            type="button"
                            onClick={() => navigate('/appointment')}
                            className="rounded-xl bg-teal-600 px-8 py-3 font-bold text-white transition-colors hover:bg-teal-700"
                          >
                            Book Now
                          </button>
                        </div>
                      ) : (
                        appointments.map((appt, index) => (
                          <div
                            key={getAppointmentId(appt) || `appt-${index}`}
                            className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                          >
                            <div className="mb-4 flex flex-col items-start justify-between gap-4 border-b border-slate-50 pb-4 md:flex-row md:items-center">
                              <div className="flex items-center gap-4">
                                <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-teal-100 bg-gradient-to-br from-cyan-50 via-white to-teal-100 shadow-sm">
                                  <img
                                    src={buildDoctorImageUrl(appt)}
                                    alt={`Dr. ${appt.doctorFirstName || ''} ${appt.doctorLastName || ''}`}
                                    className="h-full w-full object-cover"
                                    onError={(event) => {
                                      event.currentTarget.style.display = 'none';
                                      const fallback = event.currentTarget.nextElementSibling;
                                      if (fallback) fallback.classList.remove('hidden');
                                    }}
                                  />
                                  <div className="hidden absolute inset-0 items-center justify-center text-teal-700">
                                    <Icon name="doctor" className="h-8 w-8" />
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-lg font-black text-slate-800">
                                    Dr. {appt.doctorFirstName || ''} {appt.doctorLastName || ''}
                                  </h4>
                                  <p className="text-sm font-bold text-teal-600">
                                    {formatDate(appt.appointmentDate)} at {appt.appointmentTime || 'Time N/A'}
                                  </p>
                                </div>
                              </div>

                              <span
                                className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-widest ${
                                  String(appt.status || '').toUpperCase() === 'CONFIRMED'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}
                              >
                                {appt.status || 'PENDING'}
                              </span>
                            </div>

                            <div className="mb-6">
                              <p className="mb-1 text-xs font-black uppercase tracking-widest text-slate-400">Reason for Visit</p>
                              <p className="text-sm text-slate-700">{appt.reason || 'Not specified'}</p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                              <button
                                type="button"
                                onClick={() => startTelemedicineCall(appt)}
                                disabled={!canJoinTelemedicine(appt)}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 md:flex-none"
                              >
                                <Icon name="video" className="h-4 w-4" />
                                Join Video Call
                              </button>
                              {mediaStatus ? <span className="self-center text-xs font-semibold text-slate-500">{mediaStatus}</span> : null}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : null}

                  {activeTab === 'prescriptions' ? (
                    <div className="space-y-6">
                      {prescriptions.length === 0 ? (
                        <div className="rounded-3xl border border-slate-100 bg-white p-12 text-center shadow-sm">
                          <span className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                            <Icon name="pill" className="h-8 w-8" />
                          </span>
                          <h3 className="mb-2 text-xl font-bold text-slate-800">No Prescriptions</h3>
                          <p className="text-slate-500">Your doctors haven&apos;t uploaded any prescriptions yet.</p>
                        </div>
                      ) : (
                        prescriptions.map((rx, index) => (
                          <div key={rx?.id || `rx-${index}`} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                            <div className="mb-4 flex items-center justify-between">
                              <h4 className="font-black text-slate-800">Prescription #{rx.id}</h4>
                              <span className="text-xs font-bold text-slate-400">{formatDate(rx.issuedAt)}</span>
                            </div>

                            <div className="mb-4 rounded-2xl bg-slate-50 p-4">
                              <p className="text-sm text-slate-700">
                                <span className="font-bold">Diagnosis:</span> {rx.diagnosis || 'N/A'}
                              </p>
                              <p className="mt-1 text-sm text-slate-700">
                                <span className="font-bold">Doctor:</span> Dr. {rx.doctorName || 'N/A'}
                              </p>
                            </div>

                            <h5 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Medications</h5>
                            <ul className="space-y-2">
                              {(Array.isArray(rx.medications) ? rx.medications : []).map((medication, medIndex) => (
                                <li key={`med-${medIndex}`} className="flex items-center gap-3 text-sm text-slate-700">
                                  <span className="h-2 w-2 rounded-full bg-teal-500" />
                                  <span className="font-bold">{medication?.name}</span> - {medication?.dosage}, {medication?.frequency} ({medication?.duration})
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))
                      )}
                    </div>
                  ) : null}

                  {activeTab === 'history' ? (
                    <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
                      <h3 className="mb-8 text-xl font-black text-slate-800">Recent Activity</h3>
                      <div className="relative ml-4 space-y-8 border-l-2 border-slate-100">
                        {generateActivityHistory().map((activity) => (
                          <div key={activity.id} className="relative pl-8">
                            <div
                              className={`absolute -left-5 top-0 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white ${activity.color}`}
                            >
                              <Icon name={activity.icon} className="h-4 w-4" />
                            </div>
                            <div className="rounded-2xl bg-slate-50 p-4">
                              <p className="mb-1 text-xs font-black text-slate-400">
                                {formatDate(activity.date)} at {formatTime(activity.date, { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              <h4 className="text-sm font-bold text-slate-800">{activity.title}</h4>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
