import axios from 'axios';
import toast from 'react-hot-toast';

// Set the base URL to your Spring Boot server
const API = axios.create({
    baseURL: 'http://localhost:8083/api', 
});

// Axios Interceptor: Automatically attaches the JWT to every request
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response Interceptor: Handles global errors (like expired tokens)
API.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = error.response?.data?.message || "Something went wrong";
        
        if (error.response?.status === 403) {
            toast.error("Session expired. Please login again.");
            localStorage.removeItem('accessToken');
            window.location.href = '/login';
        } else {
            toast.error(message);
        }
        return Promise.reject(error);
    }
);

export default API;