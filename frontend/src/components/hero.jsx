import React, { useEffect, useMemo, useState } from 'react';
import { fetchDoctors } from '../lib/auth';

const services = [
  { title: 'Cardiology', desc: 'Advanced heart care with modern diagnostics', accent: 'from-rose-500 to-orange-400' },
  { title: 'Neurology', desc: 'Expert care for neurological disorders', accent: 'from-blue-500 to-cyan-400' },
  { title: 'Pediatrics', desc: 'Compassionate care for children and families', accent: 'from-emerald-500 to-teal-400' },
  { title: 'Orthopedics', desc: 'Complete musculoskeletal treatment and recovery', accent: 'from-amber-500 to-yellow-400' },
  { title: 'Pulmonology', desc: 'Respiratory support with specialist consultation', accent: 'from-sky-500 to-cyan-400' },
  { title: 'Diagnostics', desc: 'Fast reporting and coordinated lab workflows', accent: 'from-violet-500 to-fuchsia-400' },
];

const testimonials = [
  { name: 'Emily Rodriguez', role: 'Cardiac Patient', text: 'The cardiology team guided every step of my recovery with real care.' },
  { name: 'James Wilson', role: 'Orthopedic Patient', text: 'Treatment planning was clear, responsive, and highly professional.' },
  { name: 'Sarah Thompson', role: 'Parent', text: 'The pediatric support team made a stressful situation feel manageable.' },
];

const statusTone = (verified) =>
  verified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700';

const Hero = () => {
  const [doctorProfiles, setDoctorProfiles] = useState([]);
  const [doctorLoading, setDoctorLoading] = useState(true);
  const [doctorError, setDoctorError] = useState('');

  useEffect(() => {
    const loadDoctors = async () => {
      setDoctorLoading(true);
      setDoctorError('');

      try {
        const response = await fetchDoctors();
        setDoctorProfiles(Array.isArray(response?.data) ? response.data : []);
      } catch (error) {
        setDoctorError(error.message || 'Failed to load doctor data.');
      } finally {
        setDoctorLoading(false);
      }
    };

    loadDoctors();
  }, []);

  const activeDoctors = useMemo(
    () => doctorProfiles.filter((doctor) => doctor?.status === 'ACTIVE'),
    [doctorProfiles]
  );

  return (
    <div className="bg-white">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.22),_transparent_32%),linear-gradient(135deg,_#082f49_0%,_#0f172a_45%,_#115e59_100%)] text-white">
        <div className="mx-auto grid min-h-[88vh] max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div className="flex flex-col justify-center">
            <span className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/80">
              Smart Healthcare Platform
            </span>
            <h1 className="mt-6 max-w-3xl text-5xl font-black leading-tight sm:text-6xl">
              Your health operations, specialist care, and digital workflows in one place.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
              Built for modern healthcare teams with structured doctor management, patient support, notifications, and secure user access.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button className="rounded-full bg-white px-7 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5">
                Book Appointment
              </button>
              <button className="rounded-full border border-white/20 px-7 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                Call Emergency
              </button>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-4">
              <div className="rounded-[1.6rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-3xl font-black text-cyan-300">50K+</p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-300">Patients</p>
              </div>
              <div className="rounded-[1.6rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-3xl font-black text-cyan-300">{activeDoctors.length}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-300">Active Doctors</p>
              </div>
              <div className="rounded-[1.6rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-3xl font-black text-cyan-300">98%</p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-300">Success Rate</p>
              </div>
              <div className="rounded-[1.6rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-3xl font-black text-cyan-300">24/7</p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-300">Emergency</p>
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <div className="w-full rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.24)] backdrop-blur">
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/75">Live Doctor Service</p>
              <h2 className="mt-3 text-3xl font-black">Active specialist registry</h2>
              <div className="mt-6 grid gap-4">
                {doctorLoading ? (
                  <div className="rounded-[1.4rem] border border-white/10 bg-black/10 p-5 text-sm text-slate-200">
                    Loading active doctors from the database...
                  </div>
                ) : null}
                {!doctorLoading && doctorError ? (
                  <div className="rounded-[1.4rem] border border-rose-300/30 bg-rose-400/10 p-5 text-sm text-rose-100">
                    {doctorError}
                  </div>
                ) : null}
                {!doctorLoading && !doctorError && activeDoctors.slice(0, 3).map((doctor) => (
                  <div key={doctor.id} className="rounded-[1.4rem] border border-white/10 bg-black/10 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-white">{doctor.fullName}</h3>
                        <p className="mt-1 text-sm text-cyan-100">{doctor.specialization}</p>
                        <p className="mt-2 text-sm text-slate-300">{doctor.department} | Room {doctor.roomNumber}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${doctor.verified ? 'bg-emerald-300 text-slate-950' : 'bg-amber-300 text-slate-950'}`}>
                        {doctor.verified ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
                {!doctorLoading && !doctorError && activeDoctors.length === 0 ? (
                  <div className="rounded-[1.4rem] border border-white/10 bg-black/10 p-5 text-sm text-slate-200">
                    No active doctors are available in the database right now.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-gray-50" id="services">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-teal-600 font-semibold text-sm uppercase tracking-wider bg-teal-50 px-4 py-2 rounded-full">Medical Services</span>
            <h2 className="text-4xl font-bold mt-4 text-gray-800">Comprehensive Healthcare Services</h2>
            <p className="text-gray-600 mt-4">Structured care pathways designed around patient and specialist workflows.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div key={service.title} className="bg-white rounded-2xl p-6 shadow-md hover:-translate-y-1 transition-all">
                <div className={`h-3 w-24 rounded-full bg-gradient-to-r ${service.accent}`}></div>
                <h3 className="mt-5 text-xl font-bold text-gray-800">{service.title}</h3>
                <p className="mt-3 text-sm leading-7 text-gray-500">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-white" id="doctors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-teal-600 font-semibold text-sm uppercase tracking-wider bg-teal-50 px-4 py-2 rounded-full">Medical Experts</span>
            <h2 className="text-4xl font-bold mt-4 text-gray-800">Meet Our Specialized Doctors</h2>
            <p className="text-gray-600 mt-4">This section now shows live active doctors from the current database.</p>
          </div>

          {doctorLoading ? (
            <div className="rounded-2xl bg-gray-50 p-8 text-center text-sm text-gray-500">
              Loading active doctors from the database...
            </div>
          ) : null}

          {!doctorLoading && doctorError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">
              {doctorError}
            </div>
          ) : null}

          {!doctorLoading && !doctorError && activeDoctors.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {activeDoctors.map((doctor) => (
                <div key={doctor.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:-translate-y-1 transition-all">
                  <div className="bg-[linear-gradient(135deg,_#0f172a,_#115e59)] p-6 text-white">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/70">{doctor.department}</p>
                        <h3 className="mt-3 text-xl font-bold">{doctor.fullName}</h3>
                        <p className="mt-2 text-sm text-cyan-100">{doctor.specialization}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(doctor.verified)}`}>
                        {doctor.verified ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="grid gap-2 text-xs text-gray-500">
                      <p>Experience: {doctor.experienceYears} years</p>
                      <p>Room: {doctor.roomNumber}</p>
                      <p>Fee: LKR {doctor.consultationFee}</p>
                      <p>Available: {Array.isArray(doctor.availableDays) ? doctor.availableDays.join(', ') : 'N/A'}</p>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-gray-600">
                      {doctor.biography || `${doctor.fullName} is currently available for ${doctor.specialization.toLowerCase()} consultations.`}
                    </p>
                    <button className="mt-4 w-full py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition text-sm">
                      View Doctor Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {!doctorLoading && !doctorError && activeDoctors.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
              No active doctors are available in the database right now.
            </div>
          ) : null}
        </div>
      </section>

      <section className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-teal-600 font-semibold text-sm uppercase tracking-wider bg-teal-50 px-4 py-2 rounded-full">Patient Stories</span>
            <h2 className="text-4xl font-bold mt-4 text-gray-800">What Our Patients Say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <div key={testimonial.name} className="bg-white rounded-2xl p-6 shadow-md">
                <h4 className="font-bold text-gray-800">{testimonial.name}</h4>
                <p className="mt-1 text-teal-600 text-xs">{testimonial.role}</p>
                <p className="mt-4 text-sm leading-7 text-gray-600">"{testimonial.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-teal-600 to-cyan-600">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Start Your Health Journey?</h2>
          <p className="text-white/90 text-lg mb-6">Book an appointment today and connect with our active specialist doctors.</p>
          <button className="bg-white text-teal-600 px-8 py-3 rounded-full font-semibold hover:shadow-xl transition-all inline-flex items-center gap-2">
            <i className="fas fa-calendar-check"></i> Schedule Your Visit
          </button>
        </div>
      </section>
    </div>
  );
};

export default Hero;
