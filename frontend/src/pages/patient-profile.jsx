import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../lib/axios';
import { toast } from 'react-hot-toast';

const Patientprofile = () => {
    const [user, setUser] = useState(null);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    const userId = localStorage.getItem('userId');

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const userRes = await API.get(`/auth/user/${userId}`);
                setUser(userRes.data.data);
                const reportsRes = await API.get(`/patients/${userId}/reports`);
                setReports(reportsRes.data);
            } catch (err) {
                console.error("Failed to load profile", err);
            } finally {
                setLoading(false);
            }
        };
        if (userId) fetchProfileData();
    }, [userId]);

    if (loading) return (
        // Loading Shimmer colors: #1e293b to #334155
        <div className="flex justify-center items-center h-screen bg-[#1e293b]">
            <motion.div 
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-white font-bold text-xl tracking-widest"
            >
                HEALTHCARE<span className="text-[#14b8a6]">+</span>
            </motion.div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-12 overflow-hidden">
            {/* Header with Teal-to-Cyan Gradient */}
            <motion.header 
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className="bg-gradient-to-r from-[#14b8a6] to-[#06b6d4] h-60 relative shadow-lg"
            >
                <div className="max-w-6xl mx-auto px-6 h-full flex items-end pb-12">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-8 translate-y-16"
                    >
                        {/* Profile Avatar with 60% Black Overlay */}
                        <div className="h-40 w-40 bg-white rounded-3xl shadow-2xl flex items-center justify-center border-8 border-white p-2">
                            <div className="h-full w-full bg-teal-50 rounded-2xl flex items-center justify-center text-[#14b8a6] text-5xl font-black">
                                {user?.firstName?.charAt(0)}
                            </div>
                        </div>
                        <div className="mb-6">
                            <h1 className="text-4xl font-black text-white drop-shadow-md">
                                {user?.firstName} {user?.lastName}
                            </h1>
                            <span className="bg-black/20 backdrop-blur-md px-4 py-1 rounded-full text-white text-sm font-bold uppercase tracking-widest">
                                {user?.role} Account
                            </span>
                        </div>
                    </motion.div>
                </div>
            </motion.header>

            <div className="max-w-6xl mx-auto px-6 mt-28 grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Personal Info Card */}
                <motion.aside 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 h-fit"
                >
                    <h3 className="text-lg font-black text-[#1a202c] mb-6 border-b pb-4">Profile Info</h3>
                    <div className="space-y-6">
                        <div>
                            <p className="text-xs font-bold text-[#64748b] uppercase tracking-tighter">Email</p>
                            <p className="text-[#1a202c] font-semibold">{user?.email}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-[#64748b] uppercase tracking-tighter">Phone</p>
                            <p className="text-[#1a202c] font-semibold">{user?.phoneNumber}</p>
                        </div>
                        <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-4 border-2 border-[#14b8a6] text-[#14b8a6] font-black rounded-2xl hover:bg-teal-50 transition-all"
                        >
                            UPDATE DETAILS
                        </motion.button>
                    </div>
                </motion.aside>

                {/* Medical Reports Vault */}
                <motion.main 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-2 space-y-6"
                >
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                            <h2 className="text-2xl font-black text-[#1a202c]">Medical Vault</h2>
                            {/* Brand Gradient Button */}
                            <motion.button 
                                onClick={() => setIsUploadOpen(true)}
                                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(20, 184, 166, 0.25)" }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-gradient-to-r from-[#14b8a6] to-[#06b6d4] text-white px-8 py-3 rounded-2xl font-black shadow-lg"
                            >
                                + UPLOAD
                            </motion.button>
                        </div>

                        <div className="p-4">
                            <AnimatePresence>
                                {reports.map((report, idx) => (
                                    <motion.div 
                                        key={report.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 * idx }}
                                        className="flex items-center justify-between p-6 hover:bg-gray-50 rounded-2xl transition-all group"
                                    >
                                        <div className="flex items-center gap-5">
                                            {/* Specialty Color: Neurology (Blue) for generic files */}
                                            <div className="h-14 w-14 rounded-2xl bg-[#3182ce]/10 flex items-center justify-center text-[#3182ce] text-2xl group-hover:scale-110 transition-transform">
                                                📄
                                            </div>
                                            <div>
                                                <p className="font-bold text-[#1a202c]">{report.fileName}</p>
                                                <p className="text-xs text-[#64748b] font-bold">{new Date(report.uploadDate).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <button className="text-[#14b8a6] font-black text-sm tracking-widest hover:text-[#06b6d4]">
                                            DOWNLOAD
                                        </button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.main>
            </div>
        </div>
    );
};

export default Patientprofile;