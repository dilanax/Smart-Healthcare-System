import { useState, useEffect } from 'react';
import Navbar from '../components/navbar';

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
      <div className="min-h-screen bg-gray-50">
        <Navbar navigate={navigate} currentUser={currentUser} />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <span className="text-4xl text-teal-600 mb-4 inline-block">⏳</span>
            <p className="text-gray-600 mt-4">Loading appointment form...</p>
          </div>
        </div>
      </div>
    );
  }

  if (serverError && doctors.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar navigate={navigate} currentUser={currentUser} />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <span className="text-4xl text-red-600 mb-4 inline-block">⚠️</span>
            <p className="text-red-600 font-semibold mt-4">{serverError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedDoctor && doctors.length > 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar navigate={navigate} currentUser={currentUser} />
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-2">
              Find a Doctor. Book an Appointment.
            </h1>
            <p className="text-2xl font-semibold text-gray-700">Pay easy.</p>
          </div>

          {/* Search Filters */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-12 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Doctor Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  👨‍⚕️ Doctor - Max 20 Characters
                </label>
                <input
                  type="text"
                  maxLength="20"
                  placeholder="Search doctor name"
                  value={searchFilters.doctorName}
                  onChange={(e) => setSearchFilters({ ...searchFilters, doctorName: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-teal-500 transition"
                />
              </div>

              {/* Hospital */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🏥 Hospital Location
                </label>
                <select
                  value={searchFilters.hospital}
                  onChange={(e) => setSearchFilters({ ...searchFilters, hospital: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-teal-500 transition bg-white"
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ⚕️ Specialization
                </label>
                <select
                  value={searchFilters.specialization}
                  onChange={(e) => setSearchFilters({ ...searchFilters, specialization: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-teal-500 transition bg-white"
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📅 Any Date
                </label>
                <input
                  type="date"
                  value={searchFilters.searchDate}
                  onChange={(e) => setSearchFilters({ ...searchFilters, searchDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-teal-500 transition"
                />
              </div>
            </div>

            {/* Search Button */}
            <button className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-bold py-3 rounded-lg text-lg transition shadow-lg hover:shadow-xl">
              🔍 Search
            </button>
          </div>

          {/* Results */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {filteredDoctors.length > 0 
                ? `Found ${filteredDoctors.length} Doctor${filteredDoctors.length !== 1 ? 's' : ''}`
                : 'No doctors found'}
            </h2>

            {filteredDoctors.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl shadow-lg border border-gray-200">
                <p className="text-gray-600 text-lg mb-4">😕 No doctors match your search criteria.</p>
                <p className="text-gray-500">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredDoctors.map((doctor) => (
                  <div
                    key={doctor.userId}
                    onClick={() => setSelectedDoctor(doctor)}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all cursor-pointer hover:scale-105 transform border-2 border-transparent hover:border-teal-500"
                  >
                    <div className="relative h-48 bg-gradient-to-br from-teal-100 to-cyan-100">
                      <img
                        src={`https://i.pravatar.cc/300?u=${doctor.userId}&s=300`}
                        alt={doctor.firstName}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 right-4 bg-teal-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        ✓ Available
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="text-lg font-bold text-gray-900">
                        Dr. {doctor.firstName} {doctor.lastName}
                      </h3>
                      {doctor.specialization && (
                        <p className="text-teal-600 font-semibold mb-3">{doctor.specialization}</p>
                      )}

                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className="text-sm">⭐</span>
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">5.0</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4 text-xs text-gray-600">
                        <div>
                          <p className="font-semibold text-gray-800">10+ yrs</p>
                          <p>Experience</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">5,000+</p>
                          <p>Patients</p>
                        </div>
                      </div>

                      <button className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white py-2 rounded-lg font-semibold transition shadow-md hover:shadow-lg">
                        Select Doctor
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar navigate={navigate} currentUser={currentUser} />

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Doctor Details Header */}
        {selectedDoctor && (
          <div className="mb-8 bg-linear-to-r from-teal-500 to-cyan-500 rounded-2xl p-8 shadow-xl text-white">
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-6 flex-1">
                <img
                  src={`https://i.pravatar.cc/200?u=${selectedDoctor.userId}&s=200`}
                  alt={selectedDoctor.firstName}
                  className="w-24 h-24 rounded-full border-4 border-white"
                />
                <div className="flex-1">
                  <h2 className="text-3xl font-bold">
                    Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}
                  </h2>
                  <p className="text-teal-100 text-lg font-semibold">Specialist</p>
                  <div className="mt-3 flex gap-6">
                    <div>
                      <p className="text-teal-100 text-sm">Experience</p>
                      <p className="font-bold text-lg">10+ Years</p>
                    </div>
                    <div>
                      <p className="text-teal-100 text-sm">Patients</p>
                      <p className="font-bold text-lg">5,000+</p>
                    </div>
                    <div>
                      <p className="text-teal-100 text-sm">Rating</p>
                      <p className="font-bold text-lg">⭐ 5.0</p>
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
                className="px-6 py-2 bg-white text-teal-600 font-semibold rounded-lg hover:bg-gray-100 transition"
              >
                Change Doctor
              </button>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 rounded-lg bg-green-50 p-4 border-l-4 border-green-500">
            <p className="text-green-800 font-semibold">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {serverError && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 border-l-4 border-red-500">
            <p className="text-red-800">{serverError}</p>
          </div>
        )}

        {/* Appointment Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-lg space-y-8">
          {/* User Details Section */}
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-6 border-l-4 border-teal-500">
            <h3 className="text-lg font-bold text-gray-800 mb-6">
              👤 Your Details
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={userDetails.name}
                  onChange={(e) => handleUserDetailsChange('name', e.target.value)}
                  placeholder="Enter your full name"
                  className={`w-full px-4 py-2 rounded-lg border-2 transition-colors focus:outline-none ${
                    errors.name
                      ? 'border-red-500 bg-red-50 focus:border-red-600'
                      : 'border-gray-200 bg-white focus:border-teal-500'
                  }`}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-600">
                    ⚠️ {errors.name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={userDetails.email}
                  onChange={(e) => handleUserDetailsChange('email', e.target.value)}
                  placeholder="Enter your email"
                  className={`w-full px-4 py-2 rounded-lg border-2 transition-colors focus:outline-none ${
                    errors.email
                      ? 'border-red-500 bg-red-50 focus:border-red-600'
                      : 'border-gray-200 bg-white focus:border-teal-500'
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">
                    ⚠️ {errors.email}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={userDetails.phone}
                  onChange={(e) => handleUserDetailsChange('phone', e.target.value)}
                  placeholder="Enter 10-digit phone number"
                  className={`w-full px-4 py-2 rounded-lg border-2 transition-colors focus:outline-none ${
                    errors.phone
                      ? 'border-red-500 bg-red-50 focus:border-red-600'
                      : 'border-gray-200 bg-white focus:border-teal-500'
                  }`}
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-600">
                    ⚠️ {errors.phone}
                  </p>
                )}
              </div>

              {/* Age */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Age <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={userDetails.age}
                  onChange={(e) => handleUserDetailsChange('age', e.target.value)}
                  placeholder="Enter your age"
                  min="1"
                  max="150"
                  className={`w-full px-4 py-2 rounded-lg border-2 transition-colors focus:outline-none ${
                    errors.age
                      ? 'border-red-500 bg-red-50 focus:border-red-600'
                      : 'border-gray-200 bg-white focus:border-teal-500'
                  }`}
                />
                {errors.age && (
                  <p className="mt-1 text-xs text-red-600">
                    ⚠️ {errors.age}
                  </p>
                )}
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  value={userDetails.gender}
                  onChange={(e) => handleUserDetailsChange('gender', e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border-2 transition-colors focus:outline-none ${
                    errors.gender
                      ? 'border-red-500 bg-red-50 focus:border-red-600'
                      : 'border-gray-200 bg-white focus:border-teal-500'
                  }`}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && (
                  <p className="mt-1 text-xs text-red-600">
                    ⚠️ {errors.gender}
                  </p>
                )}
              </div>

              {/* Patient ID */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Patient ID
                </label>
                <input
                  type="text"
                  value={patientId}
                  disabled
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Date Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Select Appointment Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={appointmentDate}
              onChange={handleDateChange}
              min={getTodayDate()}
              max={getMaxDate()}
              className={`w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none ${
                errors.date
                  ? 'border-red-500 bg-red-50 focus:border-red-600'
                  : 'border-gray-200 bg-white focus:border-teal-500'
              }`}
            />
            {errors.date && (
              <p className="mt-2 text-sm text-red-600">
                ⚠️ {errors.date}
              </p>
            )}
          </div>

          {/* Time Slots */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Select Time Slot <span className="text-red-500">*</span>
            </label>
            {loadingSlots && (
              <p className="text-sm text-gray-600 mb-3">⏳ Loading available slots...</p>
            )}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-xl border-2 border-purple-200">
              <p className="text-gray-700 font-semibold mb-4 text-sm">🕐 Select Your Time Slot:</p>
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                {availableSlots.map((time) => {
                  const isBooked = isSlotBooked(time);
                  return (
                    <button
                      key={time}
                      type="button"
                      disabled={isBooked}
                      onClick={() => !isBooked && handleTimeSelect(time)}
                      className={`py-4 px-3 rounded-xl font-bold transition-all text-sm transform border-2 ${
                        isBooked
                          ? 'bg-red-500 text-white cursor-not-allowed hover:bg-red-500 border-red-600 shadow-md' // Booked - Bright Red, cannot click
                          : selectedTime === time
                          ? 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-xl scale-110 ring-4 ring-teal-300 border-teal-700' // Selected - Teal gradient + scale + ring
                          : 'bg-white text-indigo-700 hover:bg-indigo-50 border-indigo-300 shadow-sm hover:shadow-md' // Available - White with indigo border
                      }`}
                      title={isBooked ? `❌ BOOKED - Not available` : `✅ AVAILABLE - Click to select`}
                    >
                      <div className="text-sm font-bold">{time}</div>
                      <div className="text-xl">{isBooked ? '❌' : '✅'}</div>
                      {isBooked && <div className="text-xs font-semibold mt-1">BOOKED</div>}
                    </button>
                  );
                })}
              </div>
            </div>
            {errors.time && (
              <p className="mt-2 text-sm text-red-600">
                ⚠️ {errors.time}
              </p>
            )}
          </div>

          {/* Reason Textarea */}
          <div>
            <label htmlFor="reason" className="block text-sm font-semibold text-gray-700 mb-3">
              Reason for Appointment <span className="text-red-500">*</span>
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={handleReasonChange}
              placeholder="Describe your symptoms or reason for visit (10-200 characters)"
              rows="5"
              className={`w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none resize-none ${
                errors.reason
                  ? 'border-red-500 bg-red-50 focus:border-red-600'
                  : 'border-gray-200 bg-white focus:border-teal-500'
              }`}
            />
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                ℹ️ {reason.length}/200 characters
              </p>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-teal-600 h-2 rounded-full transition-all"
                  style={{ width: `${(reason.length / 200) * 100}%` }}
                ></div>
              </div>
            </div>
            {errors.reason && (
              <p className="mt-2 text-sm text-red-600">
                ⚠️ {errors.reason}
              </p>
            )}
          </div>

          {/* Appointment Summary */}
          {appointmentDate && selectedTime && (
            <div className="bg-linear-to-r from-teal-50 to-cyan-50 border-l-4 border-teal-500 rounded-lg p-6">
              <h3 className="font-bold text-gray-800 mb-4">Appointment Summary</h3>
              <div className="grid md:grid-cols-5 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Patient</p>
                  <p className="font-semibold text-gray-800">{userDetails.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Doctor</p>
                  <p className="font-semibold text-gray-800">
                    Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Date</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(appointmentDate).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Time</p>
                  <p className="font-semibold text-gray-800">{selectedTime}</p>
                </div>
                <div>
                  <p className="text-gray-600">Patient ID</p>
                  <p className="font-semibold text-gray-800">{patientId}</p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-6 border-t-2 border-gray-100">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 px-6 py-3 font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? (
                <>
                  <span>⏳</span>
                  Booking...
                </>
              ) : (
                <>
                  <span>✅</span>
                  Confirm Appointment
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 rounded-lg bg-gray-200 hover:bg-gray-300 px-6 py-3 font-semibold text-gray-800 transition-all flex items-center justify-center gap-2"
            >
              <span>❌</span>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentPage;
