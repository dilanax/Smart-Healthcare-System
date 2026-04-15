import { useState, useEffect } from 'react';
import Navbar from '../components/navbar';
import { motion, AnimatePresence } from 'framer-motion';

// Animation Variants for a modern Interactive Media feel
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, scale: 0.95 }
};

const cardHover = {
  scale: 1.03,
  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)", // From Brand Guide
};

const AppointmentPage = ({ navigate, currentUser }) => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [serverError, setServerError] = useState('');
  const [generatedToken, setGeneratedToken] = useState('');
  const [bookedSlots, setBookedSlots] = useState([]); // Store booked time slots
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  // Search filters
  const [searchFilters, setSearchFilters] = useState({
    doctorName: '',
    hospital: '',
    specialization: '',
    searchDate: '',
  });
  const [userDetails, setUserDetails] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    age: '',
    gender: '',
  });

  const patientId = currentUser?.userId || '';

  // Generate appointment token
  const generateToken = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `APT-${random}-${timestamp}`;
  };

  // Generate available time slots (9 AM to 5 PM, 30-minute intervals)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hours = 9; hours < 17; hours++) {
      for (let minutes = 0; minutes < 60; minutes += 30) {
        const time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const availableSlots = generateTimeSlots();

  // Filter doctors based on search filters
  const filteredDoctors = doctors.filter(doctor => {
    const matchName = `${doctor.firstName} ${doctor.lastName}`
      .toLowerCase()
      .includes(searchFilters.doctorName.toLowerCase());
    
    const matchHospital = searchFilters.hospital === '' || 
      (doctor.hospital && doctor.hospital.toLowerCase().includes(searchFilters.hospital.toLowerCase()));
    
    const matchSpecialization = searchFilters.specialization === '' || 
      (doctor.specialization && doctor.specialization.toLowerCase().includes(searchFilters.specialization.toLowerCase()));
    
    return matchName && matchHospital && matchSpecialization;
  });

  // Fetch booked slots for selected doctor and date
  useEffect(() => {
    if (selectedDoctor && appointmentDate) {
      fetchBookedSlots();
    }
  }, [selectedDoctor, appointmentDate]);

  const fetchBookedSlots = async () => {
    try {
      setLoadingSlots(true);
      // Fetch existing appointments for this doctor and date
      const response = await fetch(
        `http://localhost:8085/api/appointments?doctorId=${selectedDoctor.userId}&appointmentDate=${appointmentDate}`
      );
      if (response.ok) {
        const data = await response.json();
        // Extract booked times from appointments and normalize format (remove seconds if present)
        const appointments = Array.isArray(data) ? data : data.data || [];
        const booked = appointments
          .map(apt => {
            const time = apt.appointmentTime;
            if (!time) return null;
            // Normalize time format: "09:00:00" => "09:00" or keep "09:00" as is
            return time.indexOf(':') !== -1 ? time.substring(0, 5) : time;
          })
          .filter(Boolean);
        setBookedSlots(booked);
      } else {
        setBookedSlots([]);
      }
    } catch (err) {
      console.error('Failed to fetch booked slots:', err);
      setBookedSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const isSlotBooked = (time) => {
    return bookedSlots.includes(time);
  };

  // Fetch doctors and check for pre-selected doctor
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8082/api/doctors');
        if (response.ok) {
          const data = await response.json();
          const doctorsList = Array.isArray(data) ? data : data.data || [];
          setDoctors(doctorsList);

          // Check if doctor was pre-selected from hero section
          const params = new URLSearchParams(window.location.search);
          const selectedDoctorName = params.get('doctor');
          
          if (selectedDoctorName && doctorsList.length > 0) {
            const matchedDoctor = doctorsList.find(d => 
              `${d.firstName} ${d.lastName}`.toLowerCase() === selectedDoctorName.toLowerCase()
            );
            
            if (matchedDoctor) {
              setSelectedDoctor(matchedDoctor);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch doctors:', err);
        setServerError('Failed to load doctors. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!patientId) {
      newErrors.patientId = 'Patient information not available';
    }

    if (!userDetails.name || userDetails.name.trim() === '') {
      newErrors.name = 'Please enter your full name';
    }

    if (!userDetails.email || userDetails.email.trim() === '') {
      newErrors.email = 'Please enter your email address';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userDetails.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!userDetails.phone || userDetails.phone.trim() === '') {
      newErrors.phone = 'Please enter your phone number';
    } else if (!/^[0-9]{10}$/.test(userDetails.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (!userDetails.age || userDetails.age === '') {
      newErrors.age = 'Please enter your age';
    } else if (userDetails.age < 1 || userDetails.age > 150) {
      newErrors.age = 'Please enter a valid age';
    }

    if (!userDetails.gender || userDetails.gender === '') {
      newErrors.gender = 'Please select your gender';
    }

    if (!selectedDoctor) {
      newErrors.doctor = 'Please select a doctor';
    }

    if (!appointmentDate) {
      newErrors.date = 'Please select an appointment date';
    } else {
      const selectedDate = new Date(appointmentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.date = 'Appointment date cannot be in the past';
      }
    }

    if (!selectedTime) {
      newErrors.time = 'Please select an appointment time';
    } else if (isSlotBooked(selectedTime)) {
      newErrors.time = 'This time slot was just booked. Please select another time.';
    }

    if (!reason || reason.trim() === '') {
      newErrors.reason = 'Please provide a reason for the appointment';
    } else if (reason.trim().length < 10) {
      newErrors.reason = 'Reason must be at least 10 characters long';
    } else if (reason.trim().length > 200) {
      newErrors.reason = 'Reason must not exceed 200 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUserDetailsChange = (field, value) => {
    setUserDetails((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleDateChange = (e) => {
    setAppointmentDate(e.target.value);
    setSelectedTime(''); // Reset selected time when date changes
    if (errors.date) setErrors((prev) => ({ ...prev, date: '' }));
  };

  const handleTimeSelect = (time) => {
    if (isSlotBooked(time)) {
      setErrors((prev) => ({ ...prev, time: '❌ This time slot is already booked. Please select another time.' }));
      return;
    }
    setSelectedTime(time);
    if (errors.time) setErrors((prev) => ({ ...prev, time: '' }));
  };

  const handleReasonChange = (e) => {
    setReason(e.target.value);
    if (errors.reason) setErrors((prev) => ({ ...prev, reason: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setSuccess('');
    setGeneratedToken('');

    if (!validateForm()) {
      return;
    }

    // Double-check that the selected time is still available (no one booked it while they filled the form)
    if (isSlotBooked(selectedTime)) {
      setServerError('❌ Sorry! This time slot was just booked by another user. Please select a different time.');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = generateToken();
      
      const payload = {
        patientId: parseInt(patientId),
        doctorId: parseInt(selectedDoctor.userId),
        doctorFirstName: selectedDoctor.firstName,
        doctorLastName: selectedDoctor.lastName,
        appointmentDate: appointmentDate,
        appointmentTime: selectedTime,
        reason: reason,
        token: token,
      };

      const response = await fetch('http://localhost:8085/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setGeneratedToken(token);
        setSuccess(`✅ Appointment booked successfully! Your Appointment Token: ${token}`);
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        const errorData = await response.json();
        setServerError(
          errorData.message || 'Failed to book appointment. Please try again.'
        );
      }
    } catch (error) {
      setServerError('Network error. Please check your connection and try again.');
      console.error('Error booking appointment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar navigate={navigate} currentUser={currentUser} />
        <div className="flex-1 flex items-center justify-center h-96">
          <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-center">
            <span className="text-5xl text-[#14b8a6] mb-4 inline-block">⏳</span>
            <p className="text-[#64748b] font-bold tracking-widest mt-4 uppercase">Loading appointment form...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (serverError && doctors.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar navigate={navigate} currentUser={currentUser} />
        <div className="flex-1 flex items-center justify-center h-96">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center bg-white p-10 rounded-3xl shadow-xl">
            <span className="text-5xl text-red-600 mb-4 inline-block">⚠️</span>
            <p className="text-red-600 font-bold mt-4">{serverError}</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.reload()}
              className="mt-6 px-8 py-3 bg-[#14b8a6] text-white rounded-xl font-bold shadow-md hover:bg-[#06b6d4] transition-colors"
            >
              Try Again
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!selectedDoctor && doctors.length > 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar navigate={navigate} currentUser={currentUser} />
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Animated Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-5xl font-black text-[#1a202c] mb-2 tracking-tight">
              Find a Doctor. Book an Appointment.
            </h1>
            <p className="text-2xl font-bold bg-gradient-to-r from-[#14b8a6] to-[#06b6d4] bg-clip-text text-transparent">
              Healthcare Excellence Redefined.
            </p>
          </motion.div>

          {/* Search Filters Container */}
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="bg-white rounded-3xl shadow-xl p-8 mb-12 border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Doctor Name */}
              <div>
                <label className="block text-xs font-black text-[#64748b] uppercase tracking-widest mb-2">
                  👨‍⚕️ Doctor - Max 20 Chars
                </label>
                <input
                  type="text"
                  maxLength="20"
                  placeholder="Search doctor name"
                  value={searchFilters.doctorName}
                  onChange={(e) => setSearchFilters({ ...searchFilters, doctorName: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:outline-none focus:border-[#14b8a6] focus:bg-white transition-all font-semibold"
                />
              </div>

              {/* Hospital */}
              <div>
                <label className="block text-xs font-black text-[#64748b] uppercase tracking-widest mb-2">
                  🏥 Hospital Location
                </label>
                <select
                  value={searchFilters.hospital}
                  onChange={(e) => setSearchFilters({ ...searchFilters, hospital: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:outline-none focus:border-[#14b8a6] focus:bg-white transition-all font-semibold"
                >
                  <option value="">All Hospitals</option>
                  <option value="Asiri">Asiri Central Hospital - Norris Canal Road-Colombo</option>
                  <option value="Colombo">Colombo Hospital</option>
                  <option value="Kandy">Kandy Medical Center</option>
                  <option value="Galle">Galle Hospital</option>
                </select>
              </div>

              {/* Specialization */}
              <div>
                <label className="block text-xs font-black text-[#64748b] uppercase tracking-widest mb-2">
                  ⚕️ Specialization
                </label>
                <select
                  value={searchFilters.specialization}
                  onChange={(e) => setSearchFilters({ ...searchFilters, specialization: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:outline-none focus:border-[#14b8a6] focus:bg-white transition-all font-semibold"
                >
                  <option value="">Any Specialization</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Orthopedic">Orthopedic</option>
                  <option value="Dermatology">Dermatology</option>
                  <option value="General">General Medicine</option>
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-black text-[#64748b] uppercase tracking-widest mb-2">
                  📅 Any Date
                </label>
                <input
                  type="date"
                  value={searchFilters.searchDate}
                  onChange={(e) => setSearchFilters({ ...searchFilters, searchDate: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:outline-none focus:border-[#14b8a6] focus:bg-white transition-all font-semibold text-gray-700"
                />
              </div>
            </div>

            {/* Search Button */}
            <motion.button 
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full bg-gradient-to-r from-[#14b8a6] to-[#06b6d4] hover:shadow-lg text-white font-black py-4 rounded-xl text-lg transition-all tracking-widest"
            >
              🔍 SEARCH
            </motion.button>
          </motion.div>

          {/* Results Grid */}
          <div>
            <h2 className="text-2xl font-black text-[#1a202c] mb-6">
              {filteredDoctors.length > 0 
                ? `Found ${filteredDoctors.length} Doctor${filteredDoctors.length !== 1 ? 's' : ''}`
                : 'No doctors found'}
            </h2>

            {filteredDoctors.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 bg-white rounded-3xl shadow-md border border-gray-100">
                <p className="text-[#1a202c] font-black text-xl mb-2">😕 No doctors match your search criteria.</p>
                <p className="text-[#64748b] font-medium">Try adjusting your filters to see more availability.</p>
              </motion.div>
            ) : (
              <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <AnimatePresence>
                  {filteredDoctors.map((doctor) => (
                    <motion.div
                      key={doctor.userId}
                      layout
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover={cardHover}
                      onClick={() => setSelectedDoctor(doctor)}
                      className="bg-white rounded-3xl shadow-sm overflow-hidden cursor-pointer border-2 border-transparent hover:border-[#14b8a6] group transition-colors"
                    >
                      <div className="relative h-56 bg-gray-100 overflow-hidden">
                        <img
                          src={`https://i.pravatar.cc/300?u=${doctor.userId}&s=300`}
                          alt={doctor.firstName}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-[#14b8a6] px-4 py-1 rounded-full text-xs font-black shadow-sm">
                          ✓ AVAILABLE
                        </div>
                      </div>

                      <div className="p-6">
                        <h3 className="text-xl font-black text-[#1a202c]">
                          Dr. {doctor.firstName} {doctor.lastName}
                        </h3>
                        {doctor.specialization && (
                          <p className="text-[#14b8a6] font-bold mb-4">{doctor.specialization}</p>
                        )}

                        <div className="flex items-center gap-1 text-yellow-400 mb-4">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className="text-sm">⭐</span>
                          ))}
                          <span className="text-[#64748b] text-xs ml-2 font-bold">(5.0)</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-6 text-xs text-gray-600">
                          <div>
                            <p className="font-black text-[#1a202c]">10+ yrs</p>
                            <p className="font-medium text-[#64748b]">Experience</p>
                          </div>
                          <div>
                            <p className="font-black text-[#1a202c]">5,000+</p>
                            <p className="font-medium text-[#64748b]">Patients</p>
                          </div>
                        </div>

                        <div className="w-full py-3 bg-teal-50 text-[#14b8a6] rounded-xl text-center font-black text-sm group-hover:bg-gradient-to-r group-hover:from-[#14b8a6] group-hover:to-[#06b6d4] group-hover:text-white transition-all shadow-sm">
                          SELECT DOCTOR
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- FINAL BOOKING FORM VIEW ---
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar navigate={navigate} currentUser={currentUser} />

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        
        {/* Doctor Details Header */}
        <AnimatePresence>
          {selectedDoctor && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }}
              className="mb-8 bg-gradient-to-r from-[#14b8a6] to-[#06b6d4] rounded-3xl p-8 shadow-2xl text-white"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6 flex-1">
                  <img
                    src={`https://i.pravatar.cc/200?u=${selectedDoctor.userId}&s=200`}
                    alt={selectedDoctor.firstName}
                    className="w-24 h-24 rounded-2xl border-4 border-white/30 shadow-lg"
                  />
                  <div className="flex-1">
                    <h2 className="text-3xl font-black drop-shadow-md">
                      Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}
                    </h2>
                    <p className="text-teal-50 font-bold tracking-widest uppercase text-sm mt-1">Specialist</p>
                    <div className="mt-4 flex gap-8">
                      <div>
                        <p className="text-teal-100 text-xs font-bold uppercase tracking-widest">Experience</p>
                        <p className="font-black text-lg">10+ Years</p>
                      </div>
                      <div>
                        <p className="text-teal-100 text-xs font-bold uppercase tracking-widest">Patients</p>
                        <p className="font-black text-lg">5,000+</p>
                      </div>
                      <div>
                        <p className="text-teal-100 text-xs font-bold uppercase tracking-widest">Rating</p>
                        <p className="font-black text-lg">⭐ 5.0</p>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDoctor(null);
                    setSearchFilters({
                      doctorName: '',
                      hospital: '',
                      specialization: '',
                      searchDate: '',
                    });
                  }}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 font-bold rounded-xl transition backdrop-blur-sm shadow-sm"
                >
                  Change Doctor
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Message */}
        <AnimatePresence>
          {success && (
            <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} className="mb-6 rounded-2xl bg-teal-50 p-6 border-l-4 border-[#14b8a6] shadow-sm">
              <p className="text-teal-800 font-bold">{success}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        <AnimatePresence>
          {serverError && (
            <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} className="mb-6 rounded-2xl bg-red-50 p-6 border-l-4 border-red-500 shadow-sm">
              <p className="text-red-800 font-bold">{serverError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Appointment Form Container */}
        <motion.form variants={containerVariants} initial="hidden" animate="visible" onSubmit={handleSubmit} className="bg-white rounded-3xl p-10 shadow-xl space-y-10 border border-gray-100">
          
          {/* User Details Section */}
          <div className="bg-[#f8fafc] rounded-3xl p-8 border-l-8 border-[#14b8a6]">
            <h3 className="text-xl font-black text-[#1a202c] mb-8">
              👤 Your Details
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-black text-[#64748b] uppercase tracking-widest mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={userDetails.name}
                  onChange={(e) => handleUserDetailsChange('name', e.target.value)}
                  placeholder="Enter your full name"
                  className={`w-full px-4 py-3 bg-white rounded-xl border-2 transition-colors focus:outline-none font-semibold ${
                    errors.name
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-gray-200 focus:border-[#14b8a6]'
                  }`}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500 font-bold">⚠️ {errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-black text-[#64748b] uppercase tracking-widest mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={userDetails.email}
                  onChange={(e) => handleUserDetailsChange('email', e.target.value)}
                  placeholder="Enter your email"
                  className={`w-full px-4 py-3 bg-white rounded-xl border-2 transition-colors focus:outline-none font-semibold ${
                    errors.email
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-gray-200 focus:border-[#14b8a6]'
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500 font-bold">⚠️ {errors.email}</p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-black text-[#64748b] uppercase tracking-widest mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={userDetails.phone}
                  onChange={(e) => handleUserDetailsChange('phone', e.target.value)}
                  placeholder="Enter 10-digit phone number"
                  className={`w-full px-4 py-3 bg-white rounded-xl border-2 transition-colors focus:outline-none font-semibold ${
                    errors.phone
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-gray-200 focus:border-[#14b8a6]'
                  }`}
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-500 font-bold">⚠️ {errors.phone}</p>
                )}
              </div>

              {/* Age */}
              <div>
                <label className="block text-xs font-black text-[#64748b] uppercase tracking-widest mb-2">
                  Age <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={userDetails.age}
                  onChange={(e) => handleUserDetailsChange('age', e.target.value)}
                  placeholder="Enter your age"
                  min="1"
                  max="150"
                  className={`w-full px-4 py-3 bg-white rounded-xl border-2 transition-colors focus:outline-none font-semibold ${
                    errors.age
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-gray-200 focus:border-[#14b8a6]'
                  }`}
                />
                {errors.age && (
                  <p className="mt-1 text-xs text-red-500 font-bold">⚠️ {errors.age}</p>
                )}
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-black text-[#64748b] uppercase tracking-widest mb-2">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  value={userDetails.gender}
                  onChange={(e) => handleUserDetailsChange('gender', e.target.value)}
                  className={`w-full px-4 py-3 bg-white rounded-xl border-2 transition-colors focus:outline-none font-semibold ${
                    errors.gender
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-gray-200 focus:border-[#14b8a6]'
                  }`}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && (
                  <p className="mt-1 text-xs text-red-500 font-bold">⚠️ {errors.gender}</p>
                )}
              </div>

              {/* Patient ID */}
              <div>
                <label className="block text-xs font-black text-[#64748b] uppercase tracking-widest mb-2">
                  Patient ID
                </label>
                <input
                  type="text"
                  value={patientId}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed font-semibold"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6 border-t border-gray-100 pt-8">
            <h3 className="text-xl font-black text-[#1a202c]">Schedule</h3>

            {/* Date Selection */}
            <div>
              <label className="block text-xs font-black text-[#64748b] uppercase tracking-widest mb-3">
                Select Appointment Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={appointmentDate}
                onChange={handleDateChange}
                min={getTodayDate()}
                max={getMaxDate()}
                className={`w-full md:w-1/2 px-4 py-4 bg-gray-50 rounded-2xl border-2 outline-none font-bold text-gray-700 transition ${
                  errors.date
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-gray-200 focus:border-[#14b8a6]'
                }`}
              />
              {errors.date && (
                <p className="mt-2 text-xs text-red-500 font-bold">⚠️ {errors.date}</p>
              )}
            </div>

            {/* Time Slots */}
            <div>
              <label className="block text-xs font-black text-[#64748b] uppercase tracking-widest mb-4">
                Select Time Slot <span className="text-red-500">*</span>
                {loadingSlots && <span className="text-[#14b8a6] ml-2 normal-case tracking-normal">(loading...)</span>}
              </label>
              
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                  {availableSlots.map((time) => {
                    const isBooked = isSlotBooked(time);
                    return (
                      <motion.button
                        key={time}
                        type="button"
                        disabled={isBooked}
                        whileHover={!isBooked ? { scale: 1.05 } : {}}
                        whileTap={!isBooked ? { scale: 0.95 } : {}}
                        onClick={() => !isBooked && handleTimeSelect(time)}
                        className={`py-4 px-3 rounded-xl font-black text-sm transition-all border-2 ${
                          isBooked
                            ? 'bg-red-50 text-red-300 border-red-100 cursor-not-allowed shadow-none' // Subdued booked state based on Brand Guide
                            : selectedTime === time
                            ? 'bg-gradient-to-br from-[#14b8a6] to-[#06b6d4] text-white border-[#14b8a6] shadow-lg shadow-teal-500/30' // Selected - Teal gradient
                            : 'bg-white text-[#1a202c] border-gray-200 hover:border-[#14b8a6] hover:text-[#14b8a6] shadow-sm' // Available
                        }`}
                        title={isBooked ? `❌ BOOKED - Not available` : `✅ AVAILABLE - Click to select`}
                      >
                        <div className="text-sm font-bold">{time}</div>
                        {isBooked && <div className="text-[10px] uppercase font-bold mt-1 tracking-widest">Booked</div>}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
              {errors.time && (
                <p className="mt-2 text-xs text-red-500 font-bold">⚠️ {errors.time}</p>
              )}
            </div>
          </div>

          {/* Reason Textarea */}
          <div className="border-t border-gray-100 pt-8">
            <label htmlFor="reason" className="block text-xs font-black text-[#64748b] uppercase tracking-widest mb-3">
              Reason for Visit <span className="text-red-500">*</span>
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={handleReasonChange}
              placeholder="Briefly describe your symptoms or reason for visit (10-200 characters)"
              rows="5"
              className={`w-full p-6 bg-gray-50 rounded-2xl border-2 transition-colors focus:outline-none resize-none font-medium ${
                errors.reason
                  ? 'border-red-400 focus:border-red-500'
                  : 'border-gray-200 focus:border-[#14b8a6]'
              }`}
            />
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-[#64748b] font-bold">
                ℹ️ {reason.length}/200 characters
              </p>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-[#14b8a6] h-2 rounded-full transition-all"
                  style={{ width: `${(reason.length / 200) * 100}%` }}
                ></div>
              </div>
            </div>
            {errors.reason && (
              <p className="mt-2 text-xs text-red-500 font-bold">⚠️ {errors.reason}</p>
            )}
          </div>

          {/* Appointment Summary */}
          <AnimatePresence>
            {appointmentDate && selectedTime && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-gradient-to-r from-teal-50 to-cyan-50 border-l-4 border-[#14b8a6] rounded-2xl p-8 overflow-hidden"
              >
                <h3 className="font-black text-[#1a202c] mb-6 text-lg">Appointment Summary</h3>
                <div className="grid md:grid-cols-5 gap-6 text-sm">
                  <div>
                    <p className="text-[#64748b] text-xs font-bold uppercase tracking-widest">Patient</p>
                    <p className="font-black text-[#1a202c] text-base mt-1">{userDetails.name || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-[#64748b] text-xs font-bold uppercase tracking-widest">Doctor</p>
                    <p className="font-black text-[#1a202c] text-base mt-1">
                      Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#64748b] text-xs font-bold uppercase tracking-widest">Date & Time</p>
                    <p className="font-black text-[#1a202c] text-base mt-1">
                      {new Date(appointmentDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric'
                      })} @ {selectedTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#64748b] text-xs font-bold uppercase tracking-widest">ID</p>
                    <p className="font-black text-[#1a202c] text-base mt-1">{patientId}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-gray-100">
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }}
              className="flex-1 rounded-2xl bg-gradient-to-r from-[#14b8a6] to-[#06b6d4] px-8 py-5 font-black text-white shadow-xl shadow-teal-500/20 transition-all disabled:opacity-50 tracking-widest flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span>⏳</span> BOOKING...
                </>
              ) : (
                <>
                  <span>✅</span> CONFIRM APPOINTMENT
                </>
              )}
            </motion.button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-10 py-5 rounded-2xl bg-gray-100 hover:bg-gray-200 font-bold text-[#64748b] transition-colors tracking-widest flex items-center justify-center gap-2"
            >
              <span>❌</span> CANCEL
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  );
};

export default AppointmentPage;