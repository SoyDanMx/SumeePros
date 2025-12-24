import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Switch, Image } from 'react-native';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useTheme } from '@/contexts/ThemeContext';
import { MapPin, Clock, ArrowRight, DollarSign, Bell } from 'lucide-react-native';

export default function HomeScreen() {
    const { theme } = useTheme();
    const [isOnline, setIsOnline] = useState(true);

    return (
        <Screen>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text variant="caption" color={theme.textSecondary}>Bienvenido de nuevo,</Text>
                    <Text variant="h2">Carlos Martinez</Text>
                </View>
                <View style={styles.onlineToggle}>
                    <Text variant="caption" color={isOnline ? theme.success : theme.textSecondary} weight="600">
                        {isOnline ? 'ONLINE' : 'OFFLINE'}
                    </Text>
                    <Switch
                        value={isOnline}
                        onValueChange={setIsOnline}
                        trackColor={{ false: theme.border, true: theme.success }}
                        style={{ marginLeft: 8 }}
                    />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Stats */}
                <View style={styles.statsRow}>
                    <Card style={[styles.statCard, { flex: 1, marginRight: 8 }]}>
                        <View style={[styles.iconContainer, { backgroundColor: theme.surface }]}>
                            <DollarSign size={20} color={theme.primary} />
                        </View>
                        <Text variant="h3" style={{ marginTop: 8 }}>$1,250</Text>
                        <Text variant="caption" color={theme.textSecondary}>Ganancias hoy</Text>
                    </Card>
                    <Card style={[styles.statCard, { flex: 1, marginLeft: 8 }]}>
                        <View style={[styles.iconContainer, { backgroundColor: theme.surface }]}>
                            <Clock size={20} color={theme.warning} />
                        </View>
                        <Text variant="h3" style={{ marginTop: 8 }}>4.5h</Text>
                        <Text variant="caption" color={theme.textSecondary}>Tiempo activo</Text>
                    </Card>
                </View>

                {/* Urgent Request (PAS-AORA Style) */}
                {isOnline && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text variant="h3">Solicitudes Inmediatas</Text>
                            <View style={styles.liveBadge}>
                                <View style={[styles.dot, { backgroundColor: theme.error }]} />
                                <Text variant="caption" color={theme.error} weight="bold" style={{ marginLeft: 4 }}>EN VIVO</Text>
                            </View>
                        </View>

                        <Card style={{ borderColor: theme.primary, borderWidth: 1 }}>
                            <View style={styles.jobHeader}>
                                <View style={styles.jobBadge}>
                                    <Text variant="caption" color={theme.white} weight="bold">URGENTE</Text>
                                </View>
                                <Text variant="h3" color={theme.primary}>$450.00</Text>
                            </View>

                            <Text variant="h3" style={{ marginTop: 4 }}>Reparación de Fuga de Agua</Text>

                            <View style={styles.jobRow}>
                                <MapPin size={16} color={theme.textSecondary} />
                                <Text color={theme.textSecondary} style={{ marginLeft: 6 }}>Col. Polanco, CDMX (2.5 km)</Text>
                            </View>

                            <View style={styles.jobRow}>
                                <Clock size={16} color={theme.textSecondary} />
                                <Text color={theme.textSecondary} style={{ marginLeft: 6 }}>Lo antes posible</Text>
                            </View>

                            <View style={styles.actionRow}>
                                <Button title="Rechazar" variant="ghost" style={{ flex: 1, marginRight: 8 }} />
                                <Button title="Aceptar Trabajo" style={{ flex: 2 }} />
                            </View>
                        </Card>
                    </View>
                )}

                {/* Next Job */}
                <View style={styles.section}>
                    <Text variant="h3" style={{ marginBottom: 12 }}>Próximos Programados</Text>
                    <Card>
                        <View style={styles.scheduleRow}>
                            <View style={styles.timeColumn}>
                                <Text variant="h3">14:00</Text>
                                <Text variant="caption" color={theme.textSecondary}>PM</Text>
                            </View>
                            <View style={[styles.timelineLine, { backgroundColor: theme.border }]} />
                            <View style={styles.jobDetails}>
                                <Text variant="body" weight="600">Instalación Eléctrica</Text>
                                <Text variant="caption" color={theme.textSecondary}>Av. Reforma 222 • Cliente Premium</Text>
                                <Button
                                    title="Ver detalle"
                                    variant="outline"
                                    size="sm"
                                    style={{ marginTop: 8, alignSelf: 'flex-start' }}
                                />
                            </View>
                        </View>
                    </Card>
                </View>
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 24,
    },
    onlineToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.05)',
        padding: 6,
        borderRadius: 20,
        paddingLeft: 12,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    statsRow: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    statCard: {
        padding: 16,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    jobHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    jobBadge: {
        backgroundColor: '#EF4444',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    jobRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    actionRow: {
        flexDirection: 'row',
        marginTop: 16,
    },
    scheduleRow: {
        flexDirection: 'row',
    },
    timeColumn: {
        alignItems: 'center',
        width: 50,
        paddingRight: 12,
    },
    timelineLine: {
        width: 2,
        marginRight: 16,
    },
    jobDetails: {
        flex: 1,
        paddingBottom: 4,
    }
});
