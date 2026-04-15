import { useState, useEffect, useRef } from 'react';
import Navbar from '../components/navbar';
import { toast, Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY_PRESCRIPTIONS = 'doctor_prescriptions';

// --- Telemedicine Helpers ---
const buildJitsiCallUrl = (roomName, displayName) =>
  `https://meet.jit.si/${encodeURIComponent(roomName)}#userInfo.displayName=${encodeURIComponent(displayName)}&config.startWithVideoMuted=false&config.startWithAudioMuted=false&config.prejoinPageEnabled=false`;

const getMediaPermissionError = (error) => {
  if (error?.name === 'NotAllowedError') return 'Camera/Microphone permission denied. Click the lock icon near URL and allow camera + microphone.';
  if (error?.name === 'NotFoundError') return 'No camera device found on this computer.';
  if (error?.name === 'NotReadableError') return 'Camera is busy in another app. Close other apps and try again.';
  return 'Unable to access camera/microphone on this browser.';
};

const ProfilePage = ({ navigate, currentUser }) => {
  const [userDetails, setUserDetails] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Telemedicine State
  const [activeCall, setActiveCall] = useState(null);
  const [mediaReady, setMediaReady] = useState(false);

  // Avatar State & Refs
  const avatarUploadRef = useRef(null);
  const [profilePicUrl, setProfilePicUrl] = useState('');

  // Tabs & Edit State
  const [activeTab, setActiveTab] = useState('appointments'); 
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '', lastName: '', phoneNumber: '', age: '', gender: ''
  });

  const getCleanToken = () => {
    let token = localStorage.getItem('healthcare_auth_token');
    return token ? token.replace(/^["']|["']$/g, '') : null;
  };

  const getAppointmentId = (appointment) => appointment?.appointmentId ?? appointment?.id;
  const canJoinTelemedicine = (appointment) => String(appointment?.status || '').toUpperCase() === 'CONFIRMED';

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [currentUser, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const token = getCleanToken();
      const actualUserId = currentUser?.userId;

      // 1. Fetch Secure Profile Picture
      try {
          const picRes = await fetch(`http://localhost:8083/api/patients/profile/${actualUserId}/picture`, {
              method: 'GET',
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (picRes.ok) {
              const blob = await picRes.blob();
              if (blob.size > 0) setProfilePicUrl(URL.createObjectURL(blob));
          }
      } catch (e) { console.warn("Could not fetch profile picture."); }

      // 2. Fetch User Details (Port 8081)
      try {
        const userResponse = await fetch(`http://localhost:8081/api/auth/user/${actualUserId}`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          const user = userData.data || userData;
          setUserDetails(user);
        }
      } catch (e) { console.warn("Auth Service offline."); }

      // 3. Fetch Appointments (Port 8085)
      try {
        const apptRes = await fetch(`http://localhost:8085/api/appointments?patientId=${actualUserId}`);
        if (apptRes.ok) {
          const apptsData = await apptRes.json();
          setAppointments(Array.isArray(apptsData) ? apptsData : apptsData.data || []);
        }
      } catch (e) { console.warn("Appointment Service offline."); }

      // 4. Fetch Local Prescriptions
      try {
        const allPrescriptions = JSON.parse(localStorage.getItem(STORAGE_KEY_PRESCRIPTIONS) || '[]');
        const mine = Array.isArray(allPrescriptions)
          ? allPrescriptions.filter((item) => Number(item?.patientId) === Number(actualUserId))
          : [];
        setPrescriptions(mine);
      } catch { setPrescriptions([]); }

    } catch (err) {
      setError('Some data could not be loaded, but your profile is still available.');
    } finally {
      setLoading(false);
    }
  };

  // --- Avatar Upload Logic ---
  const handleAvatarClick = () => {
    if (avatarUploadRef.current) avatarUploadRef.current.click();
  };

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setProfilePicUrl(URL.createObjectURL(file));

    const token = getCleanToken();
    const actualUserId = currentUser?.userId;
    const toastId = toast.loading("Saving picture...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`http://localhost:8083/api/patients/profile/${actualUserId}/picture`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        toast.success("Profile picture updated!", { id: toastId });
      } else {
        toast.error("Failed to save to database.", { id: toastId });
      }
    } catch (err) {
      toast.error("Network error during upload.", { id: toastId });
    }
  };

  // --- Profile Edit Logic ---
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const token = getCleanToken();
    const actualUserId = currentUser?.userId;
    const toastId = toast.loading("Saving personal details...");

    const cleanPayload = {
      ...editForm,
      age: editForm.age === '' || editForm.age === null ? null : parseInt(editForm.age, 10)
    };

    try {
      const res = await fetch(`http://localhost:8081/api/auth/user/${actualUserId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanPayload)
      });

      const resData = await res.json();
      if (res.ok) {
        toast.success("Profile updated successfully!", { id: toastId });
        setIsEditing(false); // Close the form
        fetchData(); // Refresh data to show new details
      } else {
        toast.error(resData.message || "Failed to update profile.", { id: toastId });
      }
    } catch (err) {
      toast.error("Network error.", { id: toastId });
    }
  };

  // --- Telemedicine Logic ---
  const checkMediaPermissions = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMediaReady(false);
      toast.error('Browser does not support camera API.');
      return false;
    }
    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
      cameraStream.getTracks().forEach((track) => track.stop());
      setMediaReady(true);
      return true;
    } catch (err) {
      setMediaReady(false);
      toast.error(getMediaPermissionError(err));
      return false;
    }
  };

  const startTelemedicineCall = async (appointment) => {
    const appointmentId = getAppointmentId(appointment);
    if (!appointmentId) return toast.error('Appointment ID missing.');
    const allowed = await checkMediaPermissions();
    if (!allowed) return;
    setActiveCall({ appointment, roomName: `healthcare-appt-${appointmentId}` });
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar navigate={navigate} currentUser={currentUser} />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <Toaster position="top-right" />
      <Navbar navigate={navigate} currentUser={currentUser} />

      {/* Teal Banner Background */}
      <div className="h-64 bg-gradient-to-r from-teal-600 to-cyan-600 w-full absolute top-0 left-0 z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-28">
        {error && (
          <div className="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* ================= LEFT COLUMN: PROFILE CARD ================= */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 text-center">
              
              <div className="relative inline-block mb-6">
                <div className="w-40 h-40 rounded-full border-4 border-white shadow-xl bg-slate-100 overflow-hidden mx-auto">
                  <img 
                    src={profilePicUrl || `https://ui-avatars.com/api/?name=${userDetails?.firstName || 'User'}&background=14b8a6&color=fff&size=200`} 
                    className="w-full h-full object-cover" 
                    alt="Profile" 
                    onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${userDetails?.firstName || 'User'}&background=14b8a6&color=fff&size=200`; }}
                  />
                </div>
                
                <button 
                  onClick={handleAvatarClick}
                  className="absolute bottom-1 right-1 w-11 h-11 bg-teal-500 hover:bg-teal-600 text-white rounded-full border-4 border-white shadow-lg flex items-center justify-center transition-transform hover:scale-110 z-50 cursor-pointer"
                  title="Change Photo"
                >
                  <svg className="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>

              <input 
                type="file" 
                accept="image/*" 
                ref={avatarUploadRef}
                onChange={handleProfilePicUpload} 
                className="hidden" 
              />

              <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                {userDetails?.firstName || currentUser?.name || 'Patient'} {userDetails?.lastName || ''}
              </h1>
              <span className="inline-block px-3 py-1 bg-teal-50 text-teal-700 text-xs font-bold rounded-full mt-2 mb-4">
                ID: #{currentUser?.userId}
              </span>

              <div className="w-full h-px bg-slate-100 my-6"></div>

              {/* User Meta Data */}
              <div className="space-y-4 text-left">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center text-lg">📧</div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</p>
                    <p className="text-sm font-bold text-slate-800 break-all">{userDetails?.email || currentUser?.email || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-green-50 text-green-500 flex items-center justify-center text-lg">📱</div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mobile Phone</p>
                    <p className="text-sm font-bold text-slate-800">{userDetails?.phoneNumber || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center text-lg">👥</div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Demographics</p>
                    <p className="text-sm font-bold text-slate-800">{userDetails?.age ? `${userDetails.age} yrs` : 'Age N/A'} • {userDetails?.gender || 'Gender N/A'}</p>
                  </div>
                </div>
              </div>

              {/* 🚨 THE FIX: This accurately copies your details into the form immediately on click! */}
              <button 
                onClick={() => {
                  if (!isEditing) {
                    setEditForm({
                      firstName: userDetails?.firstName || '',
                      lastName: userDetails?.lastName || '',
                      phoneNumber: userDetails?.phoneNumber || '',
                      age: userDetails?.age || '',
                      gender: userDetails?.gender || ''
                    });
                  }
                  setIsEditing(!isEditing);
                }}
                className={`mt-8 w-full py-3 rounded-xl font-bold transition-all ${isEditing ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-slate-900 text-white shadow-lg hover:bg-slate-800'}`}
              >
                {isEditing ? 'Cancel Editing' : '✏️ Edit Profile Details'}
              </button>

            </div>
          </div>

          {/* ================= RIGHT COLUMN: DASHBOARD ================= */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            <AnimatePresence mode="wait">
              {isEditing ? (
                // --- EDIT PROFILE FORM ---
                <motion.div key="edit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                  <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center text-xl">📝</span>
                    Update Personal Details
                  </h2>
                  
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <InputField label="First Name" value={editForm.firstName} onChange={v => setEditForm({...editForm, firstName: v})} />
                      <InputField label="Last Name" value={editForm.lastName} onChange={v => setEditForm({...editForm, lastName: v})} />
                      <InputField label="Phone Number" value={editForm.phoneNumber} onChange={v => setEditForm({...editForm, phoneNumber: v})} />
                      <InputField label="Age" type="number" value={editForm.age} onChange={v => setEditForm({...editForm, age: v})} />
                      
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Gender</label>
                        <select 
                            className="w-full bg-slate-50 border-none text-slate-800 font-bold rounded-2xl p-4 outline-none focus:ring-4 ring-teal-500/20 transition-all appearance-none cursor-pointer"
                            value={editForm.gender || ''}
                            onChange={e => setEditForm({...editForm, gender: e.target.value})}
                        >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex justify-end">
                        <button type="submit" className="px-10 py-4 bg-teal-600 text-white rounded-xl font-black hover:bg-teal-700 transition-colors shadow-lg">
                            Save Changes
                        </button>
                    </div>
                  </form>
                </motion.div>

              ) : (
                // --- NORMAL TABS DASHBOARD ---
                <motion.div key="tabs" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="bg-white rounded-2xl p-2 shadow-sm border border-slate-100 flex overflow-x-auto gap-2 mb-6">
                      <button 
                        onClick={() => setActiveTab('appointments')} 
                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'appointments' ? 'bg-teal-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                      >
                        📅 Appointments
                      </button>
                      <button 
                        onClick={() => setActiveTab('prescriptions')} 
                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'prescriptions' ? 'bg-teal-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                      >
                        💊 Prescriptions
                      </button>
                  </div>

                  {/* TAB: Appointments */}
                  {activeTab === 'appointments' && (
                    <div className="space-y-6">
                      {activeCall && (
                        <div className="bg-slate-900 rounded-3xl p-4 shadow-2xl border-4 border-slate-800">
                          <div className="flex justify-between items-center mb-4 px-2">
                            <div className="text-white">
                              <h3 className="font-bold text-lg flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Live Consultation</h3>
                              <p className="text-xs text-slate-400">Dr. {activeCall.appointment?.doctorFirstName || ''} {activeCall.appointment?.doctorLastName || ''}</p>
                            </div>
                            <button onClick={() => setActiveCall(null)} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                              End Session
                            </button>
                          </div>
                          <div className="w-full h-[500px] rounded-2xl overflow-hidden bg-black">
                            <iframe
                              src={buildJitsiCallUrl(activeCall.roomName, userDetails?.firstName || currentUser?.name || 'Patient')}
                              allow="camera *; microphone *; fullscreen *; display-capture *; autoplay *"
                              className="w-full h-full border-0"
                              title="Telemedicine"
                            />
                          </div>
                        </div>
                      )}

                      {appointments.length === 0 ? (
                        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
                          <span className="text-5xl block mb-4">🩺</span>
                          <h3 className="text-xl font-bold text-slate-800 mb-2">No Appointments Yet</h3>
                          <p className="text-slate-500 mb-6">You haven't booked any medical consultations.</p>
                          <button onClick={() => navigate('/appointment')} className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-xl font-bold transition-colors">
                            Book Now
                          </button>
                        </div>
                      ) : (
                        appointments.map((appt) => (
                          <div key={appt.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 pb-4 border-b border-slate-50">
                              <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center text-2xl border border-teal-100">👨‍⚕️</div>
                                <div>
                                  <h4 className="font-black text-slate-800 text-lg">Dr. {appt.doctorFirstName} {appt.doctorLastName}</h4>
                                  <p className="text-sm font-bold text-teal-600">{new Date(appt.appointmentDate).toLocaleDateString()} at {appt.appointmentTime}</p>
                                </div>
                              </div>
                              <span className={`px-4 py-2 rounded-full text-xs font-black tracking-widest uppercase ${appt.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                {appt.status || 'PENDING'}
                              </span>
                            </div>
                            <div className="mb-6">
                              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Reason for Visit</p>
                              <p className="text-slate-700 text-sm">{appt.reason || 'Not specified'}</p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                              <button onClick={() => startTelemedicineCall(appt)} disabled={!canJoinTelemedicine(appt)} className="flex-1 md:flex-none bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
                                🎥 Join Video Call
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* TAB: Prescriptions */}
                  {activeTab === 'prescriptions' && (
                    <div className="space-y-6">
                      {prescriptions.length === 0 ? (
                        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
                          <span className="text-5xl block mb-4">💊</span>
                          <h3 className="text-xl font-bold text-slate-800 mb-2">No Prescriptions</h3>
                          <p className="text-slate-500">Your doctors haven't uploaded any prescriptions yet.</p>
                        </div>
                      ) : (
                        prescriptions.map((rx) => (
                          <div key={rx.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="font-black text-slate-800">Prescription #{rx.id}</h4>
                              <span className="text-xs font-bold text-slate-400">{new Date(rx.issuedAt).toLocaleDateString()}</span>
                            </div>
                            <div className="bg-slate-50 rounded-2xl p-4 mb-4">
                              <p className="text-sm text-slate-700"><span className="font-bold">Diagnosis:</span> {rx.diagnosis || 'N/A'}</p>
                              <p className="text-sm text-slate-700 mt-1"><span className="font-bold">Doctor:</span> Dr. {rx.doctorName || 'N/A'}</p>
                            </div>
                            <h5 className="font-bold text-xs uppercase tracking-widest text-slate-400 mb-3">Medications</h5>
                            <ul className="space-y-2">
                              {rx.medications?.map((m, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm text-slate-700">
                                  <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                                  <span className="font-bold">{m?.name}</span> - {m?.dosage}, {m?.frequency} ({m?.duration})
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Helper Component ---
const InputField = ({ label, type = "text", value, onChange }) => (
    <div className="space-y-2">
        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">{label}</label>
        <input type={type} className="w-full bg-slate-50 border-none text-slate-800 font-bold rounded-2xl p-4 outline-none focus:ring-4 ring-teal-500/20 transition-all placeholder:text-slate-300" value={value || ''} onChange={e => onChange(e.target.value)} placeholder={`Enter ${label.toLowerCase()}`} />
    </div>
);

export default ProfilePage;