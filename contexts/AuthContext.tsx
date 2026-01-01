import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthService } from '@/services/auth';
import { Session, User } from '@supabase/supabase-js';

type AuthContextType = {
    user: User | null;
    session: Session | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    signInWithPhone: (phone: string) => Promise<{ error: any }>;
    verifyOtp: (phone: string, token: string) => Promise<{ error: any }>;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkUser();
    }, []);

    async function checkUser() {
        try {
            const user = await AuthService.getCurrentUser();
            setUser(user ?? null);
            setSession(null);
        } catch (error) {
            console.error('Error checking user:', error);
        } finally {
            setIsLoading(false);
        }
    }

    const signInWithPhone = async (phone: string) => {
        return await AuthService.signInWithPhone(phone);
    };

    const verifyOtp = async (phone: string, token: string) => {
        const { data, error } = await AuthService.verifyOtp(phone, token);
        if (data?.user) {
            setUser(data.user as User);
            setSession(data.session as Session);
        }
        return { error };
    };

    const signOut = async () => {
        await AuthService.signOut();
        setUser(null);
        setSession(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            session,
            isAuthenticated: !!user,
            isLoading,
            signInWithPhone,
            verifyOtp,
            signOut
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
