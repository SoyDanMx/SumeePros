import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, TextInput, Modal, FlatList } from 'react-native';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import {
    Plus, Trash2, Camera, Image as ImageIcon, X, ArrowLeft,
    CheckCircle2, AlertCircle, Eye
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { supabase, supabaseUrl } from '@/lib/supabase';
import { PortfolioService, PortfolioItem } from '@/services/portfolio';

export default function PortfolioScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const { user } = useAuth();

    const [items, setItems] = useState<PortfolioItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Modal states
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [newImageUri, setNewImageUri] = useState<string | null>(null);
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');

    useEffect(() => {
        if (user) {
            loadPortfolio();
        }
    }, [user]);

    const loadPortfolio = async () => {
        if (!user) return;
        setLoading(true);
        const data = await PortfolioService.getPortfolio(user.id);
        setItems(data);
        setLoading(false);
    };

    const handlePickImage = async (useCamera: boolean) => {
        const { status } = useCamera
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Permiso denegado', 'Necesitamos acceso para mostrar tus trabajos.');
            return;
        }

        const result = useCamera
            ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
            : await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });

        if (!result.canceled) {
            setNewImageUri(result.assets[0].uri);
        }
    };

    const handleAddItem = async () => {
        if (!newImageUri || !user || !newTitle.trim()) {
            Alert.alert('Datos incompletos', 'Por favor añade una foto y un título para tu trabajo.');
            return;
        }

        setUploading(true);
        try {
            // 1. Upload to Storage
            const fileName = `${user.id}/${Date.now()}.jpg`;
            const base64 = await FileSystem.readAsStringAsync(newImageUri, { encoding: 'base64' });

            // Convert base64 to ArrayBuffer for Supabase
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            const arrayBuffer = bytes.buffer;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('portfolio')
                .upload(fileName, arrayBuffer, { contentType: 'image/jpeg' });

            if (uploadError) throw uploadError;

            // 2. Save to database
            const publicUrl = `${supabaseUrl}/storage/v1/object/public/portfolio/${uploadData.path}`;
            const newItem = await PortfolioService.addPortfolioItem(user.id, publicUrl, newTitle, newDescription);

            if (newItem) {
                setItems([newItem, ...items]);
                setIsAddModalVisible(false);
                setNewImageUri(null);
                setNewTitle('');
                setNewDescription('');
                Alert.alert('Éxito', 'Trabajo añadido a tu portafolio.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo subir la imagen.');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteItem = async (id: string) => {
        Alert.alert(
            'Eliminar trabajo',
            '¿Estás seguro de que quieres eliminar esta foto de tu portafolio?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        const success = await PortfolioService.deletePortfolioItem(id);
                        if (success) {
                            setItems(items.filter(item => item.id !== id));
                        }
                    }
                }
            ]
        );
    };

    return (
        <Screen style={{ backgroundColor: '#F8FAFC' }}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text variant="h1" style={styles.title}>Mi Portafolio</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <View style={styles.infoBox}>
                    <ImageIcon size={20} color="#6D28D9" />
                    <Text style={styles.infoText}>
                        Muestra tus mejores instalaciones y reparaciones. Un portafolio visual ayuda a los clientes a confiar más en tu trabajo.
                    </Text>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#6D28D9" style={{ marginTop: 40 }} />
                ) : (
                    <View style={styles.grid}>
                        <TouchableOpacity
                            style={styles.addItemBtn}
                            onPress={() => setIsAddModalVisible(true)}
                        >
                            <Plus size={32} color="#6D28D9" />
                            <Text style={styles.addItemText}>Añadir Trabajo</Text>
                        </TouchableOpacity>

                        {items.map((item) => (
                            <Card key={item.id} style={styles.portfolioCard}>
                                <Image source={{ uri: item.image_url }} style={styles.portfolioImage} />
                                <View style={styles.cardFooter}>
                                    <View style={{ flex: 1 }}>
                                        <Text weight="bold" numberOfLines={1} style={{ fontSize: 13, color: '#1E293B' }}>
                                            {item.title || "Sin título"}
                                        </Text>
                                        <Text variant="caption" numberOfLines={1} color="#64748B">
                                            {item.description || "Sin descripción"}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => handleDeleteItem(item.id)}
                                        style={styles.deleteBtn}
                                    >
                                        <Trash2 size={16} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            </Card>
                        ))}
                    </View>
                )}
            </ScrollView>

            <Modal
                visible={isAddModalVisible}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text weight="bold" style={{ fontSize: 18 }}>Añadir al Portafolio</Text>
                            <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
                                <X size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView>
                            {newImageUri ? (
                                <View style={styles.newImageContainer}>
                                    <Image source={{ uri: newImageUri }} style={styles.newImage} />
                                    <TouchableOpacity
                                        style={styles.changeImageBtn}
                                        onPress={() => setNewImageUri(null)}
                                    >
                                        <X size={16} color="white" />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.imagePickerRow}>
                                    <TouchableOpacity
                                        style={styles.pickerOption}
                                        onPress={() => handlePickImage(true)}
                                    >
                                        <Camera size={24} color="#6D28D9" />
                                        <Text style={styles.pickerText}>Cámara</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.pickerOption}
                                        onPress={() => handlePickImage(false)}
                                    >
                                        <ImageIcon size={24} color="#6D28D9" />
                                        <Text style={styles.pickerText}>Galería</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            <Text style={styles.inputLabel}>Título del Trabajo *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ej. Instalación de CCTV, Instalación de bomba..."
                                value={newTitle}
                                onChangeText={setNewTitle}
                            />

                            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Más detalles (Opcional)</Text>
                            <TextInput
                                style={[styles.input, { minHeight: 60 }]}
                                placeholder="Detalla qué hiciste en este proyecto..."
                                value={newDescription}
                                onChangeText={setNewDescription}
                                multiline
                                numberOfLines={2}
                            />

                            <Button
                                title={uploading ? "Subiendo..." : "Guardar en Portafolio"}
                                onPress={handleAddItem}
                                loading={uploading}
                                disabled={!newImageUri || uploading}
                                style={{ marginTop: 20, backgroundColor: '#6D28D9' }}
                            />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
    title: {
        fontSize: 22,
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
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    addItemBtn: {
        width: '48%',
        aspectRatio: 1,
        backgroundColor: 'rgba(109, 40, 217, 0.05)',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#6D28D9',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    addItemText: {
        color: '#6D28D9',
        fontWeight: 'bold',
        marginTop: 8,
        fontSize: 14,
    },
    portfolioCard: {
        width: '48%',
        padding: 0,
        marginBottom: 16,
        overflow: 'hidden',
    },
    portfolioImage: {
        width: '100%',
        aspectRatio: 1.2,
    },
    cardFooter: {
        padding: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    deleteBtn: {
        padding: 4,
        marginLeft: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    imagePickerRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 20,
    },
    pickerOption: {
        flex: 1,
        height: 100,
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    pickerText: {
        marginTop: 8,
        fontSize: 14,
        fontWeight: 'bold',
        color: '#475569',
    },
    newImageContainer: {
        width: '100%',
        aspectRatio: 1.5,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 20,
    },
    newImage: {
        width: '100%',
        height: '100%',
    },
    changeImageBtn: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 8,
        borderRadius: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: 12,
        fontSize: 15,
        color: '#1E293B',
        minHeight: 80,
        textAlignVertical: 'top',
    }
});
