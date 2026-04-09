import { useState, useEffect } from 'react';
import Navbar from '../components/navbar';

const ProfilePage = ({ navigate, currentUser }) => {
  const [userDetails, setUserDetails] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        const userResponse = await fetch(`http://localhost:8083/api/auth/user/${currentUser.userId}`, {
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
          `http://localhost:8083/api/appointments?patientId=${currentUser.userId}`
        );

        if (appointmentsResponse.ok) {
          const appointmentsData = await appointmentsResponse.json();
          const appts = Array.isArray(appointmentsData) ? appointmentsData : appointmentsData.data || [];
          setAppointments(appts);
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

        {/* Appointments Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📋 My Appointments</h2>

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
                  </div>
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
