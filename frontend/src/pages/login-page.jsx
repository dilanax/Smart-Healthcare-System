import { useState } from 'react';
import AuthShell from '../components/auth-shell';
import {
  loginUser,
  setPendingAuth,
  storeUser,
} from '../lib/auth';

// Validation functions
const validateLoginEmail = (value) => {
  if (!value || value.trim().length === 0) {
    return 'Email is required';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return 'Please enter a valid email address';
  }
  return '';
};

const validateLoginPassword = (value) => {
  if (!value || value.length === 0) {
    return 'Password is required';
  }
  if (value.length < 8) {
    return 'Password must be at least 8 characters';
  }
  return '';
};

const LoginPage = ({ navigate, refreshUser }) => {
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });
  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      validateField(name, value);
    }
  };

  const handleBlur = (event) => {
    const { name, value } = event.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const validateField = (name, value) => {
    let error = '';
    if (name === 'email') {
      error = validateLoginEmail(value);
    } else if (name === 'password') {
      error = validateLoginPassword(value);
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const validateAllFields = () => {
    const newErrors = {
      email: validateLoginEmail(form.email),
      password: validateLoginPassword(form.password),
    };

    setErrors(newErrors);
    setTouched({
      email: true,
      password: true,
    });

    return !newErrors.email && !newErrors.password;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!validateAllFields()) {
      setError('Please fill in all fields correctly');
      return;
    }

    setLoading(true);

    try {
      const response = await loginUser(form);
      const message = response?.message ?? '';
      const data = response?.data;

      // OTP flow - user needs to verify OTP (check message FIRST)
      if (message.toLowerCase().includes('otp sent')) {
        setPendingAuth({
          email: form.email,
          password: form.password,
        });
        // Redirect immediately to OTP page without waiting
        navigate('/otp');
        return;
      }

      // Check if response has no data (error case)
      if (!data) {
        setError(message || 'Login failed. Please check your credentials.');
        setLoading(false);
        return;
      }

      // Direct login without OTP (shouldn't happen based on backend, but keeping for safety)
      if (data && data.userId) {
        storeUser(data);
        refreshUser();
        setSuccess(message || 'Login successful');
        const redirectPath = data.role === 'ADMIN' ? '/admin' : data.role === 'DOCTOR' ? '/doctor' : '/';
        setTimeout(() => navigate(redirectPath), 1500);
      } else {
        setError(message || 'Login failed. Please try again.');
      }
    } catch (submitError) {
      setError(submitError.message || 'An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="User Login"
      subtitle="Enter your email and password. If your account still needs verification, we will send an OTP to your email and guide you to the next step."
      navigate={navigate}
      footer={
        <p className="text-sm text-slate-500">
          Need an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="font-semibold text-teal-700 hover:text-teal-800"
          >
            Create one here
          </button>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
            Email address <span className="text-rose-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            className={`w-full rounded-2xl border px-4 py-3 text-slate-900 outline-none transition focus:bg-white ${
              errors.email && touched.email
                ? 'border-rose-500 border-2 bg-rose-50 focus:border-rose-500'
                : 'border-slate-200 bg-slate-50 focus:border-teal-500'
            }`}
            placeholder="Enter your email"
          />
          {errors.email && touched.email && (
            <p className="mt-1 text-xs text-rose-600">{errors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
            Password <span className="text-rose-500">*</span>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            className={`w-full rounded-2xl border px-4 py-3 text-slate-900 outline-none transition focus:bg-white ${
              errors.password && touched.password
                ? 'border-rose-500 border-2 bg-rose-50 focus:border-rose-500'
                : 'border-slate-200 bg-slate-50 focus:border-teal-500'
            }`}
            placeholder="Enter your password"
          />
          {errors.password && touched.password && (
            <p className="mt-1 text-xs text-rose-600">{errors.password}</p>
          )}
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading || errors.email !== '' || errors.password !== ''}
          className="w-full rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Checking account...' : 'Continue to secure login'}
        </button>
      </form>
    </AuthShell>
  );
};

export default LoginPage;
