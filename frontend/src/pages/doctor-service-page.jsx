import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/navbar';
import {
  createDoctor,
  deleteDoctor,
  fetchDoctors,
  fetchDoctorSummary,
  fetchUsers,
  registerUser,
  updateDoctor,
  updateDoctorStatus,
  updateDoctorVerification,
  updateUser,
} from '../lib/auth';

const emptyDoctorForm = {
  fullName: '',
  email: '',
  password: '',
  phoneNumber: '',
  specialization: '',
  licenseNumber: '',
  department: '',
  roomNumber: '',
  experienceYears: '0',
  consultationFee: '0',
  status: 'ACTIVE',
  verified: false,
  availableDays: 'Monday, Wednesday',
  biography: '',
};

const inputClassName =
  'w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white';

const toneForStatus = (status) => {
  if (status === 'ACTIVE') return 'bg-emerald-100 text-emerald-700';
  if (status === 'ON_LEAVE') return 'bg-amber-100 text-amber-700';
  return 'bg-rose-100 text-rose-700';
};

const splitFullName = (fullName) => {
  const trimmedName = fullName.trim();
  if (!trimmedName) {
    return { firstName: 'Doctor', lastName: 'User' };
  }

  const parts = trimmedName.split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: 'Doctor' };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
};

const DoctorServicePage = ({ navigate, currentUser }) => {
  const [doctors, setDoctors] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyDoctorForm);
  const [editingDoctorId, setEditingDoctorId] = useState(null);
  const [authLookupEmail, setAuthLookupEmail] = useState('');

  const isAdmin = currentUser?.role === 'ADMIN';
  const accessToken = currentUser?.accessToken;

  const loadDoctorData = async () => {
    setLoading(true);
    setError('');

    const [doctorsResult, summaryResult] = await Promise.allSettled([
      fetchDoctors(),
      fetchDoctorSummary(),
    ]);

    if (doctorsResult.status === 'fulfilled') {
      setDoctors(Array.isArray(doctorsResult.value?.data) ? doctorsResult.value.data : []);
    } else {
      setError(doctorsResult.reason?.message || 'Failed to load doctor profiles.');
    }

    if (summaryResult.status === 'fulfilled') {
      setSummary(summaryResult.value?.data ?? null);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadDoctorData();
  }, []);

  const filteredDoctors = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return doctors;

    return doctors.filter((doctor) =>
      [
        doctor.fullName,
        doctor.specialization,
        doctor.department,
        doctor.email,
        doctor.licenseNumber,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [doctors, search]);

  const resetForm = () => {
    setForm(emptyDoctorForm);
    setEditingDoctorId(null);
    setAuthLookupEmail('');
  };

  const startEdit = (doctor) => {
    setEditingDoctorId(doctor.id);
    setAuthLookupEmail(doctor.email?.trim().toLowerCase() ?? '');
    setForm({
      fullName: doctor.fullName ?? '',
      email: doctor.email ?? '',
      password: '',
      phoneNumber: doctor.phoneNumber ?? '',
      specialization: doctor.specialization ?? '',
      licenseNumber: doctor.licenseNumber ?? '',
      department: doctor.department ?? '',
      roomNumber: doctor.roomNumber ?? '',
      experienceYears: String(doctor.experienceYears ?? 0),
      consultationFee: String(doctor.consultationFee ?? 0),
      status: doctor.status ?? 'ACTIVE',
      verified: doctor.verified ?? false,
      availableDays: Array.isArray(doctor.availableDays) ? doctor.availableDays.join(', ') : '',
      biography: doctor.biography ?? '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submitDoctor = async (event) => {
    event.preventDefault();
    if (!isAdmin) {
      setError('Only admin users can manage doctor records.');
      return;
    }

    setError('');
    setSuccess('');

    const normalizedEmail = form.email.trim().toLowerCase();
    const trimmedPassword = form.password.trim();
    const doctorPayload = {
      fullName: form.fullName.trim(),
      email: normalizedEmail,
      phoneNumber: form.phoneNumber.trim(),
      specialization: form.specialization.trim(),
      licenseNumber: form.licenseNumber.trim(),
      department: form.department.trim(),
      roomNumber: form.roomNumber.trim(),
      experienceYears: Number(form.experienceYears),
      consultationFee: Number(form.consultationFee),
      status: form.status,
      verified: form.verified,
      availableDays: form.availableDays
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      biography: form.biography.trim(),
    };

    const { firstName, lastName } = splitFullName(form.fullName);

    try {
      if (!editingDoctorId && !trimmedPassword) {
        throw new Error('Password is required so the doctor can log in.');
      }

      if (editingDoctorId) {
        await updateDoctor(editingDoctorId, doctorPayload);

        if (accessToken) {
          const usersResponse = await fetchUsers(accessToken);
          const authUsers = Array.isArray(usersResponse?.data) ? usersResponse.data : [];
          const linkedUser =
            authUsers.find((user) => user.email?.trim().toLowerCase() === authLookupEmail) ||
            authUsers.find((user) => user.email?.trim().toLowerCase() === normalizedEmail);

          if (linkedUser) {
            const authUpdatePayload = {
              firstName,
              lastName,
              email: normalizedEmail,
              phoneNumber: form.phoneNumber.trim(),
              role: 'DOCTOR',
              active: doctorPayload.status !== 'INACTIVE',
            };

            if (trimmedPassword) {
              authUpdatePayload.password = trimmedPassword;
            }

            await updateUser(accessToken, linkedUser.userId, authUpdatePayload);
          } else if (trimmedPassword) {
            await registerUser({
              firstName,
              lastName,
              email: normalizedEmail,
              password: trimmedPassword,
              phoneNumber: form.phoneNumber.trim(),
              role: 'DOCTOR',
            });
          }
        }

        setSuccess('Doctor profile updated successfully. Login details were synced where possible.');
      } else {
        await registerUser({
          firstName,
          lastName,
          email: normalizedEmail,
          password: trimmedPassword,
          phoneNumber: form.phoneNumber.trim(),
          role: 'DOCTOR',
        });

        await createDoctor(doctorPayload);
        setSuccess('Doctor profile created successfully. The doctor can now log in with this email and password.');
      }

      resetForm();
      await loadDoctorData();
    } catch (submitError) {
      setError(submitError.message || 'Unable to save doctor profile.');
    }
  };

  const toggleVerification = async (doctor) => {
    if (!isAdmin) return;
    setError('');
    try {
      await updateDoctorVerification(doctor.id, !doctor.verified);
      await loadDoctorData();
    } catch (submitError) {
      setError(submitError.message || 'Unable to update verification.');
    }
  };

  const cycleStatus = async (doctor) => {
    if (!isAdmin) return;
    setError('');
    const nextStatus =
      doctor.status === 'ACTIVE' ? 'ON_LEAVE' : doctor.status === 'ON_LEAVE' ? 'INACTIVE' : 'ACTIVE';

    try {
      await updateDoctorStatus(doctor.id, nextStatus);
      await loadDoctorData();
    } catch (submitError) {
      setError(submitError.message || 'Unable to update doctor status.');
    }
  };

  const removeDoctorRecord = async (doctor) => {
    if (!isAdmin) return;
    if (!window.confirm(`Delete doctor profile for ${doctor.fullName}?`)) return;

    setError('');
    try {
      await deleteDoctor(doctor.id);
      setSuccess('Doctor profile deleted successfully.');
      await loadDoctorData();
    } catch (submitError) {
      setError(submitError.message || 'Unable to delete doctor profile.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f2e9]">
      <Navbar navigate={navigate} currentUser={currentUser} />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-[2.4rem] bg-[linear-gradient(135deg,_rgba(15,23,42,1),_rgba(14,116,144,0.92),_rgba(13,148,136,0.88))] px-8 py-10 text-white shadow-[0_26px_90px_rgba(15,23,42,0.20)]">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-100/75">Doctor Service Frontend</p>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                Professional doctor management built from your backend.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-8 text-cyan-50/85">
                This page is connected to `doctor-service` on port `8083` and covers doctor CRUD, verification,
                department tracking, consultation fee setup, and availability management.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={loadDoctorData}
                  className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900"
                >
                  Refresh doctor data
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white"
                >
                  Back to admin
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.8rem] border border-white/14 bg-white/10 p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/75">Total Doctors</p>
                <p className="mt-3 text-4xl font-black">{summary?.totalDoctors ?? doctors.length}</p>
              </div>
              <div className="rounded-[1.8rem] border border-white/14 bg-white/10 p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/75">Verified</p>
                <p className="mt-3 text-4xl font-black">{summary?.verifiedDoctors ?? 0}</p>
              </div>
              <div className="rounded-[1.8rem] border border-white/14 bg-white/10 p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/75">Active</p>
                <p className="mt-3 text-4xl font-black">{summary?.activeDoctors ?? 0}</p>
              </div>
              <div className="rounded-[1.8rem] border border-white/14 bg-white/10 p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/75">On Leave</p>
                <p className="mt-3 text-4xl font-black">{summary?.onLeaveDoctors ?? 0}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <form onSubmit={submitDoctor} className="rounded-[2rem] bg-white p-6 shadow-[0_16px_60px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  {editingDoctorId ? 'Edit doctor profile' : 'Create doctor profile'}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Creates the doctor profile and the matching doctor login account.
                </p>
              </div>
              {editingDoctorId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full border border-stone-200 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Clear
                </button>
              ) : null}
            </div>

            {!isAdmin ? (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Login as an admin to create or edit doctor profiles.
              </div>
            ) : null}

            {error ? (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
              </div>
            ) : null}

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <input className={inputClassName} placeholder="Full name" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required />
              <input type="email" className={inputClassName} placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
              <input type="password" className={inputClassName} placeholder={editingDoctorId ? 'Password for login update (optional)' : 'Password for doctor login'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required={!editingDoctorId} />
              <input className={inputClassName} placeholder="Phone number" value={form.phoneNumber} onChange={(event) => setForm({ ...form, phoneNumber: event.target.value })} required />
              <input className={inputClassName} placeholder="Specialization" value={form.specialization} onChange={(event) => setForm({ ...form, specialization: event.target.value })} required />
              <input className={inputClassName} placeholder="License number" value={form.licenseNumber} onChange={(event) => setForm({ ...form, licenseNumber: event.target.value })} required />
              <input className={inputClassName} placeholder="Department" value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} required />
              <input className={inputClassName} placeholder="Room number" value={form.roomNumber} onChange={(event) => setForm({ ...form, roomNumber: event.target.value })} required />
              <input type="number" min="0" className={inputClassName} placeholder="Experience years" value={form.experienceYears} onChange={(event) => setForm({ ...form, experienceYears: event.target.value })} required />
              <input type="number" min="0" step="0.01" className={inputClassName} placeholder="Consultation fee" value={form.consultationFee} onChange={(event) => setForm({ ...form, consultationFee: event.target.value })} required />
              <select className={inputClassName} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                <option value="ACTIVE">ACTIVE</option>
                <option value="ON_LEAVE">ON_LEAVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
              <input className={inputClassName} placeholder="Available days, comma separated" value={form.availableDays} onChange={(event) => setForm({ ...form, availableDays: event.target.value })} required />
            </div>

            <textarea className={`${inputClassName} mt-4 min-h-28`} placeholder="Biography" value={form.biography} onChange={(event) => setForm({ ...form, biography: event.target.value })} />
            <label className="mt-4 flex items-center gap-3 rounded-2xl bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={form.verified} onChange={(event) => setForm({ ...form, verified: event.target.checked })} />
              Verified doctor
            </label>

            <button type="submit" disabled={!isAdmin} className="mt-5 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
              {editingDoctorId ? 'Save changes' : 'Create doctor'}
            </button>
          </form>

          <div className="rounded-[2rem] bg-white p-6 shadow-[0_16px_60px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Doctor registry</h2>
                <p className="mt-2 text-sm text-slate-500">Live data from `GET /api/doctors`.</p>
              </div>
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search doctors..."
                className="rounded-full border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none"
              />
            </div>

            {loading ? <p className="mt-5 text-sm text-slate-500">Loading doctors...</p> : null}

            <div className="mt-5 grid gap-4">
              {filteredDoctors.map((doctor) => (
                <article key={doctor.id} className="rounded-[1.6rem] border border-stone-200 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="text-xl font-black text-slate-900">{doctor.fullName}</h3>
                      <p className="mt-1 text-sm text-teal-700">{doctor.specialization}</p>
                      <p className="mt-2 text-sm text-slate-500">
                        {doctor.department} | Room {doctor.roomNumber} | {doctor.licenseNumber}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">{doctor.email} | {doctor.phoneNumber}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                      <span className={`rounded-full px-3 py-1 ${doctor.verified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {doctor.verified ? 'VERIFIED' : 'PENDING'}
                      </span>
                      <span className={`rounded-full px-3 py-1 ${toneForStatus(doctor.status)}`}>
                        {doctor.status}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                    <p>Experience: {doctor.experienceYears} years</p>
                    <p>Fee: LKR {doctor.consultationFee}</p>
                    <p>Available: {Array.isArray(doctor.availableDays) ? doctor.availableDays.join(', ') : 'N/A'}</p>
                    <p>Created: {doctor.createdAt ? new Date(doctor.createdAt).toLocaleDateString() : 'N/A'}</p>
                  </div>

                  {doctor.biography ? <p className="mt-4 text-sm leading-7 text-slate-500">{doctor.biography}</p> : null}

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button type="button" onClick={() => startEdit(doctor)} disabled={!isAdmin} className="rounded-full border border-stone-200 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50">
                      Edit
                    </button>
                    <button type="button" onClick={() => toggleVerification(doctor)} disabled={!isAdmin} className="rounded-full border border-teal-200 px-4 py-2 text-sm font-semibold text-teal-800 disabled:opacity-50">
                      {doctor.verified ? 'Mark pending' : 'Verify'}
                    </button>
                    <button type="button" onClick={() => cycleStatus(doctor)} disabled={!isAdmin} className="rounded-full border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-800 disabled:opacity-50">
                      Cycle status
                    </button>
                    <button type="button" onClick={() => removeDoctorRecord(doctor)} disabled={!isAdmin} className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 disabled:opacity-50">
                      Delete
                    </button>
                  </div>
                </article>
              ))}

              {!loading && filteredDoctors.length === 0 ? (
                <div className="rounded-[1.6rem] border border-dashed border-stone-300 p-8 text-center text-sm text-slate-500">
                  No doctors found for that search.
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DoctorServicePage;
