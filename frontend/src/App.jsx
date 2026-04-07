import { useCallback, useEffect, useState } from 'react';
import Home from './pages/home';
import AdminDashboard from './pages/admin-dashboard';
import DoctorDashboard from './pages/doctor-dashboard';
import PatientDashboard from './pages/patient-dashboard';
import PatientDetails from './pages/patient-details';
import DoctorServicePage from './pages/doctor-service-page';
import EditProfile from './pages/edit-profile';
import LoginPage from './pages/login-page';
import OtpPage from './pages/otp-page';
import RegisterPage from './pages/register-page';
import { getStoredUser } from './lib/auth';
import './App.css';

const routes = {
  '/': Home,
  '/login': LoginPage,
  '/register': RegisterPage,
  '/otp': OtpPage,
  '/admin': AdminDashboard,
  '/doctor-dashboard': DoctorDashboard,
  '/patient-dashboard': PatientDashboard,
  '/patient-details': PatientDetails,
  '/doctor-service': DoctorServicePage,
  '/edit-profile': EditProfile,
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

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
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
    </div>
  );
}

export default App;
