import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Mock user check
        setTimeout(() => {
            setIsLoading(false);
        }, 1000);
    }, []);

    const login = async (phoneNumber) => {
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            const mockUser = {
                id: '1',
                name: 'Roberto Sanchez',
                phoneNumber,
                rating: 4.8,
                responseRate: 98,
                avatar: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/aq3g7qd2nfy1yo3xwtrla', // Placeholder
                verifiedLevel: 4,
                earningsTotal: 15400,
                pendingPayout: 2400,
            };
            setUser(mockUser);
            setIsAuthenticated(true);
            setIsLoading(false);
        }, 1500);
    };

    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
