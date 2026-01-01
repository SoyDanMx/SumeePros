import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import {
    ArrowLeft, Bot, Camera, Image as ImageIcon, Sparkles,
    Lightbulb, ShieldAlert, Cpu, Droplets, Zap, Wind,
    Hammer, CheckCircle2, ChevronRight, X
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { AIService, DiagnosticCategory, AIResponse } from '@/services/ai';

const { width } = Dimensions.get('window');

const CATEGORIES: { id: DiagnosticCategory; label: string; icon: any; color: string }[] = [
    { id: 'ELECTRICO', label: 'Electricidad', icon: Zap, color: '#F59E0B' },
    { id: 'PLOMERIA', label: 'Plomería', icon: Droplets, color: '#3B82F6' },
    { id: 'CCTV', label: 'Seguridad/CCTV', icon: Cpu, color: '#10B981' },
    { id: 'CLIMA', label: 'HVAC/Aire', icon: Wind, color: '#06B6D4' },
    { id: 'CONSTRUCCION', label: 'Construcción', icon: Hammer, color: '#8B5CF6' },
    { id: 'GENERAL', label: 'General', icon: Lightbulb, color: '#6366F1' },
];

export default function AIDiagnosticScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const { user } = useAuth();

    const [category, setCategory] = useState<DiagnosticCategory>('GENERAL');
    const [description, setDescription] = useState('');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<AIResponse | null>(null);

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Error', 'Permiso de cámara necesario.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const runDiagnostic = async () => {
        if (!description && !imageUri) {
            Alert.alert('Faltan datos', 'Por favor describe la falla o añade una foto.');
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const diagnostic = await AIService.requestDiagnostic(
                user?.id || 'anonymous',
                category,
                description,
                imageUri || undefined
            );

            if (diagnostic) {
                setResult(diagnostic);
            }
        } catch (e) {
            Alert.alert('Error', 'No se pudo contactar al asistente de IA.');
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setResult(null);
        setDescription('');
        setImageUri(null);
    };

    return (
        <Screen style={{ backgroundColor: '#F8FAFC' }}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#1E293B" />
                </TouchableOpacity>
                <View style={styles.headerTitleRow}>
                    <Bot size={24} color="#6D28D9" />
                    <Text variant="h1" style={styles.title}>Sumee AI Assist</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
                {!result ? (
                    <>
                        <View style={styles.infoBox}>
                            <Sparkles size={20} color="#6D28D9" />
                            <Text style={styles.infoText}>
                                Describe el problema o toma una foto. Mi motor de IA actuará como un ingeniero especialista en la disciplina que elijas.
                            </Text>
                        </View>

                        <Text style={styles.sectionLabel}>1. Selecciona la Disciplina</Text>
                        <View style={styles.categoryGrid}>
                            {CATEGORIES.map((cat) => {
                                const Icon = cat.icon;
                                const isSelected = category === cat.id;
                                return (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[
                                            styles.catBtn,
                                            isSelected && { backgroundColor: cat.color, borderColor: cat.color }
                                        ]}
                                        onPress={() => setCategory(cat.id)}
                                    >
                                        <Icon size={20} color={isSelected ? 'white' : cat.color} />
                                        <Text style={[styles.catLabel, isSelected && { color: 'white' }]}>{cat.label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <Text style={styles.sectionLabel}>2. Evidencia de la Falla</Text>
                        <View style={styles.inputArea}>
                            <TouchableOpacity style={styles.imageBox} onPress={handlePickImage}>
                                {imageUri ? (
                                    <Image source={{ uri: imageUri }} style={styles.previewImage} />
                                ) : (
                                    <View style={styles.placeholderBox}>
                                        <Camera size={32} color="#94A3B8" />
                                        <Text style={styles.placeholderText}>Capturar Falla</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            <TextInput
                                style={styles.textInput}
                                placeholder="Describe ruidos, olores, mediciones o comportamientos extraños del equipo..."
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </View>

                        <Button
                            title={loading ? "Analizando falla..." : "Obtener Diagnóstico IA"}
                            onPress={runDiagnostic}
                            loading={loading}
                            disabled={loading}
                            style={styles.mainBtn}
                        />
                    </>
                ) : (
                    <View style={styles.resultContainer}>
                        {/* Result Header - Persona */}
                        <LinearGradient
                            colors={['#6D28D9', '#4C1D95']}
                            style={styles.resultHeader}
                        >
                            <Bot size={32} color="white" />
                            <View style={{ marginLeft: 12 }}>
                                <Text style={styles.personaTitle}>{result.persona}</Text>
                                <Text style={styles.personaSubtitle}>Consultor de Ingeniería Sumee Pro</Text>
                            </View>
                        </LinearGradient>

                        <Card style={styles.resultContent}>
                            <View style={styles.resultSection}>
                                <Text weight="bold" style={styles.resLabel}>Análisis Técnico</Text>
                                <Text style={styles.resText}>{result.analysis}</Text>
                            </View>

                            <View style={styles.resultSection}>
                                <Text weight="bold" style={styles.resLabel}>Pasos de Solución</Text>
                                {result.steps.map((step, i) => (
                                    <View key={i} style={styles.stepRow}>
                                        <CheckCircle2 size={16} color="#10B981" />
                                        <Text style={styles.stepText}>{step}</Text>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.resultSection}>
                                <Text weight="bold" style={styles.resLabel}>Tips de Experto</Text>
                                {result.technical_tips.map((tip, i) => (
                                    <View key={i} style={styles.tipRow}>
                                        <Lightbulb size={16} color="#F59E0B" />
                                        <Text style={styles.tipText}>{tip}</Text>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.safetyBox}>
                                <ShieldAlert size={20} color="#EF4444" />
                                <Text style={styles.safetyText}>{result.safety_warning}</Text>
                            </View>
                        </Card>

                        <Button
                            title="Nueva Consulta"
                            onPress={reset}
                            variant="secondary"
                            style={{ marginTop: 20 }}
                        />
                    </View>
                )}
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    backBtn: {
        padding: 8,
        marginRight: 8,
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1E293B',
        marginLeft: 8,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#F5F3FF',
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
        alignItems: 'center',
    },
    infoText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 13,
        color: '#4C1D95',
        lineHeight: 18,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#64748B',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 24,
    },
    catBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        flexDirection: 'row',
        alignItems: 'center',
    },
    catLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    inputArea: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 16,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    imageBox: {
        width: '100%',
        aspectRatio: 1.6,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        overflow: 'hidden',
        marginBottom: 16,
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    placeholderBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        marginTop: 8,
        color: '#94A3B8',
        fontWeight: 'bold',
    },
    textInput: {
        fontSize: 16,
        color: '#1E293B',
        minHeight: 100,
    },
    mainBtn: {
        backgroundColor: '#6D28D9',
        height: 60,
        borderRadius: 16,
    },
    resultContainer: {
        width: '100%',
    },
    resultHeader: {
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    personaTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    personaSubtitle: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
    },
    resultContent: {
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        padding: 20,
    },
    resultSection: {
        marginBottom: 20,
    },
    resLabel: {
        fontSize: 13,
        color: '#6D28D9',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    resText: {
        fontSize: 15,
        color: '#334155',
        lineHeight: 22,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    stepText: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        color: '#334155',
    },
    tipRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
        backgroundColor: '#FFFBEB',
        padding: 10,
        borderRadius: 10,
    },
    tipText: {
        flex: 1,
        marginLeft: 10,
        fontSize: 13,
        color: '#92400E',
        fontStyle: 'italic',
    },
    safetyBox: {
        flexDirection: 'row',
        backgroundColor: '#FEF2F2',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    safetyText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 13,
        color: '#991B1B',
        fontWeight: 'bold',
    }
});
