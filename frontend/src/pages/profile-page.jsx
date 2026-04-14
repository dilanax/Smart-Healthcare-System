import { useState, useEffect } from 'react';
import Navbar from '../components/navbar';

const STORAGE_KEY_PRESCRIPTIONS = 'doctor_prescriptions';

const buildJitsiCallUrl = (roomName, displayName) =>
  `https://meet.jit.si/${encodeURIComponent(roomName)}#userInfo.displayName=${encodeURIComponent(displayName)}&config.startWithVideoMuted=false&config.startWithAudioMuted=false&config.prejoinPageEnabled=false`;

const getMediaPermissionError = (error) => {
  if (error?.name === 'NotAllowedError') {
    return 'Camera/Microphone permission denied. Click the lock icon near URL and allow camera + microphone.';
  }
  if (error?.name === 'NotFoundError') {
    return 'No camera device found on this computer (or camera is blocked).';
  }
  if (error?.name === 'NotReadableError') {
    return 'Camera is busy in another app (Teams/Zoom/Camera). Close other apps and try again.';
  }
  return 'Unable to access camera/microphone on this browser.';
};

const ProfilePage = ({ navigate, currentUser }) => {
  const [userDetails, setUserDetails] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCall, setActiveCall] = useState(null);
  const [mediaReady, setMediaReady] = useState(false);

  const getAppointmentId = (appointment) => appointment?.appointmentId ?? appointment?.id;

  const canJoinTelemedicine = (appointment) => {
    const status = String(appointment?.status || '').toUpperCase();
    return status === 'CONFIRMED';
  };

  const checkMediaPermissions = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMediaReady(false);
      setError('Your browser does not support camera access APIs.');
      return false;
    }

    let cameraError = null;
    let micError = null;
    let cameraReady = false;

    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
      cameraReady = cameraStream.getVideoTracks().length > 0;
      cameraStream.getTracks().forEach((track) => track.stop());
    } catch (permissionError) {
      cameraError = permissionError;
    }

    try {
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStream.getTracks().forEach((track) => track.stop());
    } catch (permissionError) {
      micError = permissionError;
    }

    if (cameraReady) {
      setMediaReady(true);
      setError('');
      return true;
    }

    {
      setMediaReady(false);
      setError(getMediaPermissionError(cameraError || micError));
      return false;
    }
  };

  const startTelemedicineCall = async (appointment) => {
    const appointmentId = getAppointmentId(appointment);
    if (!appointmentId) {
      alert('Appointment ID not found. Please refresh and try again.');
      return;
    }

    setError('');
    const allowed = await checkMediaPermissions();
    if (!allowed) return;

    setActiveCall({
      appointment,
      roomName: `healthcare-appt-${appointmentId}`,
    });
  };

  const endTelemedicineCall = () => {
    setActiveCall(null);
  };

  const openPatientCallInNewTab = (roomName) => {
    const patientName = userDetails?.firstName || currentUser?.name || 'Patient';
    window.open(buildJitsiCallUrl(roomName, patientName), '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const fetchUserAndAppointments = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch user details from Auth Service
        const userResponse = await fetch(`http://localhost:8081/api/auth/user/${currentUser.userId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('healthcare_auth_token')}`,
            'Content-Type': 'application/json',
          },
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          // Handle both direct user data and wrapped response
          const user = userData.data || userData;
          setUserDetails(user);
        }

        // Fetch appointments from Appointment Service
        const appointmentsResponse = await fetch(
          `http://localhost:8085/api/appointments?patientId=${currentUser.userId}`
        );

        if (appointmentsResponse.ok) {
          const appointmentsData = await appointmentsResponse.json();
          const appts = Array.isArray(appointmentsData) ? appointmentsData : appointmentsData.data || [];
          setAppointments(appts);
        }

        try {
          const allPrescriptions = JSON.parse(localStorage.getItem(STORAGE_KEY_PRESCRIPTIONS) || '[]');
          const mine = Array.isArray(allPrescriptions)
            ? allPrescriptions.filter((item) => Number(item?.patientId) === Number(currentUser.userId))
            : [];
          setPrescriptions(mine);
        } catch {
          setPrescriptions([]);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Some data could not be loaded, but your profile is still available');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndAppointments();
  }, [currentUser, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar navigate={navigate} currentUser={currentUser} />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-600">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar navigate={navigate} currentUser={currentUser} />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 border-l-4 border-red-500">
            <p className="text-red-800">⚠️ {error}</p>
          </div>
        )}

        {/* User Details Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">👤 My Profile</h1>

          <div className="bg-linear-to-r from-teal-500 to-cyan-500 rounded-2xl p-8 shadow-xl text-white mb-8">
            <div className="flex items-center gap-6">
              <img
                src={`https://i.pravatar.cc/200?u=${currentUser.userId}&s=200`}
                alt="Profile"
                className="w-32 h-32 rounded-full border-4 border-white"
              />
            <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">
                  {userDetails?.firstName || currentUser?.name || 'User'} {userDetails?.lastName || ''}
                </h2>
                <p className="text-teal-100 text-lg mb-4">Patient ID: {currentUser.userId}</p>
              </div>
            </div>
          </div>

          {/* User Information Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Email */}
            <div className="bg-white rounded-lg p-6 shadow-md border-l-4 border-blue-500">
              <p className="text-gray-600 text-sm mb-1">📧 Email</p>
              <p className="text-gray-900 font-semibold break-all">{userDetails?.email || 'N/A'}</p>
            </div>

            {/* Phone */}
            <div className="bg-white rounded-lg p-6 shadow-md border-l-4 border-green-500">
              <p className="text-gray-600 text-sm mb-1">📱 Phone</p>
              <p className="text-gray-900 font-semibold">{userDetails?.phoneNumber || 'Not provided'}</p>
            </div>

            {/* Age */}
            <div className="bg-white rounded-lg p-6 shadow-md border-l-4 border-yellow-500">
              <p className="text-gray-600 text-sm mb-1">🎂 Age</p>
              <p className="text-gray-900 font-semibold">{userDetails?.age || 'Not provided'}</p>
            </div>

            {/* Gender */}
            <div className="bg-white rounded-lg p-6 shadow-md border-l-4 border-purple-500">
              <p className="text-gray-600 text-sm mb-1">👥 Gender</p>
              <p className="text-gray-900 font-semibold">{userDetails?.gender || 'Not provided'}</p>
            </div>

            {/* Account Status */}
            <div className="bg-white rounded-lg p-6 shadow-md border-l-4 border-orange-500">
              <p className="text-gray-600 text-sm mb-1">✅ Status</p>
              <p className="text-gray-900 font-semibold">
                {userDetails?.isActive !== false ? 'Active' : 'Inactive'}
              </p>
            </div>

            {/* Joined Date */}
            <div className="bg-white rounded-lg p-6 shadow-md border-l-4 border-red-500">
              <p className="text-gray-600 text-sm mb-1">📅 Member Since</p>
              <p className="text-gray-900 font-semibold">
                {userDetails?.createdAt 
                  ? new Date(userDetails.createdAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })
                  : 'April 2026'}
              </p>
            </div>
          </div>
        </div>

        {/* Prescriptions Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">💊 My Prescriptions</h2>
          {prescriptions.length === 0 ? (
            <div className="bg-white rounded-lg p-6 shadow-md text-gray-500">
              No prescriptions available for your patient account yet.
            </div>
          ) : (
            <div className="grid gap-4">
              {prescriptions.map((prescription) => (
                <div
                  key={prescription.id}
                  className="bg-white rounded-lg p-6 shadow-md border-l-4 border-emerald-500"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm text-gray-500">Prescription ID</p>
                      <p className="font-bold text-gray-800">{prescription.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Issued Date</p>
                      <p className="font-semibold text-gray-700">
                        {prescription.issuedAt
                          ? new Date(prescription.issuedAt).toLocaleDateString('en-US')
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-gray-700 sm:grid-cols-2">
                    <p><span className="font-semibold">Doctor:</span> Dr. {prescription.doctorName || 'N/A'}</p>
                    <p><span className="font-semibold">Appointment:</span> #{prescription.appointmentId || 'N/A'}</p>
                    <p className="sm:col-span-2"><span className="font-semibold">Diagnosis:</span> {prescription.diagnosis || 'N/A'}</p>
                    <div className="sm:col-span-2">
                      <p className="font-semibold">Medicines:</p>
                      {Array.isArray(prescription.medications) && prescription.medications.length > 0 ? (
                        <ul className="mt-1 space-y-1 text-sm text-gray-600">
                          {prescription.medications.map((m, i) => (
                            <li key={`${prescription.id}-med-${i}`}>
                              {m?.name || 'Medicine'} - {m?.dosage || 'N/A'}, {m?.frequency || 'N/A'}, {m?.duration || 'N/A'}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500">No medicine entries.</p>
                      )}
                    </div>
                    {prescription.notes ? (
                      <p className="sm:col-span-2"><span className="font-semibold">Notes:</span> {prescription.notes}</p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Appointments Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📋 My Appointments</h2>

          {activeCall ? (
            <div className="mb-6 rounded-2xl bg-white p-4 shadow-lg">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Telemedicine Session</h3>
                  <p className="text-sm text-gray-500">
                    Appointment #{getAppointmentId(activeCall.appointment)} with Dr. {activeCall.appointment?.doctorFirstName || ''} {activeCall.appointment?.doctorLastName || ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openPatientCallInNewTab(activeCall.roomName)}
                    className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition"
                  >
                    Open In New Tab
                  </button>
                  <button
                    onClick={endTelemedicineCall}
                    className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition"
                  >
                    End Call
                  </button>
                </div>
              </div>
              <div className="overflow-hidden rounded-xl border" style={{ height: '520px' }}>
                <iframe
                  src={buildJitsiCallUrl(activeCall.roomName, userDetails?.firstName || currentUser?.name || 'Patient')}
                  allow="camera *; microphone *; fullscreen *; display-capture *; autoplay *"
                  className="h-full w-full border-0"
                  title="Patient Video Consultation"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">Room: {activeCall.roomName}</p>
              <p className="mt-1 text-xs text-slate-500">Local device access: {mediaReady ? 'Camera/Mic ready' : 'Not verified for this session'}</p>
              <p className="mt-1 text-xs text-amber-600">If camera is blocked in iframe, click Open In New Tab and allow camera/mic permission.</p>
            </div>
          ) : null}

          <div className="mb-4">
            <button
              type="button"
              onClick={checkMediaPermissions}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Enable Camera & Mic
            </button>
          </div>

          {appointments.length === 0 ? (
            <div className="bg-white rounded-lg p-8 shadow-md text-center">
              <p className="text-gray-500 text-lg mb-4">No appointments booked yet</p>
              <button
                onClick={() => navigate('/appointment')}
                className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition"
              >
                Book an Appointment
              </button>
            </div>
          ) : (
            <div className="grid gap-6">
              {appointments.map((appointment, index) => (
                <div
                  key={appointment.id || index}
                  className="bg-white rounded-lg p-6 shadow-md border-l-4 border-teal-500 hover:shadow-lg transition"
                >
                  <div className="grid md:grid-cols-5 gap-4 items-start">
                    {/* Doctor Info */}
                    <div className="md:col-span-2">
                      <p className="text-gray-600 text-sm mb-1">👨‍⚕️ Doctor</p>
                      <p className="text-gray-900 font-semibold text-lg">
                        Dr. {appointment.doctorFirstName || 'Unknown'} {appointment.doctorLastName || ''}
                      </p>
                    </div>

                    {/* Date */}
                    <div>
                      <p className="text-gray-600 text-sm mb-1">📅 Date</p>
                      <p className="text-gray-900 font-semibold">
                        {appointment.appointmentDate
                          ? new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'N/A'}
                      </p>
                    </div>

                    {/* Time */}
                    <div>
                      <p className="text-gray-600 text-sm mb-1">⏰ Time</p>
                      <p className="text-gray-900 font-semibold">{appointment.appointmentTime || 'N/A'}</p>
                    </div>

                    {/* Status */}
                    <div>
                      <p className="text-gray-600 text-sm mb-1">ℹ️ Status</p>
                      <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold capitalize">
                        {appointment.status || 'Confirmed'}
                      </span>
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-gray-600 text-sm mb-1">📝 Reason</p>
                    <p className="text-gray-900">{appointment.reason || 'No reason provided'}</p>
                  </div>

                  {/* Token */}
                  {appointment.token && (
                    <div className="mt-4 bg-blue-50 rounded p-3 border-l-4 border-blue-500">
                      <p className="text-blue-600 text-sm font-mono">
                        🎟️ Token: <span className="font-semibold">{appointment.token}</span>
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-6 pt-4 border-t border-gray-200 flex gap-3">
                    <button
                      onClick={() => {
                        // Reschedule action
                        alert('Reschedule functionality coming soon!');
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-sm"
                    >
                      📅 Reschedule
                    </button>
                    <button
                      onClick={() => {
                        // Cancel action
                        if (window.confirm('Are you sure you want to cancel this appointment?')) {
                          alert('Appointment cancelled! You will receive a confirmation email.');
                        }
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold text-sm"
                    >
                      ❌ Cancel
                    </button>
                    <button
                      onClick={() => {
                        // Download slip
                        alert('Download appointment slip coming soon!');
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold text-sm"
                    >
                      📄 Download Slip
                    </button>
                    <button
                      onClick={() => startTelemedicineCall(appointment)}
                      disabled={!canJoinTelemedicine(appointment)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      🎥 Join Call
                    </button>
                  </div>
                  {!canJoinTelemedicine(appointment) ? (
                    <p className="mt-3 text-xs text-slate-500">Call is available when appointment status is CONFIRMED.</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edit Profile Button */}
        <div className="mt-12 flex gap-4">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-semibold"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
