import { useState } from 'react';
import AuthShell from '../components/auth-shell';
import { registerUser, setPendingAuth } from '../lib/auth';

const initialState = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  password: '',
  confirmPassword: '',
};

const initialErrors = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  password: '',
  confirmPassword: '',
};

// Validation functions
const validateFirstName = (value) => {
  if (!value || value.trim().length === 0) {
    return 'First name is required';
  }
  if (value.trim().length < 2) {
    return 'First name must be at least 2 characters';
  }
  if (value.trim().length > 50) {
    return 'First name must not exceed 50 characters';
  }
  if (!/^[a-zA-Z\s'-]+$/.test(value)) {
    return 'First name can only contain letters, spaces, hyphens, and apostrophes';
  }
  return '';
};

const validateLastName = (value) => {
  if (!value || value.trim().length === 0) {
    return 'Last name is required';
  }
  if (value.trim().length < 2) {
    return 'Last name must be at least 2 characters';
  }
  if (value.trim().length > 50) {
    return 'Last name must not exceed 50 characters';
  }
  if (!/^[a-zA-Z\s'-]+$/.test(value)) {
    return 'Last name can only contain letters, spaces, hyphens, and apostrophes';
  }
  return '';
};

const validateEmail = (value) => {
  if (!value || value.trim().length === 0) {
    return 'Email is required';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return 'Please enter a valid email address';
  }
  return '';
};

const validatePhoneNumber = (value) => {
  if (!value || value.trim().length === 0) {
    return 'Phone number is required';
  }
  // Supports formats: +94XXXXXXXXX, +1XXXXXXXXXX, or 09XXXXXXXX for Sri Lanka
  const phoneRegex = /^(\+\d{1,3})?[\s]?\d{9,}$|^0\d{9}$/;
  if (!phoneRegex.test(value.replace(/[\s\-()]/g, ''))) {
    return 'Please enter a valid phone number (e.g., +94 77 123 4567 or 0771234567)';
  }
  return '';
};

const validatePassword = (value) => {
  if (!value || value.length === 0) {
    return 'Password is required';
  }
  if (value.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (value.length > 128) {
    return 'Password must not exceed 128 characters';
  }
  if (!/[a-z]/.test(value)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!/[A-Z]/.test(value)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/\d/.test(value)) {
    return 'Password must contain at least one number';
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
    return 'Password must contain at least one special character (!@#$%^&*)';
  }
  return '';
};

const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword || confirmPassword.length === 0) {
    return 'Please confirm your password';
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }
  return '';
};

const RegisterPage = ({ navigate }) => {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState(initialErrors);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Validate on change if field has been touched
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
    switch (name) {
      case 'firstName':
        error = validateFirstName(value);
        break;
      case 'lastName':
        error = validateLastName(value);
        break;
      case 'email':
        error = validateEmail(value);
        break;
      case 'phoneNumber':
        error = validatePhoneNumber(value);
        break;
      case 'password':
        error = validatePassword(value);
        break;
      case 'confirmPassword':
        error = validateConfirmPassword(form.password, value);
        break;
      default:
        break;
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
    return error === '';
  };

  const validateAllFields = () => {
    const newErrors = {};
    let isValid = true;

    newErrors.firstName = validateFirstName(form.firstName);
    newErrors.lastName = validateLastName(form.lastName);
    newErrors.email = validateEmail(form.email);
    newErrors.phoneNumber = validatePhoneNumber(form.phoneNumber);
    newErrors.password = validatePassword(form.password);
    newErrors.confirmPassword = validateConfirmPassword(form.password, form.confirmPassword);

    Object.values(newErrors).forEach((err) => {
      if (err) isValid = false;
    });

    setErrors(newErrors);
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      phoneNumber: true,
      password: true,
      confirmPassword: true,
    });

    return isValid;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!validateAllFields()) {
      setError('Please fix all validation errors before submitting');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phoneNumber: form.phoneNumber.trim(),
        password: form.password,
        role: 'PATIENT',
      };

      const response = await registerUser(payload);
      setPendingAuth({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      setSuccess(response?.message ?? 'Registration completed. OTP sent to your email.');
      setForm(initialState);
      setErrors(initialErrors);
      setTouched({});
      setTimeout(() => navigate('/otp'), 1500);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create Your User Account"
      subtitle="Register as a patient, receive an OTP by email, and finish sign-in with one secure verification step."
      navigate={navigate}
      footer={
        <p className="text-sm text-slate-500">
          Already registered?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="font-semibold text-teal-700 hover:text-teal-800"
          >
            Go to login
          </button>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="mb-2 block text-sm font-semibold text-slate-700">
              First name <span className="text-rose-500">*</span>
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              value={form.firstName}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              className={`w-full rounded-2xl border px-4 py-3 text-slate-900 outline-none transition focus:bg-white ${
                errors.firstName && touched.firstName
                  ? 'border-rose-500 border-2 bg-rose-50 focus:border-rose-500'
                  : 'border-slate-200 bg-slate-50 focus:border-teal-500'
              }`}
              placeholder="First name"
            />
            {errors.firstName && touched.firstName && (
              <p className="mt-1 text-xs text-rose-600">{errors.firstName}</p>
            )}
          </div>

          <div>
            <label htmlFor="lastName" className="mb-2 block text-sm font-semibold text-slate-700">
              Last name <span className="text-rose-500">*</span>
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              value={form.lastName}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              className={`w-full rounded-2xl border px-4 py-3 text-slate-900 outline-none transition focus:bg-white ${
                errors.lastName && touched.lastName
                  ? 'border-rose-500 border-2 bg-rose-50 focus:border-rose-500'
                  : 'border-slate-200 bg-slate-50 focus:border-teal-500'
              }`}
              placeholder="Last name"
            />
            {errors.lastName && touched.lastName && (
              <p className="mt-1 text-xs text-rose-600">{errors.lastName}</p>
            )}
          </div>
        </div>

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
            placeholder="you@example.com"
          />
          {errors.email && touched.email && (
            <p className="mt-1 text-xs text-rose-600">{errors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="phoneNumber" className="mb-2 block text-sm font-semibold text-slate-700">
            Phone number <span className="text-rose-500">*</span>
          </label>
          <input
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            value={form.phoneNumber}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            className={`w-full rounded-2xl border px-4 py-3 text-slate-900 outline-none transition focus:bg-white ${
              errors.phoneNumber && touched.phoneNumber
                ? 'border-rose-500 border-2 bg-rose-50 focus:border-rose-500'
                : 'border-slate-200 bg-slate-50 focus:border-teal-500'
            }`}
            placeholder="+94 77 123 4567"
          />
          {errors.phoneNumber && touched.phoneNumber && (
            <p className="mt-1 text-xs text-rose-600">{errors.phoneNumber}</p>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
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
              placeholder="Choose a password"
            />
            {errors.password && touched.password && (
              <p className="mt-1 text-xs text-rose-600">{errors.password}</p>
            )}
            {!errors.password && form.password && (
              <div className="mt-2 space-y-1">
                <p className="text-xs font-semibold text-slate-600">Password requirements:</p>
                <div className="space-y-0.5 text-xs">
                  <p className={form.password.length >= 8 ? 'text-emerald-600' : 'text-slate-500'}>
                    ✓ At least 8 characters
                  </p>
                  <p className={/[a-z]/.test(form.password) ? 'text-emerald-600' : 'text-slate-500'}>
                    ✓ Lowercase letter
                  </p>
                  <p className={/[A-Z]/.test(form.password) ? 'text-emerald-600' : 'text-slate-500'}>
                    ✓ Uppercase letter
                  </p>
                  <p className={/\d/.test(form.password) ? 'text-emerald-600' : 'text-slate-500'}>
                    ✓ Number
                  </p>
                  <p
                    className={
                      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password)
                        ? 'text-emerald-600'
                        : 'text-slate-500'
                    }
                  >
                    ✓ Special character (!@#$%^&*)
                  </p>
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold text-slate-700">
              Confirm password <span className="text-rose-500">*</span>
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              className={`w-full rounded-2xl border px-4 py-3 text-slate-900 outline-none transition focus:bg-white ${
                errors.confirmPassword && touched.confirmPassword
                  ? 'border-rose-500 border-2 bg-rose-50 focus:border-rose-500'
                  : form.password === form.confirmPassword && form.confirmPassword
                  ? 'border-emerald-500 border-2 bg-emerald-50 focus:border-emerald-500'
                  : 'border-slate-200 bg-slate-50 focus:border-teal-500'
              }`}
              placeholder="Repeat your password"
            />
            {errors.confirmPassword && touched.confirmPassword && (
              <p className="mt-1 text-xs text-rose-600">{errors.confirmPassword}</p>
            )}
            {!errors.confirmPassword && form.confirmPassword && form.password === form.confirmPassword && (
              <p className="mt-1 text-xs text-emerald-600">✓ Passwords match</p>
            )}
          </div>
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
          disabled={loading || Object.values(errors).some((e) => e !== '')}
          className="w-full rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Creating account...' : 'Create account and send OTP'}
        </button>
      </form>
    </AuthShell>
  );
};

export default RegisterPage;
