import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import {
    Camera, FileText, CheckCircle2, AlertCircle, Trash2,
    ChevronRight, ArrowLeft, UploadCloud, Eye
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

interface DocFile {
    id: string;
    label: string;
    description: string;
    uris: string[]; // Changed to array
    type: 'single' | 'multiple';
    allowedTypes: ('image' | 'pdf')[];
}

export default function ProfessionalDocsScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const [docs, setDocs] = useState<DocFile[]>([
        { id: 'profile_photo', label: 'Foto de Perfil', description: 'Foto clara de tu rostro', uris: [], type: 'single', allowedTypes: ['image'] },
        { id: 'ine_front', label: 'INE (Frente)', description: 'Identificación oficial frontal', uris: [], type: 'single', allowedTypes: ['image'] },
        { id: 'ine_back', label: 'INE (Vuelta)', description: 'Identificación oficial posterior', uris: [], type: 'single', allowedTypes: ['image'] },
        { id: 'cv', label: 'Curriculum Vitae', description: 'Experiencia laboral (Fotos o PDF)', uris: [], type: 'multiple', allowedTypes: ['image', 'pdf'] },
        { id: 'no_penales', label: 'Antecedentes No Penales', description: 'Constancia oficial (Fotos o PDF)', uris: [], type: 'multiple', allowedTypes: ['image', 'pdf'] },
        { id: 'certificaciones', label: 'Certificaciones/Diplomas', description: 'Diplomas y cursos (Fotos o PDF)', uris: [], type: 'multiple', allowedTypes: ['image', 'pdf'] },
    ]);

    useEffect(() => {
        if (user) {
            loadExistingDocs();
        }
    }, [user]);

    const loadExistingDocs = async () => {
        try {
            const { data, error } = await supabase
                .from('professional_stats')
                .select('expediente_data')
                .eq('user_id', user?.id)
                .single();

            if (data?.expediente_data) {
                const remoteData = data.expediente_data as Record<string, string[]>;
                setDocs(prev => prev.map(doc => {
                    if (remoteData[doc.id]) {
                        // We store paths, need to convert to public URLs for display
                        const publicUris = remoteData[doc.id].map(path => {
                            if (path.startsWith('http')) return path;
                            return `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/sumee-expedientes/${path}`;
                        });
                        return { ...doc, uris: publicUris };
                    }
                    return doc;
                }));
            }
        } catch (err) {
            console.error('Error loading existing docs:', err);
        }
    };

    const handlePickFile = async (docId: string) => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                multiple: true
            });

            if (!result.canceled) {
                const newUris = result.assets.map(a => a.uri);
                setDocs(prev => prev.map(d => {
                    if (d.id === docId) {
                        return {
                            ...d,
                            uris: d.type === 'single' ? [newUris[0]] : [...d.uris, ...newUris]
                        };
                    }
                    return d;
                }));
            }
        } catch (err) {
            console.error('Error picking document:', err);
        }
    };

    const handleCapture = async (docId: string) => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Error', 'Se requiere permiso de cámara para continuar.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            addDocUri(docId, result.assets[0].uri);
        }
    };

    const handlePickImage = async (docId: string) => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            addDocUri(docId, result.assets[0].uri);
        }
    };

    const addDocUri = (id: string, uri: string) => {
        setDocs(prev => prev.map(d => {
            if (d.id === id) {
                return {
                    ...d,
                    uris: d.type === 'single' ? [uri] : [...d.uris, uri]
                };
            }
            return d;
        }));
    };

    const removeDocUri = (id: string, uriToRemove: string) => {
        setDocs(prev => prev.map(d => d.id === id ? { ...d, uris: d.uris.filter(u => u !== uriToRemove) } : d));
    };

    const generateAndUploadExpediente = async () => {
        // Validation: Only require profile photo and INE
        const mandatoryIds = ['profile_photo', 'ine_front', 'ine_back'];
        const missingMandatory = docs.filter(d => mandatoryIds.includes(d.id) && d.uris.length === 0);

        if (missingMandatory.length > 0) {
            Alert.alert(
                'Documentos Mínimos Requeridos',
                `Para activarte necesitamos al menos: ${missingMandatory.map(m => m.label).join(', ')}. El resto puedes subirlos después.`
            );
            return;
        }

        setLoading(true);
        try {
            const uploadedData: Record<string, string[]> = {};

            // Helper to upload a single file
            const uploadFile = async (uri: string, category: string, index: number) => {
                // If it's already a remote URL, don't re-upload
                if (uri.startsWith('http')) {
                    const match = uri.match(/sumee-expedientes\/(.+)$/);
                    return match ? match[1] : uri;
                }

                const extension = uri.toLowerCase().endsWith('.pdf') ? 'pdf' : 'jpg';
                const fileName = `${category}_${index}_${Date.now()}.${extension}`;
                const filePath = `${user?.id}/${fileName}`; // simplified path

                const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
                const arrayBuffer = decode(base64);

                const { data, error } = await supabase.storage
                    .from('sumee-expedientes')
                    .upload(filePath, arrayBuffer, {
                        contentType: extension === 'pdf' ? 'application/pdf' : 'image/jpeg',
                        upsert: true
                    });

                if (error) throw error;
                return filePath;
            };

            // Process all docs
            for (const doc of docs) {
                if (doc.uris.length > 0) {
                    const paths = [];
                    for (let i = 0; i < doc.uris.length; i++) {
                        const path = await uploadFile(doc.uris[i], doc.id, i);
                        paths.push(path);
                    }
                    uploadedData[doc.id] = paths;
                }
            }

            // Update Professional Stats with JSON data
            const avatarPath = uploadedData['profile_photo'] ? uploadedData['profile_photo'][0] : null;

            const { error: updateError } = await supabase
                .from('professional_stats')
                .update({
                    expediente_status: 'approved', // Auto-approve to allow immediate activity with Photo + INE
                    expediente_data: uploadedData,
                    avatar_url: avatarPath || undefined,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', user?.id);

            if (updateError) throw updateError;

            // Notify Admin
            await supabase
                .from('admin_notifications')
                .insert({
                    type: 'new_expediente',
                    title: 'Nuevo Expediente (Parcial/Completo)',
                    message: `El profesional ${user?.id} ha actualizado su expediente.`,
                    user_id: user?.id,
                    metadata: {
                        categories: Object.keys(uploadedData)
                    }
                });

            Alert.alert(
                '¡Expediente Guardado!',
                'Tus documentos se han subido correctamente. Ya puedes comenzar a usar la plataforma mientras validamos el resto.',
                [{ text: 'Entendido', onPress: () => router.back() }]
            );

        } catch (error: any) {
            console.error('Upload Error:', error);
            Alert.alert('Error', 'No se pudieron subir los documentos. Valida tu conexión a internet.');
        } finally {
            setLoading(false);
        }
    };

    // Helper to decode base64 to ArrayBuffer (Supabase needs ArrayBuffer or Blob)
    function decode(b64: string) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        let str = b64.replace(/=+$/, '');
        let bytes = new Uint8Array((str.length * 3) >> 2);
        for (let i = 0, j = 0; i < str.length; i += 4) {
            let n = (chars.indexOf(str[i]) << 18) | (chars.indexOf(str[i + 1]) << 12) |
                (chars.indexOf(str[i + 2]) << 6) | chars.indexOf(str[i + 3]);
            bytes[j++] = (n >> 16) & 0xFF;
            if (str[i + 2] !== undefined) bytes[j++] = (n >> 8) & 0xFF;
            if (str[i + 3] !== undefined) bytes[j++] = n & 0xFF;
        }
        return bytes.buffer;
    }

    return (
        <Screen style={{ backgroundColor: '#F8FAFC' }}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text variant="h1" style={styles.title}>Expediente Digital</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <View style={styles.infoBox}>
                    <AlertCircle size={20} color="#6D28D9" />
                    <Text style={styles.infoText}>
                        Alimenta tu expediente con fotos claras. Generaremos un PDF unificado con **marca de agua de seguridad** para proteger tu identidad.
                    </Text>
                </View>

                {docs.map((doc) => (
                    <Card key={doc.id} style={styles.docCard}>
                        <View style={styles.docInfo}>
                            <View style={[styles.iconBox, { backgroundColor: doc.uris.length > 0 ? '#DCFCE7' : '#F1F5F9' }]}>
                                {doc.uris.length > 0 ? <CheckCircle2 size={24} color="#10B981" /> : <FileText size={24} color="#94A3B8" />}
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text weight="bold" style={{ fontSize: 16 }}>{doc.label}</Text>
                                    {['profile_photo', 'ine_front', 'ine_back'].includes(doc.id) && (
                                        <Text style={{ color: '#EF4444', marginLeft: 4 }}>*</Text>
                                    )}
                                </View>
                                <Text variant="caption" color={theme.textSecondary}>{doc.description}</Text>
                            </View>
                        </View>

                        {doc.uris.length > 0 && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalPreviews}>
                                {doc.uris.map((uri, idx) => (
                                    <View key={idx} style={styles.previewContainer}>
                                        {uri.toLowerCase().endsWith('.pdf') ? (
                                            <View style={[styles.preview, { backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' }]}>
                                                <FileText size={40} color="#EF4444" />
                                                <Text variant="caption" color="#EF4444">PDF</Text>
                                            </View>
                                        ) : (
                                            <Image source={{ uri }} style={styles.preview} />
                                        )}
                                        <TouchableOpacity style={styles.removeBtn} onPress={() => removeDocUri(doc.id, uri)}>
                                            <Trash2 size={12} color="white" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </ScrollView>
                        )}

                        <View style={styles.btnRow}>
                            <TouchableOpacity style={styles.actionBtn} onPress={() => handleCapture(doc.id)}>
                                <Camera size={18} color={theme.primary} />
                                <Text style={styles.btnLabel}>Cámara</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionBtn} onPress={() => handlePickImage(doc.id)}>
                                <UploadCloud size={18} color={theme.primary} />
                                <Text style={styles.btnLabel}>Fotos</Text>
                            </TouchableOpacity>
                            {doc.allowedTypes.includes('pdf') && (
                                <TouchableOpacity style={styles.actionBtn} onPress={() => handlePickFile(doc.id)}>
                                    <FileText size={18} color={theme.primary} />
                                    <Text style={styles.btnLabel}>PDF</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </Card>
                ))}

                <Button
                    title={loading ? "Generando Expediente..." : "Finalizar y Subir Expediente"}
                    onPress={generateAndUploadExpediente}
                    style={{ marginTop: 24, height: 60, borderRadius: 16, backgroundColor: '#6D28D9' }}
                    loading={loading}
                    disabled={loading}
                />

                <Text style={styles.disclaimer}>
                    Tus datos están protegidos por cifrado de extremo a extremo. Sumee Pro solo utiliza estos documentos para validación profesional.
                </Text>
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
    },
    backBtn: {
        padding: 8,
        marginRight: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1E293B',
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
    docCard: {
        marginBottom: 16,
        padding: 16,
    },
    docInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnRow: {
        flexDirection: 'row',
        gap: 12,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    btnLabel: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
    },
    horizontalPreviews: {
        marginBottom: 16,
    },
    previewContainer: {
        height: 100,
        width: 100,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    preview: {
        width: '100%',
        height: '100%',
    },
    removeBtn: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: 'rgba(239, 68, 68, 0.9)',
        padding: 4,
        borderRadius: 12,
    },
    disclaimer: {
        textAlign: 'center',
        marginTop: 20,
        color: '#94A3B8',
        fontSize: 11,
        paddingHorizontal: 20,
    }
});
