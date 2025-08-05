import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

// Import all page components
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MyRepresentativesPage from './pages/MyRepresentativesPage';
import DivisionDetailPage from './pages/DivisionDetailPage'; 
import EventDetailPage from './pages/EventDetailPage';

// *** THE FIX IS HERE: PrivateRoute now correctly uses the 'loading' state. ***
function PrivateRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();
    
    // While checking auth, show a loading indicator
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex justify-center items-center">
                <div className="w-12 h-12 border-4 border-cyan-400 border-dashed rounded-full animate-spin"></div>
            </div>
        );
    }

    // If authenticated, render the child component, otherwise redirect to login
    return isAuthenticated ? children : <Navigate to="/login" />;
}

export default function App() {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Routes */}
            <Route 
                path="/dashboard" 
                element={<PrivateRoute><DashboardPage /></PrivateRoute>} 
            />
            <Route 
                path="/my-representatives" 
                element={<PrivateRoute><MyRepresentativesPage /></PrivateRoute>} 
            />
            <Route 
                path="/division/:ocdId" 
                element={<PrivateRoute><DivisionDetailPage /></PrivateRoute>} 
            />
            <Route 
                path="/event/:id" 
                element={<PrivateRoute><EventDetailPage /></PrivateRoute>} 
            />

            {/* Redirect any unknown routes to the home page */}
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
}