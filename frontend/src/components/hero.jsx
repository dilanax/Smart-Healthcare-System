import React, { useState, useEffect, useRef } from 'react';

/* ─── VIDEO OPTIONS (EASILY MANAGABLE) ─── */
// You can change videos by updating this array
// Add your own video URLs (MP4 format recommended)
const heroVideos = [
  {
    url: "https://player.vimeo.com/external/434045526.sd.mp4?s=c27ecc553d2235c5e278fa9f06d7a7e2831376f4&profile_id=164&oauth2_token_id=57447761",
    title: "Modern Medical Facility",
    subtitle: "State-of-the-art equipment",
    type: "video"
  },
  {
    url: "https://assets.mixkit.co/videos/preview/mixkit-doctor-checking-heart-beat-32610-large.mp4",
    title: "Expert Medical Care",
    subtitle: "Compassionate professionals",
    type: "video"
  },
  {
    url: "https://assets.mixkit.co/videos/preview/mixkit-female-doctor-working-in-a-laboratory-32704-large.mp4",
    title: "Advanced Diagnostics",
    subtitle: "Precision medicine",
    type: "video"
  },
  {
    url: "https://cdn.pixabay.com/video/2023/03/27/157652-815485416_large.mp4",
    title: "Modern Healthcare",
    subtitle: "Patient-centered approach",
    type: "video"
  }
];

// Fallback images if videos don't load
const fallbackImages = [
  "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=2000&q=80",
  "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=2000&q=80",
  "https://images.unsplash.com/photo-1584515933487-779824d29309?w=2000&q=80",
  "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=2000&q=80"
];

const services = [
  { icon: "🫀", title: "Cardiology", desc: "Advanced heart care with modern diagnostics", patients: "15,000+", doctors: "25+", color: "#e53e3e" },
  { icon: "🧠", title: "Neurology", desc: "Expert care for neurological disorders", patients: "8,500+", doctors: "18+", color: "#3182ce" },
  { icon: "👶", title: "Pediatrics", desc: "Compassionate care for children", patients: "12,000+", doctors: "22+", color: "#38a169" },
  { icon: "🦴", title: "Orthopedics", desc: "Complete musculoskeletal treatments", patients: "10,200+", doctors: "20+", color: "#d69e2e" },
  { icon: "🫁", title: "Pulmonology", desc: "Advanced respiratory care", patients: "7,800+", doctors: "15+", color: "#00b5d8" },
  { icon: "🔬", title: "Lab Diagnostics", desc: "Fast and accurate diagnostics", patients: "25,000+", doctors: "12+", color: "#805ad5" },
];

const fallbackDoctors = [
  { userId: 1, firstName: "Sarah", lastName: "Johnson", specialty: "Cardiologist", imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80", rating: 4.9, experienceYears: 15, patientCount: 5200, availability: "Available Today" },
  { userId: 2, firstName: "Michael", lastName: "Chen", specialty: "Neurologist", imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=80", rating: 4.8, experienceYears: 12, patientCount: 3800, availability: "Available Tomorrow" },
  { userId: 3, firstName: "Emily", lastName: "Rodriguez", specialty: "Pediatrician", imageUrl: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&q=80", rating: 5.0, experienceYears: 10, patientCount: 4500, availability: "Available Today" },
  { userId: 4, firstName: "James", lastName: "Wilson", specialty: "Orthopedic Surgeon", imageUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=80", rating: 4.9, experienceYears: 18, patientCount: 6100, availability: "Available Today" },
];

const testimonials = [
  { name: "Emily Rodriguez", role: "Cardiac Patient", text: "The cardiology team saved my life! Exceptional care throughout my treatment.", rating: 5, image: "https://randomuser.me/api/portraits/women/1.jpg" },
  { name: "James Wilson", role: "Orthopedic Patient", text: "After knee replacement, I'm back to tennis! Latest techniques, smooth recovery.", rating: 5, image: "https://randomuser.me/api/portraits/men/2.jpg" },
  { name: "Sarah Thompson", role: "Parent", text: "Dr. Rodriguez is amazing with children! Made my son feel comfortable.", rating: 5, image: "https://randomuser.me/api/portraits/women/3.jpg" },
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
  const [isPlaying, setIsPlaying] = useState(true);
  const [doctorProfiles, setDoctorProfiles] = useState(fallbackDoctors);
  const statsRef = useRef(null);
  const videoRef = useRef(null);
  const slideInterval = useRef(null);

  const patients = useCounter(50000, 2000, statsOn);
  const doctorsCount = useCounter(150, 2000, statsOn);
  const success = useCounter(98, 1800, statsOn);
  const clinics = useCounter(25, 2200, statsOn);

  // Auto-slide videos
  useEffect(() => {
    slideInterval.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroVideos.length);
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

  // Video load handlers
  const handleVideoLoad = () => {
    setIsVideoLoading(false);
    if (videoRef.current) {
      videoRef.current.play().catch(e => console.log("Video play error:", e));
    }
  };

  const handleVideoError = () => {
    setVideoError(true);
    setIsVideoLoading(false);
  };

  // Stats observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsOn(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const goToSlide = (index) => {
    if (index === currentSlide) return;
    setCurrentSlide(index);
    setIsVideoLoading(true);
    setVideoError(false);
    // Reset interval
    clearInterval(slideInterval.current);
    slideInterval.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroVideos.length);
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
        @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap');
        
        * { font-family: 'Inter', sans-serif; }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(1.02); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes fadeOut {
          from { opacity: 1; transform: scale(1); }
          to { opacity: 0; transform: scale(1.02); }
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideRight {
          from { opacity: 0; transform: translateX(-40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes shimmer {
          0% { background-position: -200%; }
          100% { background-position: 200%; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        
        .animate-fadeOut {
          animation: fadeOut 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        
        .animate-slideUp {
          animation: slideUp 0.8s ease-out forwards;
        }
        
        .animate-slideRight {
          animation: slideRight 0.8s ease-out forwards;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .delay-200 { animation-delay: 0.2s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-600 { animation-delay: 0.6s; }
        
        .hover-scale {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .hover-scale:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }
        
        .video-loading {
          background: linear-gradient(90deg, #1e293b 0%, #334155 50%, #1e293b 100%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
      `}</style>

      {/* HERO SECTION - VIDEO BACKGROUND */}
      <section className="relative min-h-screen overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0">
          {heroVideos.map((video, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-all duration-700 ${
                currentSlide === idx ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              {/* Dark Overlay */}
              <div className="absolute inset-0 bg-black/60 z-20"></div>
              
              {/* Video or Fallback Image */}
              {!videoError ? (
                <video
                  ref={currentSlide === idx ? videoRef : null}
                  className="absolute inset-0 w-full h-full object-cover"
                  autoPlay={currentSlide === idx}
                  loop
                  muted
                  playsInline
                  onLoadedData={handleVideoLoad}
                  onError={handleVideoError}
                >
                  <source src={video.url} type="video/mp4" />
                </video>
              ) : (
                <img
                  src={fallbackImages[idx]}
                  alt={video.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              
              {/* Loading Shimmer */}
              {isVideoLoading && currentSlide === idx && !videoError && (
                <div className="absolute inset-0 video-loading z-30"></div>
              )}
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/50 to-transparent z-20"></div>
            </div>
          ))}
        </div>

        {/* Video Controls - Mute/Unmute Button */}
        <button
          onClick={toggleMute}
          className="absolute bottom-24 right-6 z-30 bg-black/50 backdrop-blur-sm text-white p-3 rounded-full hover:bg-black/70 transition-all"
        >
          <i className="fas fa-volume-up"></i>
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30 flex gap-3">
          {heroVideos.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              className={`transition-all duration-300 rounded-full ${
                currentSlide === idx 
                  ? 'w-8 h-2 bg-white' 
                  : 'w-2 h-2 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>

        {/* Slide Titles */}
        <div className="absolute top-1/3 right-8 z-30 text-right hidden lg:block">
          {heroVideos.map((video, idx) => (
            <div
              key={idx}
              className={`transition-all duration-500 ${
                currentSlide === idx ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform translate-x-10'
              }`}
            >
              <h3 className="text-white text-2xl font-bold">{video.title}</h3>
              <p className="text-white/70 text-sm">{video.subtitle}</p>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="relative z-20 min-h-screen flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="text-white">
                {/* Emergency Badge */}
                <div className="inline-flex items-center gap-2 bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-full px-5 py-2 mb-6 animate-slideRight">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  <span className="text-sm font-semibold tracking-wide">🚨 24/7 Emergency Care Available</span>
                </div>

                {/* Title */}
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-4 animate-slideUp">
                  Your Health,
                  <br />
                  <span className="text-transparent bg-clip-text bg-linear-to-r from-teal-400 to-cyan-400">
                    Our Priority.
                  </span>
                  <br />
                  <span className="text-white/80">Always.</span>
                </h1>

                {/* Description */}
                <p className="text-lg text-white/80 max-w-xl leading-relaxed mb-8 animate-slideUp delay-200">
                  Experience world-class medical care with cutting-edge technology, compassionate doctors,
                  and personalised treatment plans designed just for you.
                </p>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8 animate-slideUp delay-400">
                  <button 
                    onClick={() => {
                      if (currentUser) {
                        navigate('/appointment');
                      } else {
                        navigate('/login');
                      }
                    }}
                    className="group bg-linear-to-r from-teal-500 to-cyan-600 text-white px-8 py-3 rounded-full font-semibold shadow-xl hover:shadow-2xl transition-all hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-calendar-check"></i> Book Appointment
                    <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                  </button>
                  <button className="border-2 border-white/30 backdrop-blur-sm text-white px-8 py-3 rounded-full font-semibold hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                    <i className="fas fa-phone-alt"></i> Call Emergency
                  </button>
                </div>

                {/* Stats */}
                <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slideUp delay-600">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center hover:bg-white/20 transition">
                    <div className="text-2xl md:text-3xl font-bold text-teal-400">{patients.toLocaleString()}+</div>
                    <div className="text-xs text-white/70">Happy Patients</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center hover:bg-white/20 transition">
                    <div className="text-2xl md:text-3xl font-bold text-teal-400">{doctorsCount}+</div>
                    <div className="text-xs text-white/70">Expert Doctors</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center hover:bg-white/20 transition">
                    <div className="text-2xl md:text-3xl font-bold text-teal-400">{success}%</div>
                    <div className="text-xs text-white/70">Success Rate</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center hover:bg-white/20 transition">
                    <div className="text-2xl md:text-3xl font-bold text-teal-400">{clinics}+</div>
                    <div className="text-xs text-white/70">Clinics Worldwide</div>
                  </div>
                </div>
              </div>

              {/* Right Side - Floating Info Cards */}
              <div className="hidden lg:block relative">
                <div className="absolute -top-10 -left-10 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-2xl animate-float">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center text-2xl">⚡</div>
                    <div>
                      <div className="font-bold text-gray-800">&lt; 15 min</div>
                      <div className="text-xs text-gray-500">Quick Response Time</div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-10 -right-10 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-2xl animate-float" style={{ animationDelay: '1s' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center text-2xl">⭐</div>
                    <div>
                      <div className="font-bold text-gray-800">4.9 / 5.0</div>
                      <div className="text-xs text-gray-500">Patient Rating</div>
                    </div>
                  </div>
                </div>
                <div className="absolute top-1/2 -right-5 transform -translate-y-1/2 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">🏆</div>
                    <div>
                      <div className="font-bold text-gray-800">Award Winning</div>
                      <div className="text-xs text-gray-500">Best Hospital 2024</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-2 bg-white rounded-full mt-2 animate-ping"></div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 bg-gray-50" id="services">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-teal-600 font-semibold text-sm uppercase tracking-wider bg-teal-50 px-4 py-2 rounded-full">Medical Services</span>
            <h2 className="text-4xl font-bold mt-4 text-gray-800">Comprehensive Healthcare Services</h2>
            <p className="text-gray-600 mt-4">We provide holistic healthcare solutions tailored to your unique needs</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedService(service)}
                className="bg-white rounded-2xl p-6 shadow-md hover-scale cursor-pointer transition-all"
              >
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl mb-4" style={{ background: `${service.color}10` }}>
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{service.title}</h3>
                <p className="text-gray-500 text-sm mb-3">{service.desc}</p>
                <div className="flex justify-between text-xs text-gray-400">
                  <span><i className="fas fa-users mr-1"></i>{service.patients} patients</span>
                  <span><i className="fas fa-user-md mr-1"></i>{service.doctors} doctors</span>
                </div>
                <button className="mt-4 text-teal-600 font-medium text-sm flex items-center gap-1 hover:gap-2 transition-all">
                  Learn More <i className="fas fa-arrow-right text-xs"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Doctors Section */}
      <section className="py-24 bg-white" id="doctors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-teal-600 font-semibold text-sm uppercase tracking-wider bg-teal-50 px-4 py-2 rounded-full">Medical Experts</span>
            <h2 className="text-4xl font-bold mt-4 text-gray-800">Meet Our Specialist Doctors</h2>
            <p className="text-gray-600 mt-4">Our board-certified doctors bring years of experience and compassion</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {doctorProfiles.map((doctor, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-md overflow-hidden hover-scale transition-all">
                <div className="relative h-64 overflow-hidden">
                  <img src={doctor.imageUrl || `https://i.pravatar.cc/400?u=${doctor.userId}`} alt={`Dr. ${doctor.firstName} ${doctor.lastName}`} className="w-full h-full object-cover hover:scale-110 transition duration-500" />
                  <div className={`absolute top-3 right-3 text-xs px-2 py-1 rounded-full ${
                    (doctor.availability || 'Available Today') === 'Available Today' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'
                  }`}>
                    {doctor.availability || 'Available Today'}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-800">Dr. {doctor.firstName} {doctor.lastName}</h3>
                  <p className="text-teal-600 text-sm font-medium">{doctor.specialization || doctor.specialty || 'General Medicine'}</p>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>💼 {doctor.experienceYears || 0} yrs</span>
                    <span>👥 {(doctor.patientCount || 0).toLocaleString()}+</span>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <i key={i} className={`fas fa-star text-xs ${i < Math.round(doctor.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}></i>
                    ))}
                  </div>
                  <button 
                    onClick={() => {
                      if (currentUser) {
                        navigate(`/appointment?doctor=${encodeURIComponent(`${doctor.firstName} ${doctor.lastName}`)}`);
                      } else {
                        navigate('/login');
                      }
                    }}
                    className="mt-3 w-full py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition text-sm"
                  >
                    Book Appointment
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-teal-600 font-semibold text-sm uppercase tracking-wider bg-teal-50 px-4 py-2 rounded-full">Patient Stories</span>
            <h2 className="text-4xl font-bold mt-4 text-gray-800">What Our Patients Say</h2>
            <p className="text-gray-600 mt-4">Real experiences from people who trusted us with their health</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition">
                <div className="flex items-center gap-3 mb-4">
                  <img src={testimonial.image} alt={testimonial.name} className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <h4 className="font-bold text-gray-800">{testimonial.name}</h4>
                    <p className="text-teal-600 text-xs">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <i key={i} className="fas fa-star text-yellow-400 text-sm"></i>
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">"{testimonial.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-linear-to-r from-teal-600 to-cyan-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Start Your Health Journey?</h2>
          <p className="text-white/90 text-lg mb-6">Book an appointment today and experience the best healthcare services</p>
          <button className="bg-white text-teal-600 px-8 py-3 rounded-full font-semibold hover:shadow-xl transition-all hover:scale-105 inline-flex items-center gap-2">
            <i className="fas fa-calendar-check"></i> Schedule Your Visit
            <i className="fas fa-arrow-right"></i>
          </button>
        </div>
      </section>

      {/* About & Contact */}
      <section className="py-20 bg-white" id="about">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <span className="text-teal-600 font-semibold text-sm bg-teal-50 px-3 py-1 rounded-full">About Us</span>
              <h2 className="text-3xl font-bold mt-4 text-gray-800">Leading Healthcare Provider Since 2012</h2>
              <p className="text-gray-600 mt-4 leading-relaxed">
                HealthCare+ is dedicated to providing exceptional medical services with a patient-first approach.
                Our network of advanced clinics ensures you receive top-tier treatment with empathy and innovation.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="flex items-center gap-2"><i className="fas fa-check-circle text-teal-500"></i><span className="text-sm">24/7 Emergency Care</span></div>
                <div className="flex items-center gap-2"><i className="fas fa-microscope text-teal-500"></i><span className="text-sm">Modern Equipment</span></div>
                <div className="flex items-center gap-2"><i className="fas fa-ambulance text-teal-500"></i><span className="text-sm">Ambulance Service</span></div>
                <div className="flex items-center gap-2"><i className="fas fa-laptop-medical text-teal-500"></i><span className="text-sm">E-Consultation</span></div>
              </div>
            </div>
            <div id="contact" className="bg-gray-50 rounded-2xl p-6 shadow-sm">
              <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <i className="fas fa-envelope-open-text text-teal-500"></i> Quick Contact
              </h3>
              <p className="text-gray-500 mb-4">Have questions? Reach out to our care team.</p>
              <form className="space-y-3">
                <input type="text" placeholder="Full Name" className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-teal-300 outline-none" />
                <input type="email" placeholder="Email Address" className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-teal-300 outline-none" />
                <textarea rows="3" placeholder="Your Message" className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-teal-300 outline-none"></textarea>
                <button className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-lg font-semibold transition">Send Message</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-teal-600 p-2 rounded-lg"><i className="fas fa-hospital-user text-white"></i></div>
              <span className="font-bold text-white text-xl">Health<span className="text-teal-400">Care+</span></span>
            </div>
            <div className="flex gap-6 text-sm">
              <a href="#" className="hover:text-teal-400 transition">Privacy Policy</a>
              <a href="#" className="hover:text-teal-400 transition">Terms of Service</a>
              <a href="#" className="hover:text-teal-400 transition">Accessibility</a>
            </div>
            <div className="flex gap-4 text-xl">
              <i className="fab fa-facebook hover:text-teal-400 cursor-pointer transition"></i>
              <i className="fab fa-twitter hover:text-teal-400 cursor-pointer transition"></i>
              <i className="fab fa-instagram hover:text-teal-400 cursor-pointer transition"></i>
              <i className="fab fa-linkedin hover:text-teal-400 cursor-pointer transition"></i>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-6 pt-6 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} HealthCare+ — Empowering healthier lives. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Service Modal */}
      {selectedService && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedService(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="text-5xl mb-4">{selectedService.icon}</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{selectedService.title}</h3>
              <p className="text-gray-600 mb-4">{selectedService.desc}</p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex justify-between mb-2">
                  <span>Patients Treated:</span>
                  <span className="font-bold">{selectedService.patients}</span>
                </div>
                <div className="flex justify-between">
                  <span>Specialists:</span>
                  <span className="font-bold">{selectedService.doctors}</span>
                </div>
              </div>
              <button className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition">
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