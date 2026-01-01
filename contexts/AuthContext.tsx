import { useRouter, useSegments } from 'expo-router';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthService } from '@/services/auth';
import { NotificationsService } from '@/services/notifications';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type AuthContextType = {
    user: User | null;
    session: Session | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    signInWithPhone: (phone: string) => Promise<{ error: any }>;
    verifyOtp: (phone: string, token: string) => Promise<{ error: any }>;
    signOut: () => Promise<void>;
    profile: any | null;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [profile, setProfile] = useState<any | null>(null);
    const router = useRouter();

    useEffect(() => {
        checkUser();
    }, []);

    async function checkUser() {
        try {
            const user = await AuthService.getCurrentUser();
            setUser(user ?? null);
            setSession(null);

            if (user) {
                // Fetch profile
                const { data: stats } = await supabase
                    .from('professional_stats')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                setProfile(stats);

                // Register for push notifications
                NotificationsService.registerForPushNotificationsAsync(user.id);
            } else {
                setProfile(null);
            }
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

            // Fetch profile
            const { data: stats } = await supabase
                .from('professional_stats')
                .select('*')
                .eq('user_id', data.user.id)
                .single();
            setProfile(stats);

            NotificationsService.registerForPushNotificationsAsync(data.user.id);
        }
        return { error };
    };

    const signOut = async () => {
        try {
            await AuthService.signOut();
        } finally {
            setUser(null);
            setSession(null);
            setProfile(null);
            router.replace('/auth');
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            session,
            isAuthenticated: !!user,
            isLoading,
            signInWithPhone,
            verifyOtp,
            signOut,
            profile
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
