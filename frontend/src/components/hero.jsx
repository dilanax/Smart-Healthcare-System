import React, { useEffect, useRef, useState } from 'react';
import {
  FiActivity,
  FiArrowRight,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiMail,
  FiMic,
  FiPhone,
  FiPlay,
  FiStar,
  FiTrendingUp,
  FiVolume2,
} from 'react-icons/fi';

const heroSlides = [
  {
    url: 'https://assets.mixkit.co/videos/preview/mixkit-team-of-doctors-walking-through-a-hospital-1728-large.mp4',
    fallback:
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=2000&q=80',
    title: 'Precision Care For Every Patient',
    headline: 'Specialist healthcare with calm, modern support.',
    subtitle:
      'Consult trusted doctors, manage appointments, and access coordinated care from one professional digital experience.',
    eyebrow: 'Integrated Care Platform',
    metric: '24/7 Care Access',
    detail: 'Fast support for appointments, records, and urgent guidance.',
  },
  {
    url: 'https://assets.mixkit.co/videos/preview/mixkit-doctor-checking-heart-beat-32610-large.mp4',
    fallback:
      'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=2000&q=80',
    title: 'Expert Teams, Clear Decisions',
    headline: 'Experienced specialists with patient-first coordination.',
    subtitle:
      'From cardiology to diagnostics, every journey is supported by specialists, transparent records, and timely follow-up.',
    eyebrow: 'Clinical Excellence',
    metric: '< 15 min Response',
    detail: 'Designed for speed without sacrificing reassurance.',
  },
  {
    url: 'https://assets.mixkit.co/videos/preview/mixkit-female-doctor-working-in-a-laboratory-32704-large.mp4',
    fallback:
      'https://images.unsplash.com/photo-1584515933487-779824d29309?w=2000&q=80',
    title: 'Diagnostics Built For Confidence',
    headline: 'Advanced tools, thoughtful reporting, smarter outcomes.',
    subtitle:
      'A refined digital workflow helps patients and doctors stay aligned with reports, appointments, and next steps.',
    eyebrow: 'Modern Diagnostics',
    metric: '98% Satisfaction',
    detail: 'Trusted by patients who value clarity and continuity.',
  },
];

const services = [
  {
    icon: 'Heart',
    title: 'Cardiology',
    desc: 'Advanced heart care with modern diagnostics',
    patients: '15,000+',
    doctors: '25+',
    color: '#e53e3e',
  },
  {
    icon: 'Brain',
    title: 'Neurology',
    desc: 'Expert care for neurological disorders',
    patients: '8,500+',
    doctors: '18+',
    color: '#3182ce',
  },
  {
    icon: 'Child',
    title: 'Pediatrics',
    desc: 'Compassionate care for children',
    patients: '12,000+',
    doctors: '22+',
    color: '#38a169',
  },
  {
    icon: 'Bone',
    title: 'Orthopedics',
    desc: 'Complete musculoskeletal treatments',
    patients: '10,200+',
    doctors: '20+',
    color: '#d69e2e',
  },
  {
    icon: 'Lungs',
    title: 'Pulmonology',
    desc: 'Advanced respiratory care',
    patients: '7,800+',
    doctors: '15+',
    color: '#06b6d4',
  },
  {
    icon: 'Lab',
    title: 'Lab Diagnostics',
    desc: 'Fast and accurate diagnostics',
    patients: '25,000+',
    doctors: '12+',
    color: '#7c3aed',
  },
];

const fallbackDoctors = [
  {
    userId: 1,
    firstName: 'Sarah',
    lastName: 'Johnson',
    specialty: 'Cardiologist',
    imageUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80',
    rating: 4.9,
    experienceYears: 15,
    patientCount: 5200,
    availability: 'Available Today',
  },
  {
    userId: 2,
    firstName: 'Michael',
    lastName: 'Chen',
    specialty: 'Neurologist',
    imageUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=80',
    rating: 4.8,
    experienceYears: 12,
    patientCount: 3800,
    availability: 'Available Tomorrow',
  },
  {
    userId: 3,
    firstName: 'Emily',
    lastName: 'Rodriguez',
    specialty: 'Pediatrician',
    imageUrl: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&q=80',
    rating: 5.0,
    experienceYears: 10,
    patientCount: 4500,
    availability: 'Available Today',
  },
  {
    userId: 4,
    firstName: 'James',
    lastName: 'Wilson',
    specialty: 'Orthopedic Surgeon',
    imageUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=80',
    rating: 4.9,
    experienceYears: 18,
    patientCount: 6100,
    availability: 'Available Today',
  },
];

const testimonials = [
  {
    name: 'Emily Rodriguez',
    role: 'Cardiac Patient',
    text: 'The cardiology team saved my life. Exceptional care throughout my treatment.',
    rating: 5,
    image: 'https://randomuser.me/api/portraits/women/1.jpg',
  },
  {
    name: 'James Wilson',
    role: 'Orthopedic Patient',
    text: "After knee replacement, I'm back to tennis. The latest techniques made recovery smooth.",
    rating: 5,
    image: 'https://randomuser.me/api/portraits/men/2.jpg',
  },
  {
    name: 'Sarah Thompson',
    role: 'Parent',
    text: 'The pediatric team made my son feel calm and safe from the first visit.',
    rating: 5,
    image: 'https://randomuser.me/api/portraits/women/3.jpg',
  },
];

function useCounter(target, duration, active) {
  const [v, setV] = useState(0);

  useEffect(() => {
    if (!active) return;
    let start = null;

    const tick = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setV(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [target, duration, active]);

  return v;
}

const Hero = ({ navigate, currentUser }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [statsOn, setStatsOn] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [doctorProfiles, setDoctorProfiles] = useState(fallbackDoctors);
  const statsRef = useRef(null);
  const videoRef = useRef(null);
  const slideInterval = useRef(null);

  const patients = useCounter(50000, 2000, statsOn);
  const doctorsCount = useCounter(150, 2000, statsOn);
  const success = useCounter(98, 1800, statsOn);
  const clinics = useCounter(25, 2200, statsOn);
  const activeSlide = heroSlides[currentSlide];

  useEffect(() => {
    slideInterval.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
      setIsVideoLoading(true);
      setVideoError(false);
    }, 8000);
    return () => clearInterval(slideInterval.current);
  }, []);

  useEffect(() => {
    const loadDoctorProfiles = async () => {
      try {
        const response = await fetch('http://localhost:8082/api/doctors');
        if (!response.ok) return;
        const data = await response.json();
        const list = Array.isArray(data) ? data : [];
        if (list.length > 0) {
          setDoctorProfiles(list);
        }
      } catch {
        // Keep fallback cards when doctor service is unavailable.
      }
    };

    loadDoctorProfiles();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStatsOn(true);
      },
      { threshold: 0.3 },
    );

    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const handleVideoLoad = () => {
    setIsVideoLoading(false);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleVideoError = () => {
    setVideoError(true);
    setIsVideoLoading(false);
  };

  const goToSlide = (index) => {
    if (index === currentSlide) return;
    setCurrentSlide(index);
    setIsVideoLoading(true);
    setVideoError(false);
    clearInterval(slideInterval.current);
    slideInterval.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
      setIsVideoLoading(true);
      setVideoError(false);
    }, 8000);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
    }
  };

  return (
    <div className="bg-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        * { font-family: 'Plus Jakarta Sans', sans-serif; }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        .video-loading {
          background: linear-gradient(90deg, #07111d 0%, #123147 50%, #07111d 100%);
          background-size: 200% 100%;
          animation: shimmer 1.5s linear infinite;
        }
      `}</style>

      <section className="relative overflow-hidden bg-slate-950 pt-28" id="home">
        <div className="absolute inset-0">
          {heroSlides.map((slide, idx) => (
            <div
              key={slide.title}
              className={`absolute inset-0 transition-all duration-700 ${
                currentSlide === idx ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {!videoError ? (
                <video
                  ref={currentSlide === idx ? videoRef : null}
                  className="h-full w-full object-cover"
                  autoPlay={currentSlide === idx}
                  loop
                  muted
                  playsInline
                  onLoadedData={handleVideoLoad}
                  onError={handleVideoError}
                >
                  <source src={slide.url} type="video/mp4" />
                </video>
              ) : (
                <img src={slide.fallback} alt={slide.title} className="h-full w-full object-cover" />
              )}
              {isVideoLoading && currentSlide === idx && !videoError && (
                <div className="video-loading absolute inset-0" />
              )}
              <div className="absolute inset-0 bg-slate-950/62" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.25),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(20,184,166,0.22),transparent_28%)]" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/75 to-slate-950/25" />
            </div>
          ))}
        </div>

        <div className="relative z-20 mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="max-w-3xl py-10 text-white lg:py-20">
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-400/20 bg-rose-500/12 px-4 py-2 text-sm font-semibold text-rose-100 backdrop-blur-md">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400 shadow-[0_0_18px_rgba(251,113,133,0.8)]" />
                Emergency-ready digital healthcare
              </div>

              <div className="mt-8 space-y-5">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-teal-300/90">
                  {activeSlide.eyebrow}
                </p>
                <h1 className="max-w-4xl text-5xl font-semibold leading-[0.96] tracking-tight sm:text-6xl lg:text-7xl">
                  {activeSlide.headline}
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-slate-200/85 sm:text-xl">
                  {activeSlide.subtitle}
                </p>
              </div>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    if (currentUser) {
                      navigate('/appointment');
                    } else {
                      navigate('/login');
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-teal-400 to-cyan-500 px-7 py-3.5 text-base font-semibold text-slate-950 shadow-[0_18px_45px_-18px_rgba(34,211,238,0.75)] transition hover:translate-y-[-1px]"
                >
                  <FiCalendar className="text-lg" />
                  Book Appointment
                  <FiArrowRight />
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/8 px-7 py-3.5 text-base font-semibold text-white backdrop-blur-md transition hover:bg-white/14"
                >
                  <FiPhone className="text-lg" />
                  Call Emergency
                </button>
              </div>

              <div
                ref={statsRef}
                className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4"
              >
                {[
                  { label: 'Patients Served', value: `${patients.toLocaleString()}+` },
                  { label: 'Specialist Doctors', value: `${doctorsCount}+` },
                  { label: 'Satisfaction Rate', value: `${success}%` },
                  { label: 'Connected Clinics', value: `${clinics}+` },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-3xl border border-white/10 bg-white/10 px-4 py-5 backdrop-blur-md"
                  >
                    <p className="text-2xl font-semibold text-white sm:text-3xl">{item.value}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-300">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative lg:py-16">
              <div className="rounded-[32px] border border-white/12 bg-white/10 p-4 shadow-[0_28px_70px_-28px_rgba(15,23,42,0.75)] backdrop-blur-xl">
                <div className="overflow-hidden rounded-[26px] border border-white/10 bg-slate-950/55">
                  <div className="border-b border-white/10 px-6 py-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-teal-300">
                          Live Slide Overview
                        </p>
                        <h3 className="mt-2 text-2xl font-semibold text-white">
                          {activeSlide.title}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={toggleMute}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/12 bg-white/10 text-white transition hover:bg-white/16"
                      >
                        <FiVolume2 className="text-lg" />
                      </button>
                    </div>
                    <p className="mt-3 max-w-md text-sm leading-7 text-slate-300">
                      {activeSlide.detail}
                    </p>
                  </div>

                  <div className="space-y-4 px-6 py-6">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-400/18 text-teal-300">
                            <FiClock className="text-lg" />
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-white">{activeSlide.metric}</p>
                            <p className="text-sm text-slate-300">Responsive patient support</p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/18 text-cyan-300">
                            <FiTrendingUp className="text-lg" />
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-white">Digital-first workflow</p>
                            <p className="text-sm text-slate-300">Appointments, reports, and follow-up</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {heroSlides.map((slide, idx) => (
                        <button
                          key={slide.title}
                          type="button"
                          onClick={() => goToSlide(idx)}
                          className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                            currentSlide === idx
                              ? 'border-teal-300/40 bg-white/14'
                              : 'border-white/8 bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">{slide.title}</p>
                            <p className="truncate text-xs text-slate-300">{slide.eyebrow}</p>
                          </div>
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full ${
                              currentSlide === idx
                                ? 'bg-teal-400 text-slate-950'
                                : 'bg-white/10 text-white'
                            }`}
                          >
                            <FiPlay className="ml-0.5 text-sm" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-3">
            {heroSlides.map((slide, idx) => (
              <button
                key={slide.title}
                type="button"
                onClick={() => goToSlide(idx)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  currentSlide === idx ? 'w-16 bg-teal-400' : 'w-8 bg-white/35 hover:bg-white/55'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-24" id="services">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <span className="rounded-full bg-teal-50 px-4 py-2 text-sm font-semibold uppercase tracking-wider text-teal-600">
              Medical Services
            </span>
            <h2 className="mt-4 text-4xl font-bold text-gray-800">
              Comprehensive Healthcare Services
            </h2>
            <p className="mt-4 text-gray-600">
              We provide holistic healthcare solutions tailored to your unique needs
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div
                key={service.title}
                onClick={() => setSelectedService(service)}
                className="cursor-pointer rounded-3xl bg-white p-6 shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
              >
                <div
                  className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-sm font-semibold text-gray-700"
                  style={{ background: `${service.color}15` }}
                >
                  {service.icon}
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-800">{service.title}</h3>
                <p className="mb-3 text-sm text-gray-500">{service.desc}</p>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{service.patients} patients</span>
                  <span>{service.doctors} doctors</span>
                </div>
                <button className="mt-4 flex items-center gap-1 text-sm font-medium text-teal-600 transition hover:gap-2">
                  Learn More <FiArrowRight className="text-xs" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-24" id="doctors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <span className="rounded-full bg-teal-50 px-4 py-2 text-sm font-semibold uppercase tracking-wider text-teal-600">
              Medical Experts
            </span>
            <h2 className="mt-4 text-4xl font-bold text-gray-800">Meet Our Specialist Doctors</h2>
            <p className="mt-4 text-gray-600">
              Our board-certified doctors bring years of experience and compassion
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {doctorProfiles.map((doctor) => (
              <div
                key={doctor.userId}
                className="overflow-hidden rounded-3xl bg-white shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={doctor.imageUrl || `https://i.pravatar.cc/400?u=${doctor.userId}`}
                    alt={`Dr. ${doctor.firstName} ${doctor.lastName}`}
                    className="h-full w-full object-cover transition duration-500 hover:scale-110"
                  />
                  <div
                    className={`absolute top-3 right-3 rounded-full px-3 py-1 text-xs ${
                      (doctor.availability || 'Available Today') === 'Available Today'
                        ? 'bg-green-500 text-white'
                        : 'bg-yellow-500 text-white'
                    }`}
                  >
                    {doctor.availability || 'Available Today'}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-800">
                    Dr. {doctor.firstName} {doctor.lastName}
                  </h3>
                  <p className="text-sm font-medium text-teal-600">
                    {doctor.specialization || doctor.specialty || 'General Medicine'}
                  </p>
                  <div className="mt-2 flex justify-between text-xs text-gray-500">
                    <span>{doctor.experienceYears || 0} yrs</span>
                    <span>{(doctor.patientCount || 0).toLocaleString()}+ patients</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <FiStar
                        key={`${doctor.userId}-${i}`}
                        className={`text-xs ${
                          i < Math.round(doctor.rating || 0) ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (currentUser) {
                        navigate(
                          `/appointment?doctor=${encodeURIComponent(
                            `${doctor.firstName} ${doctor.lastName}`,
                          )}`,
                        );
                      } else {
                        navigate('/login');
                      }
                    }}
                    className="mt-3 w-full rounded-xl bg-teal-600 py-2 text-sm font-medium text-white transition hover:bg-teal-700"
                  >
                    Book Appointment
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <span className="rounded-full bg-teal-50 px-4 py-2 text-sm font-semibold uppercase tracking-wider text-teal-600">
              Patient Stories
            </span>
            <h2 className="mt-4 text-4xl font-bold text-gray-800">What Our Patients Say</h2>
            <p className="mt-4 text-gray-600">
              Real experiences from people who trusted us with their health
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className="rounded-3xl bg-white p-6 shadow-md transition hover:shadow-lg"
              >
                <div className="mb-4 flex items-center gap-3">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-bold text-gray-800">{testimonial.name}</h4>
                    <p className="text-xs text-teal-600">{testimonial.role}</p>
                  </div>
                </div>
                <div className="mb-3 flex gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <FiStar key={`${testimonial.name}-${i}`} className="text-sm text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-gray-600">"{testimonial.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-teal-600 to-cyan-600 py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
            Ready to Start Your Health Journey?
          </h2>
          <p className="mb-6 text-lg text-white/90">
            Book an appointment today and experience the best healthcare services
          </p>
          <button className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 font-semibold text-teal-600 transition-all hover:scale-105 hover:shadow-xl">
            <FiCalendar />
            Schedule Your Visit
            <FiArrowRight />
          </button>
        </div>
      </section>

      <section className="bg-white py-20" id="about">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <span className="rounded-full bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-600">
                About Us
              </span>
              <h2 className="mt-4 text-3xl font-bold text-gray-800">
                Leading Healthcare Provider Since 2012
              </h2>
              <p className="mt-4 leading-relaxed text-gray-600">
                HealthCare+ is dedicated to providing exceptional medical services with a
                patient-first approach. Our network of advanced clinics ensures you receive
                top-tier treatment with empathy and innovation.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="text-teal-500" />
                  <span className="text-sm">24/7 Emergency Care</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiActivity className="text-teal-500" />
                  <span className="text-sm">Modern Equipment</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiPhone className="text-teal-500" />
                  <span className="text-sm">Ambulance Service</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiMic className="text-teal-500" />
                  <span className="text-sm">E-Consultation</span>
                </div>
              </div>
            </div>
            <div id="contact" className="rounded-3xl bg-gray-50 p-6 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-800">
                <FiMail className="text-teal-500" />
                Quick Contact
              </h3>
              <p className="mb-4 text-gray-500">Have questions? Reach out to our care team.</p>
              <form className="space-y-3">
                <input
                  type="text"
                  placeholder="Full Name"
                  className="w-full rounded-lg border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-teal-300"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full rounded-lg border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-teal-300"
                />
                <textarea
                  rows="3"
                  placeholder="Your Message"
                  className="w-full rounded-lg border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-teal-300"
                ></textarea>
                <button className="w-full rounded-lg bg-teal-600 py-3 font-semibold text-white transition hover:bg-teal-700">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 py-8 text-gray-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-teal-600 p-2 text-white">
                <FiActivity />
              </div>
              <span className="text-xl font-bold text-white">
                Health<span className="text-teal-400">Care+</span>
              </span>
            </div>
            <div className="flex gap-6 text-sm">
              <a href="#" className="transition hover:text-teal-400">
                Privacy Policy
              </a>
              <a href="#" className="transition hover:text-teal-400">
                Terms of Service
              </a>
              <a href="#" className="transition hover:text-teal-400">
                Accessibility
              </a>
            </div>
            <div className="flex gap-4 text-xl">
              <FiActivity className="cursor-pointer transition hover:text-teal-400" />
              <FiTrendingUp className="cursor-pointer transition hover:text-teal-400" />
              <FiStar className="cursor-pointer transition hover:text-teal-400" />
              <FiPlay className="cursor-pointer transition hover:text-teal-400" />
            </div>
          </div>
          <div className="mt-6 border-t border-gray-800 pt-6 text-center text-sm text-gray-500">
            Copyright {new Date().getFullYear()} HealthCare+. All rights reserved.
          </div>
        </div>
      </footer>

      {selectedService && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setSelectedService(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-sm font-semibold text-teal-700">
                {selectedService.icon}
              </div>
              <h3 className="mb-2 text-2xl font-bold text-gray-800">{selectedService.title}</h3>
              <p className="mb-4 text-gray-600">{selectedService.desc}</p>
              <div className="mb-4 rounded-lg bg-gray-50 p-4">
                <div className="mb-2 flex justify-between">
                  <span>Patients Treated:</span>
                  <span className="font-bold">{selectedService.patients}</span>
                </div>
                <div className="flex justify-between">
                  <span>Specialists:</span>
                  <span className="font-bold">{selectedService.doctors}</span>
                </div>
              </div>
              <button className="w-full rounded-lg bg-teal-600 py-3 font-semibold text-white transition hover:bg-teal-700">
                Book Appointment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Hero;
