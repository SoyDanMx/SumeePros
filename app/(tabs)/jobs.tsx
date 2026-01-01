import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useTheme } from '@/contexts/ThemeContext';
import { JobsService, Job } from '@/services/jobs';
import { useRouter } from 'expo-router';
import { Clock, MapPin, Calendar as CalendarIcon, CheckCircle, User, MessageCircle, AlertCircle, ArrowRight } from 'lucide-react-native';

const TABS = ['Solicitudes', 'Programados', 'Historial'];

export default function JobsScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('Solicitudes');
    const [jobs, setJobs] = useState<Job[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await JobsService.getJobs();
            setJobs(data);
        } catch (error) {
            console.error(error);
        }
    };

    const renderLeadCard = (job: Job) => (
        <Card style={{ marginBottom: 16, borderRadius: 12, overflow: 'hidden' }} padding="md">
            {/* Header: Client & Badge */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                        <User size={18} color="#4B5563" />
                    </View>
                    <Text weight="bold" style={{ fontSize: 15 }}>{job.client_name || 'Cliente Sumee'}</Text>
                </View>
                <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
                    <Text style={{ color: '#D97706', fontSize: 12, fontWeight: 'bold' }}>Nuevo</Text>
                </View>
            </View>

            {/* Description */}
            <Text style={{ color: theme.textSecondary, marginBottom: 12, lineHeight: 20 }}>
                {job.description}
            </Text>

            {/* Price / Total */}
            <Text style={{ fontSize: 16, marginBottom: 16, fontWeight: '600', color: theme.success }}>
                Total Estimado: ${job.price}
            </Text>

            {/* Meta Info */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 12 }}>
                <View>
                    <Text variant="caption" color={theme.textSecondary} weight="bold">Servicio</Text>
                    <Text variant="caption" color={theme.text}>{job.category}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text variant="caption" color={theme.textSecondary} weight="bold">Distancia</Text>
                    <Text variant="caption" color={theme.text}>8.4 km aprox.</Text>
                </View>
            </View>

            {/* Actions - Web Style */}
            <View style={{ gap: 12 }}>
                {/* Main Action */}
                <Button
                    title="Aceptar Trabajo"
                    style={{ backgroundColor: '#10B981', height: 48 }}
                    icon={<CheckCircle size={20} color="white" />}
                    onPress={() => router.push({ pathname: '/job/[id]', params: { id: job.id } })}
                />

                {/* Secondary Actions */}
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Button
                        title="WhatsApp"
                        style={{ flex: 1, backgroundColor: '#25D366' }}
                        icon={<MessageCircle size={20} color="white" />}
                        onPress={() => Linking.openURL(`https://wa.me/`)}
                    />
                    <Button
                        title="Ubicación"
                        style={{ flex: 1, backgroundColor: '#3B82F6' }}
                        icon={<MapPin size={20} color="white" />}
                        onPress={() => router.push({ pathname: '/job/[id]', params: { id: job.id } })}
                    />
                </View>
            </View>
        </Card>
    );

    const renderScheduledCard = (job: Job) => (
        <Card style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text variant="label" color={theme.textSecondary}>ID: #{job.id.substring(0, 4)}</Text>
                <Text variant="label" color={theme.primary}>${job.price}.00</Text>
            </View>
            <Text variant="h3" style={{ marginBottom: 4 }}>{job.category}</Text>
            <Text variant="body" color={theme.textSecondary} style={{ marginBottom: 12 }} numberOfLines={2}>{job.description}</Text>

            <View style={styles.infoRow}>
                <CalendarIcon size={16} color={theme.textSecondary} />
                <Text style={styles.infoText}>Mañana, 10:00 AM</Text>
            </View>
            <View style={styles.infoRow}>
                <MapPin size={16} color={theme.textSecondary} />
                <Text style={styles.infoText}>{job.location}</Text>
            </View>

            <View style={styles.footer}>
                <Button
                    title="Ver Detalles"
                    variant="outline"
                    size="sm"
                    style={{ flex: 1 }}
                    onPress={() => router.push({ pathname: '/job/[id]', params: { id: job.id } })}
                />
            </View>
        </Card>
    );

    const renderEmptyState = (text: string) => (
        <View style={styles.emptyState}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <CheckCircle size={32} color={theme.textSecondary} />
            </View>
            <Text color={theme.textSecondary} style={{ textAlign: 'center' }}>{text}</Text>
        </View>
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
                    <>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <Text variant="label" color={theme.textSecondary}>CHAMBAS DISPONIBLES ({jobs.filter(j => j.is_urgent).length})</Text>
                        </View>
                        {jobs.filter(j => j.is_urgent).length > 0 ? (
                            jobs.filter(j => j.is_urgent).map(job => (
                                <View key={job.id}>
                                    {renderLeadCard(job)}
                                </View>
                            ))
                        ) : (
                            renderEmptyState('No hay chambas disponibles por el momento.')
                        )}
                    </>
                )}

                {activeTab === 'Programados' && (
                    <>
                        <Text variant="label" color={theme.textSecondary} style={{ marginBottom: 12 }}>PRÓXIMOS</Text>
                        {jobs.filter(j => !j.is_urgent && j.status !== 'completed').length > 0 ? (
                            jobs.filter(j => !j.is_urgent && j.status !== 'completed').map(job => (
                                <View key={job.id}>
                                    {renderScheduledCard(job)}
                                </View>
                            ))
                        ) : (
                            renderEmptyState('No tienes trabajos programados.')
                        )}
                    </>
                )}

                {activeTab === 'Historial' && (
                    <>
                        <Text variant="label" color={theme.textSecondary} style={{ marginBottom: 12 }}>COMPLETADOS</Text>
                        {renderEmptyState('Tu historial aparecerá aquí.')}
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
