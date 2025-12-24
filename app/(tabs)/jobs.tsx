import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useTheme } from '@/contexts/ThemeContext';
import { Clock, MapPin, Calendar as CalendarIcon, CheckCircle } from 'lucide-react-native';

const TABS = ['Solicitudes', 'Programados', 'Historial'];

export default function JobsScreen() {
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState('Programados');

    const renderJobCard = (status: string) => (
        <Card style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text variant="label" color={theme.textSecondary}>ID: #4829</Text>
                <Text variant="label" color={theme.primary}>$350.00</Text>
            </View>
            <Text variant="h3" style={{ marginBottom: 4 }}>Mantenimiento de Aire Acondicionado</Text>
            <Text variant="body" color={theme.textSecondary} style={{ marginBottom: 12 }}>Limpieza preventiva y carga de gas.</Text>

            <View style={styles.infoRow}>
                <CalendarIcon size={16} color={theme.textSecondary} />
                <Text style={styles.infoText}>Mañana, 10:00 AM</Text>
            </View>
            <View style={styles.infoRow}>
                <MapPin size={16} color={theme.textSecondary} />
                <Text style={styles.infoText}>Calle 10 #405, Centro</Text>
            </View>

            <View style={styles.footer}>
                {status === 'Historial' ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <CheckCircle size={18} color={theme.success} />
                        <Text style={{ marginLeft: 8, color: theme.success, fontWeight: '600' }}>Completado</Text>
                    </View>
                ) : (
                    <Button title="Ver Detalles" variant="outline" size="sm" style={{ flex: 1 }} />
                )}
            </View>
        </Card>
    );

    return (
        <Screen>
            <View style={styles.header}>
                <Text variant="h1">Mis Trabajos</Text>
            </View>

            {/* Custom Segmented Control */}
            <View style={[styles.tabsContainer, { backgroundColor: theme.surface }]}>
                {TABS.map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[
                            styles.tab,
                            activeTab === tab && { backgroundColor: theme.card, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2 }
                        ]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text
                            weight="600"
                            color={activeTab === tab ? theme.text : theme.textSecondary}
                            style={{ fontSize: 13 }}
                        >
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {activeTab === 'Solicitudes' && (
                    <View style={styles.emptyState}>
                        <Text color={theme.textSecondary} style={{ textAlign: 'center' }}>No tienes solicitudes pendientes.</Text>
                    </View>
                )}

                {activeTab === 'Programados' && (
                    <>
                        <Text variant="label" color={theme.textSecondary} style={{ marginBottom: 12 }}>ESTA SEMANA</Text>
                        {renderJobCard('Programados')}
                        {renderJobCard('Programados')}
                    </>
                )}

                {activeTab === 'Historial' && (
                    <>
                        <Text variant="label" color={theme.textSecondary} style={{ marginBottom: 12 }}>ENERO 2024</Text>
                        {renderJobCard('Historial')}
                        {renderJobCard('Historial')}
                        {renderJobCard('Historial')}
                    </>
                )}
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 16,
    },
    tabsContainer: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginBottom: 20,
        padding: 4,
        borderRadius: 12,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
        borderRadius: 8,
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    infoText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#64748B',
    },
    footer: {
        marginTop: 16,
        flexDirection: 'row',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    }
});
