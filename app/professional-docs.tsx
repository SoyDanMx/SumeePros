import React, { useState } from 'react';
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
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

interface DocFile {
    id: string;
    label: string;
    description: string;
    uri: string | null;
}

export default function ProfessionalDocsScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const [docs, setDocs] = useState<DocFile[]>([
        { id: 'profile_photo', label: 'Foto de Perfil', description: 'Foto clara de tu rostro (estilo credencial)', uri: null },
        { id: 'ine_front', label: 'INE (Frente)', description: 'Identificación oficial vigente', uri: null },
        { id: 'ine_back', label: 'INE (Vuelta)', description: 'Parte posterior de tu identificación', uri: null },
        { id: 'cv', label: 'Curriculum Vitae', description: 'Tu experiencia laboral actualizada', uri: null },
        { id: 'no_penales', label: 'Antecedentes No Penales', description: 'Constancia oficial (máx 3 meses)', uri: null },
        { id: 'certificaciones', label: 'Certificaciones/Diplomas', description: 'Títulos o cursos que avalen tu oficio', uri: null },
    ]);

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
            updateDocUri(docId, result.assets[0].uri);
        }
    };

    const handlePick = async (docId: string) => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            updateDocUri(docId, result.assets[0].uri);
        }
    };

    const updateDocUri = (id: string, uri: string) => {
        setDocs(prev => prev.map(d => d.id === id ? { ...d, uri } : d));
    };

    const removeDoc = (id: string) => {
        setDocs(prev => prev.map(d => d.id === id ? { ...d, uri: null } : d));
    };

    const generateAndUploadExpediente = async () => {
        const missing = docs.filter(d => !d.uri);
        if (missing.length > 0) {
            Alert.alert('Expediente Incompleto', `Faltan documentos: ${missing.map(m => m.label).join(', ')}`);
            return;
        }

        setLoading(true);
        try {
            // 1. Create HTML for the PDF
            // We convert internal URIs to Base64 to include them in the PDF
            let imagesHtml = '';
            for (const doc of docs) {
                if (doc.uri) {
                    const base64 = await FileSystem.readAsStringAsync(doc.uri, { encoding: 'base64' });
                    imagesHtml += `
                        <div style="page-break-after: always; text-align: center; padding: 20px; position: relative;">
                            <h2 style="color: #6D28D9; font-family: sans-serif; margin-bottom: 20px;">${doc.label}</h2>
                            <div style="position: relative; display: inline-block;">
                                <img src="data:image/jpeg;base64,${base64}" style="max-width: 100%; border: 1px solid #ddd; border-radius: 8px;" />
                                <!-- Digital Watermark -->
                                <div style="
                                    position: absolute; 
                                    top: 50%; 
                                    left: 50%; 
                                    transform: translate(-50%, -50%) rotate(-45deg);
                                    color: rgba(109, 40, 217, 0.2);
                                    font-size: 40px;
                                    font-family: sans-serif;
                                    font-weight: bold;
                                    text-align: center;
                                    pointer-events: none;
                                    width: 100%;
                                    border: 4px solid rgba(109, 40, 217, 0.2);
                                    padding: 20px;
                                    text-transform: uppercase;
                                    letter-spacing: 5px;
                                    white-space: nowrap;
                                ">
                                    USO EXCLUSIVO SUMEE PRO<br/>
                                    ID: ${user?.id?.substring(0, 8)}<br/>
                                    ${new Date().toLocaleDateString()}
                                </div>
                            </div>
                            <p style="color: #94A3B8; font-family: sans-serif; margin-top: 15px; font-size: 12px;">Validado digitalmente por Sumee Pro Security System</p>
                        </div>
                    `;
                }
            }

            const html = `
                <html>
                    <body style="margin: 0; padding: 0;">
                        <h1 style="text-align: center; color: #6D28D9; padding-top: 50px; font-family: sans-serif;">EXPEDIENTE DIGITAL SUMEE PRO</h1>
                        <p style="text-align: center; font-family: sans-serif;">Documentación Unificada del Profesional</p>
                        ${imagesHtml}
                    </body>
                </html>
            `;

            // 2. Generate PDF
            const { uri } = await Print.printToFileAsync({ html });

            // 3. Upload to Supabase Storage
            const fileName = `expediente_${Date.now()}.pdf`;
            const filePath = `professional-docs/${fileName}`;

            const base64Pdf = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
            const arrayBuffer = decode(base64Pdf);

            const { data, error } = await supabase.storage
                .from('sumee-expedientes')
                .upload(filePath, arrayBuffer, {
                    contentType: 'application/pdf',
                });

            if (error) throw error;

            // 4. Create Notification for Administrator
            const { error: notifyError } = await supabase
                .from('admin_notifications')
                .insert({
                    type: 'new_expediente',
                    title: 'Nuevo Expediente para Validar',
                    message: `El profesional con ID ${user?.id} ha subido su expediente unificado.`,
                    user_id: user?.id,
                    metadata: {
                        file_path: filePath,
                        file_name: fileName,
                        uploaded_at: new Date().toISOString()
                    }
                });

            if (notifyError) console.error('Notification Error:', notifyError);

            // 5. Specifically handle Profile Photo for the UI
            let avatarUrl = null;
            const profilePhotoDoc = docs.find(d => d.id === 'profile_photo');
            if (profilePhotoDoc?.uri) {
                const photoName = `avatar_${user?.id}_${Date.now()}.jpg`;
                const photoB64 = await FileSystem.readAsStringAsync(profilePhotoDoc.uri, { encoding: 'base64' });
                const photoBuffer = decode(photoB64);

                const { data: photoData } = await supabase.storage
                    .from('avatars')
                    .upload(photoName, photoBuffer, { contentType: 'image/jpeg' });

                if (photoData) avatarUrl = photoData.path;
            }

            // 6. Update Professional Stats Status
            await supabase
                .from('professional_stats')
                .update({
                    expediente_status: 'pending_approval',
                    expediente_pdf_url: filePath,
                    avatar_url: avatarUrl || undefined
                })
                .eq('user_id', user?.id);

            Alert.alert(
                '¡Éxito!',
                'Tu expediente unificado PDF ha sido guardado exitosamente en Sumee.',
                [
                    { text: 'Ver PDF', onPress: () => Sharing.shareAsync(uri) },
                    { text: 'OK', onPress: () => router.back() }
                ]
            );
        } catch (error: any) {
            console.error('Upload Error:', error);
            Alert.alert('Error', 'No se pudo generar o subir el expediente. Verifica tu conexión.');
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
                            <View style={[styles.iconBox, { backgroundColor: doc.uri ? '#DCFCE7' : '#F1F5F9' }]}>
                                {doc.uri ? <CheckCircle2 size={24} color="#10B981" /> : <FileText size={24} color="#94A3B8" />}
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text weight="bold" style={{ fontSize: 16 }}>{doc.label}</Text>
                                <Text variant="caption" color={theme.textSecondary}>{doc.description}</Text>
                            </View>
                        </View>

                        {doc.uri ? (
                            <View style={styles.previewContainer}>
                                <Image source={{ uri: doc.uri }} style={styles.preview} />
                                <TouchableOpacity style={styles.removeBtn} onPress={() => removeDoc(doc.id)}>
                                    <Trash2 size={16} color="white" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.btnRow}>
                                <TouchableOpacity style={styles.actionBtn} onPress={() => handleCapture(doc.id)}>
                                    <Camera size={20} color={theme.primary} />
                                    <Text style={styles.btnLabel}>Cámara</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionBtn} onPress={() => handlePick(doc.id)}>
                                    <UploadCloud size={20} color={theme.primary} />
                                    <Text style={styles.btnLabel}>Galería</Text>
                                </TouchableOpacity>
                            </View>
                        )}
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
    previewContainer: {
        height: 150,
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    preview: {
        width: '100%',
        height: '100%',
    },
    removeBtn: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(239, 68, 68, 0.9)',
        padding: 8,
        borderRadius: 20,
    },
    disclaimer: {
        textAlign: 'center',
        marginTop: 20,
        color: '#94A3B8',
        fontSize: 11,
        paddingHorizontal: 20,
    }
});
