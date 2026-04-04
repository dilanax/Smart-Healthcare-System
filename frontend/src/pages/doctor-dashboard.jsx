import { useEffect, useMemo, useRef, useState } from 'react';
import Navbar from '../components/navbar';
import { fetchDoctors, fetchVideoConsultationsByDoctorId, createVideoConsultation as apiCreateConsultation, updateVideoConsultation as apiUpdateConsultation, deleteVideoConsultation as apiDeleteConsultation, generateVideoLink as apiGenerateVideoLink } from '../lib/auth';

const doctorNavItems = [
  { label: 'Dashboard', icon: 'fa-grip' },
  { label: 'Appointments', icon: 'fa-calendar-check' },
  { label: 'Telemedicine', icon: 'fa-video' },
  { label: 'Patients', icon: 'fa-user-group' },
  { label: 'Schedule', icon: 'fa-clock' },
  { label: 'Messages', icon: 'fa-envelope-open-text' },
];

const emptyConsultationForm = {
  patientName: '',
  patientEmail: '',
  consultationDate: '',
  consultationTime: '',
  duration: '30',
  platform: 'Google Meet',
  meetingLink: '',
  category: 'General Consultation',
  notes: '',
};

// Generate a random video consultation link
const generateVideoLink = (platform) => {
  const randomCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const platformUrls = {
    'Google Meet': `https://meet.google.com/${randomCode}`,
    'Zoom': `https://zoom.us/j/${Math.floor(Math.random() * 10000000000)}`,
    'Microsoft Teams': `https://teams.microsoft.com/l/meetup-join/${randomCode}`,
    'SmartCare Video': `https://smartcare-video.healthcare/room/${randomCode}`,
  };
  return platformUrls[platform] || `https://meet.example.com/${randomCode}`;
};

const inputClassName =
  'w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white';

const consultationStorageKey = (email) => `doctor_video_consultations_${email?.trim().toLowerCase() || 'default'}`;

const formatDate = () =>
  new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

const formatConsultationDateTime = (date, time) => {
  if (!date || !time) return 'Schedule pending';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(`${date}T${time}`));
};

const buildMetricCards = (doctorProfile, consultations) => [
  {
    label: "Today's Appointments",
    value: consultations.filter((item) => item.consultationDate === new Date().toISOString().slice(0, 10)).length,
    icon: 'fa-calendar-day',
    tone: 'text-cyan-700',
    detail: 'Booked consultations',
  },
  {
    label: 'Upcoming Sessions',
    value: consultations.length,
    icon: 'fa-video',
    tone: 'text-teal-700',
    detail: 'Scheduled remotely',
  },
  {
    label: 'Patient Messages',
    value: Math.max(2, Math.min(9, consultations.length + 1)),
    icon: 'fa-comments',
    tone: 'text-sky-700',
    detail: 'Needs your reply',
  },
  {
    label: 'Profile Strength',
    value: doctorProfile?.verified ? '96%' : '74%',
    icon: 'fa-shield-heart',
    tone: 'text-emerald-700',
    detail: 'Visibility score',
  },
];

const DoctorDashboard = ({ navigate, currentUser }) => {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [consultationForm, setConsultationForm] = useState(emptyConsultationForm);
  const [consultations, setConsultations] = useState([]);
  const [consultationMessage, setConsultationMessage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const consultationSectionRef = useRef(null);
  const patientNameInputRef = useRef(null);
  const contentSectionRef = useRef(null);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (currentUser.role !== 'DOCTOR') {
      navigate('/');
      return;
    }

    const loadDoctors = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetchDoctors();
        setDoctors(Array.isArray(response?.data) ? response.data : []);
      } catch (loadError) {
        setError(loadError.message || 'Failed to load doctor dashboard.');
      } finally {
        setLoading(false);
      }
    };

    loadDoctors();
  }, [currentUser, navigate]);

  useEffect(() => {
    if (!currentUser?.email) return;

    const loadConsultations = async () => {
      try {
        // First, try to fetch from the backend API using doctor ID
        // We'll get the doctor ID from the doctors list after it loads
        const storedValue = localStorage.getItem(consultationStorageKey(currentUser.email));
        const parsed = storedValue ? JSON.parse(storedValue) : [];
        setConsultations(Array.isArray(parsed) ? parsed : []);
      } catch {
        setConsultations([]);
      }
    };

    loadConsultations();
  }, [currentUser?.email]);

  const doctorProfile = useMemo(
    () =>
      doctors.find(
        (doctor) => doctor?.email?.trim().toLowerCase() === currentUser?.email?.trim().toLowerCase()
      ) ?? null,
    [currentUser?.email, doctors]
  );

  // Fetch consultations from backend API when doctor profile is loaded
  useEffect(() => {
    if (!doctorProfile?.id) return;

    const loadConsultationsFromBackend = async () => {
      try {
        const response = await fetchVideoConsultationsByDoctorId(doctorProfile.id);
        const consultationsFromApi = Array.isArray(response?.data) ? response.data : [];
        
        // Sort by date and time
        const sortedConsultations = consultationsFromApi.sort((left, right) =>
          `${left.consultationDate}T${left.consultationTime}`.localeCompare(
            `${right.consultationDate}T${right.consultationTime}`
          )
        );
        
        setConsultations(sortedConsultations);
        // Update localStorage with backend data
        localStorage.setItem(consultationStorageKey(currentUser.email), JSON.stringify(sortedConsultations));
      } catch (error) {
        console.error('Failed to load consultations from backend:', error);
        // Keep existing consultations from localStorage if API fails
      }
    };

    loadConsultationsFromBackend();
  }, [doctorProfile?.id]);

  const displayName = useMemo(() => {
    const rawName =
      doctorProfile?.fullName?.trim() ||
      currentUser?.name?.trim() ||
      currentUser?.email?.split('@')?.[0] ||
      'Doctor';

    return /^dr\./i.test(rawName) ? rawName : `Dr. ${rawName}`;
  }, [currentUser?.email, currentUser?.name, doctorProfile?.fullName]);

  // Filter consultations to show only those matching the current patient email
  const filteredConsultations = useMemo(() => {
    if (!consultationForm.patientEmail) {
      return consultations; // Show all if no patient email selected
    }

    const normalizedEmail = consultationForm.patientEmail.trim().toLowerCase();
    return consultations.filter(
      (consultation) => consultation.patientEmail?.trim().toLowerCase() === normalizedEmail
    );
  }, [consultations, consultationForm.patientEmail]);

  const metricCards = buildMetricCards(doctorProfile, consultations);
  const nextConsultation = consultations[0] ?? null;
  const canShowTabbedContent = Boolean(doctorProfile) || activeTab === 'Telemedicine';

  const openTelemedicine = () => {
    setActiveTab('Telemedicine');
    window.setTimeout(() => {
      contentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      consultationSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      patientNameInputRef.current?.focus();
    }, 150);
  };

  const handleDashboardNav = (label) => {
    if (label === 'Telemedicine') {
      openTelemedicine();
      return;
    }

    setActiveTab(label);
    window.setTimeout(() => {
      contentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  };

  const createVideoConsultation = async (event) => {
    event.preventDefault();
    setConsultationMessage('');

    // Use doctorProfile ID if available, otherwise use a temporary ID or allow backend to handle
    const doctorId = doctorProfile?.id || currentUser?.id || 1; // Fallback doctor ID

    try {
      const response = await apiCreateConsultation({
        doctorId: doctorId,
        patientName: consultationForm.patientName.trim(),
        patientEmail: consultationForm.patientEmail.trim().toLowerCase(),
        consultationDate: consultationForm.consultationDate,
        consultationTime: consultationForm.consultationTime,
        duration: parseInt(consultationForm.duration),
        platform: consultationForm.platform,
        meetingLink: consultationForm.meetingLink.trim(),
        category: consultationForm.category,
        notes: consultationForm.notes.trim(),
        status: 'Scheduled',
      });

      const newConsultation = response?.data || {
        id: crypto.randomUUID(),
        ...response,
      };

      const nextConsultations = [...consultations, newConsultation].sort((left, right) =>
        `${left.consultationDate}T${left.consultationTime}`.localeCompare(
          `${right.consultationDate}T${right.consultationTime}`
        )
      );

      setConsultations(nextConsultations);
      localStorage.setItem(consultationStorageKey(currentUser.email), JSON.stringify(nextConsultations));
      setConsultationForm(emptyConsultationForm);
      setConsultationMessage('Video consultation created successfully.');
    } catch (error) {
      setConsultationMessage(`Error: ${error.message}`);
    }
  };

  const autoGenerateLink = async () => {
    try {
      const response = await apiGenerateVideoLink(consultationForm.platform);
      const newLink = response?.data || generateVideoLink(consultationForm.platform);
      setConsultationForm({ ...consultationForm, meetingLink: newLink });
    } catch {
      // Fallback to client-side generation if API fails
      const newLink = generateVideoLink(consultationForm.platform);
      setConsultationForm({ ...consultationForm, meetingLink: newLink });
    }
  };

  const startEditingConsultation = (consultation) => {
    setEditingId(consultation.id);
    setConsultationForm({
      patientName: consultation.patientName,
      patientEmail: consultation.patientEmail,
      consultationDate: consultation.consultationDate,
      consultationTime: consultation.consultationTime,
      duration: consultation.duration,
      platform: consultation.platform,
      meetingLink: consultation.meetingLink,
      category: consultation.category || 'General Consultation',
      notes: consultation.notes,
    });
    setShowEditModal(true);
  };

  const updateVideoConsultation = async (event) => {
    event.preventDefault();
    setConsultationMessage('');

    try {
      const consultationToUpdate = consultations.find((c) => c.id === editingId);
      if (!consultationToUpdate) {
        setConsultationMessage('Consultation not found.');
        return;
      }

      const response = await apiUpdateConsultation(editingId, {
        doctorId: doctorProfile?.id || consultationToUpdate.doctorId,
        patientName: consultationForm.patientName.trim(),
        patientEmail: consultationForm.patientEmail.trim().toLowerCase(),
        consultationDate: consultationForm.consultationDate,
        consultationTime: consultationForm.consultationTime,
        duration: parseInt(consultationForm.duration),
        platform: consultationForm.platform,
        meetingLink: consultationForm.meetingLink.trim(),
        category: consultationForm.category,
        notes: consultationForm.notes.trim(),
      });

      const updatedConsultations = consultations.map((item) => {
        if (item.id === editingId) {
          return response?.data || item;
        }
        return item;
      }).sort((left, right) =>
        `${left.consultationDate}T${left.consultationTime}`.localeCompare(
          `${right.consultationDate}T${right.consultationTime}`
        )
      );

      setConsultations(updatedConsultations);
      localStorage.setItem(consultationStorageKey(currentUser.email), JSON.stringify(updatedConsultations));
      setConsultationForm(emptyConsultationForm);
      setEditingId(null);
      setShowEditModal(false);
      setConsultationMessage('Video consultation updated successfully.');
    } catch (error) {
      setConsultationMessage(`Error: ${error.message}`);
    }
  };

  const deleteConsultation = async (id) => {
    try {
      await apiDeleteConsultation(id);
      const nextConsultations = consultations.filter((item) => item.id !== id);
      setConsultations(nextConsultations);
      localStorage.setItem(consultationStorageKey(currentUser.email), JSON.stringify(nextConsultations));
      setConsultationMessage('Video consultation deleted successfully.');
    } catch (error) {
      setConsultationMessage(`Error: ${error.message}`);
    }
  };

  if (!currentUser || currentUser.role !== 'DOCTOR') {
    return null;
  }

  const renderTelemedicine = () => (
    <section className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <article ref={consultationSectionRef} className="rounded-[2rem] bg-white p-6 shadow-[0_16px_60px_rgba(15,23,42,0.06)]">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-600">Telemedicine Window</p>
        <h2 className="mt-3 text-2xl font-black text-slate-900">Create video consultation</h2>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          Open a dedicated consultation window for your patient with meeting details, timing, and notes.
        </p>

        {consultationMessage ? (
          <div className="mt-5 rounded-[1.4rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {consultationMessage}
          </div>
        ) : null}

        <form onSubmit={createVideoConsultation} className="mt-5 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <input ref={patientNameInputRef} className={inputClassName} placeholder="Patient name" value={consultationForm.patientName} onChange={(event) => setConsultationForm({ ...consultationForm, patientName: event.target.value })} required />
            <input type="email" className={inputClassName} placeholder="Patient email" value={consultationForm.patientEmail} onChange={(event) => setConsultationForm({ ...consultationForm, patientEmail: event.target.value })} required />
            <input type="date" className={inputClassName} value={consultationForm.consultationDate} onChange={(event) => setConsultationForm({ ...consultationForm, consultationDate: event.target.value })} required />
            <input type="time" className={inputClassName} value={consultationForm.consultationTime} onChange={(event) => setConsultationForm({ ...consultationForm, consultationTime: event.target.value })} required />
            <select className={inputClassName} value={consultationForm.platform} onChange={(event) => setConsultationForm({ ...consultationForm, platform: event.target.value })}>
              <option value="Google Meet">Google Meet</option>
              <option value="Zoom">Zoom</option>
              <option value="Microsoft Teams">Microsoft Teams</option>
              <option value="SmartCare Video">SmartCare Video</option>
            </select>
            <input type="number" min="15" step="15" className={inputClassName} placeholder="Duration in minutes" value={consultationForm.duration} onChange={(event) => setConsultationForm({ ...consultationForm, duration: event.target.value })} required />
            <select className={inputClassName} value={consultationForm.category} onChange={(event) => setConsultationForm({ ...consultationForm, category: event.target.value })}>
              <option value="General Consultation">General Consultation</option>
              <option value="Follow-up">Follow-up</option>
              <option value="Emergency">Emergency</option>
              <option value="Urgent Care">Urgent Care</option>
              <option value="Routine Check-up">Routine Check-up</option>
              <option value="Post-Surgery">Post-Surgery</option>
              <option value="Specialist Referral">Specialist Referral</option>
            </select>
          </div>

          <div className="flex gap-3">
            <input className={`${inputClassName} flex-1`} placeholder="Meeting link" value={consultationForm.meetingLink} onChange={(event) => setConsultationForm({ ...consultationForm, meetingLink: event.target.value })} required />
            <button type="button" onClick={autoGenerateLink} className="rounded-full bg-teal-600 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-700 transition">
              <i className="fas fa-link mr-2"></i>Generate Link
            </button>
          </div>
          <textarea className={`${inputClassName} min-h-28`} placeholder="Consultation notes or instructions" value={consultationForm.notes} onChange={(event) => setConsultationForm({ ...consultationForm, notes: event.target.value })} />

          <button type="submit" className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition">
            Create video consultation
          </button>
        </form>
      </article>

      <article className="rounded-[2rem] bg-white p-6 shadow-[0_16px_60px_rgba(15,23,42,0.06)]">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-600">Session Queue</p>
        <h2 className="mt-3 text-2xl font-black text-slate-900">Scheduled video consultations</h2>
        <div className="mt-5 space-y-4">
          {filteredConsultations.length > 0 ? filteredConsultations.map((item) => (
            <div key={item.id} className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-lg font-black text-slate-900">{item.patientName}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.patientEmail}</p>
                  <p className="mt-3 text-sm font-semibold text-teal-700">{formatConsultationDateTime(item.consultationDate, item.consultationTime)}</p>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-800">{item.status}</span>
                  <p className="text-xs font-semibold text-slate-600 bg-teal-50 px-3 py-1 rounded-full">{item.category}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                <p>Platform: {item.platform}</p>
                <p>Duration: {item.duration} minutes</p>
              </div>
              <p className="mt-3 truncate text-sm text-slate-500">Meeting: <a href={item.meetingLink} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">{item.meetingLink}</a></p>
              <div className="mt-4 flex gap-3">
                <button type="button" onClick={() => startEditingConsultation(item)} className="flex-1 rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition">
                  <i className="fas fa-edit mr-2"></i>Edit
                </button>
                <button type="button" onClick={() => deleteConsultation(item.id)} className="flex-1 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 transition">
                  <i className="fas fa-trash mr-2"></i>Delete
                </button>
              </div>
            </div>
          )) : (
            <div className="rounded-[1.5rem] border border-dashed border-stone-300 p-6 text-sm text-slate-500">
              {consultationForm.patientEmail
                ? `No consultations scheduled for ${consultationForm.patientEmail}. Create one to get started.`
                : 'Enter a patient email to view their scheduled consultations.'}
            </div>
          )}
        </div>
      </article>
    </section>
  );

  const renderDashboard = () => (
    <>
      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => (
          <article key={card.label} className="rounded-[1.8rem] bg-white p-6 shadow-[0_16px_60px_rgba(15,23,42,0.06)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-teal-700">
                  <i className={`fas ${card.icon}`}></i>
                </div>
                <p className="mt-4 text-lg font-black text-slate-900">{card.label}</p>
                <p className="mt-2 text-sm text-slate-500">{card.detail}</p>
              </div>
              <p className={`text-4xl font-black ${card.tone}`}>{card.value}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <article className="rounded-[2rem] bg-white p-6 shadow-[0_16px_60px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-600">Current Doctor</p>
            <h2 className="mt-3 text-3xl font-black text-slate-900">{displayName}</h2>
            <p className="mt-2 text-sm text-slate-500">{doctorProfile.specialization} in {doctorProfile.department}</p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.4rem] bg-stone-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Status</p>
                <p className="mt-3 text-lg font-black text-slate-900">{doctorProfile.status}</p>
              </div>
              <div className="rounded-[1.4rem] bg-stone-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Room Number</p>
                <p className="mt-3 text-lg font-black text-slate-900">{doctorProfile.roomNumber || 'Not assigned'}</p>
              </div>
              <div className="rounded-[1.4rem] bg-stone-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Experience</p>
                <p className="mt-3 text-lg font-black text-slate-900">{doctorProfile.experienceYears} years</p>
              </div>
            </div>
          </article>

          <article className="rounded-[2rem] bg-white p-6 shadow-[0_16px_60px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-600">Work Area Shortcuts</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <button type="button" onClick={() => setActiveTab('Appointments')} className="flex min-h-[112px] items-center justify-between rounded-[1.6rem] border border-stone-200 bg-stone-50 px-6 py-5 text-left transition hover:-translate-y-0.5 hover:bg-white">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                    <i className="fas fa-calendar-day"></i>
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-900">Today&apos;s Appointments</p>
                    <p className="text-sm text-slate-500">Review your active bookings</p>
                  </div>
                </div>
                <span className="text-3xl font-black text-cyan-700">{metricCards[0].value}</span>
              </button>

              <button type="button" onClick={openTelemedicine} className="flex min-h-[112px] items-center justify-between rounded-[1.6rem] border border-stone-200 bg-stone-50 px-6 py-5 text-left transition hover:-translate-y-0.5 hover:bg-white">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                    <i className="fas fa-video"></i>
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-900">Upcoming Sessions</p>
                    <p className="text-sm text-slate-500">Prepare for planned consultations</p>
                  </div>
                </div>
                <span className="text-3xl font-black text-teal-700">{metricCards[1].value}</span>
              </button>
            </div>
          </article>
        </div>

        <div className="space-y-6">
          <article className="rounded-[2rem] bg-white p-6 shadow-[0_16px_60px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-600">Today&apos;s Focus</p>
            <h2 className="mt-3 text-2xl font-black text-slate-900">Next consultation block</h2>
            <div className="mt-5 rounded-[1.8rem] bg-[linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(14,116,144,0.92))] p-6 text-white">
              <p className="text-sm font-semibold text-cyan-100/80">Primary consultation window</p>
              <p className="mt-3 text-3xl font-black">{nextConsultation ? nextConsultation.patientName : `${doctorProfile.availableDays?.[0] || 'Monday'} Clinic Session`}</p>
              <p className="mt-3 text-sm leading-7 text-cyan-50/85">
                {nextConsultation
                  ? `${formatConsultationDateTime(nextConsultation.consultationDate, nextConsultation.consultationTime)} via ${nextConsultation.platform}`
                  : `Room ${doctorProfile.roomNumber || 'TBD'} is reserved for your next outpatient consultation cycle.`}
              </p>
            </div>
          </article>

          <article className="rounded-[2rem] bg-white p-6 shadow-[0_16px_60px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-600">Profile Overview</p>
            <h2 className="mt-3 text-2xl font-black text-slate-900">Doctor information</h2>
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between rounded-[1.3rem] bg-stone-50 px-4 py-4">
                <span className="text-sm font-semibold text-slate-500">Email</span>
                <span className="text-sm font-bold text-slate-900">{doctorProfile.email}</span>
              </div>
              <div className="flex items-center justify-between rounded-[1.3rem] bg-stone-50 px-4 py-4">
                <span className="text-sm font-semibold text-slate-500">License Number</span>
                <span className="text-sm font-bold text-slate-900">{doctorProfile.licenseNumber}</span>
              </div>
              <div className="flex items-center justify-between rounded-[1.3rem] bg-stone-50 px-4 py-4">
                <span className="text-sm font-semibold text-slate-500">Consultation Fee</span>
                <span className="text-sm font-bold text-slate-900">LKR {doctorProfile.consultationFee}</span>
              </div>
            </div>
          </article>
        </div>
      </section>
    </>
  );

  const renderSimpleWindow = (title, description, body) => (
    <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-[0_16px_60px_rgba(15,23,42,0.06)]">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-600">{title} Window</p>
      <h2 className="mt-3 text-2xl font-black text-slate-900">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-slate-500">{description}</p>
      <div className="mt-6">{body}</div>
    </section>
  );

  return (
    <div className="min-h-screen bg-[#f6f2e9]">
      <Navbar navigate={navigate} currentUser={currentUser} />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-[2.4rem] bg-[linear-gradient(135deg,_rgba(15,23,42,1),_rgba(14,116,144,0.92),_rgba(13,148,136,0.88))] px-8 py-10 text-white shadow-[0_26px_90px_rgba(15,23,42,0.18)]">
          <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-100/75">Doctor Dashboard</p>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Welcome back, {displayName}</h1>
              <p className="mt-4 text-sm leading-8 text-cyan-50/85">{formatDate()}</p>
              <p className="mt-5 max-w-2xl text-sm leading-8 text-cyan-50/85">
                Move between focused doctor windows for appointments, telemedicine, patients, schedule, and messages.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {doctorNavItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleDashboardNav(item.label)}
                    className={`inline-flex items-center gap-3 rounded-full px-5 py-3 text-sm font-semibold transition ${
                      activeTab === item.label
                        ? 'bg-white text-slate-900'
                        : 'border border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/16'
                    }`}
                  >
                    <i className={`fas ${item.icon}`}></i>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.8rem] border border-white/14 bg-white/10 p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/75">Department</p>
                <p className="mt-3 text-2xl font-black">{doctorProfile?.department || 'Pending setup'}</p>
              </div>
              <div className="rounded-[1.8rem] border border-white/14 bg-white/10 p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/75">Specialization</p>
                <p className="mt-3 text-2xl font-black">{doctorProfile?.specialization || 'Doctor profile needed'}</p>
              </div>
              <div className="rounded-[1.8rem] border border-white/14 bg-white/10 p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/75">Consultation Fee</p>
                <p className="mt-3 text-2xl font-black">
                  {doctorProfile?.consultationFee ? `LKR ${doctorProfile.consultationFee}` : 'Not set'}
                </p>
              </div>
              <div className="rounded-[1.8rem] border border-white/14 bg-white/10 p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/75">Verification</p>
                <p className="mt-3 text-2xl font-black">{doctorProfile?.verified ? 'Verified' : 'Pending review'}</p>
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <section className="mt-8 rounded-[2rem] bg-white p-8 text-center shadow-[0_16px_60px_rgba(15,23,42,0.06)]">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-stone-200 border-t-teal-600"></div>
            <p className="mt-4 text-sm text-slate-500">Loading doctor workspace...</p>
          </section>
        ) : null}

        {error ? (
          <section className="mt-8 rounded-[2rem] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            {error}
          </section>
        ) : null}

        {!loading && !error && !doctorProfile ? (
          <section className="mt-8 rounded-[2rem] border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
            Your login is working, but there is no doctor-service profile linked to <strong>{currentUser.email}</strong>.
            Ask the admin to create a doctor profile using this same email address. You can still open
            <strong> Telemedicine </strong>
            to create a video consultation window.
          </section>
        ) : null}

        {!loading && !error && canShowTabbedContent ? (
          <>
            <section ref={contentSectionRef} className="mt-8 rounded-[1.8rem] border border-stone-200 bg-white px-6 py-5 shadow-[0_16px_60px_rgba(15,23,42,0.06)]">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-600">Active Window</p>
              <div className="mt-3 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">{activeTab}</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Doctor workspace details for the selected navigation tab.
                  </p>
                </div>
                <span className="rounded-full bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800">
                  {activeTab}
                </span>
              </div>
            </section>

            {activeTab === 'Dashboard' && doctorProfile ? renderDashboard() : null}
            {activeTab === 'Telemedicine' ? renderTelemedicine() : null}
            {activeTab === 'Appointments'
              && doctorProfile
              ? renderSimpleWindow(
                  'Appointments',
                  'Track today’s bookings and upcoming patient sessions.',
                  consultations.length > 0 ? (
                    <div className="space-y-4">
                      {consultations.map((item) => (
                        <div key={item.id} className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
                          <p className="text-lg font-black text-slate-900">{item.patientName}</p>
                          <p className="mt-2 text-sm text-slate-500">{formatConsultationDateTime(item.consultationDate, item.consultationTime)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[1.5rem] border border-dashed border-stone-300 p-6 text-sm text-slate-500">
                      No appointments yet. Open Telemedicine to create one.
                    </div>
                  )
                )
              : null}
            {activeTab === 'Patients'
              && doctorProfile
              ? renderSimpleWindow(
                  'Patients',
                  'See patient cards created from your consultation flow.',
                  consultations.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-3">
                      {consultations.map((item) => (
                        <article key={item.id} className="rounded-[1.5rem] bg-stone-50 p-5">
                          <p className="text-lg font-black text-slate-900">{item.patientName}</p>
                          <p className="mt-2 text-sm text-slate-500">{item.patientEmail}</p>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[1.5rem] border border-dashed border-stone-300 p-6 text-sm text-slate-500">
                      Patient records will appear here after you schedule consultations.
                    </div>
                  )
                )
              : null}
            {activeTab === 'Schedule'
              && doctorProfile
              ? renderSimpleWindow(
                  'Schedule',
                  'Review available days and assigned clinic setup.',
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-3">
                      {(doctorProfile.availableDays || []).map((day) => (
                        <span key={day} className="rounded-full bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800">
                          {day}
                        </span>
                      ))}
                    </div>
                    <div className="rounded-[1.5rem] bg-stone-50 p-5 text-sm text-slate-600">
                      Room {doctorProfile.roomNumber || 'TBD'} is assigned for {doctorProfile.department} sessions.
                    </div>
                  </div>
                )
              : null}
            {activeTab === 'Messages'
              && doctorProfile
              ? renderSimpleWindow(
                  'Messages',
                  'Keep communication organized inside a dedicated doctor inbox window.',
                  <div className="space-y-4">
                    <div className="rounded-[1.5rem] bg-stone-50 p-5">
                      <p className="text-lg font-black text-slate-900">Clinical coordination</p>
                      <p className="mt-2 text-sm text-slate-500">Updates from admin and patient communication will appear here.</p>
                    </div>
                    <div className="rounded-[1.5rem] bg-stone-50 p-5">
                      <p className="text-lg font-black text-slate-900">Telemedicine support</p>
                      <p className="mt-2 text-sm text-slate-500">Use the Telemedicine tab to create sessions, then track follow-up communication here.</p>
                    </div>
                  </div>
                )
              : null}
          </>
        ) : null}

        {showEditModal && editingId ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="rounded-[2rem] bg-white p-8 shadow-[0_26px_90px_rgba(15,23,42,0.18)] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-slate-900">Edit Video Consultation</h2>
                <button type="button" onClick={() => { setShowEditModal(false); setEditingId(null); setConsultationForm(emptyConsultationForm); }} className="text-slate-400 hover:text-slate-600">
                  <i className="fas fa-times text-2xl"></i>
                </button>
              </div>

              <form onSubmit={updateVideoConsultation} className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <input className={inputClassName} placeholder="Patient name" value={consultationForm.patientName} onChange={(event) => setConsultationForm({ ...consultationForm, patientName: event.target.value })} required />
                  <input type="email" className={inputClassName} placeholder="Patient email" value={consultationForm.patientEmail} onChange={(event) => setConsultationForm({ ...consultationForm, patientEmail: event.target.value })} required />
                  <input type="date" className={inputClassName} value={consultationForm.consultationDate} onChange={(event) => setConsultationForm({ ...consultationForm, consultationDate: event.target.value })} required />
                  <input type="time" className={inputClassName} value={consultationForm.consultationTime} onChange={(event) => setConsultationForm({ ...consultationForm, consultationTime: event.target.value })} required />
                  <select className={inputClassName} value={consultationForm.platform} onChange={(event) => setConsultationForm({ ...consultationForm, platform: event.target.value })}>
                    <option value="Google Meet">Google Meet</option>
                    <option value="Zoom">Zoom</option>
                    <option value="Microsoft Teams">Microsoft Teams</option>
                    <option value="SmartCare Video">SmartCare Video</option>
                  </select>
                  <input type="number" min="15" step="15" className={inputClassName} placeholder="Duration in minutes" value={consultationForm.duration} onChange={(event) => setConsultationForm({ ...consultationForm, duration: event.target.value })} required />
                  <select className={inputClassName} value={consultationForm.category} onChange={(event) => setConsultationForm({ ...consultationForm, category: event.target.value })}>
                    <option value="General Consultation">General Consultation</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Urgent Care">Urgent Care</option>
                    <option value="Routine Check-up">Routine Check-up</option>
                    <option value="Post-Surgery">Post-Surgery</option>
                    <option value="Specialist Referral">Specialist Referral</option>
                  </select>
                </div>

                <div className="flex gap-3">
                  <input className={`${inputClassName} flex-1`} placeholder="Meeting link" value={consultationForm.meetingLink} onChange={(event) => setConsultationForm({ ...consultationForm, meetingLink: event.target.value })} required />
                  <button type="button" onClick={autoGenerateLink} className="rounded-full bg-teal-600 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-700 transition">
                    <i className="fas fa-sync mr-2"></i>Regenerate
                  </button>
                </div>
                <textarea className={`${inputClassName} min-h-24`} placeholder="Consultation notes or instructions" value={consultationForm.notes} onChange={(event) => setConsultationForm({ ...consultationForm, notes: event.target.value })} />

                <div className="flex gap-3 mt-6">
                  <button type="submit" className="flex-1 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition">
                    Update Consultation
                  </button>
                  <button type="button" onClick={() => { setShowEditModal(false); setEditingId(null); setConsultationForm(emptyConsultationForm); }} className="flex-1 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default DoctorDashboard;
