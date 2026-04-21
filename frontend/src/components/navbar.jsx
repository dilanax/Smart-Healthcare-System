import React, { useEffect, useRef, useState } from 'react';
import { HiBars3, HiOutlineBell, HiXMark } from 'react-icons/hi2';
import logoImage from '../assets/Logo.jpg';
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
  const displayName = currentUser?.name || currentUser?.email || 'User';
  const initials = displayName.trim().charAt(0).toUpperCase();

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
  const filteredByReadStatus =
    selectedReadFilter === 'ALL'
      ? myNotifications
      : myNotifications.filter((item) =>
          selectedReadFilter === 'READ' ? Boolean(item?.read) : !item?.read,
        );
  const filteredNotifications =
    selectedCategory === 'ALL'
      ? filteredByReadStatus
      : filteredByReadStatus.filter(
          (item) => (item?.relatedService || 'GENERAL').toUpperCase() === selectedCategory,
        );

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
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    if (next) await loadMyNotifications();
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
        setMyNotifications((prev) =>
          prev.map((item) => (item.id === updatedNotification.id ? updatedNotification : item)),
        );
      } else {
        setMyNotifications((prev) =>
          prev.map((item) =>
            item.id === notificationId
              ? { ...item, read, readAt: read ? new Date().toISOString() : null }
              : item,
          ),
        );
      }
    } catch (err) {
      setBellError(err.message || 'Failed to update notification read state.');
    } finally {
      setUpdatingReadId(null);
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[26px] border border-slate-200/80 bg-white/92 px-4 py-3 shadow-[0_20px_60px_-32px_rgba(15,23,42,0.4)] backdrop-blur-xl sm:px-6">
          <div className="flex min-h-[56px] items-center justify-between gap-3">
            <div
              className="group flex cursor-pointer items-center gap-3"
              onClick={() => scrollToSection('home')}
            >
              <div className="h-12 w-12 overflow-hidden rounded-2xl shadow-[0_16px_34px_-18px_rgba(6,182,212,0.45)] transition-transform duration-200 group-hover:scale-105">
                <img
                  src={logoImage}
                  alt="HealthCare+ logo"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="leading-tight">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                  Trusted Care
                </p>
                <p className="text-[1.35rem] font-semibold tracking-tight text-slate-900">
                  Health<span className="text-teal-600">Care+</span>
                </p>
              </div>
            </div>

            <div className="hidden items-center lg:flex">
              <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1 shadow-inner shadow-slate-200/70">
                {navLinks.map((link) => (
                  <button
                    key={link.id}
                    type="button"
                    onClick={() => scrollToSection(link.id)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                      activeLink === link.id
                        ? 'bg-white text-slate-900 shadow-sm shadow-slate-300/50'
                        : 'text-slate-500 hover:bg-white hover:text-slate-900'
                    }`}
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="hidden items-center gap-2 lg:flex">
              <div className="relative" ref={bellRef}>
                <button
                  type="button"
                  onClick={handleBellClick}
                  className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
                  aria-label="Open notifications"
                >
                  <HiOutlineBell className="text-[18px]" aria-hidden="true" />
                  {currentUser && unreadNotificationsCount > 0 && (
                    <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </button>

                {isBellOpen && (
                  <div className="absolute right-0 z-50 mt-3 w-80 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl ring-1 ring-slate-100">
                    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-4 py-3.5">
                      <p className="text-sm font-bold text-white">Notifications</p>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={loadMyNotifications}
                          className="text-xs font-semibold text-slate-300 hover:text-white"
                        >
                          Refresh
                        </button>
                        <button
                          type="button"
                          onClick={openAllNotifications}
                          className="text-xs font-semibold text-teal-300 hover:text-teal-200"
                        >
                          View All
                        </button>
                      </div>
                    </div>

                    <div className="p-3">
                      {bellLoading && (
                        <p className="py-4 text-center text-sm text-slate-500">Loading...</p>
                      )}
                      {!bellLoading && bellError && (
                        <p className="py-4 text-center text-sm text-rose-600">{bellError}</p>
                      )}
                      {!bellLoading && !bellError && myNotifications.length === 0 && (
                        <p className="py-4 text-center text-sm text-slate-500">
                          No notifications yet.
                        </p>
                      )}
                      {!bellLoading && !bellError && myNotifications.length > 0 && (
                        <div className="max-h-72 space-y-2 overflow-y-auto pr-0.5">
                          {myNotifications.slice(0, 10).map((item) => (
                            <div
                              key={item.id}
                              className={`rounded-2xl border p-3 transition ${
                                item.read
                                  ? 'border-slate-100 bg-white'
                                  : 'border-teal-200 bg-teal-50/60'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="leading-tight text-sm font-semibold text-slate-800">
                                  {item.subject || 'Notification'}
                                </p>
                                {!item.read && (
                                  <span className="shrink-0 rounded-full bg-teal-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                                    New
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                                {item.message}
                              </p>
                              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                                <span>{item.channel || 'N/A'}</span>
                                <span>{item.status || 'N/A'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {currentUser ? (
                <>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => navigate('/admin')}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
                    >
                      Dashboard
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate('/profile')}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-left transition hover:border-teal-200 hover:bg-teal-50/70"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                      {initials}
                    </div>
                    <div className="max-w-[180px]">
                      <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
                      <p className="truncate text-xs text-slate-500">{currentUser.email}</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/register')}
                    className="flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                  >
                    <i className="fas fa-user-plus text-xs"></i>
                    Register
                  </button>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 lg:hidden"
            >
              {isMenuOpen ? <HiXMark className="text-[22px]" /> : <HiBars3 className="text-[22px]" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="mx-auto mt-3 max-w-7xl overflow-hidden rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_24px_70px_-30px_rgba(15,23,42,0.35)] ring-1 ring-slate-100 lg:hidden">
            <div className="flex flex-col gap-1.5">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => scrollToSection(link.id)}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    activeLink === link.id
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <i className={`${link.icon} w-4`}></i>
                  {link.label}
                </button>
              ))}

              <div className="mt-2 flex flex-col gap-2 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={async () => {
                    setIsMenuOpen(false);
                    await openAllNotifications();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 py-3 text-sm font-semibold text-slate-700"
                >
                  <HiOutlineBell className="text-[18px]" aria-hidden="true" />
                  Notifications
                  {currentUser && unreadNotificationsCount > 0 && (
                    <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </button>

                {currentUser ? (
                  <>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          navigate('/admin');
                        }}
                        className="w-full rounded-2xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700"
                      >
                        Dashboard
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        navigate('/profile');
                      }}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-700"
                    >
                      <span className="block font-semibold text-slate-900">{displayName}</span>
                      <span className="block truncate text-xs text-slate-500">{currentUser.email}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full rounded-2xl bg-slate-900 py-3 text-sm font-semibold text-white"
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
                      className="w-full rounded-2xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700"
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        navigate('/register');
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3 text-sm font-semibold text-white shadow-sm"
                    >
                      <i className="fas fa-user-plus text-xs"></i>
                      Register
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      <div className="h-24" />

      {showAllNotifications && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={() => setShowAllNotifications(false)}
        >
          <div
            className="max-h-[88vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-white/10 bg-gradient-to-r from-teal-800 via-teal-700 to-cyan-700 px-6 py-5 text-white">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-teal-200">
                    Notification Center
                  </p>
                  <h3 className="mt-1.5 text-2xl font-bold">All Notifications</h3>
                  <p className="mt-1 text-sm text-teal-100/80">
                    Every notification sent to your account and audience.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={loadMyNotifications}
                    className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                  >
                    Refresh
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAllNotifications(false)}
                    className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>

            <div className="border-b border-gray-100 bg-slate-50 px-6 py-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {[
                  { label: 'Total', value: myNotifications.length, cls: 'bg-white text-gray-800' },
                  {
                    label: 'Unread',
                    value: unreadNotificationsCount,
                    cls: 'bg-cyan-50 text-cyan-700',
                  },
                  {
                    label: 'Queued',
                    value: myNotifications.filter((n) => n.status === 'QUEUED').length,
                    cls: 'bg-amber-50 text-amber-700',
                  },
                  {
                    label: 'Sent',
                    value: myNotifications.filter((n) => n.status === 'SENT').length,
                    cls: 'bg-emerald-50 text-emerald-700',
                  },
                  {
                    label: 'Failed',
                    value: myNotifications.filter((n) => n.status === 'FAILED').length,
                    cls: 'bg-rose-50 text-rose-700',
                  },
                ].map(({ label, value, cls }) => (
                  <div key={label} className={`rounded-2xl px-4 py-3 shadow-sm ${cls}`}>
                    <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
                      {label}
                    </p>
                    <p className="mt-1 text-2xl font-bold">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Status
                </span>
                {readFilters.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setSelectedReadFilter(filter)}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                      selectedReadFilter === filter
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'border border-gray-200 bg-white text-gray-600 hover:border-slate-300 hover:text-slate-800'
                    }`}
                  >
                    {formatCategoryLabel(filter)}{' '}
                    <span className="opacity-60">
                      {filter === 'ALL'
                        ? myNotifications.length
                        : filter === 'UNREAD'
                          ? unreadNotificationsCount
                          : myNotifications.filter((n) => Boolean(n?.read)).length}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Category
                </span>
                {notificationCategories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                      selectedCategory === category
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'border border-gray-200 bg-white text-gray-600 hover:border-teal-200 hover:text-teal-700'
                    }`}
                  >
                    {formatCategoryLabel(category)}{' '}
                    <span className="opacity-60">
                      {category === 'ALL'
                        ? filteredByReadStatus.length
                        : filteredByReadStatus.filter(
                            (n) => (n?.relatedService || 'GENERAL').toUpperCase() === category,
                          ).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-[calc(88vh-260px)] overflow-y-auto px-6 py-5">
              {bellLoading && (
                <p className="py-8 text-center text-sm text-gray-400">Loading notifications...</p>
              )}
              {!bellLoading && bellError && (
                <p className="py-8 text-center text-sm text-rose-600">{bellError}</p>
              )}
              {!bellLoading && !bellError && filteredNotifications.length === 0 && (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-slate-50 px-6 py-12 text-center">
                  <p className="text-base font-semibold text-gray-600">
                    {myNotifications.length === 0
                      ? 'No notifications yet'
                      : 'No notifications in this category'}
                  </p>
                  <p className="mt-2 text-sm text-gray-400">
                    {myNotifications.length === 0
                      ? 'Appointments, updates, and messages will appear here.'
                      : 'Try another category to see more.'}
                  </p>
                </div>
              )}

              {!bellLoading && !bellError && filteredNotifications.length > 0 && (
                <div className="space-y-3">
                  {filteredNotifications.map((item) => (
                    <article
                      key={item.id}
                      className={`rounded-2xl border p-5 transition hover:shadow-md ${
                        item.read ? 'border-gray-100 bg-white' : 'border-teal-200 bg-teal-50/40'
                      }`}
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-base font-bold text-gray-800">
                              {item.subject || 'Notification'}
                            </h4>
                            <span
                              className={`rounded-full px-3 py-0.5 text-xs font-semibold ${getNotificationBadgeClass(item.status)}`}
                            >
                              {item.status || 'QUEUED'}
                            </span>
                            <span
                              className={`rounded-full px-3 py-0.5 text-xs font-semibold ${
                                item.read
                                  ? 'bg-slate-100 text-slate-600'
                                  : 'bg-teal-600 text-white'
                              }`}
                            >
                              {item.read ? 'Read' : 'Unread'}
                            </span>
                          </div>
                          <p className="mt-2.5 whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
                            {item.message || 'No message available.'}
                          </p>
                          <div className="mt-3">
                            <button
                              type="button"
                              onClick={() => toggleNotificationReadState(item.id, !item.read)}
                              disabled={updatingReadId === item.id}
                              className={`rounded-xl px-4 py-2 text-xs font-semibold transition disabled:opacity-50 ${
                                item.read
                                  ? 'bg-slate-800 text-white hover:bg-slate-700'
                                  : 'bg-teal-600 text-white hover:bg-teal-700'
                              }`}
                            >
                              {updatingReadId === item.id
                                ? 'Updating...'
                                : item.read
                                  ? 'Mark as Unread'
                                  : 'Mark as Read'}
                            </button>
                          </div>
                        </div>

                        <div className="grid min-w-[200px] grid-cols-2 gap-2 md:grid-cols-1">
                          {[
                            {
                              label: 'Channel',
                              value: item.channel || 'N/A',
                              color: 'text-teal-700',
                            },
                            {
                              label: 'Received',
                              value: formatNotificationDate(item.createdAt || item.sentAt),
                              color: 'text-gray-700',
                            },
                            {
                              label: 'Audience',
                              value: item.audienceType || 'GENERAL',
                              color: 'text-gray-700',
                            },
                            {
                              label: 'Service',
                              value: item.relatedService || 'GENERAL',
                              color: 'text-gray-700',
                            },
                          ].map(({ label, value, color }) => (
                            <div key={label} className="rounded-xl bg-slate-50 px-3 py-2.5">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                                {label}
                              </p>
                              <p className={`mt-0.5 text-xs font-semibold ${color}`}>{value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
