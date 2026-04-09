import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../lib/axios';
import { toast } from 'react-hot-toast';

const UploadModal = ({ isOpen, onClose, patientId, onUploadSuccess }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) return toast.error("Please select a file first");

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            // Using the RESTful path you verified in Postman
            await API.post(`/patients/${patientId}/reports`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProgress(percentCompleted);
                }
            });

            toast.success("Report uploaded successfully!");
            onUploadSuccess(); // Refresh the list
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setUploading(false);
            setProgress(0);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Dark Overlay Alternative: rgba(0, 0, 0, 0.7) */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    />

                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative z-10 p-8"
                    >
                        <h2 className="text-2xl font-black text-[#1a202c] mb-2">Upload Report</h2>
                        <p className="text-[#64748b] text-sm mb-6 font-medium">Select a medical document (PDF, PNG, JPG) to add to your vault.</p>

                        <div className="space-y-6">
                            {/* Stylish File Drop Area */}
                            <label className="border-2 border-dashed border-teal-200 rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-teal-50/50 transition-colors group">
                                <input type="file" className="hidden" onChange={handleFileChange} />
                                <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">📂</div>
                                <span className="text-[#1a202c] font-bold">
                                    {file ? file.name : "Click to browse files"}
                                </span>
                            </label>

                            {/* Progress Bar (Using Pulmonology Cyan: #00b5d8) */}
                            {uploading && (
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        className="h-full bg-[#00b5d8]"
                                    />
                                </div>
                            )}

                            <div className="flex gap-4">
                                <button 
                                    onClick={onClose}
                                    className="flex-1 py-3 font-bold text-[#64748b] hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <motion.button 
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleUpload}
                                    disabled={uploading}
                                    // Primary Brand Gradient: from-teal-600 to-cyan-600
                                    className="flex-1 bg-gradient-to-r from-[#14b8a6] to-[#06b6d4] text-white py-3 rounded-xl font-black shadow-lg shadow-teal-500/20 disabled:opacity-50"
                                >
                                    {uploading ? "Uploading..." : "Confirm"}
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default UploadModal;