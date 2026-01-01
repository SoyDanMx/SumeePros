import { supabase, supabaseUrl } from '@/lib/supabase';

export const AuthService = {
    async signInWithPhone(phone: string) {
        // In a real app, use supabase.auth.signInWithOtp
        // For MVP demo purposes, we might just simulate it if no env vars are present
        if (supabaseUrl.includes('placeholder')) {
            return { data: { message: 'OTP sent (simulated)' }, error: null };
        }

        return await supabase.auth.signInWithOtp({
            phone,
        });
    },

    async verifyOtp(phone: string, token: string) {
        if (supabaseUrl.includes('placeholder')) {
            return {
                data: {
                    session: { user: { id: 'mock-user-id', phone } },
                    user: { id: 'mock-user-id', phone }
                },
                error: null
            };
        }

        return await supabase.auth.verifyOtp({
            phone,
            token,
            type: 'sms',
        });
    },

    async signOut() {
        return await supabase.auth.signOut();
    },

    async getCurrentUser() {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    }
};
