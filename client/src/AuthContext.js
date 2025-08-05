import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from './services/auth.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const currentUser = authService.getCurrentUser();
        if (currentUser && currentUser.token) {
            setUser(currentUser);
        }
        setLoading(false);
    }, []);

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    const login = async (email, password) => {
        try {
            const responseData = await authService.login(email, password);
            setUser(responseData);
            return responseData;
        } catch (error) {
            logout();
            throw error;
        }
    };

    const value = {
        user,
        login,
        logout,
        isAuthenticated: !!user,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};