import { useCallback, useEffect, useState } from 'react';
import Home from './pages/home';
import AdminDashboard from './pages/admin-dashboard';
import DoctorDashboard from './pages/doctor-dashboard';
import LoginPage from './pages/login-page';
import OtpPage from './pages/otp-page';
import RegisterPage from './pages/register-page';
import AppointmentPage from './pages/appointment-page';
import PaymentPage from "./pages/payment-page";
import ProfilePage from './pages/profile-page';
import HealthAssistant from './components/health-assistant';
import SymptomChecker from './pages/SymptomChecker';
import SymptomChatBot from './pages/SymptomChatBot';
import { getStoredUser } from './lib/auth';
import './App.css';

const routes = {
  '/': Home,
  '/login': LoginPage,
  '/register': RegisterPage,
  '/otp': OtpPage,
  '/admin': AdminDashboard,
  '/doctor': DoctorDashboard,
  '/appointment': AppointmentPage,
  '/payment': PaymentPage,
  '/profile': ProfilePage,
  '/symptom-checker': SymptomChecker,
  '/symptom-chatbot': SymptomChatBot,
};

const getCurrentPath = () => {
  const path = window.location.pathname;
  return routes[path] ? path : '/';
};

function App() {
  const [currentPath, setCurrentPath] = useState(getCurrentPath);
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(getCurrentPath());
      setCurrentUser(getStoredUser());
    };
    const syncCurrentUser = () => {
      setCurrentUser(getStoredUser());
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('storage', syncCurrentUser);
    window.addEventListener('focus', syncCurrentUser);
    document.addEventListener('visibilitychange', syncCurrentUser);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('storage', syncCurrentUser);
      window.removeEventListener('focus', syncCurrentUser);
      document.removeEventListener('visibilitychange', syncCurrentUser);
    };
  }, []);

  const navigate = useCallback((path) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }

    setCurrentPath(getCurrentPath());
    setCurrentUser(getStoredUser());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const refreshUser = useCallback(() => {
    setCurrentUser(getStoredUser());
  }, []);

  const Page = routes[currentPath] || Home;

  return (
    <div className="min-h-screen bg-slate-50">
      <Page navigate={navigate} currentUser={currentUser} refreshUser={refreshUser} />
      <HealthAssistant navigate={navigate} currentUser={currentUser} currentPath={currentPath} />
    </div>
  );
}

export default App;
