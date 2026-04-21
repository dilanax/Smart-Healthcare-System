import React, { useEffect, useRef, useState } from 'react';
import { clearStoredUser } from '../lib/auth';
import { fetchNotifications, updateNotificationReadStatus } from '../lib/notifications';

const formatNotificationDate = (value) => {
  if (!value) return 'Just now';
  try {
    return new Intl.DateTimeFormat('en-LK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return 'Just now';
  }
};

const getNotificationBadgeClass = (status) => {
  if (status === 'SENT') return 'bg-emerald-100 text-emerald-700';
  if (status === 'FAILED') return 'bg-rose-100 text-rose-700';
  if (status === 'CANCELLED') return 'bg-slate-200 text-slate-700';
  return 'bg-amber-100 text-amber-700';
};

const formatCategoryLabel = (value) => {
  if (!value) return 'General';
  return value
    .toLowerCase()
    .split('_')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
};

const readFilters = ['ALL', 'UNREAD', 'READ'];

const Navbar = ({ navigate, currentUser }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('home');
  const [isBellOpen, setIsBellOpen] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedReadFilter, setSelectedReadFilter] = useState('ALL');
  const [bellLoading, setBellLoading] = useState(false);
  const [bellError, setBellError] = useState('');
  const [myNotifications, setMyNotifications] = useState([]);
  const [updatingReadId, setUpdatingReadId] = useState(null);
  const bellRef = useRef(null);

  const navLinks = [
    { id: 'home', label: 'Home', icon: 'fas fa-home' },
    { id: 'services', label: 'Services', icon: 'fas fa-stethoscope' },
    { id: 'doctors', label: 'Doctors', icon: 'fas fa-user-md' },
    { id: 'about', label: 'About', icon: 'fas fa-heartbeat' },
    { id: 'contact', label: 'Contact', icon: 'fas fa-phone-alt' },
  ];

  const isAdmin = currentUser?.role === 'ADMIN';
  const notificationCategories = [
    'ALL',
    ...Array.from(
      new Set(
        myNotifications
          .map((item) => (item?.relatedService || 'GENERAL').toUpperCase())
          .filter(Boolean),
      ),
    ),
  ];
  const unreadNotificationsCount = myNotifications.filter((item) => !item?.read).length;
  const filteredByReadStatus = selectedReadFilter === 'ALL'
    ? myNotifications
    : myNotifications.filter((item) => (selectedReadFilter === 'READ' ? Boolean(item?.read) : !item?.read));
  const filteredNotifications = selectedCategory === 'ALL'
    ? filteredByReadStatus
    : filteredByReadStatus.filter((item) => (item?.relatedService || 'GENERAL').toUpperCase() === selectedCategory);

  const getFilteredNotifications = (list) => {
    const email = (currentUser?.email || '').toLowerCase();
    const role = (currentUser?.role || '').toUpperCase();

    return list
      .filter((item) => {
        const recipientEmail = (item?.recipientEmail || '').toLowerCase();
        const audienceType = (item?.audienceType || '').toUpperCase();
        return recipientEmail === email || audienceType === role;
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  };

  const loadMyNotifications = async () => {
    if (!currentUser) return;

    setBellLoading(true);
    setBellError('');
    try {
      const response = await fetchNotifications();
      const list = Array.isArray(response?.data) ? response.data : [];
      setMyNotifications(getFilteredNotifications(list));
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

  const openAllNotifications = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    setSelectedCategory('ALL');
    setSelectedReadFilter('ALL');
    setShowAllNotifications(true);
    setIsBellOpen(false);
    await loadMyNotifications();
  };

  const toggleNotificationReadState = async (notificationId, read) => {
    setUpdatingReadId(notificationId);
    setBellError('');
    try {
      const response = await updateNotificationReadStatus(notificationId, read);
      const updatedNotification = response?.data;
      if (updatedNotification?.id) {
        setMyNotifications((prev) => prev.map((item) => (item.id === updatedNotification.id ? updatedNotification : item)));
      } else {
        setMyNotifications((prev) => prev.map((item) => (
          item.id === notificationId
            ? { ...item, read, readAt: read ? new Date().toISOString() : null }
            : item
        )));
      }
    } catch (err) {
      setBellError(err.message || 'Failed to update notification read state.');
    } finally {
      setUpdatingReadId(null);
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between md:h-20">
            <div
              className="group flex cursor-pointer items-center space-x-2"
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
                  {currentUser && unreadNotificationsCount > 0 ? (
                    <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-xs font-bold text-white">
                      {unreadNotificationsCount}
                    </span>
                  ) : null}
                </button>

                {isBellOpen ? (
                  <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-gray-100 bg-white p-3 shadow-xl">
                    <div className="mb-2 flex items-center justify-between px-2">
                      <p className="text-sm font-bold text-gray-800">Notifications</p>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={loadMyNotifications}
                          className="text-xs font-semibold text-teal-700 hover:text-teal-900"
                        >
                          Refresh
                        </button>
                        <button
                          type="button"
                          onClick={openAllNotifications}
                          className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                        >
                          View All
                        </button>
                      </div>
                    </div>

                    {bellLoading ? <p className="px-2 py-4 text-sm text-gray-500">Loading...</p> : null}
                    {!bellLoading && bellError ? <p className="px-2 py-4 text-sm text-rose-600">{bellError}</p> : null}
                    {!bellLoading && !bellError && myNotifications.length === 0 ? (
                      <p className="px-2 py-4 text-sm text-gray-500">No notifications yet.</p>
                    ) : null}

                    {!bellLoading && !bellError && myNotifications.length > 0 ? (
                      <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                        {myNotifications.slice(0, 10).map((item) => (
                          <div key={item.id} className={`rounded-xl border p-3 ${item.read ? 'border-gray-100 bg-white' : 'border-teal-200 bg-teal-50/40'}`}>
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm font-semibold text-gray-800">{item.subject || 'Notification'}</p>
                              {!item.read ? <span className="rounded-full bg-teal-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Unread</span> : null}
                            </div>
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
                    Profile
                  </button>
                  <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                    {currentUser.name || currentUser.email}
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
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
                      await openAllNotifications();
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
                        Profile
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

      {showAllNotifications ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" onClick={() => setShowAllNotifications(false)}>
          <div className="max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="border-b border-gray-100 bg-gradient-to-r from-teal-900 via-teal-800 to-cyan-800 px-6 py-5 text-white">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-100">Notification Center</p>
                  <h3 className="mt-2 text-2xl font-bold">All Notifications</h3>
                  <p className="mt-1 text-sm text-teal-50/90">See every notification sent to your account and audience.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={loadMyNotifications}
                    className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                  >
                    Refresh
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAllNotifications(false)}
                    className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>

            <div className="border-b border-gray-100 bg-slate-50 px-6 py-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Total</p>
                  <p className="mt-1 text-2xl font-bold text-gray-800">{myNotifications.length}</p>
                </div>
                <div className="rounded-2xl bg-cyan-50 px-4 py-3 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-cyan-700">Unread</p>
                  <p className="mt-1 text-2xl font-bold text-cyan-700">{unreadNotificationsCount}</p>
                </div>
                <div className="rounded-2xl bg-amber-50 px-4 py-3 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-amber-700">Queued</p>
                  <p className="mt-1 text-2xl font-bold text-amber-700">{myNotifications.filter((item) => item.status === 'QUEUED').length}</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 px-4 py-3 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-emerald-700">Sent</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-700">{myNotifications.filter((item) => item.status === 'SENT').length}</p>
                </div>
                <div className="rounded-2xl bg-rose-50 px-4 py-3 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-rose-700">Failed</p>
                  <p className="mt-1 text-2xl font-bold text-rose-700">{myNotifications.filter((item) => item.status === 'FAILED').length}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Status</span>
                {readFilters.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setSelectedReadFilter(filter)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      selectedReadFilter === filter
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'border border-gray-200 bg-white text-gray-600 hover:border-slate-300 hover:text-slate-900'
                    }`}
                  >
                    {formatCategoryLabel(filter)}
                    <span className="ml-2 text-xs opacity-80">
                      {filter === 'ALL'
                        ? myNotifications.length
                        : filter === 'UNREAD'
                          ? unreadNotificationsCount
                          : myNotifications.filter((item) => Boolean(item?.read)).length}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Categories</span>
                {notificationCategories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      selectedCategory === category
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'border border-gray-200 bg-white text-gray-600 hover:border-teal-200 hover:text-teal-700'
                    }`}
                  >
                    {formatCategoryLabel(category)}
                    <span className="ml-2 text-xs opacity-80">
                      {category === 'ALL'
                        ? filteredByReadStatus.length
                        : filteredByReadStatus.filter((item) => (item?.relatedService || 'GENERAL').toUpperCase() === category).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-[calc(85vh-220px)] overflow-y-auto px-6 py-5">
              {bellLoading ? <p className="py-8 text-center text-sm text-gray-500">Loading notifications...</p> : null}
              {!bellLoading && bellError ? <p className="py-8 text-center text-sm text-rose-600">{bellError}</p> : null}
              {!bellLoading && !bellError && filteredNotifications.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-slate-50 px-6 py-12 text-center">
                  <p className="text-lg font-semibold text-gray-700">
                    {myNotifications.length === 0 ? 'No notifications yet' : 'No notifications in this category'}
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    {myNotifications.length === 0
                      ? 'When appointments, updates, or admin messages arrive, they will appear here.'
                      : 'Try another category to see more notifications.'}
                  </p>
                </div>
              ) : null}

              {!bellLoading && !bellError && filteredNotifications.length > 0 ? (
                <div className="space-y-4">
                  {filteredNotifications.map((item) => (
                    <article key={item.id} className={`rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${item.read ? 'border-gray-100 bg-white' : 'border-teal-200 bg-teal-50/30'}`}>
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-lg font-bold text-gray-800">{item.subject || 'Notification'}</h4>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getNotificationBadgeClass(item.status)}`}>
                              {item.status || 'QUEUED'}
                            </span>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.read ? 'bg-slate-200 text-slate-700' : 'bg-teal-600 text-white'}`}>
                              {item.read ? 'Read' : 'Unread'}
                            </span>
                          </div>
                          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-600">{item.message || 'No message available.'}</p>
                          <div className="mt-4 flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() => toggleNotificationReadState(item.id, !item.read)}
                              disabled={updatingReadId === item.id}
                              className={`rounded-full px-4 py-2 text-xs font-semibold transition disabled:opacity-50 ${item.read ? 'bg-slate-900 text-white hover:bg-slate-700' : 'bg-teal-600 text-white hover:bg-teal-700'}`}
                            >
                              {updatingReadId === item.id ? 'Updating...' : item.read ? 'Mark as Unread' : 'Mark as Read'}
                            </button>
                          </div>
                        </div>

                        <div className="grid min-w-[220px] grid-cols-2 gap-3 md:grid-cols-1">
                          <div className="rounded-xl bg-slate-50 px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Channel</p>
                            <p className="mt-1 text-sm font-semibold text-teal-700">{item.channel || 'N/A'}</p>
                          </div>
                          <div className="rounded-xl bg-slate-50 px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Received</p>
                            <p className="mt-1 text-sm font-semibold text-gray-700">{formatNotificationDate(item.createdAt || item.sentAt)}</p>
                          </div>
                          <div className="rounded-xl bg-slate-50 px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Audience</p>
                            <p className="mt-1 text-sm font-semibold text-gray-700">{item.audienceType || 'GENERAL'}</p>
                          </div>
                          <div className="rounded-xl bg-slate-50 px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Service</p>
                            <p className="mt-1 text-sm font-semibold text-gray-700">{item.relatedService || 'GENERAL'}</p>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default Navbar;
