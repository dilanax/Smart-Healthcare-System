import { useState, useEffect, useRef } from 'react';
import Navbar from '../components/navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';

const ProfilePage = ({ navigate, currentUser }) => {
  const [userDetails, setUserDetails] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [reports, setReports] = useState([]); 
  
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('vault'); 
  const [debugError, setDebugError] = useState(""); 
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileDescription, setFileDescription] = useState("");
  const fileInputRef = useRef(null);
  
  const [editForm, setEditForm] = useState({
    firstName: '', lastName: '', phoneNumber: '', age: '', gender: '', profilePictureUrl: ''
  });

  const getCleanToken = () => {
    let token = localStorage.getItem('healthcare_auth_token');
    if (!token) return null;
    return token.replace(/^["']|["']$/g, ''); 
  };

  const getUserIdFromToken = () => {
    const token = getCleanToken();
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      return payload.id;
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setDebugError("");
      
      const token = getCleanToken();
      if (!token) return setDebugError("No token found in localStorage.");

      const actualUserId = getUserIdFromToken() || currentUser?.userId;
      if (!actualUserId) return setDebugError("Could not find a User ID.");

      // 1. Fetch User Details from AUTH SERVICE (Port 8081)
      try {
        const userRes = await fetch(`http://localhost:8081/api/auth/user/${actualUserId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const userData = await userRes.json();
        if (userData.data) {
            setUserDetails(userData.data);
            setEditForm(userData.data);
        } else {
            toast.error(userData.message || "Backend denied access.");
        }
      } catch (e) {
        console.warn("Could not fetch user details.", e);
      }

      // 2. Fetch Appointments from APPOINTMENT SERVICE (Port 8085)
      try {
        const apptRes = await fetch(`http://localhost:8085/api/appointments?patientId=${actualUserId}`);
        if (apptRes.ok) {
            const apptsData = await apptRes.json();
            setAppointments(Array.isArray(apptsData) ? apptsData : apptsData.data || []);
        }
      } catch (apptError) {
        console.warn("Appointment service is offline (Port 8085). Skipping...");
      }

      // 3. Fetch Reports from PATIENT SERVICE (Port 8083) 🚨 FIXED PORT 🚨
      try {
        const reportsRes = await fetch(`http://localhost:8083/api/reports/patient/${actualUserId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (reportsRes.ok) {
            const reportsData = await reportsRes.json();
            setReports(reportsData.data || []);
        }
      } catch (reportError) {
        console.warn("Failed to fetch reports from Patient Service.", reportError);
      }

    } catch (err) {
      setDebugError(`Critical framework error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return toast.error("Please select a file to upload.");

    const token = getCleanToken();
    const actualUserId = getUserIdFromToken() || currentUser?.userId;
    const toastId = toast.loading("Encrypting and uploading to vault...");

    const formData = new FormData();
    formData.append("file", selectedFile);
    if (fileDescription) {
        formData.append("description", fileDescription);
    }

    try {
      // 🚨 FIXED PORT TO 8083 🚨
      const res = await fetch(`http://localhost:8083/api/reports/upload/${actualUserId}`, {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${token}` 
        },
        body: formData
      });

      const data = await res.json();
      if (res.ok && data.data) {
        toast.success("Document safely stored in Vault!", { id: toastId });
        setSelectedFile(null);
        setFileDescription("");
        if(fileInputRef.current) fileInputRef.current.value = ""; 
        fetchData(); 
      } else {
        toast.error(data.message || "Failed to upload file.", { id: toastId });
      }
    } catch (err) {
      toast.error("Network error during upload.", { id: toastId });
    }
  };

  const handleSecureView = async (reportId, originalName) => {
      const token = getCleanToken();
      const toastId = toast.loading("Decrypting file...");

      try {
          // 🚨 FIXED PORT TO 8083 🚨
          const res = await fetch(`http://localhost:8083/api/reports/download/${reportId}`, {
              method: 'GET',
              headers: { 'Authorization': `Bearer ${token}` }
          });

          if (!res.ok) throw new Error("Unauthorized or File Not Found");

          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);

          const link = document.createElement('a');
          link.href = url;
          link.target = '_blank'; 
          link.download = originalName; 
          document.body.appendChild(link);
          link.click();
          
          link.remove();
          window.URL.revokeObjectURL(url);
          
          toast.success("File accessed successfully", { id: toastId });
      } catch (err) {
          toast.error("Security Block: Could not load file.", { id: toastId });
      }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const token = getCleanToken();
    const actualUserId = getUserIdFromToken() || currentUser?.userId;
    const toastId = toast.loading("Saving changes to secure vault...");

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
      if (res.ok && resData.data) {
        toast.success("Profile updated successfully!", { id: toastId });
        setIsEditing(false);
        fetchData(); 
      } else {
        toast.error(resData.message || "Failed to update profile.", { id: toastId });
      }
    } catch (err) {
      toast.error("Network error.", { id: toastId });
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f0f4f8] font-sans pb-20">
      <Toaster position="top-right" /> 
      <Navbar navigate={navigate} currentUser={currentUser} />

      <div className="h-72 bg-gradient-to-br from-[#0f766e] via-[#14b8a6] to-[#06b6d4] w-full absolute top-0 left-0 z-0 overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-32">
        
        {debugError && (
            <div className="mb-8 bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-xl shadow-lg font-mono text-sm">
                <strong>🚨 SYSTEM DIAGNOSTIC ERROR:</strong><br/>{debugError}
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Identity Card (Left Column) */}
          <div className="lg:col-span-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-xl border border-white">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="absolute -inset-1 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full blur opacity-30 transition duration-500"></div>
                  <img 
                    src={userDetails?.profilePictureUrl || `https://ui-avatars.com/api/?name=${userDetails?.firstName || 'U'}&background=14b8a6&color=fff&size=250`} 
                    className="relative w-40 h-40 rounded-full border-4 border-white shadow-xl object-cover bg-white" 
                    alt="Profile" 
                    onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${userDetails?.firstName || 'U'}&background=14b8a6&color=fff&size=250`; }}
                  />
                </div>
                
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                  {userDetails?.firstName || 'User'} {userDetails?.lastName || ''}
                </h1>
                <div className="flex items-center gap-2 mt-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Patient ID: #{getUserIdFromToken() || currentUser?.userId}</p>
                </div>

                <div className="w-full h-px bg-slate-100 my-8"></div>

                <div className="w-full space-y-5 text-left">
                  <ContactRow icon="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" label="Email Address" value={userDetails?.email || "No email"} />
                  <ContactRow icon="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" label="Mobile" value={userDetails?.phoneNumber || "Not provided"} />
                  <ContactRow icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" label="Demographics" value={`${userDetails?.age ? userDetails.age + ' yrs' : 'Age N/A'} • ${userDetails?.gender || 'Gender N/A'}`} />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Dashboard Area (Right Column) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Header / Tab Navigation */}
            <div className="bg-white rounded-3xl p-4 px-6 shadow-sm flex items-center justify-between border border-slate-100 overflow-x-auto">
                <div className="flex gap-2 sm:gap-4 min-w-max">
                    <button onClick={() => {setActiveTab('appointments'); setIsEditing(false);}} className={`px-4 sm:px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'appointments' && !isEditing ? 'bg-teal-50 text-teal-700' : 'text-slate-400 hover:text-slate-800'}`}>
                        Clinical History
                    </button>
                    <button onClick={() => {setActiveTab('vault'); setIsEditing(false);}} className={`px-4 sm:px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'vault' && !isEditing ? 'bg-indigo-50 text-indigo-700' : 'text-slate-400 hover:text-slate-800'}`}>
                        🔒 Medical Vault
                    </button>
                    <button onClick={() => {setActiveTab('details'); setIsEditing(false);}} className={`px-4 sm:px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'details' && !isEditing ? 'bg-teal-50 text-teal-700' : 'text-slate-400 hover:text-slate-800'}`}>
                        Overview
                    </button>
                </div>
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className={`ml-4 px-6 py-2.5 rounded-xl font-black text-sm transition-all shadow-lg shrink-0 ${isEditing ? 'bg-slate-800 text-white shadow-slate-500/20' : 'bg-teal-600 text-white shadow-teal-500/30 hover:bg-teal-700'}`}
                >
                  {isEditing ? 'CANCEL' : 'EDIT PROFILE'}
                </button>
            </div>

            {/* Dynamic Content Area */}
            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.div key="edit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <form onSubmit={handleUpdate} className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                    <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600 text-lg">✏️</span>
                      Update Information
                    </h2>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <InputField label="First Name" value={editForm.firstName} onChange={v => setEditForm({...editForm, firstName: v})} />
                      <InputField label="Last Name" value={editForm.lastName} onChange={v => setEditForm({...editForm, lastName: v})} />
                      <InputField label="Phone Number" value={editForm.phoneNumber} onChange={v => setEditForm({...editForm, phoneNumber: v})} />
                      <InputField label="Age" type="number" value={editForm.age} onChange={v => setEditForm({...editForm, age: v})} />
                      
                      <div className="md:col-span-2">
                        <InputField label="Profile Image URL (Optional)" type="url" value={editForm.profilePictureUrl} onChange={v => setEditForm({...editForm, profilePictureUrl: v})} />
                        <p className="text-[10px] font-bold text-slate-400 mt-2 pl-2">Paste a direct image link to change your picture.</p>
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Gender</label>
                        <select 
                            className="w-full bg-slate-50 border-none text-slate-800 font-bold rounded-2xl p-4 outline-none focus:ring-4 ring-teal-500/20 transition-all appearance-none"
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

                    <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end gap-4">
                        <button type="submit" className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-colors shadow-xl shadow-slate-900/20">
                            SAVE CHANGES
                        </button>
                    </div>
                  </form>
                </motion.div>

              ) : activeTab === 'vault' ? (
                <motion.div key="vault" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                        <div className="mb-8">
                            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                                🔒 Secure Medical Vault
                            </h2>
                            <p className="text-slate-500 font-medium mt-1">Upload and access your lab results, prescriptions, and medical reports securely.</p>
                        </div>

                        {/* Upload Form */}
                        <form onSubmit={handleFileUpload} className="mb-10 bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100">
                            <h3 className="font-bold text-indigo-900 mb-4 text-sm uppercase tracking-widest">Upload New Document</h3>
                            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                                <div className="flex-1 w-full">
                                    <input 
                                        type="file" 
                                        ref={fileInputRef}
                                        onChange={(e) => setSelectedFile(e.target.files[0])}
                                        className="w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 transition-all cursor-pointer"
                                        accept=".pdf,.png,.jpg,.jpeg"
                                    />
                                </div>
                                <div className="flex-1 w-full">
                                    <input 
                                        type="text" 
                                        placeholder="Description (e.g., Blood Test Jan 2026)" 
                                        value={fileDescription}
                                        onChange={(e) => setFileDescription(e.target.value)}
                                        className="w-full bg-white border-none text-slate-800 font-bold rounded-xl p-3 outline-none focus:ring-4 ring-indigo-500/20 transition-all"
                                    />
                                </div>
                                <button type="submit" className="w-full md:w-auto px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-colors shrink-0">
                                    Upload
                                </button>
                            </div>
                        </form>

                        {/* List of Uploaded Documents */}
                        {reports.length === 0 ? (
                            <div className="bg-slate-50 rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
                                <span className="text-4xl mb-4 block">🗂️</span>
                                <p className="text-slate-500 font-bold">Your vault is empty.</p>
                                <p className="text-sm text-slate-400 mt-1">Upload your first medical document above.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {reports.map(report => (
                                    <div key={report.id} className="group bg-white border border-slate-100 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
                                        <div className="flex items-center gap-4 w-full">
                                            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl shrink-0">
                                                {report.fileType.includes('pdf') ? '📄' : '🖼️'}
                                            </div>
                                            <div className="overflow-hidden">
                                                <h4 className="font-bold text-slate-800 truncate">{report.originalFileName}</h4>
                                                <p className="text-slate-400 text-xs mt-0.5">{report.description || 'No description provided'}</p>
                                                <p className="text-indigo-400 text-[10px] font-black uppercase mt-1 tracking-widest">
                                                    Uploaded: {new Date(report.uploadedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleSecureView(report.id, report.originalFileName)}
                                            className="w-full md:w-auto px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors shrink-0 whitespace-nowrap"
                                        >
                                            View Safely
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>

              ) : activeTab === 'appointments' ? (
                <motion.div key="appointments" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                  <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-slate-800">My Appointments</h2>
                            <p className="text-slate-500 font-medium mt-1">Manage your upcoming and past clinical visits.</p>
                        </div>
                        <button onClick={() => navigate('/appointment')} className="text-teal-600 font-bold hover:underline">+ Book New</button>
                    </div>

                    {appointments.length === 0 ? (
                        <div className="bg-slate-50 rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
                            <span className="text-4xl mb-4 block">📅</span>
                            <p className="text-slate-500 font-bold">No appointments scheduled yet.</p>
                        </div>
                    ) : (
                      <div className="space-y-4">
                        {appointments.map(apt => (
                          <div key={apt.id} className="group bg-white border border-slate-100 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6 hover:shadow-xl hover:shadow-teal-500/5 transition-all duration-300">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center text-2xl border border-teal-100">👨‍⚕️</div>
                                <div>
                                    <h4 className="font-black text-slate-800 text-lg">Dr. {apt.doctorFirstName} {apt.doctorLastName}</h4>
                                    <p className="text-teal-600 font-bold text-sm mt-1">{new Date(apt.appointmentDate).toLocaleDateString()} at {apt.appointmentTime}</p>
                                    <p className="text-slate-400 text-xs mt-1 font-medium bg-slate-50 px-2 py-1 rounded inline-block">{apt.reason}</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-3 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
                                <span className={`px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase ${apt.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>{apt.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div key="overview" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                     <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                        <h2 className="text-2xl font-black text-slate-800 mb-8">Account Overview</h2>
                        <div className="grid sm:grid-cols-2 gap-8">
                            <OverviewCard title="Account Status" value={userDetails?.isActive !== false ? "Active Member" : "Inactive"} subtitle={`Since ${new Date(userDetails?.createdAt || Date.now()).getFullYear()}`} color="emerald" />
                            <OverviewCard title="Security" value="OTP Verified" subtitle="Two-factor auth enabled" color="blue" />
                            <OverviewCard title="Platform Usage" value={`${appointments.length} Visits`} subtitle="Total lifetime bookings" color="teal" />
                            <OverviewCard title="Medical Vault" value={`${reports.length} Files`} subtitle="Securely vaulted documents" color="indigo" />
                        </div>
                     </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </div>
    </div>
  );
};

/* --- Helper Components --- */
const ContactRow = ({ icon, label, value }) => (
    <div className="flex items-start gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors">
        <div className="mt-1 w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon}></path></svg>
        </div>
        <div className="overflow-hidden">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
            <p className="font-bold text-slate-800 truncate text-sm mt-0.5">{value}</p>
        </div>
    </div>
);

const InputField = ({ label, type = "text", value, onChange }) => (
    <div className="space-y-2">
        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">{label}</label>
        <input type={type} className="w-full bg-slate-50 border-none text-slate-800 font-bold rounded-2xl p-4 outline-none focus:ring-4 ring-teal-500/20 transition-all placeholder:text-slate-300" value={value || ''} onChange={e => onChange(e.target.value)} placeholder={`Enter ${label.toLowerCase()}`} />
    </div>
);

const OverviewCard = ({ title, value, subtitle, color }) => {
    const colors = {
        emerald: 'bg-emerald-50 text-emerald-600', blue: 'bg-blue-50 text-blue-600',
        purple: 'bg-purple-50 text-purple-600', teal: 'bg-teal-50 text-teal-600',
        indigo: 'bg-indigo-50 text-indigo-600'
    };
    return (
        <div className="border border-slate-100 rounded-3xl p-6 hover:shadow-lg transition-shadow">
            <div className={`w-10 h-10 rounded-xl ${colors[color]} flex items-center justify-center mb-4`}>
                <span className="w-4 h-4 rounded-full bg-current opacity-50"></span>
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
            <h4 className="text-xl font-black text-slate-800 mb-1">{value}</h4>
            <p className="text-xs font-bold text-slate-400">{subtitle}</p>
        </div>
    )
};

export default ProfilePage;