import React, { useState } from 'react';
import { updateUserProfile, storeUser } from '../lib/auth';

const EditProfile = ({ navigate, currentUser }) => {
  const [editFormData, setEditFormData] = useState({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    phoneNumber: currentUser?.phoneNumber || '',
    profilePhoto: currentUser?.profilePhoto || '',
  });
  const [photoPreview, setPhotoPreview] = useState(currentUser?.profilePhoto || null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Image size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
        setEditFormData({ ...editFormData, profilePhoto: reader.result });
        setErrorMessage('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!editFormData.firstName.trim()) {
      setErrorMessage('First name is required');
      return;
    }
    if (!editFormData.lastName.trim()) {
      setErrorMessage('Last name is required');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage('');
      setSuccessMessage('');

      const response = await updateUserProfile(currentUser.userId, {
        firstName: editFormData.firstName || currentUser.firstName,
        lastName: editFormData.lastName || currentUser.lastName,
        phoneNumber: editFormData.phoneNumber || currentUser.phoneNumber,
        profilePhoto: editFormData.profilePhoto || null,
      });

      if (response && response.data) {
        const updatedUser = {
          ...currentUser,
          firstName: editFormData.firstName || currentUser.firstName,
          lastName: editFormData.lastName || currentUser.lastName,
          phoneNumber: editFormData.phoneNumber || currentUser.phoneNumber,
          profilePhoto: editFormData.profilePhoto || currentUser.profilePhoto,
        };
        storeUser(updatedUser);
        setSuccessMessage('Profile updated successfully!');
        
        setTimeout(() => {
          navigate('/');
        }, 1500);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setErrorMessage('Failed to save profile: ' + (error.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  const getInitials = () => {
    if (editFormData.firstName && editFormData.lastName) {
      return `${editFormData.firstName[0]}${editFormData.lastName[0]}`.toUpperCase();
    }
    return 'P';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-stone-100 py-8 px-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Edit Your Profile</h1>
            <p className="mt-2 text-slate-600">Update your personal information and profile photo</p>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-full bg-white p-3 text-slate-600 shadow-md transition hover:bg-slate-50 hover:text-slate-900"
            title="Go back"
          >
            <i className="fas fa-arrow-left text-xl"></i>
          </button>
        </div>

        {/* Messages */}
        {successMessage && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
            <div className="flex items-center gap-3">
              <i className="fas fa-check-circle text-xl"></i>
              <p className="font-semibold">{successMessage}</p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
            <div className="flex items-center gap-3">
              <i className="fas fa-exclamation-circle text-xl"></i>
              <p className="font-semibold">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Main Form Card */}
        <form onSubmit={handleSaveProfile} className="rounded-3xl bg-white p-8 shadow-lg">
          {/* Photo Section */}
          <div className="mb-8 flex flex-col items-center">
            <div className="relative mb-6">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Profile"
                  className="h-32 w-32 rounded-full object-cover border-4 border-teal-500 shadow-lg"
                />
              ) : (
                <div className="h-32 w-32 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center border-4 border-teal-200 shadow-lg">
                  <span className="text-4xl font-black text-teal-700">
                    {getInitials()}
                  </span>
                </div>
              )}
              <label className="absolute bottom-0 right-0 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-full p-3 cursor-pointer hover:from-teal-700 hover:to-cyan-700 transition shadow-lg">
                <i className="fas fa-camera text-white text-lg"></i>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                  disabled={isSaving}
                />
              </label>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700">Profile Photo</p>
              <p className="text-xs text-slate-500 mt-1">JPG, PNG or GIF (max 5MB)</p>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-8">
            {/* First Name */}
            <div className="mb-6">
              <label className="block text-sm font-bold uppercase tracking-widest text-slate-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                value={editFormData.firstName}
                onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition"
                placeholder="Enter your first name"
                disabled={isSaving}
                required
              />
            </div>

            {/* Last Name */}
            <div className="mb-6">
              <label className="block text-sm font-bold uppercase tracking-widest text-slate-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                value={editFormData.lastName}
                onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition"
                placeholder="Enter your last name"
                disabled={isSaving}
                required
              />
            </div>

            {/* Phone Number */}
            <div className="mb-8">
              <label className="block text-sm font-bold uppercase tracking-widest text-slate-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={editFormData.phoneNumber}
                onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition"
                placeholder="Enter your phone number"
                disabled={isSaving}
              />
            </div>

            {/* Email Display (read-only) */}
            <div className="mb-8 rounded-2xl bg-slate-50 p-4 border-2 border-slate-200">
              <label className="block text-sm font-bold uppercase tracking-widest text-slate-600 mb-2">
                Email Address
              </label>
              <p className="text-base font-semibold text-slate-700 break-all">
                {currentUser?.email}
              </p>
              <p className="text-xs text-slate-500 mt-1">Email cannot be changed from this page</p>
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-4 text-base font-bold text-white shadow-lg transition hover:shadow-xl hover:from-teal-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i>
                    Save Changes
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="flex-1 rounded-full bg-slate-300 px-6 py-4 text-base font-bold text-slate-700 shadow transition hover:bg-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-8 rounded-2xl border-2 border-amber-200 bg-amber-50 p-6">
          <div className="flex gap-4">
            <i className="fas fa-info-circle text-2xl text-amber-700 flex-shrink-0 mt-1"></i>
            <div>
              <p className="font-bold text-amber-900">Profile Information</p>
              <p className="text-sm text-amber-800 mt-2">
                Your profile photo will be displayed on your profile and to other users. Make sure to choose a clear, professional image.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
