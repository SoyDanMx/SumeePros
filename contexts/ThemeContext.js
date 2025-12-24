import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';

const ThemeContext = createContext();

export const theme = {
    light: {
        primary: '#0A74DA',
        background: '#F8FAFC',
        card: '#FFFFFF',
        text: '#0F172A',
        textSecondary: '#64748B',
        border: '#E2E8F0',
        surface: '#F1F5F9',
        error: '#EF4444',
        success: '#10B981',
        warning: '#F59E0B',
        white: '#FFFFFF',
    },
    dark: {
        primary: '#3B82F6',
        background: '#0F172A',
        card: '#1E293B',
        text: '#F8FAFC',
        textSecondary: '#94A3B8',
        border: '#334155',
        surface: '#1E293B',
        error: '#EF4444',
        success: '#10B981',
        warning: '#F59E0B',
        white: '#FFFFFF',
    }
};

export const ThemeProvider = ({ children }) => {
    const colorScheme = useColorScheme();
    const currentTheme = theme[colorScheme === 'dark' ? 'dark' : 'light'];

    return (
        <ThemeContext.Provider value={{ theme: currentTheme, isDark: colorScheme === 'dark' }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
