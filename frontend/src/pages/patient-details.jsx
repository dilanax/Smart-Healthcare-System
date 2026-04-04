import React, { useState, useEffect } from 'react';
import { getPatientDetails, updatePatientDetails } from '../lib/auth';

const PatientDetails = ({ navigate, currentUser }) => {
  const [details, setDetails] = useState({
    dateOfBirth: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactPhone: '',
    bloodType: '',
    height: '',
    weight: '',
    allergies: '',
    chronicDiseases: '',
    previousSurgeries: '',
    currentMedications: '',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadPatientDetails = async () => {
      try {
        setLoading(true);
        const response = await getPatientDetails(currentUser?.email);
        if (response?.data) {
          setDetails(response.data);
        }
      } catch (error) {
        console.error('Error loading patient details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.email) {
      loadPatientDetails();
    }
  }, [currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDetails({ ...details, [name]: value });
    setErrorMessage('');
  };

  const handleSave = async () => {
    try {
      setErrorMessage('');
      setSuccessMessage('');
      setIsSaving(true);

      const response = await updatePatientDetails(currentUser?.email, details);
      if (response?.data) {
        setDetails(response.data);
        setIsEditing(false);
        setSuccessMessage('Patient details updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error saving patient details:', error);
      setErrorMessage('Failed to save details: ' + (error.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-stone-100 py-8 px-4">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900">My Medical Details</h1>
            <p className="mt-2 text-slate-600">Manage your personal and medical information</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/')}
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

        {loading ? (
          <div className="text-center py-12">
            <i className="fas fa-spinner fa-spin text-4xl text-teal-600"></i>
            <p className="mt-4 text-slate-600">Loading your details...</p>
          </div>
        ) : (
          <>
            {/* Personal Information Card */}
            <div className="mb-6 rounded-3xl bg-white p-8 shadow-lg">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <i className="fas fa-user-circle text-teal-600"></i>
                  Personal Information
                </h2>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="rounded-full bg-teal-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 flex items-center gap-2"
                  >
                    <i className="fas fa-edit"></i>
                    Edit
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-slate-700 mb-2">
                    Date of Birth
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={details.dateOfBirth || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                      disabled={isSaving}
                    />
                  ) : (
                    <p className="text-slate-700 py-3 font-semibold">
                      {details.dateOfBirth
                        ? new Date(details.dateOfBirth).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : 'Not provided'}
                    </p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-slate-700 mb-2">
                    Gender
                  </label>
                  {isEditing ? (
                    <select
                      name="gender"
                      value={details.gender || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                      disabled={isSaving}
                    >
                      <option value="">Select Gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  ) : (
                    <p className="text-slate-700 py-3 font-semibold">{details.gender || 'Not provided'}</p>
                  )}
                </div>

                {/* Height */}
                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-slate-700 mb-2">
                    Height (cm)
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      name="height"
                      value={details.height || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                      placeholder="Enter height"
                      disabled={isSaving}
                    />
                  ) : (
                    <p className="text-slate-700 py-3 font-semibold">{details.height ? `${details.height} cm` : 'Not provided'}</p>
                  )}
                </div>

                {/* Weight */}
                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-slate-700 mb-2">
                    Weight (kg)
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      name="weight"
                      value={details.weight || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                      placeholder="Enter weight"
                      disabled={isSaving}
                    />
                  ) : (
                    <p className="text-slate-700 py-3 font-semibold">{details.weight ? `${details.weight} kg` : 'Not provided'}</p>
                  )}
                </div>

                {/* Blood Type */}
                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-slate-700 mb-2">
                    Blood Type
                  </label>
                  {isEditing ? (
                    <select
                      name="bloodType"
                      value={details.bloodType || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                      disabled={isSaving}
                    >
                      <option value="">Select Blood Type</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  ) : (
                    <p className="text-slate-700 py-3 font-semibold">{details.bloodType || 'Not provided'}</p>
                  )}
                </div>

                {/* Email (read-only) */}
                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-slate-700 mb-2">
                    Email Address
                  </label>
                  <p className="text-slate-700 py-3 font-semibold">{currentUser?.email}</p>
                </div>
              </div>
            </div>

            {/* Address Information Card */}
            <div className="mb-6 rounded-3xl bg-white p-8 shadow-lg">
              <h2 className="mb-6 text-2xl font-black text-slate-900 flex items-center gap-2">
                <i className="fas fa-map-location-dot text-teal-600"></i>
                Address Information
              </h2>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold uppercase tracking-widest text-slate-700 mb-2">
                    Street Address
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="address"
                      value={details.address || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                      placeholder="Enter street address"
                      disabled={isSaving}
                    />
                  ) : (
                    <p className="text-slate-700 py-3 font-semibold">{details.address || 'Not provided'}</p>
                  )}
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-slate-700 mb-2">
                    City
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="city"
                      value={details.city || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                      placeholder="Enter city"
                      disabled={isSaving}
                    />
                  ) : (
                    <p className="text-slate-700 py-3 font-semibold">{details.city || 'Not provided'}</p>
                  )}
                </div>

                {/* State */}
                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-slate-700 mb-2">
                    State
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="state"
                      value={details.state || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                      placeholder="Enter state"
                      disabled={isSaving}
                    />
                  ) : (
                    <p className="text-slate-700 py-3 font-semibold">{details.state || 'Not provided'}</p>
                  )}
                </div>

                {/* Zip Code */}
                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-slate-700 mb-2">
                    Zip Code
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="zipCode"
                      value={details.zipCode || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                      placeholder="Enter zip code"
                      disabled={isSaving}
                    />
                  ) : (
                    <p className="text-slate-700 py-3 font-semibold">{details.zipCode || 'Not provided'}</p>
                  )}
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-slate-700 mb-2">
                    Country
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="country"
                      value={details.country || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                      placeholder="Enter country"
                      disabled={isSaving}
                    />
                  ) : (
                    <p className="text-slate-700 py-3 font-semibold">{details.country || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Emergency Contact Card */}
            <div className="mb-6 rounded-3xl bg-white p-8 shadow-lg">
              <h2 className="mb-6 text-2xl font-black text-slate-900 flex items-center gap-2">
                <i className="fas fa-phone text-teal-600"></i>
                Emergency Contact
              </h2>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Emergency Contact Name */}
                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-slate-700 mb-2">
                    Contact Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="emergencyContactName"
                      value={details.emergencyContactName || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                      placeholder="Enter emergency contact name"
                      disabled={isSaving}
                    />
                  ) : (
                    <p className="text-slate-700 py-3 font-semibold">{details.emergencyContactName || 'Not provided'}</p>
                  )}
                </div>

                {/* Emergency Contact Relationship */}
                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-slate-700 mb-2">
                    Relationship
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="emergencyContactRelationship"
                      value={details.emergencyContactRelationship || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                      placeholder="e.g., Parent, Spouse, Sibling"
                      disabled={isSaving}
                    />
                  ) : (
                    <p className="text-slate-700 py-3 font-semibold">{details.emergencyContactRelationship || 'Not provided'}</p>
                  )}
                </div>

                {/* Emergency Contact Phone */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold uppercase tracking-widest text-slate-700 mb-2">
                    Phone Number
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="emergencyContactPhone"
                      value={details.emergencyContactPhone || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                      placeholder="Enter emergency contact phone"
                      disabled={isSaving}
                    />
                  ) : (
                    <p className="text-slate-700 py-3 font-semibold">{details.emergencyContactPhone || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Medical Information Card */}
            <div className="mb-6 rounded-3xl bg-white p-8 shadow-lg">
              <h2 className="mb-6 text-2xl font-black text-slate-900 flex items-center gap-2">
                <i className="fas fa-heartbeat text-teal-600"></i>
                Medical Information
              </h2>

              <div className="grid grid-cols-1 gap-6">
                {/* Allergies */}
                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-slate-700 mb-2">
                    Allergies
                  </label>
                  {isEditing ? (
                    <textarea
                      name="allergies"
                      value={details.allergies || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                      placeholder="List any allergies (e.g., Penicillin, Peanuts)"
                      rows="3"
                      disabled={isSaving}
                    />
                  ) : (
                    <p className="text-slate-700 py-3 font-semibold whitespace-pre-wrap">{details.allergies || 'Not provided'}</p>
                  )}
                </div>

                {/* Chronic Diseases */}
                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-slate-700 mb-2">
                    Chronic Diseases
                  </label>
                  {isEditing ? (
                    <textarea
                      name="chronicDiseases"
                      value={details.chronicDiseases || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                      placeholder="List any chronic diseases or conditions"
                      rows="3"
                      disabled={isSaving}
                    />
                  ) : (
                    <p className="text-slate-700 py-3 font-semibold whitespace-pre-wrap">{details.chronicDiseases || 'Not provided'}</p>
                  )}
                </div>

                {/* Previous Surgeries */}
                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-slate-700 mb-2">
                    Previous Surgeries
                  </label>
                  {isEditing ? (
                    <textarea
                      name="previousSurgeries"
                      value={details.previousSurgeries || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                      placeholder="List any previous surgeries with dates"
                      rows="3"
                      disabled={isSaving}
                    />
                  ) : (
                    <p className="text-slate-700 py-3 font-semibold whitespace-pre-wrap">{details.previousSurgeries || 'Not provided'}</p>
                  )}
                </div>

                {/* Current Medications */}
                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-slate-700 mb-2">
                    Current Medications
                  </label>
                  {isEditing ? (
                    <textarea
                      name="currentMedications"
                      value={details.currentMedications || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                      placeholder="List current medications and dosages"
                      rows="3"
                      disabled={isSaving}
                    />
                  ) : (
                    <p className="text-slate-700 py-3 font-semibold whitespace-pre-wrap">{details.currentMedications || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex gap-4 mb-6">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-4 text-base font-bold text-white shadow-lg transition hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i>
                      Save Details
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="flex-1 rounded-full bg-slate-300 px-6 py-4 text-base font-bold text-slate-700 shadow transition hover:bg-slate-400 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Info Box */}
            <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-6">
              <div className="flex gap-4">
                <i className="fas fa-info-circle text-2xl text-blue-700 shrink-0 mt-1"></i>
                <div>
                  <p className="font-bold text-blue-900">Keep Your Information Updated</p>
                  <p className="text-sm text-blue-800 mt-2">
                    Your medical information helps healthcare providers understand your health better. Update this information whenever it changes to ensure the best care.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PatientDetails;
