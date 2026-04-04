import React, { useEffect, useMemo, useState } from 'react';
import { clearStoredUser, fetchNotifications, replyToNotification } from '../lib/auth';

const normalizeAudience = (value) => (value || '').trim().toUpperCase();

const doesAudienceMatchRole = (audienceType, role) => {
  const normalizedAudience = normalizeAudience(audienceType);
  const normalizedRole = normalizeAudience(role);

  if (!normalizedAudience || normalizedAudience === 'ALL') return true;
  if (normalizedAudience === normalizedRole) return true;
  if (normalizedAudience === `${normalizedRole}S`) return true;
  if (normalizedRole === 'PATIENT' && normalizedAudience === 'PUBLIC') return true;

  return false;
};

const Navbar = ({ navigate, currentUser }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('home');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [seenNotificationIds, setSeenNotificationIds] = useState([]);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replySubmittingId, setReplySubmittingId] = useState(null);

  const navLinks = [
    { id: 'home', label: 'Home', icon: 'fas fa-home' },
    { id: 'services', label: 'Services', icon: 'fas fa-stethoscope' },
    { id: 'doctors', label: 'Doctors', icon: 'fas fa-user-md' },
    { id: 'about', label: 'About', icon: 'fas fa-heartbeat' },
    { id: 'contact', label: 'Contact', icon: 'fas fa-phone-alt' },
  ];

  const isAdmin = currentUser?.role === 'ADMIN';
  const isDoctor = currentUser?.role === 'DOCTOR';
  const isPatient = currentUser?.role === 'PATIENT';
  const isDashboardUser = isAdmin || isDoctor || isPatient;
  const currentEmail = (currentUser?.email || '').trim().toLowerCase();

  useEffect(() => {
    const loadNotifications = async () => {
      if (!currentUser || !isDashboardUser) {
        setNotifications([]);
        return;
      }

      setNotificationsLoading(true);
      setNotificationsError('');

      try {
        const response = await fetchNotifications();
        const allNotifications = Array.isArray(response?.data) ? response.data : [];
        const visibleNotifications = allNotifications
          .filter((item) => item?.status === 'SENT')
          .filter((item) => doesAudienceMatchRole(item?.audienceType, currentUser?.role))
          .filter((item) => {
            const recipientEmail = (item?.recipientEmail || '').trim().toLowerCase();
            return !recipientEmail || recipientEmail === currentEmail;
          })
          .sort((left, right) => new Date(right?.createdAt || 0) - new Date(left?.createdAt || 0));

        setNotifications(visibleNotifications);
      } catch (loadError) {
        setNotifications([]);
        setNotificationsError(loadError.message || 'Failed to load notifications.');
      } finally {
        setNotificationsLoading(false);
      }
    };

    loadNotifications();
  }, [currentUser, isDashboardUser, currentEmail]);

  useEffect(() => {
    if (showNotificationPanel) {
      setSeenNotificationIds((prev) => {
        const merged = new Set([...prev, ...notifications.map((item) => item.id)]);
        return [...merged];
      });
    }
  }, [showNotificationPanel, notifications]);

  const unreadCount = notifications.filter((item) => !seenNotificationIds.includes(item.id)).length;
  const notificationItems = useMemo(
    () =>
      notifications.map((item) => ({
        id: item.id,
        subject: item.subject || 'Notification',
        message: item.message || '',
        audienceType: item.audienceType || 'ALL',
        replyMessage: item.replyMessage || '',
        repliedByName: item.repliedByName || '',
      })),
    [notifications]
  );

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
    setShowNotificationPanel(false);
    navigate('/');
  };

  const handleEditProfile = () => {
    navigate('/edit-profile');
  };

  const submitReply = async (notificationId) => {
    const draft = (replyDrafts[notificationId] || '').trim();
    if (!draft || !currentUser?.email) return;

    setReplySubmittingId(notificationId);
    setNotificationsError('');

    try {
      const response = await replyToNotification(notificationId, {
        replyMessage: draft,
        repliedByName:
          currentUser?.name ||
          `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() ||
          'Patient',
        repliedByEmail: currentUser.email,
      });

      const updated = response?.data;
      if (updated?.id) {
        setNotifications((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      }
      setReplyDrafts((prev) => ({ ...prev, [notificationId]: '' }));
    } catch (replyError) {
      setNotificationsError(replyError.message || 'Failed to submit reply.');
    } finally {
      setReplySubmittingId(null);
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
            <div className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 p-2 shadow-md transition-all group-hover:shadow-lg">
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

            {currentUser ? (
              <div className="ml-4 flex items-center gap-3">
                {isAdmin ? (
                  <>
                    <button
                      type="button"
                      onClick={() => navigate('/doctor-service')}
                      className="rounded-full border border-cyan-200 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50"
                    >
                      Doctor Service
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/admin')}
                      className="rounded-full border border-teal-200 px-4 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-50"
                    >
                      Dashboard
                    </button>
                  </>
                ) : null}
                {isDoctor ? (
                  <button
                    type="button"
                    onClick={() => navigate('/doctor-dashboard')}
                    className="rounded-full border border-cyan-200 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50"
                  >
                    Doctor Dashboard
                  </button>
                ) : null}
                {isPatient ? (
                  <>
                    <button
                      type="button"
                      onClick={() => navigate('/patient-details')}
                      className="rounded-full border border-cyan-200 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50"
                    >
                      Medical Details
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/patient-dashboard')}
                      className="rounded-full border border-teal-200 px-4 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-50"
                    >
                      Consultations
                    </button>
                  </>
                ) : null}
                <button
                  type="button"
                  onClick={() => setShowNotificationPanel((prev) => !prev)}
                  className="relative flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100 text-cyan-700 transition hover:bg-cyan-200"
                  title="Notifications"
                >
                  <i className="fas fa-bell text-lg"></i>
                  {isDashboardUser && unreadCount > 0 ? (
                    <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-rose-500 px-1 text-center text-[10px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  ) : null}
                </button>
                <button
                  type="button"
                  onClick={() => setShowProfileModal(true)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-teal-700 transition hover:bg-teal-200"
                  title="View profile"
                >
                  <i className="fas fa-user-circle text-lg"></i>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
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
                  className="flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 px-5 py-2 text-sm font-semibold text-white shadow-md transition-all hover:scale-105 hover:shadow-xl"
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
                {currentUser ? (
                  <>
                    {isAdmin ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            navigate('/doctor-service');
                          }}
                          className="w-full rounded-xl border border-cyan-200 py-3 font-semibold text-cyan-700"
                        >
                          Doctor Service
                        </button>
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
                      </>
                    ) : null}
                    {isDoctor ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          navigate('/doctor-dashboard');
                        }}
                        className="w-full rounded-xl border border-cyan-200 py-3 font-semibold text-cyan-700"
                      >
                        Doctor Dashboard
                      </button>
                    ) : null}
                    {isPatient ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            navigate('/patient-details');
                          }}
                          className="w-full rounded-xl border border-cyan-200 py-3 font-semibold text-cyan-700"
                        >
                          Medical Details
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            navigate('/patient-dashboard');
                          }}
                          className="w-full rounded-xl border border-teal-200 py-3 font-semibold text-teal-700"
                        >
                          Consultations
                        </button>
                      </>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        setShowNotificationPanel((prev) => !prev);
                        setIsMenuOpen(false);
                      }}
                      className="w-full rounded-xl border border-cyan-200 py-3 font-semibold text-cyan-700 flex items-center justify-center gap-2"
                    >
                      <i className="fas fa-bell"></i>
                      Notifications
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileModal(true);
                        setIsMenuOpen(false);
                      }}
                      className="w-full rounded-xl border border-teal-200 py-3 font-semibold text-teal-700 flex items-center justify-center gap-2"
                    >
                      <i className="fas fa-user-circle"></i>
                      View Profile
                    </button>
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
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 py-3 font-semibold text-white shadow"
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

        {showNotificationPanel && currentUser ? (
          <div className="absolute right-4 top-[76px] z-50 w-[320px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:right-6 lg:right-8">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-800">Notifications</h3>
              <button
                type="button"
                onClick={() => setShowNotificationPanel(false)}
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                title="Close notifications"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {notificationsLoading ? (
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                  Loading notifications...
                </div>
              ) : null}
              {notificationsError ? (
                <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {notificationsError}
                </div>
              ) : null}
              {notificationItems.length > 0 ? (
                notificationItems.map((item) => (
                  <div key={item.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                    <p className="text-sm font-semibold text-slate-800">{item.subject}</p>
                    <p className="mt-1 text-xs text-slate-600">{item.message}</p>
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-700">
                      {item.audienceType}
                    </p>
                    {isPatient ? (
                      <div className="mt-3 space-y-2">
                        <input
                          type="text"
                          value={replyDrafts[item.id] ?? ''}
                          onChange={(event) =>
                            setReplyDrafts((prev) => ({ ...prev, [item.id]: event.target.value }))
                          }
                          placeholder="Reply to this notification..."
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-teal-500"
                        />
                        <button
                          type="button"
                          onClick={() => submitReply(item.id)}
                          disabled={replySubmittingId === item.id || !(replyDrafts[item.id] || '').trim()}
                          className="rounded-full bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {replySubmittingId === item.id ? 'Sending...' : 'Send Reply'}
                        </button>
                        {item.replyMessage ? (
                          <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                              Your Reply
                            </p>
                            <p className="mt-1 text-xs text-emerald-800">{item.replyMessage}</p>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ))
              ) : !notificationsLoading && !notificationsError ? (
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                  No notifications right now.
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {showProfileModal && currentUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="rounded-3xl bg-white p-8 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-slate-900">My Profile</h2>
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <i className="fas fa-times text-2xl"></i>
                </button>
              </div>

              <div className="space-y-4">
                {/* Photo Display */}
                <div className="flex items-center justify-center mb-6">
                  {currentUser.profilePhoto ? (
                    <img
                      src={currentUser.profilePhoto}
                      alt="Profile"
                      className="h-20 w-20 rounded-full object-cover border-4 border-teal-500"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-teal-100 flex items-center justify-center border-4 border-teal-200">
                      <i className="fas fa-user text-3xl text-teal-700"></i>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Full Name</p>
                  <p className="mt-2 text-lg font-black text-slate-900">
                    {currentUser.firstName && currentUser.lastName
                      ? `${currentUser.firstName} ${currentUser.lastName}`
                      : currentUser.name || 'Not provided'}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Email Address</p>
                  <p className="mt-2 text-lg font-black text-slate-900 break-all">{currentUser.email}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Role</p>
                  <p className="mt-2 text-lg font-black text-slate-900">{currentUser.role}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Phone Number</p>
                  <p className="mt-2 text-lg font-black text-slate-900">
                    {currentUser.phoneNumber || 'Not provided'}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Account Status</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${
                      currentUser.otpVerified
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      <i className={`fas ${currentUser.otpVerified ? 'fa-check-circle' : 'fa-clock'}`}></i>
                      {currentUser.otpVerified ? 'Verified' : 'Pending Verification'}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Account Active</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${
                      currentUser.active
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}>
                      <i className={`fas ${currentUser.active ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>
                      {currentUser.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={handleEditProfile}
                    className="flex-1 rounded-full bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-edit"></i>
                    Edit Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowProfileModal(false)}
                    className="flex-1 rounded-full bg-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-400"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
