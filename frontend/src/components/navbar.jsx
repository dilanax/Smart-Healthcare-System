import React, { useState } from 'react';
import { clearStoredUser } from '../lib/auth';

const Navbar = ({ navigate, currentUser }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('home');
  const [showProfileModal, setShowProfileModal] = useState(false);

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

  const handleEditProfile = () => {
    navigate('/edit-profile');
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
