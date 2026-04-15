import React, { useState } from 'react';
import { clearStoredUser } from '../lib/auth';

const Navbar = ({ navigate, currentUser }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('home');

  const navLinks = [
    { id: 'home', label: 'Home', icon: 'fas fa-home' },
    { id: 'services', label: 'Services', icon: 'fas fa-stethoscope' },
    { id: 'doctors', label: 'Doctors', icon: 'fas fa-user-md' },
    { id: 'about', label: 'About', icon: 'fas fa-heartbeat' },
    { id: 'contact', label: 'Contact', icon: 'fas fa-phone-alt' },
  ];

  const isAdmin = currentUser?.role === 'ADMIN';

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
