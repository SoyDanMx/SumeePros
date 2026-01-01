import { supabase, supabaseUrl } from '@/lib/supabase';

export const AuthService = {
    /**
     * Inicia el flujo de autenticación por SMS enviando el código OTP.
     */
    async signInWithPhone(phone: string) {
        // Validación básica de formato mexicano si es necesario
        const formattedPhone = phone.startsWith('+') ? phone : `+52${phone}`;

        if (supabaseUrl.includes('placeholder')) {
            console.log('[Auth] Modo Mock: Enviando OTP a', formattedPhone);
            return { data: { message: 'OTP enviado (simulado)' }, error: null };
        }

        return await supabase.auth.signInWithOtp({
            phone: formattedPhone,
        });
    },

    /**
     * Verifica el código de 6 dígitos introducido por el técnico.
     */
    async verifyOtp(phone: string, token: string) {
        const formattedPhone = phone.startsWith('+') ? phone : `+52${phone}`;

        if (supabaseUrl.includes('placeholder')) {
            return {
                data: {
                    session: {
                        access_token: 'mock-token',
                        user: { id: 'mock-user-id', phone: formattedPhone, email: '' }
                    },
                    user: { id: 'mock-user-id', phone: formattedPhone }
                },
                error: null
            };
        }

        return await supabase.auth.verifyOtp({
            phone: formattedPhone,
            token,
            type: 'sms',
        });
    },

    /**
     * Cierra la sesión y limpia el almacenamiento local.
     */
    async signOut() {
        return await supabase.auth.signOut();
    },

    /**
     * Obtiene el usuario actual verificado por el servidor.
     */
    async getCurrentUser() {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    }
};
