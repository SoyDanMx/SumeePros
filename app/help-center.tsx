import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking, TextInput, Platform, Alert } from 'react-native';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import {
    ArrowLeft, MessageCircle, BookOpen, DollarSign,
    MessageSquare, AlertTriangle, ChevronRight, Search,
    Calculator, Scale, ShieldAlert
} from 'lucide-react-native';

// Mock Price Guide Data (Based on Sumee Prices)
const PRICE_GUIDE = [
    { category: 'Plomería', service: 'Fuga básica', price: '$450 - $850' },
    { category: 'Electricidad', service: 'Cambio de contacto', price: '$350 - $600' },
    { category: 'CCTV', service: 'Instalación cámara IP', price: '$850 - $1,200' },
    { category: 'CCTV', service: 'Configuración DVR', price: '$1,200 - $2,500' },
    { category: 'Cerraduras', service: 'Cambio de chapa', price: '$650 - $1,100' },
];

export default function HelpCenterScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [showNegotiator, setShowNegotiator] = useState(false);

    const whatsappNumber = '+5215636741156';

    const handleWhatsApp = (message?: string) => {
        const text = message || 'Hola Sumee Support, necesito ayuda con mi cuenta de Profesional.';
        const url = `whatsapp://send?phone=${whatsappNumber}&text=${encodeURIComponent(text)}`;

        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                Linking.openURL(`https://wa.me/${whatsappNumber.replace('+', '')}?text=${encodeURIComponent(text)}`);
            }
        });
    };

    const filteredPrices = PRICE_GUIDE.filter(p =>
        p.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Screen style={{ backgroundColor: '#F8FAFC' }}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text variant="h1" style={styles.title}>Centro de Ayuda</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
                {/* VIP Support Card */}
                <Card style={[styles.supportCard, { borderColor: '#25D366' }]}>
                    <View style={styles.supportIcon}>
                        <MessageCircle size={32} color="#25D366" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 16 }}>
                        <Text weight="bold" style={{ fontSize: 18 }}>Soporte Directo VIP</Text>
                        <Text variant="caption" color="#64748B">Respuesta inmediata por WhatsApp</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleWhatsApp()} style={styles.waBtn}>
                        <Text style={styles.waBtnText}>Chat</Text>
                    </TouchableOpacity>
                </Card>

                {/* SOS / Emergency Row */}
                <TouchableOpacity style={styles.sosBanner} onPress={() => handleWhatsApp('⚠️ URGENTE: Necesito asistencia de seguridad en mi ubicación actual.')}>
                    <ShieldAlert size={20} color="white" />
                    <Text style={styles.sosText}>Botón de Seguridad / Emergencia</Text>
                    <ChevronRight size={16} color="white" />
                </TouchableOpacity>

                {/* Price Guide Section */}
                <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleRow}>
                        <DollarSign size={20} color="#6D28D9" />
                        <Text weight="bold" style={styles.sectionTitle}>Guía de Precios Justos</Text>
                    </View>
                    <Text variant="caption" color="#64748B">Sugerencias basadas en el mercado Sumee</Text>
                </View>

                <View style={styles.searchBar}>
                    <Search size={18} color="#94A3B8" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Busca un servicio (ej. CCTV)..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                <Card style={styles.priceListCard}>
                    {filteredPrices.map((item, idx) => (
                        <View key={idx} style={[styles.priceItem, idx === filteredPrices.length - 1 && { borderBottomWidth: 0 }]}>
                            <View>
                                <Text weight="600" style={{ fontSize: 14 }}>{item.service}</Text>
                                <Text variant="caption" color="#94A3B8">{item.category}</Text>
                            </View>
                            <Text weight="bold" style={{ color: '#10B981' }}>{item.price}</Text>
                        </View>
                    ))}
                    <TouchableOpacity
                        style={styles.fullGuideBtn}
                        onPress={() => Linking.openURL('https://sumeeapp.com/precios')}
                    >
                        <Text style={styles.fullGuideText}>Ver guía completa en web</Text>
                        <ChevronRight size={14} color="#6D28D9" />
                    </TouchableOpacity>
                </Card>

                {/* Price Debate Tool */}
                <View style={styles.debateContainer}>
                    <View style={styles.debateContent}>
                        <Scale size={24} color="#64748B" />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text weight="bold">¿El precio no es justo?</Text>
                            <Text variant="caption" color="#64748B">Propón un ajuste basado en la complejidad del trabajo.</Text>
                        </View>
                    </View>
                    <Button
                        title="Proponer Precio Justo"
                        onPress={() => setShowNegotiator(true)}
                        style={styles.debateBtn}
                        size="sm"
                    />
                </View>

                {/* Quick Help Grid */}
                <View style={styles.helpGrid}>
                    <TouchableOpacity style={styles.helpItem}>
                        <BookOpen size={24} color="#6D28D9" />
                        <Text style={styles.helpItemLabel}>Tutoriales</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.helpItem}>
                        <Calculator size={24} color="#6D28D9" />
                        <Text style={styles.helpItemLabel}>Comisiones</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.helpItem}>
                        <MessageSquare size={24} color="#6D28D9" />
                        <Text style={styles.helpItemLabel}>FAQs</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>

            {/* Negotiation Modal Simulation */}
            {showNegotiator && (
                <View style={styles.modalOverlay}>
                    <Card style={styles.negotiatorModal}>
                        <View style={styles.modalHeader}>
                            <Scale size={24} color="#6D28D9" />
                            <Text weight="bold" style={{ marginLeft: 10, fontSize: 18 }}>Negociación de Precio</Text>
                        </View>
                        <Text style={styles.modalInstructions}>
                            Explica por qué consideras que el precio del lead debería ajustarse (ej. material extra, distancia no contemplada).
                        </Text>
                        <TextInput
                            placeholder="Escribe tu propuesta aquí..."
                            multiline
                            numberOfLines={4}
                            style={styles.modalInput}
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setShowNegotiator(false)} style={styles.cancelBtn}>
                                <Text style={{ color: '#64748B', fontWeight: 'bold' }}>Cancelar</Text>
                            </TouchableOpacity>
                            <Button
                                title="Enviar Propuesta"
                                onPress={() => {
                                    Alert.alert('Propuesta Enviada', 'Un administrador revisará tu propuesta de precio para este lead y te responderá vía WhatsApp.');
                                    setShowNegotiator(false);
                                }}
                                style={styles.sendBtn}
                            />
                        </View>
                    </Card>
                </View>
            )}
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
    supportCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderWidth: 1.5,
        marginBottom: 16,
    },
    supportIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#DCFCE7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    waBtn: {
        backgroundColor: '#25D366',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    waBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    sosBanner: {
        backgroundColor: '#EF4444',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 24,
    },
    sosText: {
        flex: 1,
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 10,
        fontSize: 14,
    },
    sectionHeader: {
        marginBottom: 12,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    sectionTitle: {
        fontSize: 18,
        color: '#1E293B',
        marginLeft: 8,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
        marginBottom: 16,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
    },
    priceListCard: {
        padding: 0,
        overflow: 'hidden',
        marginBottom: 24,
    },
    priceItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    fullGuideBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: '#F5F3FF',
    },
    fullGuideText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#6D28D9',
        marginRight: 6,
    },
    debateContainer: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 24,
    },
    debateContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    debateBtn: {
        height: 44,
        backgroundColor: '#475569',
        borderRadius: 12,
    },
    helpGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    helpItem: {
        flex: 1,
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    helpItemLabel: {
        marginTop: 8,
        fontSize: 11,
        fontWeight: '600',
        color: '#475569',
    },
    modalOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    negotiatorModal: {
        padding: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalInstructions: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 20,
        marginBottom: 16,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: 12,
        height: 100,
        textAlignVertical: 'top',
        marginBottom: 20,
    },
    modalActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        alignItems: 'center',
    },
    sendBtn: {
        flex: 2,
        height: 48,
        borderRadius: 12,
    }
});
