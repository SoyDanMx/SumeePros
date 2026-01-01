import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import {
    ArrowLeft, Plus, Trash2, FileText, Share2,
    User, Phone, MapPin, Calculator, CheckCircle2
} from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

interface QuoteItem {
    id: string;
    description: string;
    price: number;
    quantity: number;
}

export default function QuoteGeneratorScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const { user } = useAuth();

    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [items, setItems] = useState<QuoteItem[]>([
        { id: '1', description: 'Mano de obra especializada', price: 0, quantity: 1 }
    ]);
    const [isGenerating, setIsGenerating] = useState(false);

    const addItem = () => {
        setItems([...items, { id: Date.now().toString(), description: '', price: 0, quantity: 1 }]);
    };

    const removeItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    const updateItem = (id: string, field: keyof QuoteItem, value: any) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal; // For now, no tax added

    const generateQuotePDF = async () => {
        if (!clientName) {
            Alert.alert('Faltan datos', 'Por favor ingresa el nombre del cliente.');
            return;
        }

        setIsGenerating(true);
        try {
            const itemsHtml = items.map(item => `
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #EEE;">${item.description}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #EEE; text-align: center;">${item.quantity}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #EEE; text-align: right;">$${item.price.toLocaleString()}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #EEE; text-align: right;">$${(item.price * item.quantity).toLocaleString()}</td>
                </tr>
            `).join('');

            const html = `
                <html>
                <head>
                    <style>
                        body { font-family: 'Helvetica', sans-serif; color: #333; padding: 40px; }
                        .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #6D28D9; padding-bottom: 20px; }
                        .logo { color: #6D28D9; font-size: 28px; font-weight: bold; }
                        .quote-title { font-size: 32px; font-weight: bold; color: #1E293B; margin-bottom: 5px; }
                        .details { margin-bottom: 30px; }
                        .client-info { background: #F8FAFC; padding: 20px; border-radius: 8px; margin-bottom: 40px; }
                        table { width: 100%; border-collapse: collapse; }
                        th { background: #6D28D9; color: white; padding: 12px; text-align: left; }
                        .total-section { margin-top: 40px; border-top: 2px solid #EEE; padding-top: 20px; text-align: right; }
                        .total-amount { font-size: 24px; color: #6D28D9; font-weight: bold; }
                        .footer { margin-top: 60px; font-size: 12px; color: #94A3B8; text-align: center; border-top: 1px solid #EEE; padding-top: 20px; }
                        .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 80px; color: rgba(109, 40, 217, 0.05); white-space: nowrap; pointer-events: none; }
                    </style>
                </head>
                <body>
                    <div class="watermark">SUMEE PRO QUOTE</div>
                    <div class="header">
                        <div>
                            <div class="logo">SUMEE PRO</div>
                            <div style="font-size: 14px; color: #666;">Red de Profesionales Élite</div>
                        </div>
                        <div style="text-align: right;">
                            <div class="quote-title">COTIZACIÓN</div>
                            <div style="color: #64748B;">Folio: #${Date.now().toString().slice(-6)}</div>
                            <div style="color: #64748B;">Fecha: ${new Date().toLocaleDateString()}</div>
                        </div>
                    </div>

                    <div class="client-info">
                        <div style="font-weight: bold; color: #6D28D9; margin-bottom: 10px; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">Preparado para:</div>
                        <div style="font-size: 18px; font-weight: bold; color: #1E293B;">${clientName}</div>
                        <div style="color: #64748B;">Tel: ${clientPhone || 'N/A'}</div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th style="border-radius: 8px 0 0 0;">Descripción del Servicio/Material</th>
                                <th style="text-align: center;">Cant.</th>
                                <th style="text-align: right;">Precio Unit.</th>
                                <th style="text-align: right; border-radius: 0 8px 0 0;">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>

                    <div class="total-section">
                        <div style="margin-bottom: 5px;">Subtotal: $${subtotal.toLocaleString()}</div>
                        <div style="margin-bottom: 10px;">IVA (0%): $0</div>
                        <div class="total-amount">TOTAL: $${total.toLocaleString()} MXN</div>
                    </div>

                    <div style="margin-top: 40px;">
                        <div style="font-weight: bold; color: #1E293B; margin-bottom: 5px;">Notas y Condiciones:</div>
                        <div style="color: #64748B; font-size: 14px;">
                            • Esta cotización tiene una vigencia de 15 días naturales.<br/>
                            • No incluye materiales adicionales no especificados en esta lista.<br/>
                            • El pago deberá realizarse conforme a los términos acordados con el profesional.
                        </div>
                    </div>

                    <div class="footer">
                        Este documento fue generado por un profesional verificado de la red Sumee Pro.<br/>
                        Sumee Pro - Conectando Expertos con Soluciones.
                    </div>
                </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo generar el PDF de la cotización.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Screen style={{ backgroundColor: '#F8FAFC' }}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text variant="h1" style={styles.title}>Nueva Cotización</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <Card style={styles.sectionCard}>
                    <View style={styles.sectionTitleRow}>
                        <User size={18} color="#6D28D9" />
                        <Text weight="bold" style={styles.sectionTitle}>Datos del Cliente</Text>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text variant="caption" style={styles.label}>Nombre del Cliente</Text>
                        <TextInput
                            placeholder="Ej. Juan Pérez"
                            value={clientName}
                            onChangeText={setClientName}
                            style={styles.input}
                            placeholderTextColor="#94A3B8"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text variant="caption" style={styles.label}>Teléfono (Opcional)</Text>
                        <TextInput
                            placeholder="55 1234 5678"
                            value={clientPhone}
                            onChangeText={setClientPhone}
                            style={styles.input}
                            placeholderTextColor="#94A3B8"
                            keyboardType="phone-pad"
                        />
                    </View>
                </Card>

                <View style={[styles.sectionTitleRow, { marginBottom: 12, marginTop: 10 }]}>
                    <Calculator size={18} color="#6D28D9" />
                    <Text weight="bold" style={styles.sectionTitle}>Conceptos y Precios</Text>
                </View>

                {items.map((item, index) => (
                    <Card key={item.id} style={styles.itemCard}>
                        <View style={styles.itemHeader}>
                            <Text weight="bold" color="#64748B">Concepto #${index + 1}</Text>
                            <TouchableOpacity onPress={() => removeItem(item.id)}>
                                <Trash2 size={18} color="#EF4444" />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            placeholder="Descripción del servicio o material"
                            value={item.description}
                            onChangeText={(val) => updateItem(item.id, 'description', val)}
                            style={styles.itemInput}
                            multiline
                        />

                        <View style={styles.priceRow}>
                            <View style={{ flex: 1 }}>
                                <Text variant="caption" style={styles.label}>Precio Unitario</Text>
                                <TextInput
                                    placeholder="0.00"
                                    value={item.price.toString()}
                                    onChangeText={(val) => updateItem(item.id, 'price', parseFloat(val) || 0)}
                                    style={styles.itemInput}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={{ width: 80, marginLeft: 12 }}>
                                <Text variant="caption" style={styles.label}>Cant.</Text>
                                <TextInput
                                    placeholder="1"
                                    value={item.quantity.toString()}
                                    onChangeText={(val) => updateItem(item.id, 'quantity', parseInt(val) || 0)}
                                    style={[styles.itemInput, { textAlign: 'center' }]}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>
                    </Card>
                ))}

                <TouchableOpacity style={styles.addBtn} onPress={addItem}>
                    <Plus size={20} color="#6D28D9" />
                    <Text style={styles.addBtnText}>Agregar Concepto</Text>
                </TouchableOpacity>

                <Card style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                        <Text color="#64748B">Subtotal:</Text>
                        <Text weight="bold" style={{ fontSize: 18 }}>${subtotal.toLocaleString()}</Text>
                    </View>
                    <View style={[styles.summaryRow, { marginTop: 8 }]}>
                        <Text weight="bold" style={{ fontSize: 20, color: '#1E293B' }}>TOTAL:</Text>
                        <Text weight="bold" style={{ fontSize: 22, color: '#6D28D9' }}>${total.toLocaleString()} MXN</Text>
                    </View>
                </Card>

                <Button
                    title={isGenerating ? "Generando PDF..." : "Generar y Compartir PDF"}
                    icon={<Share2 size={20} color="white" />}
                    onPress={generateQuotePDF}
                    style={{ marginTop: 24, height: 60, borderRadius: 16, backgroundColor: '#6D28D9' }}
                    loading={isGenerating}
                />

                <View style={styles.safetyInfo}>
                    <CheckCircle2 size={16} color="#10B981" />
                    <Text style={styles.safetyText}>Cotización profesional verificada por Sumee Pro Network</Text>
                </View>
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
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    sectionCard: {
        marginBottom: 20,
        padding: 16,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 14,
        color: '#1E293B',
        marginLeft: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    label: {
        marginBottom: 6,
        color: '#64748B',
        fontWeight: '600',
    },
    inputContainer: {
        marginBottom: 16,
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#1E293B',
    },
    itemCard: {
        marginBottom: 12,
        padding: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#6D28D9',
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    itemInput: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        borderRadius: 8,
        padding: 12,
        fontSize: 15,
        color: '#1E293B',
        marginBottom: 12,
    },
    priceRow: {
        flexDirection: 'row',
    },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#6D28D9',
        borderStyle: 'dashed',
        marginTop: 8,
        backgroundColor: 'rgba(109, 40, 217, 0.05)',
    },
    addBtnText: {
        color: '#6D28D9',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    summaryCard: {
        marginTop: 24,
        padding: 20,
        backgroundColor: 'white',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    safetyInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        paddingBottom: 40,
    },
    safetyText: {
        fontSize: 11,
        color: '#64748B',
        marginLeft: 6,
    }
});
