import { useCallback, useEffect, useRef, useState } from 'react';
import Navbar from '../components/navbar';
import { apiRequest } from '../lib/auth';

// ─── Constants ──────────────────────────────────────────────────────────────
const APPOINTMENT_API = 'http://localhost:8085';
const DOCTOR_API = 'http://localhost:8082';

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = Array.from({ length: 16 }, (_, i) => {
  const h = Math.floor(i / 2) + 9;
  const m = i % 2 === 0 ? '00' : '30';
  return `${String(h).padStart(2, '0')}:${m}`;
});

const MENU = [
  ['overview', 'fas fa-chart-line', 'Overview'],
  ['appointments', 'fas fa-calendar-check', 'Appointments'],
  ['profile', 'fas fa-user-md', 'My Profile'],
  ['availability', 'fas fa-clock', 'Availability'],
  ['telemedicine', 'fas fa-video', 'Telemedicine'],
  ['prescriptions', 'fas fa-prescription-bottle-alt', 'Prescriptions'],
  ['reports', 'fas fa-file-medical', 'Patient Reports'],
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatDate = (v) =>
  v ? new Intl.DateTimeFormat('en-LK', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(v)) : 'N/A';

const formatDateTime = (v) =>
  v ? new Intl.DateTimeFormat('en-LK', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(v)) : 'N/A';

const statusColor = (s) => {
  if (s === 'CONFIRMED') return 'bg-green-100 text-green-700';
  if (s === 'CANCELLED') return 'bg-red-100 text-red-700';
  if (s === 'COMPLETED') return 'bg-blue-100 text-blue-700';
  if (s === 'RESCHEDULED') return 'bg-purple-100 text-purple-700';
  return 'bg-yellow-100 text-yellow-700';
};

const STORAGE_KEY_AVAILABILITY = 'doctor_availability';
const STORAGE_KEY_PRESCRIPTIONS = 'doctor_prescriptions';
const STORAGE_KEY_REPORTS = 'doctor_patient_reports';

const loadStorage = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};

const saveStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read selected file.'));
    reader.readAsDataURL(file);
  });

const dataUrlToBlobUrl = (dataUrl) => {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
    return null;
  }

  const [meta, content] = dataUrl.split(',');
  if (!meta || !content) return null;

  const mimeMatch = meta.match(/data:(.*?);base64/);
  const mimeType = mimeMatch?.[1] || 'application/octet-stream';
  const binary = window.atob(content);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  const blob = new Blob([bytes], { type: mimeType });
  return URL.createObjectURL(blob);
};

const emptyAvailability = () =>
  WEEK_DAYS.reduce((acc, day) => {
    acc[day] = { enabled: false, slots: [] };
    return acc;
  }, {});

const emptyPrescriptionForm = () => ({
  patientName: '',
  patientId: '',
  appointmentId: '',
  diagnosis: '',
  medications: [{ name: '', dosage: '', frequency: '', duration: '' }],
  notes: '',
  date: new Date().toISOString().slice(0, 10),
});

const buildJitsiCallUrl = (roomName, displayName) =>
  `https://meet.jit.si/${encodeURIComponent(roomName)}#userInfo.displayName=${encodeURIComponent(displayName)}&config.startWithVideoMuted=false&config.startWithAudioMuted=false&config.prejoinPageEnabled=false`;

const getMediaPermissionError = (error) => {
  if (error?.name === 'NotAllowedError') {
    return 'Camera/Microphone permission denied. Click the lock icon near URL and allow camera + microphone.';
  }
  if (error?.name === 'NotFoundError') {
    return 'No camera device found on this computer (or camera is blocked).';
  }
  if (error?.name === 'NotReadableError') {
    return 'Camera is busy in another app (Teams/Zoom/Camera). Close other apps and try again.';
  }
  return 'Unable to access camera/microphone on this browser.';
};

const splitName = (nameValue) => {
  const full = String(nameValue || '').trim();
  if (!full) return { firstName: '', lastName: '' };
  const parts = full.split(/\s+/);
  const firstName = parts.shift() || '';
  const lastName = parts.join(' ');
  return { firstName, lastName };
};

const asNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

// ─── Sub-components ──────────────────────────────────────────────────────────
const StatCard = ({ title, value, icon, color, note }) => (
  <div className="rounded-2xl bg-white p-6 shadow-lg">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="mt-2 text-3xl font-bold text-gray-800">{value}</p>
        {note && <p className="mt-2 text-xs text-gray-500">{note}</p>}
      </div>
      <div className={`flex h-12 w-12 items-center justify-center rounded-full ${color}`}>
        <i className={`${icon} text-xl text-white`} />
      </div>
    </div>
  </div>
);

const Modal = ({ title, onClose, children }) => {
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const DoctorDashboard = ({ navigate, currentUser, refreshUser }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [appointments, setAppointments] = useState([]);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [loadingAppts, setLoadingAppts] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [apptFilter, setApptFilter] = useState('ALL');
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedAppt, setSelectedAppt] = useState(null);

  // Profile edit
  const [profileForm, setProfileForm] = useState({});
  const [profileSaving, setProfileSaving] = useState(false);

  // Availability
  const [availability, setAvailability] = useState(() =>
    loadStorage(STORAGE_KEY_AVAILABILITY, emptyAvailability())
  );

  // Telemedicine
  const [activeRoom, setActiveRoom] = useState(null);
  const jitsiRef = useRef(null);

  // Prescriptions
  const [prescriptions, setPrescriptions] = useState(() =>
    loadStorage(STORAGE_KEY_PRESCRIPTIONS, [])
  );
  const [prescForm, setPrescForm] = useState(emptyPrescriptionForm());
  const [showPrescModal, setShowPrescModal] = useState(false);
  const [viewPresc, setViewPresc] = useState(null);

  // Patient Reports
  const [patientReports, setPatientReports] = useState(() =>
    loadStorage(STORAGE_KEY_REPORTS, [])
  );

  // Logout confirmation
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [mediaReady, setMediaReady] = useState(false);

  const doctorUserId = Number(currentUser?.userId ?? currentUser?.id ?? 0);
  const nameFromPayload = splitName(currentUser?.name);
  const doctorFirstName = currentUser?.firstName ?? nameFromPayload.firstName;
  const doctorLastName = currentUser?.lastName ?? nameFromPayload.lastName;
  const doctorName = `${doctorFirstName ?? ''} ${doctorLastName ?? ''}`.trim() || 'Doctor';
  const visiblePatientReports = patientReports.filter(
    (report) => !report?.doctorId || Number(report.doctorId) === Number(doctorUserId)
  );
  const selectedApptReports = selectedAppt
    ? visiblePatientReports.filter((report) => {
        if (report?.appointmentId) {
          return Number(report.appointmentId) === Number(selectedAppt.appointmentId);
        }
        return Number(report?.patientId) === Number(selectedAppt.patientId);
      })
    : [];

  // ── Redirect if not doctor ──────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (currentUser.role !== 'DOCTOR') {
      navigate('/');
    }
  }, [currentUser, navigate]);

  // ── Fetch appointments ──────────────────────────────────────────────────
  const fetchAppointments = useCallback(async () => {
    if (!doctorUserId) return;
    setLoadingAppts(true);
    try {
      const response = await fetch(`${APPOINTMENT_API}/api/appointments?doctorId=${doctorUserId}`);
      const data = await response.json();
      const list = Array.isArray(data) ? data : data?.data || [];

      // Guardrail: only keep appointments that belong to the logged-in doctor.
      const myAppointments = list.filter((item) => Number(item?.doctorId) === Number(doctorUserId));
      setAppointments(myAppointments);
    } catch {
      setAppointments([]);
    } finally {
      setLoadingAppts(false);
    }
  }, [doctorUserId]);

  // ── Fetch doctor profile ────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    if (!doctorUserId) return;
    setLoadingProfile(true);
    try {
      const res = await fetch(`${DOCTOR_API}/api/doctors/${doctorUserId}`);
      if (res.ok) {
        const data = await res.json();
        setDoctorProfile(data);
        setProfileForm({
          firstName: data.firstName ?? '',
          lastName: data.lastName ?? '',
          specialty: data.specialty ?? '',
          specialization: data.specialization ?? data.specialty ?? '',
          hospital: data.hospital ?? '',
          email: data.email ?? currentUser?.email ?? '',
          phoneNumber: data.phoneNumber ?? currentUser?.phoneNumber ?? '',
          experienceYears: data.experienceYears ?? 0,
        });
      } else {
        // Profile might not exist yet – seed from auth data
        setDoctorProfile(null);
        setProfileForm({
          firstName: doctorFirstName ?? '',
          lastName: doctorLastName ?? '',
          specialty: '',
          specialization: '',
          hospital: '',
          email: currentUser?.email ?? '',
          phoneNumber: currentUser?.phoneNumber ?? '',
          experienceYears: 0,
        });
      }
    } catch {
      setDoctorProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  }, [doctorUserId, currentUser, doctorFirstName, doctorLastName]);

  useEffect(() => {
    fetchAppointments();
    fetchProfile();
  }, [fetchAppointments, fetchProfile]);

  useEffect(() => {
    setPatientReports(loadStorage(STORAGE_KEY_REPORTS, []));
  }, [activeTab]);

  // ── Clear flash messages ────────────────────────────────────────────────
  useEffect(() => {
    if (!success && !error) return;
    const t = setTimeout(() => {
      setSuccess('');
      setError('');
    }, 4000);
    return () => clearTimeout(t);
  }, [success, error]);

  // ── Appointment status update ───────────────────────────────────────────
  const updateStatus = async (apptId, status) => {
    setBusyId(apptId);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${APPOINTMENT_API}/api/appointments/${apptId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      const updated = await res.json();
      setAppointments((prev) =>
        prev.map((a) => (a.appointmentId === apptId ? { ...a, status: updated.status } : a))
      );
      setSelectedAppt((prev) => (prev?.appointmentId === apptId ? { ...prev, status: updated.status } : prev));
      setSuccess(`Appointment ${status.toLowerCase()} successfully.`);
    } catch (e) {
      setError(e.message || 'Could not update appointment.');
    } finally {
      setBusyId(null);
    }
  };

  // ── Profile save ────────────────────────────────────────────────────────
  const saveProfile = async () => {
    setProfileSaving(true);
    setError('');
    setSuccess('');
    try {
      const method = doctorProfile ? 'PUT' : 'POST';
      const url = doctorProfile
        ? `${DOCTOR_API}/api/doctors/${doctorUserId}`
        : `${DOCTOR_API}/api/doctors`;
      const body = {
        ...profileForm,
        userId: doctorUserId,
        specialization: profileForm.specialization || profileForm.specialty || doctorProfile?.specialization || doctorProfile?.specialty || '',
        specialty: profileForm.specialty || profileForm.specialization || doctorProfile?.specialty || doctorProfile?.specialization || '',
        hospital: profileForm.hospital ?? doctorProfile?.hospital ?? '',
        email: profileForm.email ?? doctorProfile?.email ?? currentUser?.email ?? '',
        phoneNumber: profileForm.phoneNumber ?? doctorProfile?.phoneNumber ?? currentUser?.phoneNumber ?? '',
        availability: doctorProfile?.availability ?? 'Available Today',
        consultationFee: doctorProfile?.consultationFee ?? 0,
        imageUrl: doctorProfile?.imageUrl ?? '',
        rating: doctorProfile?.rating ?? 0,
        patientCount: doctorProfile?.patientCount ?? 0,
      };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to save profile');
      const saved = await res.json();
      setDoctorProfile(saved);
      setSuccess('Profile updated successfully.');
    } catch (e) {
      setError(e.message || 'Could not save profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  // ── Availability ────────────────────────────────────────────────────────
  const toggleDayEnabled = (day) => {
    setAvailability((prev) => {
      const updated = { ...prev, [day]: { ...prev[day], enabled: !prev[day].enabled } };
      saveStorage(STORAGE_KEY_AVAILABILITY, updated);
      return updated;
    });
  };

  const toggleSlot = (day, slot) => {
    setAvailability((prev) => {
      const dayData = prev[day];
      const slots = dayData.slots.includes(slot)
        ? dayData.slots.filter((s) => s !== slot)
        : [...dayData.slots, slot];
      const updated = { ...prev, [day]: { ...dayData, slots } };
      saveStorage(STORAGE_KEY_AVAILABILITY, updated);
      return updated;
    });
  };

  // ── Telemedicine ────────────────────────────────────────────────────────
  const checkMediaPermissions = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMediaReady(false);
      setError('Your browser does not support camera access APIs.');
      return false;
    }

    let cameraError = null;
    let micError = null;
    let cameraReady = false;
    let micReady = false;

    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
      cameraReady = cameraStream.getVideoTracks().length > 0;
      cameraStream.getTracks().forEach((track) => track.stop());
    } catch (error) {
      cameraError = error;
    }

    try {
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micReady = micStream.getAudioTracks().length > 0;
      micStream.getTracks().forEach((track) => track.stop());
    } catch (error) {
      micError = error;
    }

    if (cameraReady) {
      setMediaReady(true);
      setError('');
      if (!micReady) {
        setSuccess('Camera is ready. Microphone is unavailable/blocked. You can still join video and use chat.');
      }
      return true;
    }

    {
      setMediaReady(false);
      setError(getMediaPermissionError(cameraError || micError));
      return false;
    }
  }, []);

  const startVideoCall = async (appt) => {
    setError('');
    const allowed = await checkMediaPermissions();
    if (!allowed) return;

    const roomName = `healthcare-appt-${appt.appointmentId}`;
    setActiveRoom({ roomName, appt });
  };

  

  const endCall = () => setActiveRoom(null);

  const openCallInNewTab = (roomName) => {
    const url = buildJitsiCallUrl(roomName, `Dr. ${doctorName}`);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // ── Prescriptions ───────────────────────────────────────────────────────
  const addMedication = () =>
    setPrescForm((prev) => ({
      ...prev,
      medications: [...prev.medications, { name: '', dosage: '', frequency: '', duration: '' }],
    }));

  const removeMedication = (idx) =>
    setPrescForm((prev) => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== idx),
    }));

  const updateMedication = (idx, field, value) =>
    setPrescForm((prev) => ({
      ...prev,
      medications: prev.medications.map((m, i) => (i === idx ? { ...m, [field]: value } : m)),
    }));

  const issuePrescription = () => {
    if (!prescForm.appointmentId) {
      setError('Select an appointment to link this prescription to a unique patient.');
      return;
    }

    const apptId = asNumber(prescForm.appointmentId);
    const selectedAppointment = appointments.find((a) => Number(a.appointmentId) === apptId);
    if (!selectedAppointment) {
      setError('Selected appointment is not valid for this doctor.');
      return;
    }

    const linkedPatientId = asNumber(selectedAppointment.patientId);
    const enteredPatientId = asNumber(prescForm.patientId);
    if (!linkedPatientId) {
      setError('Selected appointment does not have a valid patient ID.');
      return;
    }

    if (enteredPatientId && enteredPatientId !== linkedPatientId) {
      setError('Patient ID must match the selected appointment patient.');
      return;
    }

    if (!prescForm.patientName || !prescForm.diagnosis) {
      setError('Patient name and diagnosis are required.');
      return;
    }

    const newPresc = {
      ...prescForm,
      id: `RX-${Date.now()}`,
      patientId: linkedPatientId,
      appointmentId: apptId,
      doctorName,
      doctorId: doctorUserId,
      specialty: doctorProfile?.specialty ?? '',
      issuedAt: new Date().toISOString(),
    };
    const updated = [newPresc, ...prescriptions];
    setPrescriptions(updated);
    saveStorage(STORAGE_KEY_PRESCRIPTIONS, updated);
    setPrescForm(emptyPrescriptionForm());
    setShowPrescModal(false);
    setSuccess(`Prescription ${newPresc.id} issued successfully.`);
  };

  // ── Patient Reports (simulated upload) ─────────────────────────────────
  const handleReportUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const fileUrl = await readFileAsDataUrl(file);
      const newReport = {
        id: Date.now(),
        fileName: file.name,
        type: file.type,
        size: (file.size / 1024).toFixed(1) + ' KB',
        uploadedAt: new Date().toISOString(),
        patientId: '',
        patientName: '',
        notes: '',
        doctorId: doctorUserId,
        doctorName: `Dr. ${doctorName}`,
        fileUrl,
      };
      const updated = [newReport, ...patientReports];
      setPatientReports(updated);
      saveStorage(STORAGE_KEY_REPORTS, updated);
    } catch (e) {
      setError(e.message || 'Could not prepare the selected report.');
    }

    e.target.value = '';
  };

  const deleteReport = (id) => {
    const updated = patientReports.filter((r) => r.id !== id);
    setPatientReports(updated);
    saveStorage(STORAGE_KEY_REPORTS, updated);
  };

  const openReport = (report) => {
    if (!report?.fileUrl) {
      setError('This report does not have a stored file to open. Please upload it again.');
      return;
    }

    const blobUrl = report.fileUrl.startsWith('data:')
      ? dataUrlToBlobUrl(report.fileUrl)
      : report.fileUrl;

    if (!blobUrl) {
      setError('This report format could not be opened. Please upload it again.');
      return;
    }

    const openedWindow = window.open(blobUrl, '_blank', 'noopener,noreferrer');
    if (!openedWindow) {
      setError('Popup was blocked by the browser. Allow popups and try again.');
      if (blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl);
      }
      return;
    }

    if (blobUrl.startsWith('blob:')) {
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    }
  };

  // ── Derived stats ───────────────────────────────────────────────────────
  const stats = {
    total: appointments.length,
    pending: appointments.filter((a) => a.status === 'PENDING').length,
    confirmed: appointments.filter((a) => a.status === 'CONFIRMED').length,
    completed: appointments.filter((a) => a.status === 'COMPLETED').length,
  };

  const filteredAppts =
    apptFilter === 'ALL' ? appointments : appointments.filter((a) => a.status === apptFilter);

  // ── Logout ──────────────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem('healthcare_auth_user');
    refreshUser();
    navigate('/login');
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    handleLogout();
  };

  // ════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar navigate={navigate} currentUser={currentUser} />

      <div className="flex">
        {/* ── Sidebar ──────────────────────────────────────────────────── */}
        <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 overflow-y-auto bg-linear-to-b from-teal-800 to-teal-900 text-white shadow-xl">
          <div className="border-b border-teal-700 px-6 py-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-600 text-2xl font-bold">
              {(currentUser?.firstName?.[0] ?? 'D').toUpperCase()}
            </div>
            <p className="mt-3 font-semibold">{doctorName}</p>
            <p className="text-xs text-teal-300">{doctorProfile?.specialty || 'Doctor'}</p>
          </div>

          <nav className="mt-4 space-y-1 px-3">
            {MENU.map(([key, icon, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                  activeTab === key
                    ? 'bg-teal-600 text-white shadow'
                    : 'text-teal-200 hover:bg-teal-700/50'
                }`}
              >
                <i className={`${icon} w-5`} />
                {label}
              </button>
            ))}
          </nav>

          <div className="mt-6 px-3">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-teal-200 hover:bg-red-500/20 hover:text-red-300 transition"
            >
              <i className="fas fa-sign-out-alt w-5" />
              Logout
            </button>
          </div>
        </aside>

        {/* ── Main Content ─────────────────────────────────────────────── */}
        <main className="ml-64 flex-1 p-8">
          {/* Flash messages */}
          {success && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-green-700">
              <i className="fas fa-check-circle" />
              {success}
            </div>
          )}
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-700">
              <i className="fas fa-exclamation-circle" />
              {error}
            </div>
          )}

          {/* ══ OVERVIEW ══════════════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <div>
              <h1 className="mb-6 text-2xl font-bold text-gray-800">
                Welcome back, Dr. {currentUser?.firstName ?? 'Doctor'}
              </h1>

              <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard title="Total Appointments" value={stats.total} icon="fas fa-calendar" color="bg-teal-500" />
                <StatCard title="Pending" value={stats.pending} icon="fas fa-hourglass-half" color="bg-yellow-500" note="Awaiting your response" />
                <StatCard title="Confirmed" value={stats.confirmed} icon="fas fa-check-circle" color="bg-green-500" />
                <StatCard title="Completed" value={stats.completed} icon="fas fa-flag-checkered" color="bg-blue-500" />
              </div>

              {/* Today's appointments */}
              <div className="rounded-2xl bg-white p-6 shadow-lg">
                <h2 className="mb-4 text-lg font-bold text-gray-800">Today's Appointments</h2>
                {loadingAppts ? (
                  <p className="text-sm text-gray-500">Loading…</p>
                ) : (() => {
                  const today = new Date().toISOString().slice(0, 10);
                  const todayAppts = appointments.filter(
                    (a) => a.appointmentDate === today || (a.appointmentDate && String(a.appointmentDate).startsWith(today))
                  );
                  return todayAppts.length === 0 ? (
                    <p className="text-sm text-gray-500">No appointments scheduled for today.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-gray-500">
                            <th className="pb-2 pr-4">Time</th>
                            <th className="pb-2 pr-4">Patient ID</th>
                            <th className="pb-2 pr-4">Reason</th>
                            <th className="pb-2 pr-4">Token</th>
                            <th className="pb-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {todayAppts.map((a) => (
                            <tr key={a.appointmentId} className="border-b last:border-0">
                              <td className="py-2 pr-4 font-medium">{a.appointmentTime ?? '—'}</td>
                              <td className="py-2 pr-4">#{a.patientId}</td>
                              <td className="py-2 pr-4">{a.reason || '—'}</td>
                              <td className="py-2 pr-4 font-mono text-xs">{a.token || '—'}</td>
                              <td className="py-2">
                                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusColor(a.status)}`}>
                                  {a.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>

              {/* Quick links */}
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { tab: 'appointments', icon: 'fas fa-calendar-check', label: 'Manage Appointments', color: 'bg-teal-50 border-teal-200 text-teal-700' },
                  { tab: 'telemedicine', icon: 'fas fa-video', label: 'Start Video Call', color: 'bg-purple-50 border-purple-200 text-purple-700' },
                  { tab: 'prescriptions', icon: 'fas fa-prescription', label: 'Issue Prescription', color: 'bg-blue-50 border-blue-200 text-blue-700' },
                  { tab: 'availability', icon: 'fas fa-clock', label: 'Set Availability', color: 'bg-amber-50 border-amber-200 text-amber-700' },
                ].map(({ tab, icon, label, color }) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-sm font-medium transition hover:shadow-md ${color}`}
                  >
                    <i className={`${icon} text-2xl`} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ══ APPOINTMENTS ══════════════════════════════════════════════ */}
          {activeTab === 'appointments' && (
            <div>
              <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">Appointments</h1>
                <button
                  onClick={fetchAppointments}
                  className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition"
                >
                  <i className="fas fa-sync-alt" /> Refresh
                </button>
              </div>

              {/* Status filter tabs */}
              <div className="mb-4 flex flex-wrap gap-2">
                {['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setApptFilter(s)}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                      apptFilter === s ? 'bg-teal-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'
                    }`}
                  >
                    {s} {s === 'ALL' ? `(${stats.total})` : `(${appointments.filter((a) => a.status === s).length})`}
                  </button>
                ))}
              </div>

              {loadingAppts ? (
                <div className="rounded-2xl bg-white p-8 text-center text-gray-500 shadow-lg">
                  <i className="fas fa-spinner fa-spin text-3xl text-teal-500" />
                  <p className="mt-2">Loading appointments…</p>
                </div>
              ) : filteredAppts.length === 0 ? (
                <div className="rounded-2xl bg-white p-8 text-center text-gray-500 shadow-lg">
                  <i className="fas fa-calendar-times text-4xl text-gray-300" />
                  <p className="mt-2">No appointments found.</p>
                </div>
              ) : (
                <div className="rounded-2xl bg-white shadow-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">ID</th>
                        <th className="px-4 py-3 text-left font-semibold">Patient</th>
                        <th className="px-4 py-3 text-left font-semibold">Date</th>
                        <th className="px-4 py-3 text-left font-semibold">Time</th>
                        <th className="px-4 py-3 text-left font-semibold">Reason</th>
                        <th className="px-4 py-3 text-left font-semibold">Token</th>
                        <th className="px-4 py-3 text-left font-semibold">Status</th>
                        <th className="px-4 py-3 text-left font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAppts.map((a) => (
                        <tr key={a.appointmentId} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono text-xs text-gray-500">#{a.appointmentId}</td>
                          <td className="px-4 py-3">Patient #{a.patientId}</td>
                          <td className="px-4 py-3">{a.appointmentDate ? formatDate(a.appointmentDate) : '—'}</td>
                          <td className="px-4 py-3">{a.appointmentTime ?? '—'}</td>
                          <td className="px-4 py-3 max-w-40 truncate">{a.reason || '—'}</td>
                          <td className="px-4 py-3 font-mono text-xs">{a.token || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusColor(a.status)}`}>
                              {a.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setSelectedAppt(a)}
                                className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
                              >
                                View
                              </button>
                              {a.status === 'PENDING' && (
                                <>
                                  <button
                                    disabled={busyId === a.appointmentId}
                                    onClick={() => updateStatus(a.appointmentId, 'CONFIRMED')}
                                    className="rounded-lg bg-green-100 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-200 disabled:opacity-50"
                                  >
                                    {busyId === a.appointmentId ? '…' : 'Confirm'}
                                  </button>
                                  <button
                                    disabled={busyId === a.appointmentId}
                                    onClick={() => updateStatus(a.appointmentId, 'CANCELLED')}
                                    className="rounded-lg bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200 disabled:opacity-50"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {a.status === 'CONFIRMED' && (
                                <>
                                  <button
                                    disabled={busyId === a.appointmentId}
                                    onClick={() => updateStatus(a.appointmentId, 'COMPLETED')}
                                    className="rounded-lg bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200 disabled:opacity-50"
                                  >
                                    Mark Done
                                  </button>
                                  <button
                                    onClick={() => startVideoCall(a)}
                                    className="rounded-lg bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 hover:bg-purple-200"
                                  >
                                    <i className="fas fa-video mr-1" />
                                    Call
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ══ PROFILE ═══════════════════════════════════════════════════ */}
          {activeTab === 'profile' && (
            <div>
              <h1 className="mb-6 text-2xl font-bold text-gray-800">My Profile</h1>

              <div className="grid gap-6 lg:grid-cols-3">
                {/* Profile card */}
                <div className="rounded-2xl bg-white p-6 shadow-lg text-center">
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-teal-600 text-4xl font-bold text-white">
                    {(currentUser?.firstName?.[0] ?? 'D').toUpperCase()}
                  </div>
                  <h2 className="mt-4 text-lg font-bold text-gray-800">Dr. {doctorName}</h2>
                  <p className="text-sm text-teal-600">{doctorProfile?.specialization || doctorProfile?.specialty || 'General Practitioner'}</p>
                  <p className="mt-1 text-xs text-gray-500">User ID: {doctorUserId || 'N/A'}</p>
                  <div className="mt-4 space-y-2 text-left text-sm text-gray-600">
                    <div className="flex gap-2">
                      <i className="fas fa-star text-yellow-400 mt-0.5" />
                      Rating: <span className="font-semibold">{doctorProfile?.rating?.toFixed(1) ?? 'N/A'}</span>
                    </div>
                    <div className="flex gap-2">
                      <i className="fas fa-briefcase-medical text-teal-500 mt-0.5" />
                      Experience: <span className="font-semibold">{doctorProfile?.experienceYears ?? 0} yrs</span>
                    </div>
                    <div className="flex gap-2">
                      <i className="fas fa-users text-blue-500 mt-0.5" />
                      Patients: <span className="font-semibold">{doctorProfile?.patientCount ?? 0}</span>
                    </div>
                    <div className="flex gap-2">
                      <i className="fas fa-envelope text-gray-400 mt-0.5" />
                      {doctorProfile?.email || currentUser?.email || 'N/A'}
                    </div>
                    <div className="flex gap-2">
                      <i className="fas fa-phone text-gray-400 mt-0.5" />
                      {doctorProfile?.phoneNumber || currentUser?.phoneNumber || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Edit form */}
                <div className="col-span-2 rounded-2xl bg-white p-6 shadow-lg">
                  <h2 className="mb-4 text-lg font-bold text-gray-800">Edit Profile</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      { key: 'firstName', label: 'First Name' },
                      { key: 'lastName', label: 'Last Name' },
                      { key: 'specialty', label: 'Specialty' },
                      { key: 'specialization', label: 'Specialization' },
                      { key: 'hospital', label: 'Hospital' },
                      { key: 'email', label: 'Email' },
                      { key: 'phoneNumber', label: 'Phone Number' },
                      { key: 'experienceYears', label: 'Years of Experience', type: 'number' },
                    ].map(({ key, label, type = 'text' }) => (
                      <div key={key}>
                        <label className="mb-1 block text-sm font-semibold text-gray-700">{label}</label>
                        <input
                          type={type}
                          value={profileForm[key] ?? ''}
                          onChange={(e) => setProfileForm((p) => ({ ...p, [key]: e.target.value }))}
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-teal-500 focus:bg-white transition"
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    disabled={profileSaving}
                    onClick={saveProfile}
                    className="mt-6 flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 transition"
                  >
                    {profileSaving ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-save" />}
                    {profileSaving ? 'Saving…' : 'Save Changes'}
                  </button>
                  {loadingProfile && <p className="mt-2 text-xs text-gray-400">Loading profile data…</p>}
                </div>
              </div>
            </div>
          )}

          {/* ══ AVAILABILITY ══════════════════════════════════════════════ */}
          {activeTab === 'availability' && (
            <div>
              <h1 className="mb-2 text-2xl font-bold text-gray-800">Availability Schedule</h1>
              <p className="mb-6 text-sm text-gray-500">
                Toggle days on and select your available time slots. Changes are saved automatically.
              </p>

              <div className="space-y-4">
                {WEEK_DAYS.map((day) => {
                  const dayData = availability[day] || { enabled: false, slots: [] };
                  return (
                    <div key={day} className="rounded-2xl bg-white p-5 shadow-lg">
                      <div className="mb-3 flex items-center gap-3">
                        <button
                          onClick={() => toggleDayEnabled(day)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                            dayData.enabled ? 'bg-teal-500' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                              dayData.enabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span className="font-semibold text-gray-800">{day}</span>
                        {dayData.enabled && (
                          <span className="text-xs text-teal-600">
                            {dayData.slots.length} slot{dayData.slots.length !== 1 ? 's' : ''} selected
                          </span>
                        )}
                      </div>

                      {dayData.enabled && (
                        <div className="flex flex-wrap gap-2">
                          {TIME_SLOTS.map((slot) => (
                            <button
                              key={slot}
                              onClick={() => toggleSlot(day, slot)}
                              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                                dayData.slots.includes(slot)
                                  ? 'bg-teal-600 text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══ TELEMEDICINE ══════════════════════════════════════════════ */}
          {activeTab === 'telemedicine' && (
            <div>
              <h1 className="mb-2 text-2xl font-bold text-gray-800">Telemedicine</h1>
              <p className="mb-6 text-sm text-gray-500">
                Start video consultations with patients for confirmed appointments.
              </p>

              {activeRoom ? (
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-gray-800">
                        Active Session — Appointment #{activeRoom.appt.appointmentId}
                      </h2>
                      <p className="text-sm text-gray-500">Patient #{activeRoom.appt.patientId}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openCallInNewTab(activeRoom.roomName)}
                        className="flex items-center gap-2 rounded-xl bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition"
                      >
                        <i className="fas fa-up-right-from-square" /> Open In New Tab
                      </button>
                      <button
                        onClick={endCall}
                        className="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition"
                      >
                        <i className="fas fa-phone-slash" /> End Call
                      </button>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-2xl shadow-xl" style={{ height: '560px' }}>
                    <iframe
                      ref={jitsiRef}
                      src={buildJitsiCallUrl(activeRoom.roomName, `Dr. ${doctorName}`)}
                      allow="camera *; microphone *; fullscreen *; display-capture *; autoplay *"
                      className="h-full w-full border-0"
                      title="Video Consultation"
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-400">
                    Room: <span className="font-mono">{activeRoom.roomName}</span> — Share this room ID with your patient.
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Local device access: {mediaReady ? 'Camera/Mic ready' : 'Not verified for this session'}
                  </p>
                  <p className="mt-1 text-xs text-amber-600">
                    If camera is blocked in iframe, click "Open In New Tab" and allow camera/mic in browser prompt.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="mb-4 rounded-2xl bg-teal-50 border border-teal-200 p-4 text-sm text-teal-700">
                    <i className="fas fa-info-circle mr-2" />
                    Video calls use Jitsi Meet — no installation required. Start a session to generate a meeting room for the patient.
                  </div>
                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={checkMediaPermissions}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Enable Camera & Mic
                    </button>
                  </div>

                  {appointments.filter((a) => a.status === 'CONFIRMED').length === 0 ? (
                    <div className="rounded-2xl bg-white p-8 text-center text-gray-500 shadow-lg">
                      <i className="fas fa-video-slash text-4xl text-gray-300" />
                      <p className="mt-2">No confirmed appointments available for telemedicine.</p>
                      <p className="text-xs text-gray-400">Confirm pending appointments first.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {appointments
                        .filter((a) => a.status === 'CONFIRMED')
                        .map((a) => (
                          <div key={a.appointmentId} className="rounded-2xl bg-white p-5 shadow-lg">
                            <div className="mb-3 flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-teal-700 font-bold">
                                P
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800">Patient #{a.patientId}</p>
                                <p className="text-xs text-gray-500">
                                  {a.appointmentDate} at {a.appointmentTime}
                                </p>
                              </div>
                            </div>
                            <p className="mb-3 text-sm text-gray-600">{a.reason || 'General Consultation'}</p>
                            <button
                              onClick={() => startVideoCall(a)}
                              className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-2 text-sm font-medium text-white hover:bg-teal-700 transition"
                            >
                              <i className="fas fa-video" /> Start Video Call
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ══ PRESCRIPTIONS ═════════════════════════════════════════════ */}
          {activeTab === 'prescriptions' && (
            <div>
              <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">Digital Prescriptions</h1>
                <button
                  onClick={() => { setPrescForm(emptyPrescriptionForm()); setShowPrescModal(true); }}
                  className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition"
                >
                  <i className="fas fa-plus" /> New Prescription
                </button>
              </div>

              {prescriptions.length === 0 ? (
                <div className="rounded-2xl bg-white p-8 text-center text-gray-500 shadow-lg">
                  <i className="fas fa-prescription-bottle text-4xl text-gray-300" />
                  <p className="mt-2">No prescriptions issued yet.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {prescriptions.map((p) => (
                    <div key={p.id} className="rounded-2xl bg-white p-5 shadow-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-gray-800">
                            {p.id} — {p.patientName || 'Patient #' + p.patientId}
                          </p>
                          <p className="text-sm text-gray-500">
                            {p.diagnosis} · {new Date(p.issuedAt).toLocaleDateString()}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            {p.medications.length} medication{p.medications.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setViewPresc(p)}
                            className="rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700 hover:bg-teal-100"
                          >
                            View
                          </button>
                          <button
                            onClick={() => {
                              const updated = prescriptions.filter((x) => x.id !== p.id);
                              setPrescriptions(updated);
                              saveStorage(STORAGE_KEY_PRESCRIPTIONS, updated);
                            }}
                            className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Issue Prescription Modal */}
              {showPrescModal && (
                <Modal title="Issue New Prescription" onClose={() => setShowPrescModal(false)}>
                  <div className="max-h-[70vh] overflow-y-auto space-y-4 pr-1">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-semibold text-gray-700">Patient Name *</label>
                        <input
                          value={prescForm.patientName}
                          onChange={(e) => setPrescForm((p) => ({ ...p, patientName: e.target.value }))}
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none focus:border-teal-500 focus:bg-white"
                          placeholder="Patient full name"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-semibold text-gray-700">Patient ID</label>
                        <input
                          value={prescForm.patientId}
                          onChange={(e) => setPrescForm((p) => ({ ...p, patientId: e.target.value }))}
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none focus:border-teal-500 focus:bg-white"
                          placeholder="e.g. 12"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-semibold text-gray-700">Appointment ID</label>
                      <select
                        value={prescForm.appointmentId}
                        onChange={(e) =>
                          setPrescForm((p) => {
                            const appointmentId = e.target.value;
                            const selectedAppointment = appointments.find(
                              (a) => String(a.appointmentId) === String(appointmentId)
                            );
                            if (!selectedAppointment) return { ...p, appointmentId };
                            return {
                              ...p,
                              appointmentId,
                              patientId: String(selectedAppointment.patientId ?? ''),
                              patientName:
                                p.patientName || `Patient #${selectedAppointment.patientId ?? ''}`,
                            };
                          })
                        }
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none focus:border-teal-500 focus:bg-white"
                      >
                        <option value="">— Select appointment (required) —</option>
                        {appointments
                          .filter((a) => ['CONFIRMED', 'COMPLETED'].includes(a.status))
                          .map((a) => (
                            <option key={a.appointmentId} value={a.appointmentId}>
                              #{a.appointmentId} · Patient #{a.patientId} · {a.appointmentDate}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-semibold text-gray-700">Diagnosis *</label>
                      <input
                        value={prescForm.diagnosis}
                        onChange={(e) => setPrescForm((p) => ({ ...p, diagnosis: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none focus:border-teal-500 focus:bg-white"
                        placeholder="Primary diagnosis"
                      />
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <label className="text-sm font-semibold text-gray-700">Medications</label>
                        <button
                          onClick={addMedication}
                          className="text-xs font-medium text-teal-600 hover:text-teal-800"
                        >
                          <i className="fas fa-plus mr-1" />Add
                        </button>
                      </div>
                      {prescForm.medications.map((med, idx) => (
                        <div key={idx} className="mb-2 grid grid-cols-2 gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3">
                          <input
                            value={med.name}
                            onChange={(e) => updateMedication(idx, 'name', e.target.value)}
                            className="col-span-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500"
                            placeholder="Medicine name"
                          />
                          <input
                            value={med.dosage}
                            onChange={(e) => updateMedication(idx, 'dosage', e.target.value)}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500"
                            placeholder="Dosage (e.g. 500mg)"
                          />
                          <input
                            value={med.frequency}
                            onChange={(e) => updateMedication(idx, 'frequency', e.target.value)}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500"
                            placeholder="Frequency (e.g. 2x daily)"
                          />
                          <input
                            value={med.duration}
                            onChange={(e) => updateMedication(idx, 'duration', e.target.value)}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500"
                            placeholder="Duration (e.g. 7 days)"
                          />
                          {prescForm.medications.length > 1 && (
                            <button
                              onClick={() => removeMedication(idx)}
                              className="col-start-2 text-right text-xs text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-semibold text-gray-700">Additional Notes</label>
                      <textarea
                        value={prescForm.notes}
                        onChange={(e) => setPrescForm((p) => ({ ...p, notes: e.target.value }))}
                        rows={3}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none focus:border-teal-500 focus:bg-white resize-none"
                        placeholder="Diet, rest, follow-up instructions…"
                      />
                    </div>

                    <button
                      onClick={issuePrescription}
                      className="w-full rounded-xl bg-teal-600 py-3 text-sm font-bold text-white hover:bg-teal-700 transition"
                    >
                      Issue Prescription
                    </button>
                  </div>
                </Modal>
              )}

              {/* View Prescription Modal */}
              {viewPresc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                  <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
                    <div className="flex items-center justify-between border-b px-6 py-4">
                      <h3 className="text-lg font-bold text-gray-800">Prescription {viewPresc.id}</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => window.print()}
                          className="rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700 hover:bg-teal-100"
                        >
                          <i className="fas fa-print mr-1" />Print
                        </button>
                        <button onClick={() => setViewPresc(null)} className="text-gray-400 hover:text-gray-600">
                          <i className="fas fa-times text-xl" />
                        </button>
                      </div>
                    </div>
                    <div className="px-6 py-5 space-y-4 text-sm">
                      <div className="rounded-xl bg-teal-50 p-4">
                        <p className="font-bold text-teal-800">Dr. {viewPresc.doctorName}</p>
                        <p className="text-teal-600">{viewPresc.specialty}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <div><span className="font-semibold">Patient:</span> {viewPresc.patientName || '#' + viewPresc.patientId}</div>
                        <div><span className="font-semibold">Date:</span> {new Date(viewPresc.issuedAt).toLocaleDateString()}</div>
                        <div className="col-span-2"><span className="font-semibold">Diagnosis:</span> {viewPresc.diagnosis}</div>
                      </div>
                      <div>
                        <p className="mb-2 font-semibold text-gray-700">Medications</p>
                        {viewPresc.medications.map((m, i) => (
                          <div key={i} className="mb-2 rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs">
                            <p className="font-bold text-gray-800">{m.name}</p>
                            <p className="text-gray-500">{m.dosage} · {m.frequency} · {m.duration}</p>
                          </div>
                        ))}
                      </div>
                      {viewPresc.notes && (
                        <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
                          <p className="font-semibold">Notes:</p>
                          <p>{viewPresc.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ PATIENT REPORTS ═══════════════════════════════════════════ */}
          {activeTab === 'reports' && (
            <div>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Patient Reports</h1>
                  <p className="text-sm text-gray-500 mt-1">View and manage patient-uploaded medical reports.</p>
                </div>
                <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition">
                  <i className="fas fa-upload" /> Upload Report
                  <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleReportUpload} />
                </label>
              </div>

              {visiblePatientReports.length === 0 ? (
                <div className="rounded-2xl bg-white p-8 text-center text-gray-500 shadow-lg">
                  <i className="fas fa-file-medical text-4xl text-gray-300" />
                  <p className="mt-2">No patient reports uploaded yet.</p>
                  <p className="text-xs text-gray-400">Upload a report to get started.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {visiblePatientReports.map((r) => (
                    <div key={r.id} className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <i className={`fas ${r.type?.includes('pdf') ? 'fa-file-pdf' : r.type?.includes('image') ? 'fa-file-image' : 'fa-file-alt'} text-xl`} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{r.fileName}</p>
                          <p className="text-xs text-gray-500">
                            {r.size} · Uploaded {formatDateTime(r.uploadedAt)}
                          </p>
                          {r.patientName && (
                            <p className="text-xs text-teal-600">Patient: {r.patientName}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openReport(r)}
                          className="rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700 hover:bg-teal-100"
                        >
                          <i className="fas fa-eye mr-1" />
                          Open
                        </button>
                        <button
                          onClick={() => deleteReport(r.id)}
                          className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
                        >
                          <i className="fas fa-trash-alt" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-center border-b px-6 py-4">
              <i className="fas fa-exclamation-triangle text-3xl text-amber-500" />
            </div>
            <div className="px-6 py-6 text-center">
              <h3 className="text-lg font-bold text-gray-800">Logout Confirmation</h3>
              <p className="mt-3 text-sm text-gray-600">
                Are you sure you want to logout? You will need to log in again to access your dashboard.
              </p>
            </div>
            <div className="flex gap-3 border-t px-6 py-4">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition"
              >
                <i className="fas fa-sign-out-alt mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appointment detail modal */}
      {selectedAppt && (
        <Modal title={`Appointment #${selectedAppt.appointmentId}`} onClose={() => setSelectedAppt(null)}>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Patient ID</p>
                <p className="font-semibold">#{selectedAppt.patientId}</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Status</p>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusColor(selectedAppt.status)}`}>
                  {selectedAppt.status}
                </span>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Date</p>
                <p className="font-semibold">{selectedAppt.appointmentDate ? formatDate(selectedAppt.appointmentDate) : '—'}</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Time</p>
                <p className="font-semibold">{selectedAppt.appointmentTime ?? '—'}</p>
              </div>
            </div>
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Token</p>
              <p className="font-mono font-semibold">{selectedAppt.token || '—'}</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Reason</p>
              <p className="font-medium">{selectedAppt.reason || '—'}</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Created</p>
              <p>{formatDateTime(selectedAppt.createdAt)}</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-3">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Uploaded Documents</p>
                  <p className="text-xs text-gray-400">Files attached by the patient for this appointment.</p>
                </div>
                <span className="rounded-full bg-teal-100 px-2 py-1 text-xs font-semibold text-teal-700">
                  {selectedApptReports.length}
                </span>
              </div>

              {selectedApptReports.length === 0 ? (
                <p className="text-sm text-gray-500">No patient documents uploaded for this appointment yet.</p>
              ) : (
                <div className="space-y-2">
                  {selectedApptReports.map((report) => (
                    <div
                      key={report.id}
                      className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-gray-800">{report.fileName}</p>
                        <p className="text-xs text-gray-500">
                          {report.size} · Uploaded {formatDateTime(report.uploadedAt)}
                        </p>
                      </div>
                      <button
                        onClick={() => openReport(report)}
                        className="rounded-lg bg-teal-600 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-700"
                      >
                        <i className="fas fa-eye mr-1" />
                        Open File
                      </button>
                      <button
                        onClick={() => deleteReport(report.id)}
                        className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                      >
                        <i className="fas fa-trash-alt mr-1" />
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedAppt.status === 'PENDING' && (
              <div className="flex gap-3 pt-2">
                <button
                  disabled={busyId === selectedAppt.appointmentId}
                  onClick={() => updateStatus(selectedAppt.appointmentId, 'CONFIRMED')}
                  className="flex-1 rounded-xl bg-green-500 py-2 text-sm font-bold text-white hover:bg-green-600 disabled:opacity-50 transition"
                >
                  Confirm
                </button>
                <button
                  disabled={busyId === selectedAppt.appointmentId}
                  onClick={() => updateStatus(selectedAppt.appointmentId, 'CANCELLED')}
                  className="flex-1 rounded-xl bg-red-500 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50 transition"
                >
                  Reject
                </button>
              </div>
            )}
            {selectedAppt.status === 'CONFIRMED' && (
              <div className="flex gap-3 pt-2">
                <button
                  disabled={busyId === selectedAppt.appointmentId}
                  onClick={() => updateStatus(selectedAppt.appointmentId, 'COMPLETED')}
                  className="flex-1 rounded-xl bg-blue-500 py-2 text-sm font-bold text-white hover:bg-blue-600 disabled:opacity-50 transition"
                >
                  Mark as Completed
                </button>
                <button
                  onClick={() => { setSelectedAppt(null); startVideoCall(selectedAppt); setActiveTab('telemedicine'); }}
                  className="flex-1 rounded-xl bg-purple-500 py-2 text-sm font-bold text-white hover:bg-purple-600 transition"
                >
                  <i className="fas fa-video mr-1" />Start Call
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DoctorDashboard;
