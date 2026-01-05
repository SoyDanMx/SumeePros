import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    TextInput,
    TouchableWithoutFeedback,
    Keyboard,
    ActivityIndicator,
    Image,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, Mail, Lock, Phone } from 'lucide-react-native';
import { Alert } from 'react-native';

// Brand Colors from Web parity
const SUMEE_PURPLE = '#6D28D9';
const WEB_BLUE = '#1D4ED8';
const TEXT_DARK = '#111827';
const TEXT_GRAY = '#6B7280';
const INPUT_BORDER = '#D1D5DB';

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { signInWithEmail } = useAuth();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Datos incompletos', 'Por favor ingresa tu correo y contraseña.');
            return;
        }

        setLoading(true);
        const { error } = await signInWithEmail(email, password);
        setLoading(false);

        if (error) {
            Alert.alert('Error de Acceso', error.message || 'Credenciales incorrectas o no tienes permiso de profesional.');
        } else {
            router.replace('/(tabs)');
        }
    };

    return (
        <Screen style={{ backgroundColor: '#FFFFFF' }}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={styles.container}>

                            {/* Logo Section */}
                            <View style={styles.logoContainer}>
                                <Image
                                    source={require('@/assets/images/sumee_logo_horizontal.png')}
                                    style={styles.logo}
                                    resizeMode="contain"
                                />
                                <Text style={styles.title}>Sumee Pro</Text>
                                <Text style={styles.subtitle}>Acceso exclusivo para profesionales.</Text>
                            </View>

                            {/* Form Section */}
                            <View style={styles.formContainer}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Correo Electrónico</Text>
                                    <View style={styles.inputWrapper}>
                                        <Mail size={20} color={TEXT_GRAY} style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="pro@sumee.mx"
                                            placeholderTextColor="#9CA3AF"
                                            value={email}
                                            onChangeText={setEmail}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Contraseña</Text>
                                    <View style={styles.inputWrapper}>
                                        <Lock size={20} color={TEXT_GRAY} style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="••••••••"
                                            placeholderTextColor="#9CA3AF"
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry
                                        />
                                    </View>
                                </View>

                                <Button
                                    title={loading ? "Iniciando sesión..." : "Entrar a Sumee Pro"}
                                    onPress={handleLogin}
                                    loading={loading}
                                    disabled={!email || !password}
                                    style={styles.loginButton}
                                />
                            </View>

                            {/* Social Login Divider (Optional but modern) */}
                            <View style={styles.dividerContainer}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>o ingresa con</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            <View style={styles.socialRow}>
                                <TouchableOpacity style={styles.socialBtn}>
                                    <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }} style={styles.socialIcon} />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.socialBtn}>
                                    <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/733/733547.png' }} style={styles.socialIcon} />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.socialBtn}>
                                    <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/0/747.png' }} style={styles.socialIcon} />
                                </TouchableOpacity>
                            </View>

                        </View>
                    </TouchableWithoutFeedback>
                </ScrollView>
            </KeyboardAvoidingView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    container: {
        padding: 24,
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logo: {
        width: 180,
        height: 60,
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: TEXT_DARK,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: TEXT_GRAY,
        textAlign: 'center',
        marginTop: 4,
    },
    formContainer: {
        width: '100%',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: TEXT_DARK,
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: INPUT_BORDER,
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 16,
        height: 56,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: TEXT_DARK,
        height: '100%',
    },
    eyeIcon: {
        padding: 8,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotPasswordText: {
        color: TEXT_GRAY,
        fontSize: 14,
    },
    loginButton: {
        backgroundColor: WEB_BLUE,
        height: 56,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: WEB_BLUE,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    loginButtonDisabled: {
        backgroundColor: '#93C5FD',
        shadowOpacity: 0,
        elevation: 0,
    },
    loginButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    footerText: {
        color: TEXT_GRAY,
        fontSize: 14,
    },
    footerLink: {
        color: WEB_BLUE,
        fontSize: 14,
        fontWeight: 'bold',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 40,
        width: '100%',
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    dividerText: {
        paddingHorizontal: 16,
        color: '#9CA3AF',
        fontSize: 12,
    },
    socialRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
        gap: 20,
    },
    socialBtn: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    socialIcon: {
        width: 24,
        height: 24,
    }
});
