import { useEffect, useState } from 'react';
import AuthShell from '../components/auth-shell';
import {
  clearPendingAuth,
  getPendingAuth,
  storeUser,
  verifyOtp,
  loginUser,
} from '../lib/auth';

const validateOtp = (value) => {
  if (!value || value.trim().length === 0) {
    return 'OTP is required';
  }
  if (!/^\d{6}$/.test(value)) {
    return 'OTP must be exactly 6 digits';
  }
  return '';
};

const OtpPage = ({ navigate, refreshUser }) => {
  const [pendingAuth, setPendingAuthState] = useState(() => getPendingAuth());
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [touched, setTouched] = useState(false);

  const getDashboardPath = (role) => {
    if (role === 'ADMIN') return '/admin';
    if (role === 'DOCTOR') return '/doctor-dashboard';
    return '/';
  };

  useEffect(() => {
    const storedPendingAuth = getPendingAuth();
    if (!storedPendingAuth?.email) {
      navigate('/login');
      return;
    }

    setPendingAuthState(storedPendingAuth);
  }, [navigate]);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleOtpChange = (event) => {
    const value = event.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);

    if (touched) {
      const error = validateOtp(value);
      setOtpError(error);
    }
  };

  const handleOtpBlur = () => {
    setTouched(true);
    const error = validateOtp(otp);
    setOtpError(error);
  };

  const handleResendOtp = async () => {
    if (!pendingAuth?.email) {
      setError('Email is missing. Please login again.');
      return;
    }

    setResendLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await loginUser({
        email: pendingAuth.email,
        password: pendingAuth.password,
      });

      if (response?.message?.toLowerCase().includes('otp sent')) {
        setSuccess('OTP resent to your email successfully.');
        setResendTimer(30); // 30 seconds cooldown
        setOtp('');
        setOtpError('');
        setTouched(false);
      } else {
        setError('Failed to resend OTP. Please try again.');
      }
    } catch (submitError) {
      setError(submitError.message || 'Failed to resend OTP.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    // Validate OTP
    const error = validateOtp(otp);
    setOtpError(error);
    setTouched(true);

    if (error) {
      return;
    }

    if (!pendingAuth?.email) {
      setError('Login details are missing. Please login again.');
      return;
    }

    setLoading(true);

    try {
      const verifyResponse = await verifyOtp({
        email: pendingAuth.email,
        otp,
      });

      const userData = verifyResponse?.data;

      if (!userData || !userData.userId) {
        setError('OTP verification failed. Please try again.');
        setLoading(false);
        return;
      }

      storeUser(userData);
      clearPendingAuth();
      refreshUser();
      setSuccess('OTP verified successfully. Logging you in...');
      
      setTimeout(() => {
        navigate(getDashboardPath(userData.role));
      }, 1500);
    } catch (submitError) {
      setError(submitError.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Enter OTP"
      subtitle="We sent a one-time password to your email. Enter it below to verify your account and finish login."
      navigate={navigate}
      footer={
        <p className="text-sm text-slate-500">
          Wrong email?{' '}
          <button
            type="button"
            onClick={() => {
              clearPendingAuth();
              navigate('/login');
            }}
            className="font-semibold text-teal-700 hover:text-teal-800"
          >
            Return to login
          </button>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="otpEmail" className="mb-2 block text-sm font-semibold text-slate-700">
            Email address
          </label>
          <input
            id="otpEmail"
            type="email"
            value={pendingAuth?.email ?? ''}
            readOnly
            className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-600 outline-none"
          />
        </div>

        <div>
          <label htmlFor="otp" className="mb-2 block text-sm font-semibold text-slate-700">
            OTP code <span className="text-rose-500">*</span>
          </label>
          <input
            id="otp"
            name="otp"
            type="text"
            inputMode="numeric"
            value={otp}
            onChange={handleOtpChange}
            onBlur={handleOtpBlur}
            required
            maxLength={6}
            className={`w-full rounded-2xl border px-4 py-3 text-lg tracking-[0.35em] text-slate-900 outline-none transition focus:bg-white ${
              otpError && touched
                ? 'border-rose-500 border-2 bg-rose-50 focus:border-rose-500'
                : 'border-slate-200 bg-slate-50 focus:border-teal-500'
            }`}
            placeholder="123456"
          />
          {otpError && touched && (
            <p className="mt-1 text-xs text-rose-600">{otpError}</p>
          )}
          {otp && otp.length === 6 && !otpError && touched && (
            <p className="mt-1 text-xs text-emerald-600">✓ OTP format valid</p>
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
          disabled={loading || otpError !== '' || otp.length !== 6}
          className="w-full rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Verifying OTP...' : 'Verify OTP and login'}
        </button>

        <button
          type="button"
          onClick={handleResendOtp}
          disabled={resendLoading || resendTimer > 0}
          className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-teal-700 transition hover:border-teal-600 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {resendLoading
            ? 'Sending OTP...'
            : resendTimer > 0
            ? `Resend OTP in ${resendTimer}s`
            : 'Resend OTP'}
        </button>
      </form>
    </AuthShell>
  );
};

export default OtpPage;
