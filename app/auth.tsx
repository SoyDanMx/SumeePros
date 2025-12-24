import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Image, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext'; // Assuming this hook exists
import { useRouter } from 'expo-router';

export default function LoginScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    // const { signIn } = useAuth(); // Mocking this for now if simpler
    const [phone, setPhone] = useState('');
    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [otp, setOtp] = useState('');

    const handleSendCode = () => {
        if (phone.length > 9) setStep('otp');
    };

    const handleVerify = () => {
        // signIn();
        router.replace('/(tabs)');
    };

    return (
        <Screen style={{ justifyContent: 'center' }}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.container}>
                    <View style={styles.logoContainer}>
                        <View style={[styles.logoPlaceholder, { backgroundColor: theme.primary }]}>
                            <Text variant="h1" color={theme.white}>S</Text>
                        </View>
                        <Text variant="h1" style={{ marginTop: 16 }}>Sumee Pro</Text>
                        <Text color={theme.textSecondary}>Para Profesionales</Text>
                    </View>

                    <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        {step === 'phone' ? (
                            <>
                                <Text variant="h3" style={{ marginBottom: 8 }}>Inicia Sesión</Text>
                                <Text color={theme.textSecondary} style={{ marginBottom: 24 }}>Ingresa tu número celular para continuar</Text>

                                <TextInput
                                    style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                                    placeholder="+52 (000) 000-0000"
                                    placeholderTextColor={theme.textSecondary}
                                    keyboardType="phone-pad"
                                    value={phone}
                                    onChangeText={setPhone}
                                />

                                <Button
                                    title="Enviar Código"
                                    onPress={handleSendCode}
                                    style={{ marginTop: 16 }}
                                    disabled={phone.length < 10}
                                />
                            </>
                        ) : (
                            <>
                                <Text variant="h3" style={{ marginBottom: 8 }}>Verificación</Text>
                                <Text color={theme.textSecondary} style={{ marginBottom: 24 }}>Ingresa el código enviado al {phone}</Text>

                                <TextInput
                                    style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border, textAlign: 'center', letterSpacing: 8, fontSize: 24 }]}
                                    placeholder="000000"
                                    placeholderTextColor={theme.textSecondary}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    value={otp}
                                    onChangeText={setOtp}
                                />

                                <Button
                                    title="Verificar"
                                    onPress={handleVerify}
                                    style={{ marginTop: 16 }}
                                    disabled={otp.length < 4}
                                />
                                <Button
                                    title="Cambiar número"
                                    variant="ghost"
                                    onPress={() => setStep('phone')}
                                    style={{ marginTop: 8 }}
                                />
                            </>
                        )}
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 24,
        flex: 1,
        justifyContent: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logoPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    formCard: {
        padding: 24,
        borderRadius: 24,
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 4,
    },
    input: {
        height: 56,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        borderWidth: 1,
    }
});
