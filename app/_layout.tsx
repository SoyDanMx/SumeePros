import { Stack } from 'expo-router';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <ThemeProvider>
                <AuthProvider>
                    <Stack screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                        <Stack.Screen name="auth" options={{ headerShown: false, presentation: 'modal' }} />
                        <Stack.Screen name="marketplace" options={{ title: 'Tienda', headerShown: true }} />
                        <Stack.Screen name="job/[id]" options={{ presentation: 'modal', headerShown: false }} />
                    </Stack>
                </AuthProvider>
            </ThemeProvider>
        </SafeAreaProvider>
    );
}
