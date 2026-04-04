import { useEffect, useMemo, useRef, useState } from 'react';
import Navbar from '../components/navbar';
import {
  createNotification,
  deleteNotification,
  deleteUser,
  fetchNotifications,
  fetchUsers,
  registerUser,
  updateNotification,
  updateUser,
} from '../lib/auth';

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phoneNumber: '',
  role: 'PATIENT',
  active: true,
};

const emptyNotificationForm = {
  recipientName: '',
  recipientEmail: '',
  recipientPhone: '',
  audienceType: 'PATIENT',
  relatedService: 'General',
  subject: '',
  message: '',
  templateCode: '',
  channel: 'IN_APP',
  priority: 'NORMAL',
  status: 'SENT',
};

const inputClassName =
  'w-full rounded-2xl border border-stone-200 bg-stone-50/90 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition duration-200 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100';
const panelClassName =
  'rounded-3xl border border-stone-200/80 bg-white p-7 shadow-[0_18px_55px_rgba(15,23,42,0.08)]';
const primaryButtonClassName =
  'rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800';
const secondaryButtonClassName =
  'rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-stone-300 hover:bg-stone-50';

const roleTone = (role) => {
  if (role === 'ADMIN') return 'bg-cyan-100 text-cyan-700';
  if (role === 'DOCTOR') return 'bg-emerald-100 text-emerald-700';
  return 'bg-amber-100 text-amber-700';
};

const notificationStatusTone = (status) => {
  if (status === 'SENT') return 'bg-emerald-100 text-emerald-700';
  if (status === 'QUEUED') return 'bg-cyan-100 text-cyan-700';
  if (status === 'FAILED') return 'bg-rose-100 text-rose-700';
  return 'bg-amber-100 text-amber-700';
};
const sidebarItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'fa-gauge-high' },
  { id: 'create-user', label: 'Create User Account', icon: 'fa-user-plus' },
  { id: 'create-notification', label: 'Create Notification', icon: 'fa-bell' },
  { id: 'device', label: 'Device', icon: 'fa-microchip' },
  { id: 'doctor', label: 'Doctor', icon: 'fa-user-doctor' },
  { id: 'patient', label: 'Patient', icon: 'fa-user-injured' },
  { id: 'doctor-schedule', label: 'Doctor Schedule', icon: 'fa-calendar-days' },
  { id: 'appointments', label: 'Appointments', icon: 'fa-calendar-check' },
  { id: 'case-studies', label: 'Case Studies', icon: 'fa-notes-medical' },
  { id: 'prescription', label: 'Prescription', icon: 'fa-prescription' },
  { id: 'notification-center', label: 'Notification Center', icon: 'fa-envelope-open-text' },
];

const validateNotificationForm = (form) => {
  const errors = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const cleanedPhone = (form.recipientPhone || '').replace(/[^\d+]/g, '');

  if (!form.recipientName.trim()) {
    errors.recipientName = 'Recipient name is required.';
  } else if (form.recipientName.trim().length < 2) {
    errors.recipientName = 'Recipient name must be at least 2 characters.';
  }

  if (form.recipientEmail.trim() && !emailRegex.test(form.recipientEmail.trim())) {
    errors.recipientEmail = 'Enter a valid email address.';
  }

  if (form.channel === 'EMAIL' && !form.recipientEmail.trim()) {
    errors.recipientEmail = 'Recipient email is required for EMAIL channel.';
  }

  if (form.recipientPhone.trim()) {
    if (cleanedPhone.length < 7 || cleanedPhone.length > 16) {
      errors.recipientPhone = 'Enter a valid phone number.';
    }
  }

  if (form.channel === 'SMS' && !form.recipientPhone.trim()) {
    errors.recipientPhone = 'Recipient phone is required for SMS channel.';
  }

  if (!form.relatedService.trim()) {
    errors.relatedService = 'Related service is required.';
  }

  if (!form.subject.trim()) {
    errors.subject = 'Subject is required.';
  } else if (form.subject.trim().length < 5) {
    errors.subject = 'Subject must be at least 5 characters.';
  } else if (form.subject.trim().length > 120) {
    errors.subject = 'Subject must be 120 characters or less.';
  }

  if (!form.message.trim()) {
    errors.message = 'Message is required.';
  } else if (form.message.trim().length < 10) {
    errors.message = 'Message must be at least 10 characters.';
  } else if (form.message.trim().length > 2000) {
    errors.message = 'Message must be 2000 characters or less.';
  }

  if (!form.templateCode.trim()) {
    errors.templateCode = 'Template code is required.';
  } else if (!/^[A-Z0-9_]{3,40}$/.test(form.templateCode.trim().toUpperCase())) {
    errors.templateCode = 'Use A-Z, 0-9, underscore only (3-40 chars).';
  }

  return errors;
};

const AdminDashboard = ({ navigate, currentUser, refreshUser }) => {
  const accessToken = currentUser?.accessToken;
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationError, setNotificationError] = useState('');
  const [notificationSuccess, setNotificationSuccess] = useState('');
  const [notificationSearch, setNotificationSearch] = useState('');
  const [editingNotification, setEditingNotification] = useState(null);
  const [notificationForm, setNotificationForm] = useState(emptyNotificationForm);
  const [notificationFormErrors, setNotificationFormErrors] = useState({});
  const [activeSidebarItem, setActiveSidebarItem] = useState('dashboard');
  const dashboardSectionRef = useRef(null);
  const userFormRef = useRef(null);
  const userDirectoryRef = useRef(null);
  const notificationFormRef = useRef(null);
  const notificationCenterRef = useRef(null);

  const loadUsers = async () => {
    if (!accessToken) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetchUsers(accessToken);
      setUsers(Array.isArray(response?.data) ? response.data : []);
    } catch (loadError) {
      const message = loadError.message || 'Failed to load admin dashboard.';
      setError(message);
      if (message.toLowerCase().includes('unauthorized')) {
        refreshUser?.();
      }
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    setNotificationsLoading(true);
    setNotificationError('');

    try {
      const response = await fetchNotifications();
      const data = Array.isArray(response?.data) ? response.data : [];
      const sorted = data.sort((left, right) => new Date(right?.createdAt || 0) - new Date(left?.createdAt || 0));
      setNotifications(sorted);
    } catch (loadError) {
      setNotificationError(loadError.message || 'Failed to load notifications.');
    } finally {
      setNotificationsLoading(false);
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
    loadNotifications();
  }, [currentUser, accessToken, navigate]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;

    return users.filter((user) =>
      [
        user.firstName,
        user.lastName,
        user.email,
        user.phoneNumber,
        user.role,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [search, users]);

  const stats = useMemo(
    () => ({
      total: users.length,
      admins: users.filter((user) => user.role === 'ADMIN').length,
      doctors: users.filter((user) => user.role === 'DOCTOR').length,
      patients: users.filter((user) => user.role === 'PATIENT').length,
      active: users.filter((user) => user.active).length,
      verified: users.filter((user) => user.otpVerified).length,
    }),
    [users]
  );

  const notificationStats = useMemo(
    () => ({
      total: notifications.length,
      sent: notifications.filter((item) => item.status === 'SENT').length,
      queued: notifications.filter((item) => item.status === 'QUEUED').length,
      failed: notifications.filter((item) => item.status === 'FAILED').length,
    }),
    [notifications]
  );

  const resetForm = () => {
    setForm(emptyForm);
    setEditingUser(null);
  };

  const resetNotificationForm = () => {
    setNotificationForm(emptyNotificationForm);
    setNotificationFormErrors({});
    setEditingNotification(null);
  };

  const startEdit = (user) => {
    setEditingUser(user);
    setForm({
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      email: user.email ?? '',
      password: '',
      phoneNumber: user.phoneNumber ?? '',
      role: user.role ?? 'PATIENT',
      active: user.active ?? true,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Validate password requirements
      if (!editingUser && form.password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }

      if (editingUser && form.password.trim() && form.password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }

      if (editingUser) {
        const payload = {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim().toLowerCase(),
          phoneNumber: form.phoneNumber.trim(),
          role: form.role,
          active: form.active,
        };

        if (form.password.trim()) {
          payload.password = form.password.trim();
        }

        await updateUser(accessToken, editingUser.userId, payload);
        setSuccess('User account updated successfully.');
      } else {
        await registerUser({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          phoneNumber: form.phoneNumber.trim(),
          role: form.role,
        });
        setSuccess('User account created successfully.');
      }

      resetForm();
      await loadUsers();
    } catch (submitError) {
      setError(submitError.message || 'Unable to save user account.');
    }
  };

  const removeUserRecord = async (user) => {
    if (!window.confirm(`Delete ${user.email}?`)) return;

    setError('');
    setSuccess('');

    try {
      await deleteUser(accessToken, user.userId);
      setSuccess('User account deleted successfully.');
      await loadUsers();
    } catch (submitError) {
      setError(submitError.message || 'Unable to delete user account.');
    }
  };

  const toggleActive = async (user) => {
    setError('');
    setSuccess('');

    try {
      await updateUser(accessToken, user.userId, { active: !user.active });
      setSuccess('User status updated successfully.');
      await loadUsers();
    } catch (submitError) {
      setError(submitError.message || 'Unable to update user status.');
    }
  };

  const startEditNotification = (notification) => {
    setEditingNotification(notification);
    setNotificationForm({
      recipientName: notification.recipientName ?? '',
      recipientEmail: notification.recipientEmail ?? '',
      recipientPhone: notification.recipientPhone ?? '',
      audienceType: notification.audienceType ?? 'PATIENT',
      relatedService: notification.relatedService ?? 'General',
      subject: notification.subject ?? '',
      message: notification.message ?? '',
      templateCode: notification.templateCode ?? '',
      channel: notification.channel ?? 'IN_APP',
      priority: notification.priority ?? 'NORMAL',
      status: notification.status ?? 'SENT',
    });
    setNotificationFormErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setNotificationField = (field, value) => {
    const nextForm = { ...notificationForm, [field]: value };
    setNotificationForm(nextForm);

    if (Object.keys(notificationFormErrors).length > 0) {
      setNotificationFormErrors(validateNotificationForm(nextForm));
    }
  };

  const submitNotification = async (event) => {
    event.preventDefault();
    setNotificationError('');
    setNotificationSuccess('');

    const payload = {
      recipientName: notificationForm.recipientName.trim(),
      recipientEmail: notificationForm.recipientEmail.trim() || null,
      recipientPhone: notificationForm.recipientPhone.trim() || null,
      audienceType: notificationForm.audienceType.trim().toUpperCase(),
      relatedService: notificationForm.relatedService.trim(),
      subject: notificationForm.subject.trim(),
      message: notificationForm.message.trim(),
      templateCode: notificationForm.templateCode.trim().toUpperCase(),
      channel: notificationForm.channel,
      priority: notificationForm.priority,
      status: notificationForm.status,
    };

    const validationErrors = validateNotificationForm(notificationForm);
    setNotificationFormErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      setNotificationError('Please fix validation errors before submitting.');
      return;
    }

    try {
      if (editingNotification?.id) {
        await updateNotification(editingNotification.id, payload);
        setNotificationSuccess('Notification updated successfully.');
      } else {
        await createNotification(payload);
        setNotificationSuccess('Notification created successfully.');
      }

      resetNotificationForm();
      await loadNotifications();
    } catch (submitError) {
      setNotificationError(submitError.message || 'Unable to save notification.');
    }
  };

  const removeNotificationRecord = async (notification) => {
    if (!window.confirm(`Delete notification "${notification.subject}"?`)) return;

    setNotificationError('');
    setNotificationSuccess('');

    try {
      await deleteNotification(notification.id);
      setNotificationSuccess('Notification deleted successfully.');
      await loadNotifications();
    } catch (submitError) {
      setNotificationError(submitError.message || 'Unable to delete notification.');
    }
  };

  const filteredNotifications = useMemo(() => {
    const query = notificationSearch.trim().toLowerCase();
    if (!query) return notifications;

    return notifications.filter((item) =>
      [
        item.subject,
        item.message,
        item.audienceType,
        item.recipientName,
        item.relatedService,
        item.status,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [notificationSearch, notifications]);

  const scrollToRef = (ref) => {
    ref?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openUserCreationForRole = (role) => {
    resetForm();
    setForm((prev) => ({ ...prev, role }));
    scrollToRef(userFormRef);
  };

  const openNotificationForService = (serviceName) => {
    resetNotificationForm();
    setNotificationForm((prev) => ({ ...prev, relatedService: serviceName }));
    scrollToRef(notificationFormRef);
  };

  const handleSidebarClick = (itemId) => {
    setActiveSidebarItem(itemId);

    switch (itemId) {
      case 'dashboard':
      case 'device':
        scrollToRef(dashboardSectionRef);
        break;
      case 'create-user':
        scrollToRef(userFormRef);
        break;
      case 'create-notification':
        scrollToRef(notificationFormRef);
        break;
      case 'doctor':
        openUserCreationForRole('DOCTOR');
        break;
      case 'patient':
        openUserCreationForRole('PATIENT');
        break;
      case 'doctor-schedule':
        openNotificationForService('Doctor Schedule');
        break;
      case 'appointments':
        openNotificationForService('Appointment');
        break;
      case 'case-studies':
        openNotificationForService('Case Study');
        break;
      case 'prescription':
        openNotificationForService('Prescription');
        break;
      case 'notification-center':
        scrollToRef(notificationCenterRef);
        break;
      default:
        scrollToRef(userDirectoryRef);
        break;
    }
  };

  if (!currentUser || currentUser.role !== 'ADMIN' || !accessToken) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f3f4fb]">
      <Navbar navigate={navigate} currentUser={currentUser} />

      <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-24 lg:h-fit">
            <div className="mb-5 border-b border-slate-100 pb-4">
              <p className="text-xl font-black text-slate-900">HealthEase</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Super Admin</p>
            </div>
            <div className="space-y-1.5">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSidebarClick(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                    activeSidebarItem === item.id
                      ? 'bg-teal-600 text-white'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <i className={`fas ${item.icon} text-xs`}></i>
                  {item.label}
                </button>
              ))}
            </div>
          </aside>

          <div className="space-y-6">
            <section ref={dashboardSectionRef} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-4xl font-black text-slate-900">Dashboard</h1>
                <button
                  type="button"
                  onClick={() => {
                    loadUsers();
                    loadNotifications();
                  }}
                  className="rounded-full border border-teal-200 bg-teal-50 px-5 py-2.5 text-sm font-semibold text-teal-700 transition hover:bg-teal-100"
                >
                  Refresh Data
                </button>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Department</p>
                  <p className="mt-1 text-3xl font-black text-slate-900">{Math.max(1, stats.doctors)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Doctor</p>
                  <p className="mt-1 text-3xl font-black text-slate-900">{stats.doctors}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Patient</p>
                  <p className="mt-1 text-3xl font-black text-slate-900">{stats.patients}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Appointments</p>
                  <p className="mt-1 text-3xl font-black text-slate-900">{notificationStats.sent}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Case Studies</p>
                  <p className="mt-1 text-3xl font-black text-slate-900">{notificationStats.failed}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Invoice</p>
                  <p className="mt-1 text-3xl font-black text-slate-900">{notificationStats.queued}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Prescription</p>
                  <p className="mt-1 text-3xl font-black text-slate-900">{Math.max(0, stats.verified - stats.admins)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Payment</p>
                  <p className="mt-1 text-3xl font-black text-slate-900">{notificationStats.total}</p>
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-black text-slate-900">Monthly Registered Users</h2>
                <div className="mt-6 flex h-64 items-end gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  {[62, 75, 61, 84, 70, 78, 58, 69, 42, 6, 4, 5].map((height, index) => (
                    <div key={index} className="flex flex-1 flex-col items-center gap-2">
                      <div className="w-full rounded-t-md bg-gradient-to-t from-cyan-500 to-teal-400" style={{ height: `${height}%` }}></div>
                      <span className="text-[10px] font-semibold text-slate-500">
                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index]}
                      </span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-black text-slate-900">Monthly Earning</h2>
                <p className="mt-6 text-sm text-slate-500">This Week</p>
                <p className="mt-2 text-4xl font-black text-slate-900">$29.5k</p>
                <p className="mt-2 text-sm font-semibold text-rose-500">-31.08% from previous week</p>
                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                    <p className="text-2xl font-black text-cyan-700">40%</p>
                    <p className="mt-1 text-xs text-slate-500">First 15 days</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                    <p className="text-2xl font-black text-amber-600">30%</p>
                    <p className="mt-1 text-xs text-slate-500">Last 15 days</p>
                  </div>
                </div>
              </article>
            </section>
          </div>
        </section>

        {error ? (
          <section className="mt-8 rounded-[2rem] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            {error}
          </section>
        ) : null}

        {success ? (
          <section className="mt-8 rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-700">
            {success}
          </section>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <form ref={userFormRef} onSubmit={submit} className={panelClassName}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  {editingUser ? 'Edit user account' : 'Create user account'}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Add admins, doctors, or patients through the auth backend.
                </p>
              </div>
              {editingUser ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className={secondaryButtonClassName}
                >
                  Clear
                </button>
              ) : null}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <input className={inputClassName} placeholder="First name" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} required />
              <input className={inputClassName} placeholder="Last name" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} required />
              <input type="email" className={inputClassName} placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
              <div>
                <input 
                  type="password" 
                  className={inputClassName} 
                  placeholder={editingUser ? 'New password (optional)' : 'Password'} 
                  value={form.password} 
                  onChange={(event) => setForm({ ...form, password: event.target.value })} 
                  required={!editingUser} 
                />
                <p className="mt-2 text-xs text-slate-500">
                  {editingUser ? 'Password must be at least 8 characters (leave blank to keep current)' : 'Minimum 8 characters required'}
                </p>
              </div>
              <input className={inputClassName} placeholder="Phone number" value={form.phoneNumber} onChange={(event) => setForm({ ...form, phoneNumber: event.target.value })} required />
              <select className={inputClassName} value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
                <option value="PATIENT">PATIENT</option>
                <option value="DOCTOR">DOCTOR</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>

            {editingUser ? (
              <label className="mt-4 flex items-center gap-3 rounded-2xl bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
                Keep this account active
              </label>
            ) : null}

            <button type="submit" className={`mt-5 ${primaryButtonClassName}`}>
              {editingUser ? 'Save changes' : 'Create account'}
            </button>
          </form>

          <div ref={userDirectoryRef} className={panelClassName}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">User directory</h2>
                <p className="mt-2 text-sm text-slate-500">Live data from the authenticated admin user API.</p>
              </div>
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search users..."
                className="rounded-full border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              />
            </div>

            {loading ? (
              <div className="mt-5 rounded-[1.6rem] bg-stone-50 p-8 text-center text-sm text-slate-500">
                Loading user accounts...
              </div>
            ) : null}

            <div className="mt-5 grid gap-4">
              {filteredUsers.map((user) => (
                <article key={user.userId} className="rounded-[1.6rem] border border-stone-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="text-xl font-black text-slate-900">
                        {user.firstName} {user.lastName}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">{user.email}</p>
                      <p className="mt-2 text-sm text-slate-500">{user.phoneNumber || 'No phone number'}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                      <span className={`rounded-full px-3 py-1 ${roleTone(user.role)}`}>{user.role}</span>
                      <span className={`rounded-full px-3 py-1 ${user.active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {user.active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                      <span className={`rounded-full px-3 py-1 ${user.otpVerified ? 'bg-cyan-100 text-cyan-700' : 'bg-amber-100 text-amber-700'}`}>
                        {user.otpVerified ? 'VERIFIED' : 'PENDING'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button type="button" onClick={() => startEdit(user)} className={secondaryButtonClassName}>
                      Edit
                    </button>
                    <button type="button" onClick={() => toggleActive(user)} className="rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-100">
                      {user.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button type="button" onClick={() => removeUserRecord(user)} className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100">
                      Delete
                    </button>
                  </div>
                </article>
              ))}

              {!loading && filteredUsers.length === 0 ? (
                <div className="rounded-[1.6rem] border border-dashed border-stone-300 p-8 text-center text-sm text-slate-500">
                  No users found for that search.
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {notificationError ? (
          <section className="mt-8 rounded-[2rem] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            {notificationError}
          </section>
        ) : null}

        {notificationSuccess ? (
          <section className="mt-8 rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-700">
            {notificationSuccess}
          </section>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <form
            ref={notificationFormRef}
            onSubmit={submitNotification}
            className={panelClassName}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  {editingNotification ? 'Edit notification' : 'Create notification'}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Publish targeted notifications for patients, doctors, admins, or all users.
                </p>
              </div>
              {editingNotification ? (
                <button
                  type="button"
                  onClick={resetNotificationForm}
                  className={secondaryButtonClassName}
                >
                  Clear
                </button>
              ) : null}
            </div>

            <div className="mt-6 rounded-2xl border border-stone-200 bg-stone-50/70 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Recipient & Audience</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <input
                  className={inputClassName}
                  placeholder="Recipient name"
                  value={notificationForm.recipientName}
                  onChange={(event) => setNotificationField('recipientName', event.target.value)}
                  required
                />
                <select
                  className={inputClassName}
                  value={notificationForm.audienceType}
                  onChange={(event) => setNotificationField('audienceType', event.target.value)}
                >
                  <option value="ALL">ALL</option>
                  <option value="PATIENT">PATIENT</option>
                  <option value="DOCTOR">DOCTOR</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
                <input
                  type="email"
                  className={inputClassName}
                  placeholder="Recipient email (optional)"
                  value={notificationForm.recipientEmail}
                  onChange={(event) => setNotificationField('recipientEmail', event.target.value)}
                />
                <input
                  className={inputClassName}
                  placeholder="Recipient phone (optional)"
                  value={notificationForm.recipientPhone}
                  onChange={(event) => setNotificationField('recipientPhone', event.target.value)}
                />
              </div>
              {notificationFormErrors.recipientName ? (
                <p className="mt-2 text-xs text-rose-600">{notificationFormErrors.recipientName}</p>
              ) : null}
              {notificationFormErrors.recipientEmail ? (
                <p className="mt-2 text-xs text-rose-600">{notificationFormErrors.recipientEmail}</p>
              ) : null}
              {notificationFormErrors.recipientPhone ? (
                <p className="mt-2 text-xs text-rose-600">{notificationFormErrors.recipientPhone}</p>
              ) : null}
            </div>

            <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50/70 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Delivery Settings</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <input
                  className={inputClassName}
                  placeholder="Related service (e.g. Appointment)"
                  value={notificationForm.relatedService}
                  onChange={(event) => setNotificationField('relatedService', event.target.value)}
                  required
                />
                <input
                  className={inputClassName}
                  placeholder="Template code (e.g. APPT_UPDATE)"
                  value={notificationForm.templateCode}
                  onChange={(event) => setNotificationField('templateCode', event.target.value.toUpperCase())}
                  required
                />
                <select
                  className={inputClassName}
                  value={notificationForm.channel}
                  onChange={(event) => setNotificationField('channel', event.target.value)}
                >
                  <option value="IN_APP">IN_APP</option>
                  <option value="EMAIL">EMAIL</option>
                  <option value="SMS">SMS</option>
                </select>
                <select
                  className={inputClassName}
                  value={notificationForm.priority}
                  onChange={(event) => setNotificationField('priority', event.target.value)}
                >
                  <option value="LOW">LOW</option>
                  <option value="NORMAL">NORMAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
                <select
                  className={inputClassName}
                  value={notificationForm.status}
                  onChange={(event) => setNotificationField('status', event.target.value)}
                >
                  <option value="SENT">SENT</option>
                  <option value="QUEUED">QUEUED</option>
                  <option value="DRAFT">DRAFT</option>
                  <option value="FAILED">FAILED</option>
                </select>
              </div>
              <input
                className={inputClassName}
                placeholder="Notification subject"
                value={notificationForm.subject}
                onChange={(event) => setNotificationField('subject', event.target.value)}
                required
              />
              {notificationFormErrors.relatedService ? (
                <p className="mt-2 text-xs text-rose-600">{notificationFormErrors.relatedService}</p>
              ) : null}
              {notificationFormErrors.templateCode ? (
                <p className="mt-2 text-xs text-rose-600">{notificationFormErrors.templateCode}</p>
              ) : null}
              {notificationFormErrors.subject ? (
                <p className="mt-2 text-xs text-rose-600">{notificationFormErrors.subject}</p>
              ) : null}
            </div>

            <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50/70 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Message Content</p>
              <textarea
                className={`${inputClassName} mt-4 min-h-32`}
                placeholder="Notification message"
                value={notificationForm.message}
                onChange={(event) => setNotificationField('message', event.target.value)}
                required
              />
            </div>
            {notificationFormErrors.message ? (
              <p className="mt-2 text-xs text-rose-600">{notificationFormErrors.message}</p>
            ) : null}

            <button type="submit" className={`mt-5 ${primaryButtonClassName}`}>
              {editingNotification ? 'Update notification' : 'Publish notification'}
            </button>
          </form>

          <div ref={notificationCenterRef} className={panelClassName}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Notification center</h2>
                <p className="mt-2 text-sm text-slate-500">Create, edit, and delete published notifications.</p>
              </div>
              <input
                type="text"
                value={notificationSearch}
                onChange={(event) => setNotificationSearch(event.target.value)}
                placeholder="Search notifications..."
                className="rounded-full border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              />
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-4">
              <div className="rounded-2xl bg-stone-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{notificationStats.total}</p>
              </div>
              <div className="rounded-2xl bg-stone-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Sent</p>
                <p className="mt-2 text-2xl font-black text-emerald-700">{notificationStats.sent}</p>
              </div>
              <div className="rounded-2xl bg-stone-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Queued</p>
                <p className="mt-2 text-2xl font-black text-cyan-700">{notificationStats.queued}</p>
              </div>
              <div className="rounded-2xl bg-stone-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Failed</p>
                <p className="mt-2 text-2xl font-black text-rose-700">{notificationStats.failed}</p>
              </div>
            </div>

            {notificationsLoading ? (
              <div className="mt-5 rounded-[1.6rem] bg-stone-50 p-8 text-center text-sm text-slate-500">
                Loading notifications...
              </div>
            ) : null}

            <div className="mt-5 grid gap-4">
              {filteredNotifications.map((item) => (
                <article key={item.id} className="rounded-[1.6rem] border border-stone-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-xl font-black text-slate-900">{item.subject}</h3>
                      <p className="mt-2 text-sm text-slate-600">{item.message}</p>
                      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        To: {item.audienceType} | Service: {item.relatedService}
                      </p>
                      {item.replyMessage ? (
                        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                            Patient Reply {item.repliedByName ? `- ${item.repliedByName}` : ''}
                          </p>
                          <p className="mt-1 text-sm text-emerald-800">{item.replyMessage}</p>
                        </div>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                      <span className={`rounded-full px-3 py-1 ${notificationStatusTone(item.status)}`}>{item.status}</span>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">{item.priority}</span>
                      <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-700">{item.channel}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => startEditNotification(item)}
                      className={secondaryButtonClassName}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => removeNotificationRecord(item)}
                      className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}

              {!notificationsLoading && filteredNotifications.length === 0 ? (
                <div className="rounded-[1.6rem] border border-dashed border-stone-300 p-8 text-center text-sm text-slate-500">
                  No notifications found for that search.
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
