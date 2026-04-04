import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/navbar';
import { deleteUser, fetchUsers, registerUser, updateUser } from '../lib/auth';

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phoneNumber: '',
  role: 'PATIENT',
  active: true,
};

const inputClassName =
  'w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white';

const roleTone = (role) => {
  if (role === 'ADMIN') return 'bg-cyan-100 text-cyan-700';
  if (role === 'DOCTOR') return 'bg-emerald-100 text-emerald-700';
  return 'bg-amber-100 text-amber-700';
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

  const resetForm = () => {
    setForm(emptyForm);
    setEditingUser(null);
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

  if (!currentUser || currentUser.role !== 'ADMIN' || !accessToken) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f6f2e9]">
      <Navbar navigate={navigate} currentUser={currentUser} />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-[2.4rem] bg-[linear-gradient(135deg,_rgba(15,23,42,1),_rgba(14,116,144,0.92),_rgba(13,148,136,0.88))] px-8 py-10 text-white shadow-[0_26px_90px_rgba(15,23,42,0.18)]">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-100/75">Admin Dashboard</p>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                Welcome back, {currentUser.name || currentUser.email}
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-8 text-cyan-50/85">
                Manage platform users, review role distribution, monitor verification progress, and control access
                from one professional admin workspace.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={loadUsers}
                  className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900"
                >
                  Refresh dashboard
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/doctor-service')}
                  className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white"
                >
                  Open doctor service
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.8rem] border border-white/14 bg-white/10 p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/75">Total Users</p>
                <p className="mt-3 text-4xl font-black">{stats.total}</p>
              </div>
              <div className="rounded-[1.8rem] border border-white/14 bg-white/10 p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/75">Active Accounts</p>
                <p className="mt-3 text-4xl font-black">{stats.active}</p>
              </div>
              <div className="rounded-[1.8rem] border border-white/14 bg-white/10 p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/75">Doctors</p>
                <p className="mt-3 text-4xl font-black">{stats.doctors}</p>
              </div>
              <div className="rounded-[1.8rem] border border-white/14 bg-white/10 p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/75">Verified Users</p>
                <p className="mt-3 text-4xl font-black">{stats.verified}</p>
              </div>
            </div>
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

        <section className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <form onSubmit={submit} className="rounded-[2rem] bg-white p-6 shadow-[0_16px_60px_rgba(15,23,42,0.06)]">
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
                  className="rounded-full border border-stone-200 px-4 py-2 text-sm font-semibold text-slate-700"
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

            <button type="submit" className="mt-5 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white">
              {editingUser ? 'Save changes' : 'Create account'}
            </button>
          </form>

          <div className="rounded-[2rem] bg-white p-6 shadow-[0_16px_60px_rgba(15,23,42,0.06)]">
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
                className="rounded-full border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none"
              />
            </div>

            {loading ? (
              <div className="mt-5 rounded-[1.6rem] bg-stone-50 p-8 text-center text-sm text-slate-500">
                Loading user accounts...
              </div>
            ) : null}

            <div className="mt-5 grid gap-4">
              {filteredUsers.map((user) => (
                <article key={user.userId} className="rounded-[1.6rem] border border-stone-200 p-5">
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
                    <button type="button" onClick={() => startEdit(user)} className="rounded-full border border-stone-200 px-4 py-2 text-sm font-semibold text-slate-700">
                      Edit
                    </button>
                    <button type="button" onClick={() => toggleActive(user)} className="rounded-full border border-teal-200 px-4 py-2 text-sm font-semibold text-teal-800">
                      {user.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button type="button" onClick={() => removeUserRecord(user)} className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700">
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
      </main>
    </div>
  );
};

export default AdminDashboard;
