import { useCallback, useEffect, useMemo, useState } from 'react';
import { deleteUser, fetchUserById, fetchUsers, registerUser, updateUser } from '../lib/auth';
import { deleteNotificationById, fetchNotificationSummary, fetchNotifications, sendNotificationById, updateNotificationStatus } from '../lib/notifications';
import { createDoctorProfile, deleteDoctorProfile, fetchDoctorProfiles, updateDoctorProfile } from '../lib/doctors';
import { uploadDoctorImage } from '../lib/supabase';

const menu = [
  ['overview', 'fas fa-chart-line', 'Dashboard Overview'],
  ['users', 'fas fa-users', 'User Management'],
  ['doctors', 'fas fa-user-md', 'Doctor Verification'],
  ['appointments', 'fas fa-calendar-check', 'Appointments'],
  ['notifications', 'fas fa-bell', 'Notification Management'],
  ['payments', 'fas fa-credit-card', 'Transactions'],
  ['reports', 'fas fa-file-alt', 'Reports'],
  ['settings', 'fas fa-cog', 'Settings'],
];

const formatRole = (role) => role ? `${role[0]}${role.slice(1).toLowerCase()}` : 'Unknown';
const fullName = (user) => `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Unnamed User';
const formatDate = (value) => value ? new Intl.DateTimeFormat('en-LK', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value)) : 'N/A';
const formatDateTime = (value) => value ? new Intl.DateTimeFormat('en-LK', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value)) : 'N/A';

const roleClass = (role) => {
  if (role === 'DOCTOR') return 'bg-purple-100 text-purple-700';
  if (role === 'ADMIN') return 'bg-amber-100 text-amber-700';
  return 'bg-blue-100 text-blue-700';
};

const appointmentStatusClass = (status) => {
  if (status === 'CONFIRMED') return 'bg-green-100 text-green-700';
  if (status === 'CANCELLED') return 'bg-red-100 text-red-700';
  if (status === 'COMPLETED') return 'bg-blue-100 text-blue-700';
  return 'bg-yellow-100 text-yellow-700';
};

const StatCard = ({ title, value, icon, color, note }) => (
  <div className="rounded-2xl bg-white p-6 shadow-lg">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="mt-2 text-3xl font-bold text-gray-800">{value}</p>
        <p className="mt-2 text-xs text-gray-500">{note}</p>
      </div>
      <div className={`flex h-12 w-12 items-center justify-center rounded-full ${color}`}>
        <i className={`${icon} text-xl text-white`}></i>
      </div>
    </div>
  </div>
);

const Placeholder = ({ title, text }) => (
  <div className="rounded-2xl bg-white p-8 shadow-lg">
    <h3 className="text-lg font-bold text-gray-800">{title}</h3>
    <p className="mt-2 text-sm text-gray-500">{text}</p>
  </div>
);

const emptyCreateForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phoneNumber: '',
  role: 'PATIENT',
};

const toEditForm = (user) => ({
  firstName: user?.firstName ?? '',
  lastName: user?.lastName ?? '',
  email: user?.email ?? '',
  password: '',
  phoneNumber: user?.phoneNumber ?? '',
  role: user?.role ?? 'PATIENT',
  active: user?.active ?? true,
});

const emptyDoctorProfileForm = {
  firstName: '',
  lastName: '',
  specialization: '',
  hospital: '',
  email: '',
  loginPassword: '',
  phoneNumber: '',
  imageUrl: '',
  availability: 'Available Today',
  consultationFee: '2500',
  rating: '5',
  experienceYears: '5',
  patientCount: '0',
};

const toDoctorProfileForm = (doctor) => ({
  firstName: doctor?.firstName ?? '',
  lastName: doctor?.lastName ?? '',
  specialization: doctor?.specialization ?? doctor?.specialty ?? '',
  hospital: doctor?.hospital ?? '',
  email: doctor?.email ?? '',
  loginPassword: '',
  phoneNumber: doctor?.phoneNumber ?? '',
  imageUrl: doctor?.imageUrl ?? '',
  availability: doctor?.availability ?? 'Available Today',
  consultationFee: String(doctor?.consultationFee ?? '2500'),
  rating: String(doctor?.rating ?? '5'),
  experienceYears: String(doctor?.experienceYears ?? '5'),
  patientCount: String(doctor?.patientCount ?? '0'),
});

const generateDoctorPassword = () => {
  const base = Math.random().toString(36).slice(-6);
  return `Dr@${base}9A`;
};

const AdminDashboard = ({ navigate, currentUser, refreshUser }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [editForm, setEditForm] = useState(toEditForm(null));
  const [createFormError, setCreateFormError] = useState('');
  const [editFormError, setEditFormError] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showEditAppointmentModal, setShowEditAppointmentModal] = useState(false);
  const [editAppointmentForm, setEditAppointmentForm] = useState({});
  const [payments, setPayments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notificationSummary, setNotificationSummary] = useState(null);
  const [doctorProfiles, setDoctorProfiles] = useState([]);
  const [doctorProfileForm, setDoctorProfileForm] = useState(emptyDoctorProfileForm);
  const [doctorProfileError, setDoctorProfileError] = useState('');
  const [doctorImageFile, setDoctorImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingDoctorId, setEditingDoctorId] = useState(null);

  // ✅ Payment edit modal states
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);

  const [editPaymentForm, setEditPaymentForm] = useState({
     amount: "",
     status: "",
     method: "",
});

  const accessToken = currentUser?.accessToken;

  const mergeUserIntoState = useCallback((user) => {
    if (!user?.userId) return;

    setUsers((prev) => prev.map((item) => (item.userId === user.userId ? user : item)));
    setSelectedUser((prev) => (prev?.userId === user.userId ? user : prev));
  }, []);

  const loadUsers = useCallback(async (silent = false) => {
    if (!accessToken) return;
    if (!silent) setLoading(true);
    setError('');

    try {
      const response = await fetchUsers(accessToken);
      setUsers(Array.isArray(response?.data) ? response.data : []);
    } catch (err) {
      const message = err.message || 'Failed to load users.';
      setError(message);
      if (message.toLowerCase().includes('unauthorized')) refreshUser?.();
    } finally {
      if (!silent) setLoading(false);
    }
  }, [accessToken, refreshUser]);

  const loadAppointments = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8085/api/appointments');
      if (response.ok) {
        const data = await response.json();
        setAppointments(Array.isArray(data) ? data : data.data || []);
      } else {
        throw new Error('Failed to fetch appointments');
      }
    } catch (err) {
      const message = err.message || 'Failed to load appointments.';
      setError(message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const loadDoctorProfiles = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');

    try {
      const data = await fetchDoctorProfiles();
      setDoctorProfiles(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load doctor profiles.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const loadPayments = useCallback(async () => {
  try {
    setLoading(true);
    const response = await fetch("http://localhost:8086/payments/admin/all");
    if (response.ok) {
      const data = await response.json();
      setPayments(Array.isArray(data) ? data : data.data || []);
    } else {
      throw new Error("Failed to fetch payments");
    }
  } catch (err) {
    setError(err.message || "Failed to load payments.");
  } finally {
    setLoading(false);
  }
}, []);

const deletePayment = async (paymentId) => {
  if (!window.confirm("Are you sure you want to delete this transaction?")) return;

  try {
    await fetch(
      `http://localhost:8086/payments/admin/delete/${paymentId}`,
      { method: "DELETE" }
    );
    loadPayments(); // refresh table
  } catch (err) {
    alert("Failed to delete payment");
  }
};

const openEditPayment = (payment) => {
  setSelectedPayment(payment);
  setEditPaymentForm({
    amount: payment.amount,
    status: payment.status,
    method: payment.method,
  });
  setShowEditPaymentModal(true);
};

const submitEditPayment = async (e) => {
  e.preventDefault();
  if (!selectedPayment) return;

  try {
    await fetch(
      `http://localhost:8086/payments/admin/update/${selectedPayment.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(editPaymentForm.amount),
          status: editPaymentForm.status,
          method: editPaymentForm.method,
        }),
      }
    );

    setShowEditPaymentModal(false);
    setSelectedPayment(null);
    loadPayments();
  } catch (err) {
    alert("Failed to update payment");
  }
};


const approvePayment = async (paymentId) => {
  try {
    await fetch(
      `http://localhost:8086/payments/confirm/${paymentId}`,
      { method: "POST" }
    );
    loadPayments(); // refresh table
  } catch (err) {
    alert("Failed to approve payment");
  }
};

  const handleDoctorProfileChange = (event) => {
    const { name, value } = event.target;
    setDoctorProfileError('');
    setDoctorProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const startEditDoctorProfile = (doctor) => {
    setDoctorProfileError('');
    setError('');
    setSuccess('');
    setEditingDoctorId(doctor.userId);
    setDoctorProfileForm(toDoctorProfileForm(doctor));
    setDoctorImageFile(null);
  };

  const cancelDoctorProfileEdit = () => {
    setEditingDoctorId(null);
    setDoctorProfileForm(emptyDoctorProfileForm);
    setDoctorImageFile(null);
    setDoctorProfileError('');
  };

  const submitDoctorProfile = async (event) => {
    event.preventDefault();
    setBusyId('doctor-profile-submit');
    setError('');
    setSuccess('');
    setDoctorProfileError('');

    if (!doctorProfileForm.firstName.trim() || !doctorProfileForm.lastName.trim()) {
      const message = 'Doctor first name and last name are required.';
      setDoctorProfileError(message);
      setError(message);
      setBusyId(null);
      return;
    }

    const normalizedDoctorEmail = doctorProfileForm.email.trim().toLowerCase();
    if (!normalizedDoctorEmail) {
      const message = 'Doctor email is required.';
      setDoctorProfileError(message);
      setError(message);
      setBusyId(null);
      return;
    }

    if (!editingDoctorId && !doctorProfileForm.loginPassword.trim()) {
      const message = 'Doctor login password is required for new doctor registration.';
      setDoctorProfileError(message);
      setError(message);
      setBusyId(null);
      return;
    }

    try {
      let imageUrl = doctorProfileForm.imageUrl.trim();

      // If user selected an image file, upload it to Supabase first
      if (doctorImageFile) {
        setUploadingImage(true);
        imageUrl = await uploadDoctorImage(doctorImageFile);
        setUploadingImage(false);
      }

      let linkedDoctorUserId = editingDoctorId;

      if (!editingDoctorId) {
        if (!accessToken) {
          throw new Error('Admin session expired. Please login again and try.');
        }

        const usersResponse = await fetchUsers(accessToken);
        const refreshedUsers = Array.isArray(usersResponse?.data) ? usersResponse.data : [];
        setUsers(refreshedUsers);

        const existingUser = refreshedUsers.find(
          (user) => user.email?.trim().toLowerCase() === normalizedDoctorEmail,
        );

        if (existingUser) {
          if (existingUser.role !== 'DOCTOR') {
            throw new Error('This email already belongs to a non-doctor account. Please use another email.');
          }
          linkedDoctorUserId = existingUser.userId;
        } else {
          await registerUser({
            firstName: doctorProfileForm.firstName.trim(),
            lastName: doctorProfileForm.lastName.trim(),
            email: normalizedDoctorEmail,
            phoneNumber: doctorProfileForm.phoneNumber.trim(),
            password: doctorProfileForm.loginPassword,
            role: 'DOCTOR',
          });

          const latestUsersResponse = await fetchUsers(accessToken);
          const latestUsers = Array.isArray(latestUsersResponse?.data) ? latestUsersResponse.data : [];
          setUsers(latestUsers);

          const registeredDoctorUser = latestUsers.find(
            (user) => user.email?.trim().toLowerCase() === normalizedDoctorEmail,
          );

          if (!registeredDoctorUser) {
            throw new Error('Doctor login account was created, but user linking failed. Please refresh and try again.');
          }

          linkedDoctorUserId = registeredDoctorUser.userId;
        }
      }

      const payload = {
        userId: Number(linkedDoctorUserId),
        firstName: doctorProfileForm.firstName.trim(),
        lastName: doctorProfileForm.lastName.trim(),
        specialty: doctorProfileForm.specialization.trim(),
        specialization: doctorProfileForm.specialization.trim(),
        hospital: doctorProfileForm.hospital.trim(),
        email: normalizedDoctorEmail,
        phoneNumber: doctorProfileForm.phoneNumber.trim(),
        imageUrl: imageUrl,
        availability: doctorProfileForm.availability,
        consultationFee: Number(doctorProfileForm.consultationFee) || 2500,
        rating: Number(doctorProfileForm.rating) || 5,
        experienceYears: Number(doctorProfileForm.experienceYears) || 0,
        patientCount: Number(doctorProfileForm.patientCount) || 0,
      };

      if (editingDoctorId) {
        await updateDoctorProfile(editingDoctorId, payload);
      } else {
        await createDoctorProfile(payload);
      }

      setDoctorProfileForm(emptyDoctorProfileForm);
      setDoctorImageFile(null);
      setEditingDoctorId(null);
      await loadDoctorProfiles(true);
      setSuccess(
        editingDoctorId
          ? 'Doctor profile updated successfully.'
          : 'Doctor profile added successfully. It will now appear in home and appointment doctor lists.',
      );
    } catch (err) {
      const message = err.message || (editingDoctorId ? 'Failed to update doctor profile.' : 'Failed to create doctor profile.');
      setDoctorProfileError(message);
      setError(message);
    } finally {
      setBusyId(null);
      setUploadingImage(false);
    }
  };

  const removeDoctorProfile = async (doctorId) => {
    if (!window.confirm('Delete this doctor profile?')) return;

    setBusyId(doctorId);
    setError('');
    setSuccess('');
    try {
      await deleteDoctorProfile(doctorId);
      setDoctorProfiles((prev) => prev.filter((item) => item.userId !== doctorId));
      setSuccess('Doctor profile deleted successfully.');
    } catch (err) {
      setError(err.message || 'Failed to delete doctor profile.');
    } finally {
      setBusyId(null);
    }
  };

  const loadNotifications = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');

    try {
      const [listResponse, summaryResponse] = await Promise.all([
        fetchNotifications(),
        fetchNotificationSummary(),
      ]);
      setNotifications(Array.isArray(listResponse?.data) ? listResponse.data : []);
      setNotificationSummary(summaryResponse?.data || null);
    } catch (err) {
      setError(err.message || 'Failed to load notifications.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const triggerSendNotification = async (notificationId) => {
    setBusyId(notificationId);
    setError('');
    setSuccess('');
    try {
      const response = await sendNotificationById(notificationId);
      const updated = response?.data;
      setNotifications((prev) => prev.map((item) => item.id === notificationId ? updated : item));
      setSuccess(response?.message || 'Notification sent successfully.');
      await loadNotifications(true);
    } catch (err) {
      setError(err.message || 'Failed to send notification.');
    } finally {
      setBusyId(null);
    }
  };

  const changeNotificationStatus = async (notificationId, status) => {
    setBusyId(notificationId);
    setError('');
    setSuccess('');
    try {
      const response = await updateNotificationStatus(notificationId, status);
      const updated = response?.data;
      setNotifications((prev) => prev.map((item) => item.id === notificationId ? updated : item));
      setSuccess(response?.message || 'Notification status updated.');
      await loadNotifications(true);
    } catch (err) {
      setError(err.message || 'Failed to update notification status.');
    } finally {
      setBusyId(null);
    }
  };

  const removeNotification = async (notificationId) => {
    if (!window.confirm('Delete this notification permanently?')) return;

    setBusyId(notificationId);
    setError('');
    setSuccess('');
    try {
      await deleteNotificationById(notificationId);
      setNotifications((prev) => prev.filter((item) => item.id !== notificationId));
      setSuccess('Notification deleted successfully.');
      await loadNotifications(true);
    } catch (err) {
      setError(err.message || 'Failed to delete notification.');
    } finally {
      setBusyId(null);
    }
  };



  const approveAppointment = async (appointmentId) => {
    setBusyId(appointmentId);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`http://localhost:8085/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CONFIRMED' })
      });

      if (response.ok) {
        const updatedAppointment = await response.json();
        setAppointments((prev) =>
          prev.map((apt) => apt.appointmentId === appointmentId ? updatedAppointment : apt)
        );
        setSuccess('Appointment approved successfully.');
      } else {
        throw new Error('Failed to approve appointment');
      }
    } catch (err) {
      setError(err.message || 'Failed to approve appointment.');
    } finally {
      setBusyId(null);
    }
  };

  const cancelAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    
    setBusyId(appointmentId);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`http://localhost:8085/api/appointments/${appointmentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        setAppointments((prev) =>
          prev.filter((apt) => apt.appointmentId !== appointmentId)
        );
        setSelectedAppointment(null);
        setSuccess('Appointment cancelled successfully.');
      } else {
        throw new Error('Failed to cancel appointment');
      }
    } catch (err) {
      setError(err.message || 'Failed to cancel appointment.');
    } finally {
      setBusyId(null);
    }
  };

  const openAppointmentDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setShowAppointmentModal(true);
  };

  const openEditAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setEditAppointmentForm({
      appointmentDate: appointment.appointmentDate || '',
      appointmentTime: appointment.appointmentTime || '',
      reason: appointment.reason || '',
      status: appointment.status || 'PENDING'
    });
    setShowEditAppointmentModal(true);
  };

  const handleEditAppointmentChange = (e) => {
    const { name, value } = e.target;
    setEditAppointmentForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitEditAppointment = async (e) => {
    e.preventDefault();
    if (!selectedAppointment?.appointmentId) return;

    setBusyId(selectedAppointment.appointmentId);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`http://localhost:8085/api/appointments/${selectedAppointment.appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editAppointmentForm)
      });

      if (response.ok) {
        const updatedAppointment = await response.json();
        setAppointments((prev) =>
          prev.map((apt) => apt.appointmentId === selectedAppointment.appointmentId ? updatedAppointment : apt)
        );
        setShowEditAppointmentModal(false);
        setSelectedAppointment(null);
        setSuccess('Appointment updated successfully.');
      } else {
        throw new Error('Failed to update appointment');
      }
    } catch (err) {
      setError(err.message || 'Failed to update appointment.');
    } finally {
      setBusyId(null);
    }
  };

  const sendReminder = async (appointment) => {
    setBusyId(appointment.appointmentId);
    setError('');
    setSuccess('');

    try {
      window.alert(`📧 Reminder email will be sent to:\n- Patient ID: ${appointment.patientId}\n- Doctor: ${appointment.doctorFirstName} ${appointment.doctorLastName}\n- Date: ${appointment.appointmentDate}\n- Time: ${appointment.appointmentTime}`);
      setSuccess('Reminder queued for sending.');
    } catch (err) {
      setError(err.message || 'Failed to send reminder.');
    } finally {
      setBusyId(null);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (currentUser.role !== 'ADMIN' || !accessToken) {
      navigate('/');
      return;
    }
    loadUsers();
    loadAppointments();
    loadPayments();
    loadNotifications(true);
    loadDoctorProfiles(true);
  }, [accessToken, currentUser, loadUsers, loadAppointments, loadPayments, loadNotifications, loadDoctorProfiles, navigate]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) =>
      [fullName(user), user.email, user.role, user.phoneNumber]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [search, users]);

  const doctors = useMemo(() => users.filter((user) => user.role === 'DOCTOR'), [users]);
  const recentUsers = useMemo(
    () => [...users].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
    [users]
  );

  const stats = useMemo(() => ({
    total: users.length,
    patients: users.filter((user) => user.role === 'PATIENT').length,
    doctors: doctors.length,
    admins: users.filter((user) => user.role === 'ADMIN').length,
    verified: users.filter((user) => user.otpVerified).length,
    inactive: users.filter((user) => !user.active).length,
    appointments: appointments.length,
    appointmentsToday: appointments.filter((a) => a.appointmentDate === new Date().toISOString().split('T')[0]).length,
  }), [doctors.length, users, appointments]);

  const openUser = async (userId) => {
    setBusyId(userId);
    setError('');
    try {
      const response = await fetchUserById(accessToken, userId);
      setSelectedUser(response?.data ?? null);
    } catch (err) {
      setError(err.message || 'Failed to load user details.');
    } finally {
      setBusyId(null);
    }
  };

  const startEditUser = async (userId) => {
    setBusyId(userId);
    setError('');
    setSuccess('');
    try {
      const response = await fetchUserById(accessToken, userId);
      const user = response?.data ?? null;
      setSelectedUser(user);
      setEditForm(toEditForm(user));
      setShowEditModal(true);
    } catch (err) {
      setError(err.message || 'Failed to load user details.');
    } finally {
      setBusyId(null);
    }
  };

  const setUserActive = async (user, active) => {
    setBusyId(user.userId);
    setError('');
    setSuccess('');
    try {
      const response = await updateUser(accessToken, user.userId, { active });
      const updatedUser = response?.data ?? { ...user, active };
      mergeUserIntoState(updatedUser);
      setSuccess(response?.message || `${fullName(updatedUser)} updated successfully.`);
    } catch (err) {
      setError(err.message || 'Failed to update user.');
    } finally {
      setBusyId(null);
    }
  };

  const removeUser = async (user) => {
    if (!window.confirm(`Delete ${fullName(user)} permanently?`)) return;
    setBusyId(user.userId);
    setError('');
    setSuccess('');
    try {
      await deleteUser(accessToken, user.userId);
      setUsers((prev) => prev.filter((item) => item.userId !== user.userId));
      setSelectedUser((prev) => prev?.userId === user.userId ? null : prev);
      setSuccess(`${fullName(user)} deleted successfully.`);
    } catch (err) {
      setError(err.message || 'Failed to delete user.');
    } finally {
      setBusyId(null);
    }
  };

  const handleCreateChange = (event) => {
    const { name, value } = event.target;
    setCreateFormError('');
    setCreateForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (event) => {
    const { name, value, type, checked } = event.target;
    setEditFormError('');
    setEditForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const submitCreateUser = async (event) => {
    event.preventDefault();
    setBusyId('create');
    setError('');
    setSuccess('');
    setCreateFormError('');

    try {
      await registerUser({
        ...createForm,
        email: createForm.email.trim().toLowerCase(),
      });

      if (createForm.role === 'DOCTOR') {
        await createDoctorProfile({
          firstName: createForm.firstName.trim(),
          lastName: createForm.lastName.trim(),
          specialty: 'General Medicine',
          specialization: 'General Medicine',
          hospital: 'Not Assigned',
          email: createForm.email.trim().toLowerCase(),
          phoneNumber: createForm.phoneNumber.trim(),
          imageUrl: '',
          availability: 'Available Today',
          consultationFee: 2500,
          rating: 5,
          experienceYears: 0,
          patientCount: 0,
        });
      }

      setShowCreateModal(false);
      setCreateForm(emptyCreateForm);
      await loadUsers(true);
      if (createForm.role === 'DOCTOR') {
        await loadDoctorProfiles(true);
      }
      setSuccess(`${createForm.role.toLowerCase()} account created successfully.`);
    } catch (err) {
      const message = err.message || 'Failed to create user.';
      setCreateFormError(message);
      setError(message);
    } finally {
      setBusyId(null);
    }
  };

  const submitEditUser = async (event) => {
    event.preventDefault();
    if (!selectedUser?.userId) return;

    setBusyId(selectedUser.userId);
    setError('');
    setSuccess('');
    setEditFormError('');

    const nextEmail = editForm.email.trim().toLowerCase();
    const nextFirstName = editForm.firstName.trim();
    const nextLastName = editForm.lastName.trim();
    const nextPhoneNumber = editForm.phoneNumber.trim();

    if (!nextEmail) {
      setEditFormError('Email is required.');
      setError('Email is required.');
      setBusyId(null);
      return;
    }

    const payload = {};

    if (nextFirstName !== (selectedUser.firstName ?? '')) {
      payload.firstName = nextFirstName;
    }
    if (nextLastName !== (selectedUser.lastName ?? '')) {
      payload.lastName = nextLastName;
    }
    if (nextEmail !== (selectedUser.email ?? '').trim().toLowerCase()) {
      payload.email = nextEmail;
    }
    if (nextPhoneNumber !== (selectedUser.phoneNumber ?? '')) {
      payload.phoneNumber = nextPhoneNumber;
    }
    if (editForm.role !== selectedUser.role) {
      payload.role = editForm.role;
    }
    if (editForm.active !== selectedUser.active) {
      payload.active = editForm.active;
    }
    if (editForm.password.trim()) {
      payload.password = editForm.password.trim();
    }

    if (Object.keys(payload).length === 0) {
      setShowEditModal(false);
      setSuccess('No changes to save.');
      setBusyId(null);
      return;
    }

    try {
      const response = await updateUser(accessToken, selectedUser.userId, payload);
      const updatedUser = response?.data ?? null;
      mergeUserIntoState(updatedUser);
      setShowEditModal(false);
      setEditForm(toEditForm(updatedUser));
      setSuccess(response?.message || `${fullName(updatedUser || selectedUser)} updated successfully.`);
    } catch (err) {
      const message = err.message || 'Failed to update user.';
      setEditFormError(message);
      setError(message);
    } finally {
      setBusyId(null);
    }
  };

  if (!currentUser || currentUser.role !== 'ADMIN' || !accessToken) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <aside className="fixed min-h-screen w-64 bg-linear-to-b from-teal-700 to-teal-900">
          <div className="p-6">
            <div className="mb-8 flex items-center gap-3">
              <div className="rounded-xl bg-white/20 p-2"><i className="fas fa-hospital-user text-2xl text-white"></i></div>
              <div><h1 className="text-xl font-bold text-white">HealthCare+</h1><p className="text-xs text-teal-200">Admin Portal</p></div>
            </div>
            <nav className="space-y-2">
              {menu.map(([id, icon, label]) => (
                <button key={id} type="button" onClick={() => setActiveTab(id)} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 ${activeTab === id ? 'bg-white/20 text-white' : 'text-teal-100 hover:bg-white/10'}`}>
                  <i className={`${icon} w-5`}></i><span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <div className="ml-64 flex-1">
          <header className="flex items-center justify-between bg-white px-8 py-4 shadow-sm">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{menu.find(([id]) => id === activeTab)?.[2]}</h2>
              <p className="mt-1 text-sm text-gray-500">Connected to the Spring Boot backend user API</p>
            </div>
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => loadUsers()} className="rounded-xl border border-teal-200 px-4 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50">Refresh</button>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800">{currentUser.name || currentUser.email}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
            </div>
          </header>

          <main className="p-8">
            {error ? <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
            {success ? <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}

            {loading ? (
              <div className="rounded-2xl bg-white p-10 text-center shadow-lg">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-teal-600"></div>
                <p className="mt-4 text-sm text-slate-500">Loading live user data...</p>
              </div>
            ) : null}

            {!loading && activeTab === 'overview' ? (
              <div>
                <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                  <StatCard title="Total Users" value={stats.total} icon="fas fa-users" color="bg-cyan-600" note="All backend users" />
                  <StatCard title="Patients" value={stats.patients} icon="fas fa-user-friends" color="bg-blue-500" note="Role = PATIENT" />
                  <StatCard title="Doctors" value={stats.doctors} icon="fas fa-user-md" color="bg-teal-500" note="Role = DOCTOR" />
                  <StatCard title="Admins" value={stats.admins} icon="fas fa-user-shield" color="bg-amber-500" note="Role = ADMIN" />
                  <StatCard title="Total Appointments" value={stats.appointments} icon="fas fa-calendar-check" color="bg-green-500" note="All appointments" />
                  <StatCard title="Today's Appointments" value={stats.appointmentsToday} icon="fas fa-clock" color="bg-purple-500" note="Appointments today" />
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="rounded-2xl bg-white p-6 shadow-lg">
                    <h3 className="mb-4 text-lg font-bold text-gray-800">Recently Registered Users</h3>
                    <div className="space-y-4">
                      {recentUsers.length === 0 ? <p className="text-sm text-slate-500">No users found.</p> : recentUsers.map((user) => (
                        <div key={user.userId} className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                          <div><p className="font-semibold text-gray-800">{fullName(user)}</p><p className="text-sm text-gray-500">{user.email}</p></div>
                          <div className="text-right"><p className="text-sm text-gray-700">{formatDate(user.createdAt)}</p><span className={`rounded-full px-2 py-1 text-xs font-medium ${roleClass(user.role)}`}>{formatRole(user.role)}</span></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-linear-to-r from-teal-600 to-cyan-600 p-8 text-white shadow-lg">
                    <h3 className="text-2xl font-bold">Live Admin Summary</h3>
                    <p className="mt-2 text-sm text-white/80">This page now uses real user management data instead of hardcoded dashboard values.</p>
                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div className="rounded-2xl bg-white/10 p-4"><p className="text-sm text-white/70">Active Users</p><p className="mt-2 text-2xl font-bold">{stats.total - stats.inactive}</p></div>
                      <div className="rounded-2xl bg-white/10 p-4"><p className="text-sm text-white/70">Pending Doctors</p><p className="mt-2 text-2xl font-bold">{doctors.filter((user) => !user.otpVerified).length}</p></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {!loading && activeTab === 'users' ? (
              <div className="rounded-2xl bg-white shadow-lg">
                <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
                  <div><h3 className="text-lg font-bold text-gray-800">All Users</h3><p className="mt-1 text-sm text-gray-500">Create, edit, suspend, activate, view, and delete real backend users.</p></div>
                  <div className="flex gap-3">
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-teal-300" />
                    <button type="button" onClick={() => { setCreateForm(emptyCreateForm); setCreateFormError(''); setShowCreateModal(true); }} className="rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white hover:bg-teal-700">
                      <i className="fas fa-plus mr-2"></i>Add User
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Verified</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Joined</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredUsers.length === 0 ? <tr><td colSpan="6" className="px-6 py-8 text-center text-sm text-slate-500">No matching users found.</td></tr> : filteredUsers.map((user) => (
                        <tr key={user.userId} className="hover:bg-gray-50">
                          <td className="px-6 py-4"><p className="font-medium text-gray-800">{fullName(user)}</p><p className="text-sm text-gray-500">{user.email}</p></td>
                          <td className="px-6 py-4"><span className={`rounded-full px-2 py-1 text-xs font-medium ${roleClass(user.role)}`}>{formatRole(user.role)}</span></td>
                          <td className="px-6 py-4"><span className={`rounded-full px-2 py-1 text-xs font-medium ${user.active ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>{user.active ? 'active' : 'suspended'}</span></td>
                          <td className="px-6 py-4"><span className={`rounded-full px-2 py-1 text-xs font-medium ${user.otpVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>{user.otpVerified ? 'verified' : 'pending'}</span></td>
                          <td className="px-6 py-4 text-sm text-gray-500">{formatDate(user.createdAt)}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-2">
                              <button type="button" onClick={() => openUser(user.userId)} disabled={busyId === user.userId} title="View details" className="px-3 py-1 text-xs font-semibold rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50">👁️ View</button>
                              <button type="button" onClick={() => startEditUser(user.userId)} disabled={busyId === user.userId} title="Edit user" className="px-3 py-1 text-xs font-semibold rounded-md bg-amber-100 text-amber-700 hover:bg-amber-200 disabled:opacity-50">✏️ Edit</button>
                              <button type="button" onClick={() => setUserActive(user, !user.active)} disabled={busyId === user.userId} title={user.active ? 'Suspend user' : 'Activate user'} className={`px-3 py-1 text-xs font-semibold rounded-md disabled:opacity-50 ${user.active ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>{user.active ? '🚫 Suspend' : '✅ Activate'}</button>
                              <button type="button" onClick={() => removeUser(user)} disabled={busyId === user.userId} title="Delete user" className="px-3 py-1 text-xs font-semibold rounded-md bg-rose-100 text-rose-700 hover:bg-rose-200 disabled:opacity-50">🗑️ Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {!loading && activeTab === 'doctors' ? (
              <div className="space-y-6">
                <div className="rounded-2xl bg-white p-6 shadow-lg">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-800">Add Doctor Profile</h3>
                    <button
                      type="button"
                      onClick={() => loadDoctorProfiles()}
                      className="rounded-lg border border-teal-200 px-4 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50"
                    >
                      Refresh Profiles
                    </button>
                  </div>
                  {editingDoctorId ? (
                    <div className="mb-4 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      <span>You are editing doctor profile #{editingDoctorId}.</span>
                      <button
                        type="button"
                        onClick={cancelDoctorProfileEdit}
                        className="font-semibold text-amber-900 hover:text-amber-950"
                      >
                        Cancel Edit
                      </button>
                    </div>
                  ) : null}
                  <p className="mb-4 text-sm text-gray-500">Create full doctor records with image and details. These records are used by home and appointment pages.</p>
                  <form onSubmit={submitDoctorProfile} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <input name="firstName" value={doctorProfileForm.firstName} onChange={handleDoctorProfileChange} placeholder="First name" className="rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-teal-300" />
                    <input name="lastName" value={doctorProfileForm.lastName} onChange={handleDoctorProfileChange} placeholder="Last name" className="rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-teal-300" />
                    <input name="specialization" value={doctorProfileForm.specialization} onChange={handleDoctorProfileChange} placeholder="Specialization" className="rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-teal-300" />
                    <input name="hospital" value={doctorProfileForm.hospital} onChange={handleDoctorProfileChange} placeholder="Hospital" className="rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-teal-300" />
                    <input name="email" type="email" value={doctorProfileForm.email} onChange={handleDoctorProfileChange} placeholder="Doctor login email" className="rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-teal-300" />
                    {!editingDoctorId ? <div className="space-y-2"><input name="loginPassword" type="text" value={doctorProfileForm.loginPassword} onChange={handleDoctorProfileChange} placeholder="Doctor login password" className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-teal-300" /><div className="flex items-center justify-between gap-2"><p className="text-xs text-slate-500">Use at least 8 chars with A-Z, a-z, number and symbol.</p><button type="button" onClick={() => setDoctorProfileForm((prev) => ({ ...prev, loginPassword: generateDoctorPassword() }))} className="rounded-md border border-teal-300 px-3 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-50">Auto Generate</button></div></div> : null}
                    <input name="phoneNumber" value={doctorProfileForm.phoneNumber} onChange={handleDoctorProfileChange} placeholder="Phone number" className="rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-teal-300" />
                    <div className="col-span-1 md:col-span-2">
                      <label className="mb-2 block text-sm font-semibold text-gray-700">Doctor Image</label>
                      <div className="flex gap-2">
                        <input type="file" accept="image/*" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setDoctorImageFile(file);
                        }} placeholder="Upload image from gallery" className="flex-1 rounded-lg border px-4 py-2 file:mr-3 file:rounded file:border-0 file:bg-teal-500 file:px-3 file:py-1 file:text-white file:cursor-pointer outline-none focus:ring-2 focus:ring-teal-300" />
                        {doctorImageFile && <span className="flex items-center rounded bg-green-100 px-3 py-1 text-xs text-green-700 font-semibold">✓ {doctorImageFile.name}</span>}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Or enter image URL below if you prefer</p>
                    </div>
                    <input name="imageUrl" value={doctorProfileForm.imageUrl} onChange={handleDoctorProfileChange} placeholder="Doctor image URL (optional if file selected)" className="rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-teal-300" />
                    <select name="availability" value={doctorProfileForm.availability} onChange={handleDoctorProfileChange} className="rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-teal-300">
                      <option value="Available Today">Available Today</option>
                      <option value="Available Tomorrow">Available Tomorrow</option>
                      <option value="On Leave">On Leave</option>
                    </select>
                    <input type="number" min="0" name="consultationFee" value={doctorProfileForm.consultationFee} onChange={handleDoctorProfileChange} placeholder="Consultation Fee" className="rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-teal-300" />
                    <input type="number" min="0" max="5" step="0.1" name="rating" value={doctorProfileForm.rating} onChange={handleDoctorProfileChange} placeholder="Rating" className="rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-teal-300" />
                    <input type="number" min="0" name="experienceYears" value={doctorProfileForm.experienceYears} onChange={handleDoctorProfileChange} placeholder="Experience years" className="rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-teal-300" />
                    <input type="number" min="0" name="patientCount" value={doctorProfileForm.patientCount} onChange={handleDoctorProfileChange} placeholder="Patient count" className="rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-teal-300" />
                    <div className="md:col-span-2 lg:col-span-3">
                      {doctorProfileError ? <p className="mb-3 text-sm text-rose-600">{doctorProfileError}</p> : null}
                      <div className="flex flex-wrap gap-3">
                        <button type="submit" disabled={busyId === 'doctor-profile-submit' || uploadingImage} className="rounded-lg bg-teal-600 px-6 py-2 font-semibold text-white hover:bg-teal-700 disabled:opacity-50">
                          {uploadingImage ? 'Uploading image...' : busyId === 'doctor-profile-submit' ? 'Saving...' : editingDoctorId ? 'Update Doctor Profile' : 'Add Doctor Profile'}
                        </button>
                        {editingDoctorId ? (
                          <button
                            type="button"
                            onClick={cancelDoctorProfileEdit}
                            className="rounded-lg border border-slate-300 px-6 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </form>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-lg">
                  <h3 className="mb-4 text-lg font-bold text-gray-800">Doctor Profiles</h3>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {doctorProfiles.length === 0 ? <p className="text-sm text-slate-500">No doctor profiles found.</p> : doctorProfiles.map((doctor) => (
                      <div key={doctor.userId} className="rounded-xl border p-4">
                        <img src={doctor.imageUrl || `https://i.pravatar.cc/200?u=${doctor.userId}`} alt={`${doctor.firstName} ${doctor.lastName}`} className="mb-3 h-40 w-full rounded-lg object-cover" />
                        <div className="mb-2 flex items-center justify-between"><h4 className="font-bold text-gray-800">Dr. {doctor.firstName} {doctor.lastName}</h4><span className="rounded-full bg-teal-100 px-2 py-1 text-xs font-medium text-teal-700">{doctor.availability || 'Available Today'}</span></div>
                        <p className="text-sm text-teal-600">{doctor.specialization || doctor.specialty || 'General Medicine'}</p>
                        <p className="mt-1 text-sm text-gray-500">Hospital: {doctor.hospital || 'N/A'}</p>
                        <p className="mt-1 text-sm text-gray-500">Email: {doctor.email || 'N/A'}</p>
                        <p className="mt-1 text-sm text-gray-500">Phone: {doctor.phoneNumber || 'N/A'}</p>
                        <p className="mt-1 text-sm text-gray-500">Fee: LKR {doctor.consultationFee || 0}</p>
                        <div className="mt-4 flex gap-2">
                          <button type="button" onClick={() => startEditDoctorProfile(doctor)} className="flex-1 rounded-lg border border-teal-300 py-2 font-medium text-teal-700 hover:bg-teal-50">Edit</button>
                          <button type="button" onClick={() => removeDoctorProfile(doctor.userId)} disabled={busyId === doctor.userId} className="flex-1 rounded-lg border border-rose-300 py-2 font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50">Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {!loading && activeTab === 'appointments' ? (
              <div className="rounded-2xl bg-white shadow-lg">
                <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">All Appointments</h3>
                    <p className="mt-1 text-sm text-gray-500">Create, approve, edit, and cancel patient appointments</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => loadAppointments()} 
                    className="rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white hover:bg-teal-700 flex items-center gap-2"
                  >
                    🔄 Refresh
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Patient</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Doctor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Date & Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Reason</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Token</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {appointments.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="px-6 py-8 text-center text-sm text-slate-500">
                            📭 No appointments found
                          </td>
                        </tr>
                      ) : (
                        appointments.map((appointment) => (
                          <tr key={appointment.appointmentId} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-800">#{appointment.appointmentId}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">ID: {appointment.patientId}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{appointment.doctorFirstName} {appointment.doctorLastName}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{formatDate(appointment.appointmentDate)} {appointment.appointmentTime}</td>
                            <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={appointment.reason}>{appointment.reason}</td>
                            <td className="px-6 py-4 text-sm font-mono text-teal-600">{appointment.token || 'N/A'}</td>
                            <td className="px-6 py-4">
                              <span className={`rounded-full px-3 py-1 text-xs font-medium ${appointmentStatusClass(appointment.status || 'PENDING')}`}>
                                {appointment.status || 'PENDING'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2 flex-wrap">
                                <button type="button" onClick={() => openAppointmentDetails(appointment)} disabled={busyId === appointment.appointmentId} className="px-2 py-1 text-xs font-semibold rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50" title="View Details">👁️ View</button>
                                <button type="button" onClick={() => openEditAppointment(appointment)} disabled={busyId === appointment.appointmentId} className="px-2 py-1 text-xs font-semibold rounded-md bg-amber-100 text-amber-700 hover:bg-amber-200 disabled:opacity-50" title="Edit">✏️ Edit</button>
                                {(!appointment.status || appointment.status === 'PENDING') && (
                                  <button type="button" onClick={() => approveAppointment(appointment.appointmentId)} disabled={busyId === appointment.appointmentId} className="px-2 py-1 text-xs font-semibold rounded-md bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50" title="Approve">✅ Approve</button>
                                )}
                                <button type="button" onClick={() => sendReminder(appointment)} disabled={busyId === appointment.appointmentId} className="px-2 py-1 text-xs font-semibold rounded-md bg-purple-100 text-purple-700 hover:bg-purple-200 disabled:opacity-50" title="Send Reminder">📧 Remind</button>
                                <button type="button" onClick={() => cancelAppointment(appointment.appointmentId)} disabled={busyId === appointment.appointmentId} className="px-2 py-1 text-xs font-semibold rounded-md bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50" title="Cancel">❌ Cancel</button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
            
            {!loading && activeTab === 'payments' ? (
                  <div className="rounded-2xl bg-white shadow-lg">
                  <div className="border-b px-6 py-4 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-800">Payment Transactions</h3>
                  <button
                onClick={loadPayments}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
              >
                 🔄 Refresh
               </button>
               </div>

            <div className="overflow-x-auto">
            <table className="w-full">
            <thead className="bg-gray-50">
            <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Appointment</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Amount</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Hospital (30%)</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Doctor (70%)</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Method</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200">
          {payments.length === 0 ? (
            <tr>
              <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500">
                No transactions found
              </td>
            </tr>
          ) : (
            payments.map((p) => (
              <tr key={p.id || p.paymentId} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-800">
                  #{p.id || p.paymentId}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  Appointment #{p.appointmentId}
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-teal-700">
                  LKR {p.amount}
                </td>
                <td className="px-6 py-4 text-sm text-emerald-700 font-semibold">
                 {p.hospitalShare != null ? `LKR ${p.hospitalShare}` : "N/A"}
                </td>

                <td className="px-6 py-4 text-sm text-indigo-700 font-semibold">
                 {p.doctorShare != null ? `LKR ${p.doctorShare}` : "N/A"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  
                     {p.method === "PAYHERE_TEST"
                       ? "PayHere (Test)"
                        : p.method}

                </td>
                <td className="px-6 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      p.status === "SUCCESS"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="px-6 py-4 flex gap-2">
                  
                 {/* Approve - ONLY if PENDING */}
                
                  {p.status === "PENDING" && (
                  <button
                 onClick={() => approvePayment(p.id)}
                 className="px-3 py-1 text-xs font-semibold rounded-md bg-green-100 text-green-700 hover:bg-green-200"
                >
               ✅ Approve
              </button>
              )}
 

                {/* Edit Payment  */}
                <button
                 onClick={() => openEditPayment(p)}
                 className="px-3 py-1 text-xs font-semibold rounded-md bg-amber-100 text-amber-700 hover:bg-amber-200"
                >
                ✏️ Edit
                </button>          

                 {/* Delete Payment */}
                  <button
                  onClick={() => deletePayment(p.id)}
                  className="px-3 py-1 text-xs font-semibold rounded-md bg-red-100 text-red-700 hover:bg-red-200"
                 >
                🗑️ Delete
               </button>
               </td>
               </tr>
            ))
             )}
               </tbody>
             </table>
             </div>
            </div>
           ) : null}

            {!loading && activeTab === 'notifications' ? (
              <div className="rounded-2xl bg-white shadow-lg">
                <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Notification Management</h3>
                    <p className="mt-1 text-sm text-gray-500">Only admins can manage notification delivery and status updates.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => loadNotifications()}
                    className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
                  >
                    Refresh Notifications
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 border-b border-gray-100 p-6 md:grid-cols-5">
                  <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-gray-500">Total</p><p className="mt-1 text-xl font-bold text-gray-800">{notificationSummary?.totalNotifications ?? notifications.length}</p></div>
                  <div className="rounded-xl bg-yellow-50 p-4"><p className="text-xs text-gray-500">Queued</p><p className="mt-1 text-xl font-bold text-yellow-700">{notificationSummary?.queuedNotifications ?? 0}</p></div>
                  <div className="rounded-xl bg-green-50 p-4"><p className="text-xs text-gray-500">Sent</p><p className="mt-1 text-xl font-bold text-green-700">{notificationSummary?.sentNotifications ?? 0}</p></div>
                  <div className="rounded-xl bg-rose-50 p-4"><p className="text-xs text-gray-500">Failed</p><p className="mt-1 text-xl font-bold text-rose-700">{notificationSummary?.failedNotifications ?? 0}</p></div>
                  <div className="rounded-xl bg-red-50 p-4"><p className="text-xs text-gray-500">Critical</p><p className="mt-1 text-xl font-bold text-red-700">{notificationSummary?.criticalNotifications ?? 0}</p></div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Recipient</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Subject</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Channel</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {notifications.length === 0 ? (
                        <tr><td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500">No notifications found.</td></tr>
                      ) : notifications.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-semibold text-gray-800">#{item.id}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            <p>{item.recipientName || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">{item.recipientEmail || item.recipientPhone || 'No contact'}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">{item.subject || 'No subject'}</td>
                          <td className="px-6 py-4 text-xs font-semibold text-teal-700">{item.channel || 'N/A'}</td>
                          <td className="px-6 py-4">
                            <span className={`rounded-full px-3 py-1 text-xs font-medium ${item.status === 'SENT' ? 'bg-green-100 text-green-700' : item.status === 'FAILED' ? 'bg-rose-100 text-rose-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {item.status || 'QUEUED'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => triggerSendNotification(item.id)}
                                disabled={busyId === item.id}
                                className="rounded-md bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-200 disabled:opacity-50"
                              >
                                Send
                              </button>
                              <button
                                type="button"
                                onClick={() => changeNotificationStatus(item.id, 'QUEUED')}
                                disabled={busyId === item.id}
                                className="rounded-md bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700 hover:bg-yellow-200 disabled:opacity-50"
                              >
                                Mark Queued
                              </button>
                              <button
                                type="button"
                                onClick={() => changeNotificationStatus(item.id, 'FAILED')}
                                disabled={busyId === item.id}
                                className="rounded-md bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-200 disabled:opacity-50"
                              >
                                Mark Failed
                              </button>
                              <button
                                type="button"
                                onClick={() => removeNotification(item.id)}
                                disabled={busyId === item.id}
                                className="rounded-md bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-200 disabled:opacity-50"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}


            {!loading && activeTab === 'reports' ? <Placeholder title="Reports module pending" text="There is no reports endpoint in the current backend, so this section stays as a placeholder." /> : null}
            {!loading && activeTab === 'settings' ? <Placeholder title="Settings module pending" text="Admin settings are not backed by the API yet. The live connection now covers user management only." /> : null}
          </main>
        </div>
      </div>

      {selectedUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedUser(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">User Details</h3>
              <button type="button" onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600"><i className="fas fa-times"></i></button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4"><span className="text-gray-500">Name</span><span className="text-right font-medium text-gray-800">{fullName(selectedUser)}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-500">Email</span><span className="text-right font-medium text-gray-800">{selectedUser.email}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-500">Role</span><span className="font-medium text-gray-800">{formatRole(selectedUser.role)}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-500">Phone</span><span className="text-right font-medium text-gray-800">{selectedUser.phoneNumber || 'N/A'}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-500">Status</span><span className={`font-medium ${selectedUser.active ? 'text-green-600' : 'text-rose-600'}`}>{selectedUser.active ? 'Active' : 'Suspended'}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-500">OTP Verified</span><span className={`font-medium ${selectedUser.otpVerified ? 'text-green-600' : 'text-yellow-600'}`}>{selectedUser.otpVerified ? 'Yes' : 'No'}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-500">Created</span><span className="text-right font-medium text-gray-800">{formatDateTime(selectedUser.createdAt)}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-500">Updated</span><span className="text-right font-medium text-gray-800">{formatDateTime(selectedUser.updatedAt)}</span></div>
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => { setEditForm(toEditForm(selectedUser)); setEditFormError(''); setShowEditModal(true); }} className="flex-1 rounded-lg border border-amber-300 py-2 text-amber-700 hover:bg-amber-50">Edit User</button>
              <button type="button" onClick={() => setUserActive(selectedUser, !selectedUser.active)} disabled={busyId === selectedUser.userId} className={`flex-1 rounded-lg py-2 text-white disabled:opacity-50 ${selectedUser.active ? 'bg-rose-500 hover:bg-rose-600' : 'bg-teal-600 hover:bg-teal-700'}`}>{selectedUser.active ? 'Suspend User' : 'Activate User'}</button>
              <button type="button" onClick={() => removeUser(selectedUser)} disabled={busyId === selectedUser.userId} className="flex-1 rounded-lg border border-rose-500 py-2 text-rose-500 hover:bg-rose-50 disabled:opacity-50">Delete User</button>
            </div>
          </div>
        </div>
      ) : null}

      {showCreateModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowCreateModal(false)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">Create User Account</h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600"><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={submitCreateUser} className="space-y-4">
              {createFormError ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{createFormError}</div> : null}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input name="firstName" value={createForm.firstName} onChange={handleCreateChange} placeholder="First name" className="rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-teal-300" />
                <input name="lastName" value={createForm.lastName} onChange={handleCreateChange} placeholder="Last name" className="rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-teal-300" />
                <input name="email" type="email" value={createForm.email} onChange={handleCreateChange} placeholder="Email" required className="rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-teal-300" />
                <input name="password" type="password" value={createForm.password} onChange={handleCreateChange} placeholder="Password" required className="rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-teal-300" />
                <input name="phoneNumber" value={createForm.phoneNumber} onChange={handleCreateChange} placeholder="Phone number" className="rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-teal-300" />
                <select name="role" value={createForm.role} onChange={handleCreateChange} className="rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-teal-300">
                  <option value="PATIENT">Patient</option>
                  <option value="DOCTOR">Doctor</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="rounded-lg border px-4 py-2 text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={busyId === 'create'} className="rounded-lg bg-teal-600 px-5 py-2 font-semibold text-white hover:bg-teal-700 disabled:opacity-50">
                  {busyId === 'create' ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showEditModal && selectedUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowEditModal(false)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">Edit User Account</h3>
              <button type="button" onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600"><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={submitEditUser} className="space-y-4">
              {editFormError ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{editFormError}</div> : null}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input name="firstName" value={editForm.firstName} onChange={handleEditChange} placeholder="First name" className="rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-teal-300" />
                <input name="lastName" value={editForm.lastName} onChange={handleEditChange} placeholder="Last name" className="rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-teal-300" />
                <input name="email" type="email" value={editForm.email} onChange={handleEditChange} placeholder="Email" required className="rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-teal-300" />
                <input name="password" type="password" value={editForm.password} onChange={handleEditChange} placeholder="New password (optional)" className="rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-teal-300" />
                <input name="phoneNumber" value={editForm.phoneNumber} onChange={handleEditChange} placeholder="Phone number" className="rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-teal-300" />
                <select name="role" value={editForm.role} onChange={handleEditChange} className="rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-teal-300">
                  <option value="PATIENT">Patient</option>
                  <option value="DOCTOR">Doctor</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <label className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <input type="checkbox" name="active" checked={editForm.active} onChange={handleEditChange} />
                Keep this account active
              </label>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowEditModal(false)} className="rounded-lg border px-4 py-2 text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={busyId === selectedUser.userId} className="rounded-lg bg-amber-500 px-5 py-2 font-semibold text-white hover:bg-amber-600 disabled:opacity-50">
                  {busyId === selectedUser.userId ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showAppointmentModal && selectedAppointment ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowAppointmentModal(false)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">Appointment Details</h3>
              <button type="button" onClick={() => setShowAppointmentModal(false)} className="text-gray-400 hover:text-gray-600">❌</button>
            </div>
            
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-gray-500 text-xs uppercase">Appointment ID</p>
                  <p className="mt-1 font-bold text-gray-800">#{selectedAppointment.appointmentId}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-gray-500 text-xs uppercase">Status</p>
                  <p className={`mt-1 font-bold ${appointmentStatusClass(selectedAppointment.status || 'PENDING')}`}>{selectedAppointment.status || 'PENDING'}</p>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Patient Information</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Patient ID:</span><span className="ml-2 font-medium">{selectedAppointment.patientId}</span></div>
                  <div><span className="text-gray-500">Email:</span><span className="ml-2 font-medium">N/A</span></div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Doctor Information</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Doctor ID:</span><span className="ml-2 font-medium">{selectedAppointment.doctorId}</span></div>
                  <div><span className="text-gray-500">Name:</span><span className="ml-2 font-medium">{selectedAppointment.doctorFirstName} {selectedAppointment.doctorLastName}</span></div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Appointment Details</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Date:</span><span className="ml-2 font-medium">{formatDate(selectedAppointment.appointmentDate)}</span></div>
                  <div><span className="text-gray-500">Time:</span><span className="ml-2 font-medium">{selectedAppointment.appointmentTime}</span></div>
                  <div className="col-span-2"><span className="text-gray-500">Reason:</span><p className="mt-1 font-medium text-gray-800">{selectedAppointment.reason}</p></div>
                  <div className="col-span-2"><span className="text-gray-500">Token:</span><p className="mt-1 font-mono text-teal-600 font-medium">{selectedAppointment.token || 'N/A'}</p></div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Timestamps</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Created:</span><span className="ml-2 font-medium">{formatDateTime(selectedAppointment.createdAt)}</span></div>
                  <div><span className="text-gray-500">Updated:</span><span className="ml-2 font-medium">{formatDateTime(selectedAppointment.updatedAt)}</span></div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => { setShowAppointmentModal(false); openEditAppointment(selectedAppointment); }} className="flex-1 rounded-lg border border-amber-300 py-2 text-amber-700 hover:bg-amber-50">✏️ Edit</button>
              {(!selectedAppointment.status || selectedAppointment.status === 'PENDING') && (
                <button type="button" onClick={() => { approveAppointment(selectedAppointment.appointmentId); setShowAppointmentModal(false); }} disabled={busyId === selectedAppointment.appointmentId} className="flex-1 rounded-lg bg-green-600 py-2 text-white hover:bg-green-700 disabled:opacity-50">✅ Approve</button>
              )}
              <button type="button" onClick={() => { cancelAppointment(selectedAppointment.appointmentId); setShowAppointmentModal(false); }} disabled={busyId === selectedAppointment.appointmentId} className="flex-1 rounded-lg border border-red-500 py-2 text-red-500 hover:bg-red-50 disabled:opacity-50">❌ Cancel</button>
              <button type="button" onClick={() => setShowAppointmentModal(false)} className="flex-1 rounded-lg border px-4 py-2 text-slate-600 hover:bg-slate-50">Close</button>
            </div>
          </div>
        </div>
      ) : null}

      {showEditAppointmentModal && selectedAppointment ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowEditAppointmentModal(false)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">Edit Appointment</h3>
              <button type="button" onClick={() => setShowEditAppointmentModal(false)} className="text-gray-400 hover:text-gray-600">❌</button>
            </div>
            
            <form onSubmit={submitEditAppointment} className="space-y-4">
              <div className="rounded-lg border px-4 py-3 bg-gray-50 text-sm text-gray-600">
                <p><strong>Appointment ID:</strong> #{selectedAppointment.appointmentId}</p>
                <p><strong>Doctor:</strong> {selectedAppointment.doctorFirstName} {selectedAppointment.doctorLastName}</p>
                <p><strong>Patient ID:</strong> {selectedAppointment.patientId}</p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">📅 Appointment Date</label>
                  <input type="date" name="appointmentDate" value={editAppointmentForm.appointmentDate} onChange={handleEditAppointmentChange} required className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-teal-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">⏰ Appointment Time</label>
                  <input type="time" name="appointmentTime" value={editAppointmentForm.appointmentTime} onChange={handleEditAppointmentChange} required className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-teal-300" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">📝 Reason for Appointment</label>
                <textarea name="reason" value={editAppointmentForm.reason} onChange={handleEditAppointmentChange} rows="4" required className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-teal-300 resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">📋 Status</label>
                <select name="status" value={editAppointmentForm.status} onChange={handleEditAppointmentChange} className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-teal-300">
                  <option value="PENDING">⏳ Pending</option>
                  <option value="CONFIRMED">✅ Confirmed</option>
                  <option value="CANCELLED">❌ Cancelled</option>
                  <option value="RESCHEDULED">🔄 Rescheduled</option>
                  <option value="COMPLETED">✔️ Completed</option>
                </select>
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowEditAppointmentModal(false)} className="rounded-lg border px-4 py-2 text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={busyId === selectedAppointment.appointmentId} className="rounded-lg bg-amber-500 px-5 py-2 font-semibold text-white hover:bg-amber-600 disabled:opacity-50">
                  {busyId === selectedAppointment.appointmentId ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}


      {showEditPaymentModal && selectedPayment && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-md rounded-2xl bg-white p-6">

      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-800">Edit Payment</h3>
        <button
          onClick={() => setShowEditPaymentModal(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ❌
        </button>
      </div>

      {/* Info */}
      <div className="mb-4 text-sm text-gray-600">
        <p><b>Payment ID:</b> #{selectedPayment.id}</p>
        <p><b>Appointment:</b> #{selectedPayment.appointmentId}</p>
      </div>

      {/* Form */}
      <form onSubmit={submitEditPayment} className="space-y-4">

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium">Amount (LKR)</label>
          <input
            type="number"
            value={editPaymentForm.amount}
            onChange={(e) =>
              setEditPaymentForm({
                ...editPaymentForm,
                amount: e.target.value,
              })
            }
            className="w-full rounded-lg border px-4 py-2"
            required
          />
        </div>

        {/* Method */}
        <div>
          <label className="block text-sm font-medium">Method</label>
          <select
            value={editPaymentForm.method}
            onChange={(e) =>
              setEditPaymentForm({
                ...editPaymentForm,
                method: e.target.value,
              })
            }
            className="w-full rounded-lg border px-4 py-2"
          >
            <option value="PAYHERE_TEST">PayHere</option>
            <option value="CASH">Cash</option>
            <option value="ADMIN_UPDATED">Admin Updated</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium">Status</label>
          <select
            value={editPaymentForm.status}
            onChange={(e) =>
              setEditPaymentForm({
                ...editPaymentForm,
                status: e.target.value,
              })
            }
            className="w-full rounded-lg border px-4 py-2"
          >
            <option value="PENDING">Pending</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setShowEditPaymentModal(false)}
            className="rounded-lg border px-4 py-2"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="rounded-lg bg-amber-500 px-6 py-2 text-white font-semibold hover:bg-amber-600"
          >
            Save Changes
          </button>
        </div>

      </form>
    </div>
  </div>
)}

 </div>
  );
};

export default AdminDashboard;