import { useState, useEffect } from "react";
import Navbar from "../components/navbar";
import Hero from "../components/hero";
import { fetchVideoConsultationsByPatientEmail } from "../lib/auth";

export default function Home({ navigate, currentUser }) {
  const isAdmin = currentUser?.role === 'ADMIN';
  const isPatient = currentUser?.role === 'PATIENT';
  const [consultations, setConsultations] = useState([]);
  const [loadingConsultations, setLoadingConsultations] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    const loadConsultations = async () => {
      if (isPatient && currentUser?.email) {
        try {
          setLoadingConsultations(true);
          const response = await fetchVideoConsultationsByPatientEmail(currentUser.email);
          if (response?.data && Array.isArray(response.data)) {
            setConsultations(response.data);
          }
        } catch (error) {
          console.error('Error loading consultations:', error);
        } finally {
          setLoadingConsultations(false);
        }
      }
    };

    loadConsultations();
  }, [isPatient, currentUser?.email]);

  const isUpcoming = (date, time) => {
    try {
      const consultationDateTime = new Date(`${date} ${time}`);
      return consultationDateTime > new Date();
    } catch {
      return false;
    }
  };

  const getUpcomingConsultations = () => {
    return consultations.filter(c => isUpcoming(c.consultationDate, c.consultationTime)).slice(0, 3);
  };

  const handleJoinConsultation = (meetingLink) => {
    if (meetingLink) {
      window.open(meetingLink, '_blank');
    }
  };

  const handleCopyLink = (meetingLink, id) => {
    if (meetingLink) {
      navigator.clipboard.writeText(meetingLink);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div>
      <Navbar navigate={navigate} currentUser={currentUser} />
      <Hero />

      {/* Patient Consultations Section */}
      {isPatient && (
        <section className="bg-gradient-to-br from-slate-50 to-stone-50 px-4 py-12">
          <div className="mx-auto max-w-6xl">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-slate-900">
                  <i className="fas fa-video text-teal-600 mr-3"></i>
                  Your Video Consultations
                </h2>
                <p className="mt-2 text-slate-600">Upcoming appointments with doctors</p>
              </div>
              <button
                onClick={() => navigate('/patient-dashboard')}
                className="rounded-full border-2 border-teal-600 px-6 py-3 text-sm font-semibold text-teal-600 transition hover:bg-teal-50"
              >
                View All
              </button>
            </div>

            {loadingConsultations ? (
              <div className="text-center py-12">
                <i className="fas fa-spinner fa-spin text-3xl text-teal-600"></i>
                <p className="mt-3 text-slate-600">Loading consultations...</p>
              </div>
            ) : getUpcomingConsultations().length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {getUpcomingConsultations().map((consultation) => (
                  <div
                    key={consultation.id}
                    className="rounded-2xl border-2 border-teal-100 bg-white p-6 shadow-lg hover:shadow-xl transition"
                  >
                    {/* Doctor Name */}
                    <div className="mb-4 flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-teal-100 flex items-center justify-center">
                        <i className="fas fa-stethoscope text-teal-600 text-lg"></i>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-500 uppercase">Doctor</p>
                        <p className="text-lg font-black text-slate-900">{consultation.doctorName || 'Dr. Smith'}</p>
                      </div>
                    </div>

                    {/* Consultation Details */}
                    <div className="mb-4 space-y-2 border-t border-slate-200 pt-4">
                      {/* Date & Time */}
                      <div className="flex items-center gap-2 text-sm">
                        <i className="fas fa-calendar text-teal-600 w-4"></i>
                        <span className="text-slate-700 font-semibold">
                          {new Date(consultation.consultationDate).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <i className="fas fa-clock text-teal-600 w-4"></i>
                        <span className="text-slate-700 font-semibold">{consultation.consultationTime}</span>
                      </div>

                      {/* Category */}
                      {consultation.category && (
                        <div className="flex items-center gap-2 text-sm">
                          <i className="fas fa-tag text-teal-600 w-4"></i>
                          <span className="inline-block rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-700">
                            {consultation.category}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleJoinConsultation(consultation.meetingLink)}
                        disabled={!consultation.meetingLink}
                        className="flex-1 rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <i className="fas fa-video"></i>
                        Join
                      </button>
                      <button
                        onClick={() => handleCopyLink(consultation.meetingLink, consultation.id)}
                        disabled={!consultation.meetingLink}
                        className="flex-1 rounded-full border-2 border-teal-600 px-4 py-2 text-sm font-semibold text-teal-600 transition hover:bg-teal-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {copiedId === consultation.id ? (
                          <>
                            <i className="fas fa-check mr-1"></i>
                            Copied
                          </>
                        ) : (
                          <>
                            <i className="fas fa-copy mr-1"></i>
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center">
                <i className="fas fa-calendar-times text-5xl text-slate-400"></i>
                <p className="mt-4 text-lg font-semibold text-slate-700">No upcoming consultations</p>
                <p className="mt-2 text-slate-600">Book a consultation with a doctor to get started</p>
                <button
                  onClick={() => navigate('/doctor-service')}
                  className="mt-6 rounded-full bg-teal-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-700"
                >
                  <i className="fas fa-search mr-2"></i>
                  Find a Doctor
                </button>
              </div>
            )}

            {/* Quick Stats */}
            {consultations.length > 0 && (
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
                  <i className="fas fa-clock text-3xl text-teal-600"></i>
                  <p className="mt-2 text-sm font-semibold text-slate-600">Upcoming</p>
                  <p className="text-2xl font-black text-slate-900">{getUpcomingConsultations().length}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
                  <i className="fas fa-stethoscope text-3xl text-cyan-600"></i>
                  <p className="mt-2 text-sm font-semibold text-slate-600">Total</p>
                  <p className="text-2xl font-black text-slate-900">{consultations.length}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
                  <i className="fas fa-check-circle text-3xl text-emerald-600"></i>
                  <p className="mt-2 text-sm font-semibold text-slate-600">Completed</p>
                  <p className="text-2xl font-black text-slate-900">
                    {consultations.filter(c => !isUpcoming(c.consultationDate, c.consultationTime)).length}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Admin Section */}
      {isAdmin ? (
        <section className="bg-slate-950 px-4 py-10 text-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/75">Sadun Module</p>
              <h2 className="mt-3 text-3xl font-black">Open the doctor-service frontend</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                Manage verified doctors, specialization details, schedules, departments, and consultation fees using the live `doctor-service` backend.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/doctor-service')}
              className="rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Open doctor-service UI
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}


   
