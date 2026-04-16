import React, { useEffect, useRef, useState } from 'react';
import { clearStoredUser } from '../lib/auth';
import { fetchNotifications } from '../lib/notifications';

const Navbar = ({ navigate, currentUser }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('home');
  const [isBellOpen, setIsBellOpen] = useState(false);
  const [bellLoading, setBellLoading] = useState(false);
  const [bellError, setBellError] = useState('');
  const [myNotifications, setMyNotifications] = useState([]);
  const bellRef = useRef(null);

  const navLinks = [
    { id: 'home', label: 'Home', icon: 'fas fa-home' },
    { id: 'services', label: 'Services', icon: 'fas fa-stethoscope' },
    { id: 'doctors', label: 'Doctors', icon: 'fas fa-user-md' },
    { id: 'about', label: 'About', icon: 'fas fa-heartbeat' },
    { id: 'contact', label: 'Contact', icon: 'fas fa-phone-alt' },
  ];

  const isAdmin = currentUser?.role === 'ADMIN';

  const loadMyNotifications = async () => {
    if (!currentUser) return;

    setBellLoading(true);
    setBellError('');
    try {
      const response = await fetchNotifications();
      const list = Array.isArray(response?.data) ? response.data : [];
      const email = (currentUser.email || '').toLowerCase();
      const role = (currentUser.role || '').toUpperCase();

      const filtered = list
        .filter((item) => {
          const recipientEmail = (item?.recipientEmail || '').toLowerCase();
          const audienceType = (item?.audienceType || '').toUpperCase();
          return recipientEmail === email || audienceType === role;
        })
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      setMyNotifications(filtered.slice(0, 10));
    } catch (err) {
      setBellError(err.message || 'Failed to load notifications.');
    } finally {
      setBellLoading(false);
    }
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setIsBellOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const scrollToSection = (sectionId) => {
    if (window.location.pathname !== '/') {
      navigate('/');
      window.setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setActiveLink(sectionId);
        }
      }, 120);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      setActiveLink(sectionId);
    }
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    clearStoredUser();
    setIsMenuOpen(false);
    navigate('/');
  };

  const handleBellClick = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const next = !isBellOpen;
    setIsBellOpen(next);
    if (next) {
      await loadMyNotifications();
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between md:h-20">
          <div
            className="flex cursor-pointer items-center space-x-2 group"
            onClick={() => scrollToSection('home')}
          >
            <div className="rounded-xl bg-linear-to-r from-teal-500 to-cyan-600 p-2 shadow-md transition-all group-hover:shadow-lg">
              <i className="fas fa-hospital-user text-xl text-white"></i>
            </div>
            <span className="text-2xl font-extrabold tracking-tight">
              <span className="text-gray-800">Health</span>
              <span className="text-teal-600">Care+</span>
            </span>
          </div>

          <div className="hidden items-center space-x-1 md:flex lg:space-x-2">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  activeLink === link.id
                    ? 'bg-teal-50 text-teal-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-teal-600'
                }`}
              >
                <i className={`${link.icon} text-sm`}></i>
                {link.label}
              </button>
            ))}

            <div className="relative ml-4" ref={bellRef}>
              <button
                type="button"
                onClick={handleBellClick}
                className="relative rounded-full border border-teal-200 px-3 py-2 text-teal-700 transition hover:bg-teal-50"
                aria-label="Open notifications"
              >
                <span className="text-base leading-none" aria-hidden="true">🔔</span>
                {currentUser && myNotifications.length > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-xs font-bold text-white">
                    {myNotifications.length}
                  </span>
                ) : null}
              </button>

              {isBellOpen ? (
                <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-gray-100 bg-white p-3 shadow-xl">
                  <div className="mb-2 flex items-center justify-between px-2">
                    <p className="text-sm font-bold text-gray-800">Notifications</p>
                    <button
                      type="button"
                      onClick={loadMyNotifications}
                      className="text-xs font-semibold text-teal-700 hover:text-teal-900"
                    >
                      Refresh
                    </button>
                  </div>

                  {bellLoading ? <p className="px-2 py-4 text-sm text-gray-500">Loading...</p> : null}
                  {!bellLoading && bellError ? <p className="px-2 py-4 text-sm text-rose-600">{bellError}</p> : null}
                  {!bellLoading && !bellError && myNotifications.length === 0 ? (
                    <p className="px-2 py-4 text-sm text-gray-500">No notifications yet.</p>
                  ) : null}

                  {!bellLoading && !bellError && myNotifications.length > 0 ? (
                    <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                      {myNotifications.map((item) => (
                        <div key={item.id} className="rounded-xl border border-gray-100 p-3">
                          <p className="text-sm font-semibold text-gray-800">{item.subject || 'Notification'}</p>
                          <p className="mt-1 line-clamp-2 text-xs text-gray-600">{item.message}</p>
                          <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
                            <span>{item.channel || 'N/A'}</span>
                            <span>{item.status || 'N/A'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            {currentUser ? (
              <div className="ml-4 flex items-center gap-3">
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={() => navigate('/admin')}
                    className="rounded-full border border-teal-200 px-4 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-50"
                  >
                    Dashboard
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  className="rounded-full bg-teal-100 px-4 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-200"
                >
                  👤 Profile
                </button>
                <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                  {currentUser.name || currentUser.email}
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full bg-red-600 text-white px-4 py-2 text-sm font-semibold transition hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="ml-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="rounded-full border border-teal-200 px-5 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-50"
                >
                  User Login
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="flex items-center gap-2 rounded-full bg-linear-to-r from-teal-600 to-cyan-600 px-5 py-2 text-sm font-semibold text-white shadow-md transition-all hover:scale-105 hover:shadow-lg"
                >
                  <i className="fas fa-user-plus"></i>
                  User Register
                </button>
              </div>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 focus:outline-none"
            >
              <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'} text-2xl`}></i>
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="border-t border-gray-100 bg-white/95 py-4 backdrop-blur-md md:hidden">
            <div className="flex flex-col space-y-2 pb-3">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition ${
                    activeLink === link.id ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <i className={`${link.icon} w-5`}></i>
                  {link.label}
                </button>
              ))}

              <div className="space-y-2 px-4 pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    setIsMenuOpen(false);
                    if (!currentUser) {
                      navigate('/login');
                      return;
                    }
                    await loadMyNotifications();
                    window.alert(`You have ${myNotifications.length} notification(s). Open desktop view for detailed list.`);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-teal-200 py-3 font-semibold text-teal-700"
                >
                  <span aria-hidden="true">🔔</span>
                  Notifications
                </button>

                {currentUser ? (
                  <>
                    {isAdmin ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          navigate('/admin');
                        }}
                        className="w-full rounded-xl border border-teal-200 py-3 font-semibold text-teal-700"
                      >
                        Dashboard
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        navigate('/profile');
                      }}
                      className="w-full rounded-xl bg-teal-100 py-3 font-semibold text-teal-700"
                    >
                      👤 Profile
                    </button>
                    <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700">
                      Signed in as {currentUser.name || currentUser.email}
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full rounded-xl border border-slate-200 py-3 font-semibold text-slate-700"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        navigate('/login');
                      }}
                      className="w-full rounded-xl border border-teal-200 py-3 font-semibold text-teal-700"
                    >
                      User Login
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        navigate('/register');
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-teal-600 to-cyan-600 py-3 font-semibold text-white shadow"
                    >
                      <i className="fas fa-user-plus"></i>
                      User Register
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
