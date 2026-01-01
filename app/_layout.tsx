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
                        <Stack.Screen name="professional-docs" options={{ headerShown: false }} />
                        <Stack.Screen name="achievements" options={{ headerShown: false }} />
                        <Stack.Screen name="help-center" options={{ headerShown: false }} />
                        <Stack.Screen name="quote-generator" options={{ headerShown: false }} />
                        <Stack.Screen name="portfolio" options={{ headerShown: false }} />
                        <Stack.Screen name="professional-id" options={{ headerShown: false }} />
                        <Stack.Screen name="ai-diagnostic" options={{ headerShown: false }} />
                    </Stack>
                </AuthProvider>
            </ThemeProvider>
        </SafeAreaProvider>
    );
}
