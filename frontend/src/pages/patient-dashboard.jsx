import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/navbar';
import { fetchVideoConsultationsByPatientEmail } from '../lib/auth';

const patientNavItems = [
  { label: 'Dashboard', icon: 'fa-grip' },
  { label: 'Consultations', icon: 'fa-video' },
  { label: 'Medical Records', icon: 'fa-file-medical' },
  { label: 'Prescriptions', icon: 'fa-prescription-bottle' },
  { label: 'Messages', icon: 'fa-envelope-open-text' },
];

const inputClassName =
  'w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white';

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

const isUpcoming = (date, time) => {
  if (!date || !time) return false;
  const consultationDateTime = new Date(`${date}T${time}`);
  return consultationDateTime > new Date();
};

const buildMetricCards = (consultations) => {
  const upcoming = consultations.filter((c) => isUpcoming(c.consultationDate, c.consultationTime));
  const completed = consultations.filter((c) => !isUpcoming(c.consultationDate, c.consultationTime) && c.status === 'Completed');
  
  return [
    {
      label: 'Upcoming Consultations',
      value: upcoming.length,
      icon: 'fa-calendar-check',
      tone: 'text-teal-700',
      detail: 'Scheduled sessions',
    },
    {
      label: 'Completed Sessions',
      value: completed.length,
      icon: 'fa-check-circle',
      tone: 'text-emerald-700',
      detail: 'Past consultations',
    },
    {
      label: 'Total Consultations',
      value: consultations.length,
      icon: 'fa-video',
      tone: 'text-cyan-700',
      detail: 'All sessions',
    },
    {
      label: 'This Month',
      value: consultations.filter((c) => {
        const today = new Date();
        const cDate = new Date(`${c.consultationDate}T${c.consultationTime}`);
        return cDate.getMonth() === today.getMonth() && cDate.getFullYear() === today.getFullYear();
      }).length,
      icon: 'fa-calendar-days',
      tone: 'text-sky-700',
      detail: 'Current month count',
    },
  ];
};

const PatientDashboard = ({ navigate, currentUser }) => {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (currentUser.role !== 'PATIENT') {
      navigate('/');
      return;
    }

    const loadConsultations = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetchVideoConsultationsByPatientEmail(currentUser.email);
        setConsultations(Array.isArray(response?.data) ? response.data : []);
      } catch (loadError) {
        setError(loadError.message || 'Failed to load consultations.');
      } finally {
        setLoading(false);
      }
    };

    loadConsultations();
  }, [currentUser, navigate]);

  if (!currentUser || currentUser.role !== 'PATIENT') {
    return null;
  }

  const displayName = currentUser?.name || currentUser?.firstName || currentUser?.email?.split('@')?.[0] || 'Patient';
  const metricCards = buildMetricCards(consultations);
  const upcomingConsultations = consultations.filter((c) => isUpcoming(c.consultationDate, c.consultationTime));
  const pastConsultations = consultations.filter((c) => !isUpcoming(c.consultationDate, c.consultationTime));

  const renderDashboard = () => (
    <>
      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => (
          <article key={card.label} className="rounded-4xl bg-white p-6 shadow-[0_16px_60px_rgba(15,23,42,0.06)]">
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
        <article className="rounded-4xl bg-white p-6 shadow-[0_16px_60px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-600">Your Profile</p>
          <h2 className="mt-3 text-3xl font-black text-slate-900">{displayName}</h2>
          <p className="mt-2 text-sm text-slate-500">Patient Account</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl bg-stone-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Email</p>
              <p className="mt-3 text-lg font-black text-slate-900 break-all">{currentUser.email}</p>
            </div>
            <div className="rounded-3xl bg-stone-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Status</p>
              <p className="mt-3 text-lg font-black text-slate-900">
                {currentUser.otpVerified ? 'Verified' : 'Pending Verification'}
              </p>
            </div>
            <div className="rounded-3xl bg-stone-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Phone</p>
              <p className="mt-3 text-lg font-black text-slate-900">{currentUser.phoneNumber || 'Not provided'}</p>
            </div>
            <div className="rounded-3xl bg-stone-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Access Level</p>
              <p className="mt-3 text-lg font-black text-slate-900">{currentUser.role}</p>
            </div>
          </div>
        </article>

        <article className="rounded-4xl bg-white p-6 shadow-[0_16px_60px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-600">Quick Actions</p>
          <h2 className="mt-3 text-2xl font-black text-slate-900">Get Started</h2>
          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={() => setActiveTab('Consultations')}
              className="w-full rounded-full border border-stone-200 bg-stone-50 px-5 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-white"
            >
              <i className="fas fa-video mr-3 text-teal-600"></i>View Consultations
            </button>
            <button
              type="button"
              onClick={() => navigate('/home')}
              className="w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <i className="fas fa-home mr-3"></i>Back to Home
            </button>
          </div>
        </article>
      </section>
    </>
  );

  const renderConsultations = () => (
    <section className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <article className="rounded-4xl bg-white p-6 shadow-[0_16px_60px_rgba(15,23,42,0.06)]">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-600">Upcoming Sessions</p>
        <h2 className="mt-3 text-2xl font-black text-slate-900">Your Scheduled Consultations</h2>
        <div className="mt-5 space-y-4">
          {upcomingConsultations.length > 0 ? (
            upcomingConsultations.map((consultation) => (
              <div key={consultation.id} className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-lg font-black text-slate-900">
                      {consultation.category || 'Consultation'}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Dr. {consultation.doctorName || 'Your Doctor'}
                    </p>
                    <p className="mt-3 text-sm font-semibold text-teal-700">
                      {formatConsultationDateTime(consultation.consultationDate, consultation.consultationTime)}
                    </p>
                  </div>
                  <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">
                    {consultation.platform}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                  <p>Duration: {consultation.duration} minutes</p>
                  <p>Category: {consultation.category}</p>
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  {consultation.notes || 'No description provided'}
                </p>
                <div className="mt-4 flex gap-3">
                  <a
                    href={consultation.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 rounded-full bg-teal-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-teal-700"
                  >
                    <i className="fas fa-video mr-2"></i>Join Now
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(consultation.meetingLink);
                      alert('Link copied to clipboard!');
                    }}
                    className="rounded-full border border-stone-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-stone-50"
                  >
                    <i className="fas fa-copy"></i>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-stone-300 p-6 text-sm text-slate-500">
              <i className="fas fa-calendar-slash mr-2"></i>
              No upcoming consultations scheduled. Your doctor will schedule one soon.
            </div>
          )}
        </div>
      </article>

      <article className="rounded-4xl bg-white p-6 shadow-[0_16px_60px_rgba(15,23,42,0.06)]">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-600">History</p>
        <h2 className="mt-3 text-2xl font-black text-slate-900">Past Consultations</h2>
        <div className="mt-5 space-y-4">
          {pastConsultations.length > 0 ? (
            pastConsultations.map((consultation) => (
              <div key={consultation.id} className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-lg font-black text-slate-900">
                      {consultation.category || 'Consultation'}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Dr. {consultation.doctorName || 'Your Doctor'}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      {formatConsultationDateTime(consultation.consultationDate, consultation.consultationTime)}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    {consultation.status || 'Completed'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-stone-300 p-6 text-sm text-slate-500">
              <i className="fas fa-check-circle mr-2"></i>
              No past consultations yet.
            </div>
          )}
        </div>
      </article>
    </section>
  );

  return (
    <div className="min-h-screen bg-[#f6f2e9]">
      <Navbar navigate={navigate} currentUser={currentUser} />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-4xl bg-[linear-gradient(135deg,rgba(15,23,42,1),rgba(14,116,144,0.92),rgba(13,148,136,0.88))] px-8 py-10 text-white shadow-[0_26px_90px_rgba(15,23,42,0.18)]">
          <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-100/75">Patient Dashboard</p>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Welcome back, {displayName}</h1>
              <p className="mt-4 text-sm leading-8 text-cyan-50/85">{formatDate()}</p>
              <p className="mt-5 max-w-2xl text-sm leading-8 text-cyan-50/85">
                View your scheduled consultations, access medical records, and manage your healthcare appointments in one place.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {patientNavItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setActiveTab(item.label)}
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
              <div className="rounded-3xl border border-white/14 bg-white/10 p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/75">Upcoming</p>
                <p className="mt-3 text-2xl font-black">
                  {upcomingConsultations.length}
                </p>
              </div>
              <div className="rounded-3xl border border-white/14 bg-white/10 p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/75">Total Consultations</p>
                <p className="mt-3 text-2xl font-black">{consultations.length}</p>
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <section className="mt-8 rounded-4xl bg-white p-8 text-center shadow-[0_16px_60px_rgba(15,23,42,0.06)]">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-stone-200 border-t-teal-600"></div>
            <p className="mt-4 text-sm text-slate-500">Loading your consultations...</p>
          </section>
        ) : null}

        {error ? (
          <section className="mt-8 rounded-4xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            {error}
          </section>
        ) : null}

        {!loading && !error ? (
          <>
            <section className="mt-8 rounded-3xl border border-stone-200 bg-white px-6 py-5 shadow-[0_16px_60px_rgba(15,23,42,0.06)]">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-600">Active Window</p>
              <div className="mt-3 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">{activeTab}</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Manage your healthcare consultations and appointments.
                  </p>
                </div>
                <span className="rounded-full bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800">
                  {activeTab}
                </span>
              </div>
            </section>

            {activeTab === 'Dashboard' ? renderDashboard() : null}
            {activeTab === 'Consultations' ? renderConsultations() : null}
            {activeTab === 'Medical Records' ? (
              <section className="mt-8 rounded-4xl bg-white p-6 text-center shadow-[0_16px_60px_rgba(15,23,42,0.06)]">
                <i className="fas fa-file-medical text-4xl text-slate-300"></i>
                <p className="mt-4 text-slate-500">Medical records feature coming soon.</p>
              </section>
            ) : null}
            {activeTab === 'Prescriptions' ? (
              <section className="mt-8 rounded-4xl bg-white p-6 text-center shadow-[0_16px_60px_rgba(15,23,42,0.06)]">
                <i className="fas fa-prescription-bottle text-4xl text-slate-300"></i>
                <p className="mt-4 text-slate-500">Prescriptions feature coming soon.</p>
              </section>
            ) : null}
            {activeTab === 'Messages' ? (
              <section className="mt-8 rounded-4xl bg-white p-6 text-center shadow-[0_16px_60px_rgba(15,23,42,0.06)]">
                <i className="fas fa-envelope text-4xl text-slate-300"></i>
                <p className="mt-4 text-slate-500">Messages feature coming soon.</p>
              </section>
            ) : null}
          </>
        ) : null}
      </main>
    </div>
  );
};

export default PatientDashboard;
