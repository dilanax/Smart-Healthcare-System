import { useState, useEffect } from 'react';
import Navbar from '../components/navbar';

const ProfilePage = ({ navigate, currentUser }) => {
  const [userDetails, setUserDetails] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '', lastName: '', phoneNumber: '', age: '', gender: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('healthcare_auth_token');
      const userRes = await fetch(`http://localhost:8081/api/auth/user/${currentUser.userId}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      if (userRes.ok) {
        const userData = await userRes.json();
        const user = userData.data || userData;
        setUserDetails(user);
        setEditForm(user);
      }

      const apptRes = await fetch(`http://localhost:8085/api/appointments?patientId=${currentUser.userId}`);
      if (apptRes.ok) {
        const apptsData = await apptRes.json();
        setAppointments(Array.isArray(apptsData) ? apptsData : apptsData.data || []);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!currentUser) { navigate('/login'); return; }
    fetchData();
  }, [currentUser, navigate]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('healthcare_auth_token');
    const res = await fetch(`http://localhost:8081/api/auth/user/${currentUser.userId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm)
    });

    if (res.ok) {
      setIsEditing(false);
      fetchData();
    }
  };

  if (loading) return <div className="p-20 text-center">⏳ Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar navigate={navigate} currentUser={currentUser} />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl p-8 shadow-xl text-white mb-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <img src={`https://i.pravatar.cc/200?u=${currentUser.userId}`} className="w-32 h-32 rounded-full border-4 border-white" alt="Profile" />
            <div>
              <h2 className="text-3xl font-bold">{userDetails?.firstName} {userDetails?.lastName}</h2>
              <p className="text-teal-100">Patient ID: {currentUser.userId}</p>
            </div>
          </div>
          <button onClick={() => setIsEditing(!isEditing)} className="bg-white text-teal-600 px-6 py-2 rounded-xl font-bold shadow-lg">
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1 bg-white p-8 rounded-3xl shadow-md">
            <h3 className="text-xl font-black mb-6">Personal Details</h3>
            {isEditing ? (
              <form onSubmit={handleUpdate} className="space-y-4">
                <input className="w-full p-3 bg-gray-50 rounded-xl border" value={editForm.firstName || ''} onChange={e => setEditForm({...editForm, firstName: e.target.value})} placeholder="First Name" />
                <input className="w-full p-3 bg-gray-50 rounded-xl border" value={editForm.lastName || ''} onChange={e => setEditForm({...editForm, lastName: e.target.value})} placeholder="Last Name" />
                <input className="w-full p-3 bg-gray-50 rounded-xl border" value={editForm.phoneNumber || ''} onChange={e => setEditForm({...editForm, phoneNumber: e.target.value})} placeholder="Phone" />
                <button type="submit" className="w-full py-3 bg-teal-600 text-white rounded-xl font-bold">Save Changes</button>
              </form>
            ) : (
              <div className="space-y-4">
                <p><strong>📧 Email:</strong> {userDetails?.email}</p>
                <p><strong>📱 Phone:</strong> {userDetails?.phoneNumber || 'Not provided'}</p>
                <p><strong>🎂 Age:</strong> {userDetails?.age || 'N/A'}</p>
                <p><strong>👥 Gender:</strong> {userDetails?.gender || 'N/A'}</p>
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <h2 className="text-2xl font-bold mb-6">My Appointments ({appointments.length})</h2>
            {appointments.map((apt) => (
              <div key={apt.id} className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-teal-500 mb-4">
                <p className="font-bold text-lg">Dr. {apt.doctorFirstName} {apt.doctorLastName}</p>
                <p className="text-gray-500">{apt.appointmentDate} at {apt.appointmentTime}</p>
                <span className="text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded mt-2 inline-block font-mono">{apt.token}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;