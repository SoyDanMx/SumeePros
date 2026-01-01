import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TextInput, TouchableOpacity, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { ArrowLeft, Building2, CreditCard, ShieldCheck, AlertCircle, CheckCircle2, Info } from 'lucide-react-native';

// Brand Colors
const SUMEE_PURPLE = '#6D28D9';
const SUCCESS_GREEN = '#10B981';

// Mexican Banks list
const MEXICAN_BANKS = [
    { code: '002', name: 'BBVA México' },
    { code: '012', name: 'HSBC' },
    { code: '014', name: 'Santander' },
    { code: '021', name: 'Banorte' },
    { code: '072', name: 'Banregio' },
    { code: '127', name: 'Azteca' },
    { code: '646', name: 'STP' },
    { code: '659', name: 'Nu México (Nubank)' },
    { code: '901', name: 'Cuenta Digital (Spin, Hey Banco)' },
];

export default function BankAccountScreen() {
    const { theme } = useTheme();
    const router = useRouter();

    const [clabeNumber, setClabeNumber] = useState('');
    const [holderName, setHolderName] = useState('');
    const [bankName, setBankName] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [isValid, setIsValid] = useState<boolean | null>(null);
    const [savedAccount, setSavedAccount] = useState<{ clabe: string; bank: string; holder: string } | null>(null);

    // Validate CLABE format (18 digits)
    const validateClabe = (clabe: string) => {
        const cleanClabe = clabe.replace(/\s/g, '');
        if (cleanClabe.length !== 18) return false;
        if (!/^\d{18}$/.test(cleanClabe)) return false;

        // Get bank code from first 3 digits
        const bankCode = cleanClabe.substring(0, 3);
        const bank = MEXICAN_BANKS.find(b => b.code === bankCode);
        if (bank) {
            setBankName(bank.name);
        } else {
            setBankName('Banco Mexicano');
        }

        return true;
    };

    const handleClabeChange = (text: string) => {
        // Only allow numbers and format with spaces
        const cleaned = text.replace(/\D/g, '').substring(0, 18);
        const formatted = cleaned.replace(/(.{4})/g, '$1 ').trim();
        setClabeNumber(formatted);

        if (cleaned.length === 18) {
            setIsValidating(true);
            // Simulate validation
            setTimeout(() => {
                const valid = validateClabe(cleaned);
                setIsValid(valid);
                setIsValidating(false);
            }, 500);
        } else {
            setIsValid(null);
            setBankName('');
        }
    };

    const handleSave = () => {
        if (!isValid) {
            Alert.alert('CLABE Inválida', 'Por favor verifica que la CLABE tenga 18 dígitos correctos.');
            return;
        }

        if (!holderName.trim()) {
            Alert.alert('Nombre Requerido', 'Por favor ingresa el nombre del titular de la cuenta.');
            return;
        }

        // In production, this would save to Supabase
        setSavedAccount({
            clabe: clabeNumber,
            bank: bankName,
            holder: holderName
        });

        Alert.alert(
            '✅ Cuenta Guardada',
            `Tu cuenta CLABE de ${bankName} ha sido registrada correctamente. Los pagos se depositarán en 24-48 horas hábiles.`,
            [{ text: 'Entendido', onPress: () => router.back() }]
        );
    };

    return (
        <Screen>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                {/* Header */}
                <View style={[styles.header, { backgroundColor: SUMEE_PURPLE }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Cuenta para Depósitos</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Info Card */}
                    <Card style={styles.infoCard}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={styles.infoIconBox}>
                                <Building2 size={24} color={SUMEE_PURPLE} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text weight="bold" style={{ fontSize: 16 }}>Cuenta CLABE</Text>
                                <Text color={theme.textSecondary} style={{ fontSize: 13, marginTop: 2 }}>
                                    Registra tu cuenta bancaria para recibir tus pagos de forma segura.
                                </Text>
                            </View>
                        </View>
                    </Card>

                    {/* Existing Account Display */}
                    {savedAccount && (
                        <Card style={[styles.savedCard, { borderColor: SUCCESS_GREEN }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <CheckCircle2 size={24} color={SUCCESS_GREEN} />
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text weight="bold" color={SUCCESS_GREEN}>Cuenta Registrada</Text>
                                    <Text style={{ fontSize: 13 }}>{savedAccount.bank}</Text>
                                    <Text color={theme.textSecondary} style={{ fontSize: 12 }}>
                                        ****{savedAccount.clabe.slice(-4)}
                                    </Text>
                                </View>
                            </View>
                        </Card>
                    )}

                    {/* CLABE Input */}
                    <View style={styles.inputGroup}>
                        <Text weight="600" style={styles.inputLabel}>Número CLABE</Text>
                        <View style={[
                            styles.inputContainer,
                            { borderColor: isValid === true ? SUCCESS_GREEN : isValid === false ? '#EF4444' : theme.border }
                        ]}>
                            <CreditCard size={20} color={theme.textSecondary} style={{ marginRight: 12 }} />
                            <TextInput
                                style={[styles.textInput, { color: theme.text }]}
                                placeholder="0000 0000 0000 0000 00"
                                placeholderTextColor={theme.textSecondary}
                                value={clabeNumber}
                                onChangeText={handleClabeChange}
                                keyboardType="numeric"
                                maxLength={22} // 18 digits + 4 spaces
                            />
                            {isValid === true && <CheckCircle2 size={20} color={SUCCESS_GREEN} />}
                            {isValid === false && <AlertCircle size={20} color="#EF4444" />}
                        </View>

                        {/* Bank Detection */}
                        {bankName ? (
                            <View style={styles.bankBadge}>
                                <Building2 size={14} color={SUMEE_PURPLE} />
                                <Text style={{ marginLeft: 6, color: SUMEE_PURPLE, fontWeight: '600', fontSize: 13 }}>
                                    {bankName}
                                </Text>
                            </View>
                        ) : (
                            <Text style={styles.helperText}>18 dígitos • Disponible en tu app bancaria</Text>
                        )}
                    </View>

                    {/* Holder Name Input */}
                    <View style={styles.inputGroup}>
                        <Text weight="600" style={styles.inputLabel}>Nombre del Titular</Text>
                        <View style={[styles.inputContainer, { borderColor: theme.border }]}>
                            <TextInput
                                style={[styles.textInput, { color: theme.text }]}
                                placeholder="Como aparece en tu cuenta bancaria"
                                placeholderTextColor={theme.textSecondary}
                                value={holderName}
                                onChangeText={setHolderName}
                                autoCapitalize="words"
                            />
                        </View>
                        <Text style={styles.helperText}>Debe coincidir exactamente con el titular de la cuenta</Text>
                    </View>

                    {/* Security Notice */}
                    <View style={styles.securityNote}>
                        <ShieldCheck size={20} color={SUMEE_PURPLE} />
                        <Text style={{ flex: 1, marginLeft: 12, fontSize: 13, color: theme.textSecondary, lineHeight: 18 }}>
                            Tu información bancaria está protegida con encriptación de grado bancario.
                            Nunca compartimos tus datos con terceros.
                        </Text>
                    </View>

                    {/* Important Info */}
                    <Card style={styles.infoBox}>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                            <Info size={18} color="#F59E0B" />
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <Text weight="bold" style={{ color: '#92400E', marginBottom: 4 }}>Información Importante</Text>
                                <Text style={{ fontSize: 13, color: '#92400E', lineHeight: 18 }}>
                                    • Los depósitos se procesan en 24-48 horas hábiles{'\n'}
                                    • Monto mínimo de retiro: $50 MXN{'\n'}
                                    • Sin comisiones por transferencia{'\n'}
                                    • Solo aceptamos cuentas a tu nombre
                                </Text>
                            </View>
                        </View>
                    </Card>

                    {/* Save Button */}
                    <TouchableOpacity
                        style={[styles.saveButton, { opacity: isValid && holderName.trim() ? 1 : 0.5 }]}
                        onPress={handleSave}
                        disabled={!isValid || !holderName.trim()}
                    >
                        <Text style={styles.saveButtonText}>Guardar Cuenta</Text>
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    infoCard: {
        marginBottom: 20,
    },
    infoIconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#F3E8FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    savedCard: {
        marginBottom: 20,
        borderWidth: 2,
        backgroundColor: '#DCFCE7',
    },
    inputGroup: {
        marginBottom: 24,
    },
    inputLabel: {
        marginBottom: 8,
        fontSize: 14,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: 'white',
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
    },
    helperText: {
        marginTop: 8,
        fontSize: 12,
        color: '#9CA3AF',
    },
    bankBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        backgroundColor: '#F3E8FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    securityNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#F3E8FF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
    },
    infoBox: {
        backgroundColor: '#FEF3C7',
        marginBottom: 24,
    },
    saveButton: {
        backgroundColor: SUMEE_PURPLE,
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: SUMEE_PURPLE,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
