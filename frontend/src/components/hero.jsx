import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // Added Framer Motion

/* ─── VIDEO OPTIONS (EASILY MANAGABLE) ─── */
const heroVideos = [
  {
    url: "https://assets.mixkit.co/videos/preview/mixkit-team-of-doctors-walking-through-a-hospital-1728-large.mp4",
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
    url: "https://assets.mixkit.co/videos/preview/mixkit-medical-researcher-looking-through-a-microscope-32537-large.mp4",
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

// Updated to use the EXACT Hex codes from your Brand Guide
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

  // Modern Animation Variants
  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  return (
    <div className="bg-white">
      {/* Kept your original CSS animations for the elements that use them */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap');
        * { font-family: 'Inter', sans-serif; }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes shimmer {
          0% { background-position: -200%; }
          100% { background-position: 200%; }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
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
              {/* Brand Guide Dark Overlay: rgba(0, 0, 0, 0.6) */}
              <div className="absolute inset-0 bg-black/60 z-20"></div>
              
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
                <img src={fallbackImages[idx]} alt={video.title} className="absolute inset-0 w-full h-full object-cover" />
              )}
              
              {isVideoLoading && currentSlide === idx && !videoError && (
                <div className="absolute inset-0 video-loading z-30"></div>
              )}
              
              <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/50 to-transparent z-20"></div>
            </div>
          ))}
        </div>

        {/* Video Controls - Mute/Unmute Button */}
        <button onClick={toggleMute} className="absolute bottom-24 right-6 z-30 bg-black/50 backdrop-blur-sm text-white p-3 rounded-full hover:bg-[#14b8a6] transition-all">
          <i className="fas fa-volume-up"></i>
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30 flex gap-3">
          {heroVideos.map((_, idx) => (
            <button
              key={idx} onClick={() => goToSlide(idx)}
              className={`transition-all duration-300 rounded-full ${currentSlide === idx ? 'w-8 h-2 bg-[#14b8a6]' : 'w-2 h-2 bg-white/50 hover:bg-[#14b8a6]'}`}
            />
          ))}
        </div>

        {/* Slide Titles */}
        <div className="absolute top-1/3 right-8 z-30 text-right hidden lg:block">
          {heroVideos.map((video, idx) => (
            <div key={idx} className={`transition-all duration-500 ${currentSlide === idx ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform translate-x-10'}`}>
              <h3 className="text-white text-2xl font-bold">{video.title}</h3>
              <p className="text-[#14b8a6] font-medium text-sm">{video.subtitle}</p>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="relative z-20 min-h-screen flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <motion.div 
                variants={staggerContainer} initial="hidden" animate="visible"
                className="text-white"
              >
                {/* Emergency Badge */}
                <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-full px-5 py-2 mb-6">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  <span className="text-sm font-semibold tracking-wide text-white">🚨 24/7 Emergency Care Available</span>
                </motion.div>

                {/* Title */}
                <motion.h1 variants={fadeUp} className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-4 text-white">
                  Your Health,
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#14b8a6] to-[#06b6d4]">
                    Our Priority.
                  </span>
                  <br />
                  <span className="text-white/80">Always.</span>
                </motion.h1>

                {/* Description */}
                <motion.p variants={fadeUp} className="text-lg text-white/80 max-w-xl leading-relaxed mb-8">
                  Experience world-class medical care with cutting-edge technology, compassionate doctors,
                  and personalised treatment plans designed just for you.
                </motion.p>

                {/* Buttons - Brand Gradient */}
                <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 mb-8">
                  <motion.button 
                    whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(20, 184, 166, 0.4)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (currentUser) {
                        navigate('/appointment');
                      } else {
                        navigate('/login');
                      }
                    }}
                    className="group bg-gradient-to-r from-[#14b8a6] to-[#06b6d4] text-white px-8 py-3 rounded-full font-bold shadow-xl transition-all flex items-center justify-center gap-2 uppercase tracking-wide"
                  >
                    <i className="fas fa-calendar-check"></i> Book Appointment
                    <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                    whileTap={{ scale: 0.95 }}
                    className="border-2 border-white/30 backdrop-blur-sm text-white px-8 py-3 rounded-full font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2 uppercase tracking-wide"
                  >
                    <i className="fas fa-phone-alt"></i> Call Emergency
                  </motion.button>
                </motion.div>

                {/* Stats */}
                <motion.div ref={statsRef} variants={staggerContainer} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { count: patients, label: "Happy Patients" },
                    { count: doctorsCount, label: "Expert Doctors" },
                    { count: success, label: "Success Rate", suffix: "%" },
                    { count: clinics, label: "Clinics Worldwide" }
                  ].map((stat, i) => (
                    <motion.div key={i} variants={fadeUp} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center hover:bg-[#14b8a6]/20 transition border border-white/10">
                      <div className="text-2xl md:text-3xl font-bold text-[#14b8a6]">{stat.count.toLocaleString()}{stat.suffix || "+"}</div>
                      <div className="text-xs text-white/80 font-medium">{stat.label}</div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>

              {/* Right Side - Floating Info Cards */}
              <div className="hidden lg:block relative h-full">
                <div className="absolute -top-10 -left-10 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-2xl animate-float border-b-4 border-[#14b8a6]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center text-2xl">⚡</div>
                    <div>
                      <div className="font-bold text-[#1a202c]">&lt; 15 min</div>
                      <div className="text-xs text-[#64748b] font-medium">Quick Response Time</div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-10 -right-10 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-2xl animate-float border-b-4 border-yellow-400" style={{ animationDelay: '1s' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center text-2xl">⭐</div>
                    <div>
                      <div className="font-bold text-[#1a202c]">4.9 / 5.0</div>
                      <div className="text-xs text-[#64748b] font-medium">Patient Rating</div>
                    </div>
                  </div>
                </div>
                <div className="absolute top-1/2 -right-5 transform -translate-y-1/2 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-2xl border-b-4 border-[#38a169]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">🏆</div>
                    <div>
                      <div className="font-bold text-[#1a202c]">Award Winning</div>
                      <div className="text-xs text-[#64748b] font-medium">Best Hospital 2026</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30 animate-bounce">
          <div className="w-6 h-10 border-2 border-[#14b8a6]/50 rounded-full flex justify-center">
            <div className="w-1 h-2 bg-[#14b8a6] rounded-full mt-2 animate-ping"></div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 bg-gray-50" id="services">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-[#14b8a6] font-bold text-sm uppercase tracking-widest bg-teal-50 px-4 py-2 rounded-full">Medical Services</span>
            <h2 className="text-4xl font-black mt-6 text-[#1a202c]">Comprehensive Healthcare Services</h2>
            <p className="text-[#64748b] mt-4 font-medium">We provide holistic healthcare solutions tailored to your unique needs</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -8, scale: 1.02, boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)" }}
                onClick={() => setSelectedService(service)}
                className="bg-white rounded-3xl p-8 border border-gray-100 cursor-pointer transition-all group"
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform" style={{ background: `${service.color}15`, color: service.color }}>
                  {service.icon}
                </div>
                <h3 className="text-xl font-black text-[#1a202c] mb-3">{service.title}</h3>
                <p className="text-[#64748b] font-medium text-sm mb-6 leading-relaxed">{service.desc}</p>
                <div className="flex justify-between text-xs text-gray-500 font-semibold border-t border-gray-50 pt-4">
                  <span className="flex items-center gap-2"><i className="fas fa-users text-[#14b8a6]"></i>{service.patients} patients</span>
                  <span className="flex items-center gap-2"><i className="fas fa-user-md text-[#14b8a6]"></i>{service.doctors} doctors</span>
                </div>
                <button className="mt-6 text-[#14b8a6] font-bold text-sm flex items-center gap-2 group-hover:text-[#06b6d4] transition-all">
                  Learn More <i className="fas fa-arrow-right text-xs transform group-hover:translate-x-1 transition-transform"></i>
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Doctors Section */}
      <section className="py-24 bg-white" id="doctors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-[#14b8a6] font-bold text-sm uppercase tracking-widest bg-teal-50 px-4 py-2 rounded-full">Medical Experts</span>
            <h2 className="text-4xl font-black mt-6 text-[#1a202c]">Meet Our Specialist Doctors</h2>
            <p className="text-[#64748b] mt-4 font-medium">Our board-certified doctors bring years of experience and compassion</p>
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
                  <div className="flex items-center gap-1 mt-4">
                    {[...Array(5)].map((_, i) => (
                      <i key={i} className={`fas fa-star text-xs ${i < Math.round(doctor.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}></i>
                    ))}
                    <span className="text-xs font-bold text-[#64748b] ml-1">({doctor.rating})</span>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (currentUser) {
                        navigate(`/appointment?doctor=${encodeURIComponent(`${doctor.firstName} ${doctor.lastName}`)}`);
                      } else {
                        navigate('/login');
                      }
                    }}
                    className="mt-6 w-full py-3 bg-gradient-to-r from-[#14b8a6] to-[#06b6d4] text-white rounded-xl font-bold transition shadow-md hover:shadow-lg"
                  >
                    Book Appointment
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-[#14b8a6] font-bold text-sm uppercase tracking-widest bg-teal-50 px-4 py-2 rounded-full">Patient Stories</span>
            <h2 className="text-4xl font-black mt-6 text-[#1a202c]">What Our Patients Say</h2>
            <p className="text-[#64748b] mt-4 font-medium">Real experiences from people who trusted us with their health</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <motion.div key={idx} whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)" }} className="bg-white rounded-3xl p-8 border border-gray-100 relative">
                <div className="absolute top-8 right-8 text-6xl text-gray-100 font-serif opacity-50">"</div>
                <div className="flex items-center gap-4 mb-6 relative z-10">
                  <img src={testimonial.image} alt={testimonial.name} className="w-16 h-16 rounded-full object-cover border-4 border-teal-50" />
                  <div>
                    <h4 className="font-black text-[#1a202c]">{testimonial.name}</h4>
                    <p className="text-[#14b8a6] font-bold text-xs uppercase tracking-wider mt-1">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <i key={i} className="fas fa-star text-yellow-400 text-sm"></i>
                  ))}
                </div>
                <p className="text-[#64748b] text-sm leading-relaxed font-medium">"{testimonial.text}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Brand Gradient */}
      <section className="py-24 bg-gradient-to-r from-[#14b8a6] to-[#06b6d4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 drop-shadow-sm">Ready to Start Your Health Journey?</h2>
          <p className="text-white/90 text-lg mb-10 font-medium max-w-2xl mx-auto">Book an appointment today and experience the best healthcare services tailored to your personal needs.</p>
          <motion.button 
            whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/appointment')}
            className="bg-white text-[#14b8a6] px-10 py-4 rounded-full font-black tracking-widest uppercase transition-all flex items-center justify-center gap-3 mx-auto"
          >
            <i className="fas fa-calendar-check"></i> Schedule Your Visit
            <i className="fas fa-arrow-right"></i>
          </motion.button>
        </div>
      </section>

      {/* About & Contact */}
      <section className="py-24 bg-white" id="about">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            <div>
              <span className="text-[#14b8a6] font-bold text-sm uppercase tracking-widest bg-teal-50 px-4 py-2 rounded-full">About Us</span>
              <h2 className="text-4xl font-black mt-6 text-[#1a202c]">Leading Healthcare Provider Since 2012</h2>
              <p className="text-[#64748b] mt-6 leading-relaxed font-medium text-lg">
                HealthCare+ is dedicated to providing exceptional medical services with a patient-first approach.
                Our network of advanced clinics ensures you receive top-tier treatment with empathy and innovation.
              </p>
              <div className="grid grid-cols-2 gap-6 mt-10">
                <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl"><i className="fas fa-check-circle text-[#14b8a6] text-xl"></i><span className="text-sm font-bold text-[#1a202c]">24/7 Emergency</span></div>
                <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl"><i className="fas fa-microscope text-[#14b8a6] text-xl"></i><span className="text-sm font-bold text-[#1a202c]">Modern Equipment</span></div>
                <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl"><i className="fas fa-ambulance text-[#14b8a6] text-xl"></i><span className="text-sm font-bold text-[#1a202c]">Ambulance Service</span></div>
                <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl"><i className="fas fa-laptop-medical text-[#14b8a6] text-xl"></i><span className="text-sm font-bold text-[#1a202c]">E-Consultation</span></div>
              </div>
            </div>
            <div id="contact" className="bg-gray-50 rounded-3xl p-10 border border-gray-100 shadow-sm">
              <h3 className="text-2xl font-black text-[#1a202c] mb-2 flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center text-[#14b8a6]"><i className="fas fa-envelope-open-text"></i></div>
                Quick Contact
              </h3>
              <p className="text-[#64748b] mb-8 font-medium">Have questions? Reach out to our care team.</p>
              <form className="space-y-4">
                <input type="text" placeholder="Full Name" className="w-full p-4 rounded-xl border-2 border-transparent focus:border-[#14b8a6] outline-none font-semibold transition-colors" />
                <input type="email" placeholder="Email Address" className="w-full p-4 rounded-xl border-2 border-transparent focus:border-[#14b8a6] outline-none font-semibold transition-colors" />
                <textarea rows="4" placeholder="Your Message" className="w-full p-4 rounded-xl border-2 border-transparent focus:border-[#14b8a6] outline-none font-semibold transition-colors resize-none"></textarea>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full bg-gradient-to-r from-[#14b8a6] to-[#06b6d4] text-white py-4 rounded-xl font-black tracking-widest uppercase transition shadow-md hover:shadow-lg mt-2">
                  Send Message
                </motion.button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1a202c] text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-[#14b8a6] to-[#06b6d4] p-3 rounded-xl"><i className="fas fa-hospital-user text-white text-xl"></i></div>
              <span className="font-black text-white text-2xl tracking-tight">Health<span className="text-[#14b8a6]">Care+</span></span>
            </div>
            <div className="flex flex-wrap justify-center gap-8 text-sm font-semibold">
              <a href="#" className="hover:text-[#14b8a6] transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-[#14b8a6] transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-[#14b8a6] transition-colors">Accessibility</a>
            </div>
            <div className="flex gap-6 text-xl">
              <i className="fab fa-facebook hover:text-[#14b8a6] cursor-pointer transition-transform hover:scale-110"></i>
              <i className="fab fa-twitter hover:text-[#14b8a6] cursor-pointer transition-transform hover:scale-110"></i>
              <i className="fab fa-instagram hover:text-[#14b8a6] cursor-pointer transition-transform hover:scale-110"></i>
              <i className="fab fa-linkedin hover:text-[#14b8a6] cursor-pointer transition-transform hover:scale-110"></i>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-10 pt-8 text-center text-sm font-medium text-gray-500">
            © {new Date().getFullYear()} HealthCare+ — Empowering healthier lives. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Service Modal */}
      <AnimatePresence>
        {selectedService && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setSelectedService(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8">
                <div className="text-6xl mb-6 flex justify-center">{selectedService.icon}</div>
                <h3 className="text-3xl font-black text-[#1a202c] mb-3 text-center">{selectedService.title}</h3>
                <p className="text-[#64748b] mb-8 text-center font-medium leading-relaxed">{selectedService.desc}</p>
                <div className="bg-gray-50 p-6 rounded-2xl mb-8 border border-gray-100">
                  <div className="flex justify-between mb-4 pb-4 border-b border-gray-200">
                    <span className="text-[#64748b] font-bold uppercase tracking-widest text-xs">Patients Treated</span>
                    <span className="font-black text-[#1a202c]">{selectedService.patients}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748b] font-bold uppercase tracking-widest text-xs">Active Specialists</span>
                    <span className="font-black text-[#1a202c]">{selectedService.doctors}</span>
                  </div>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedService(null);
                    navigate(`/appointment?specialty=${encodeURIComponent(selectedService.title)}`);
                  }}
                  className="w-full bg-gradient-to-r from-[#14b8a6] to-[#06b6d4] text-white py-4 rounded-xl font-black tracking-widest uppercase shadow-lg hover:shadow-xl transition-all"
                >
                  Book Specialist
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Hero;
