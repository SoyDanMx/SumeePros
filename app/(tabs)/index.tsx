import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Switch, Alert, Platform, ActivityIndicator, Animated, PanResponder } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/Text';
import { UniversalMap } from '@/components/UniversalMap';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { JobsService, Job } from '@/services/jobs';
import {
    Zap, MapPin, Search, Filter, Clock, Bell, User,
    ChevronRight, Star, ArrowRight, Trophy, FileText, Shield, QrCode, X, Check
} from 'lucide-react-native';
import { BadgesService, UserBadges } from '@/services/badges';
import { Skeleton } from '@/components/Skeleton';
import ConfettiCannon from 'react-native-confetti-cannon';
import { supabase } from '@/lib/supabase';
import { AuthService } from '@/services/auth';
import { NotificationsService } from '@/services/notifications';

const { width, height } = Dimensions.get('window');

// Branding Colors
const SUMEE_PURPLE = '#6D28D9';
const SUMEE_PURPLE_DARK = '#4C1D95';
const SUMEE_GREEN = '#10B981';
const TEXT_DARK = '#374151';

// Swipeable Lead Card Component
function SwipeableLeadCard({ job, onAccept, onReject, onPress }: { job: Job; onAccept: () => void; onReject: () => void; onPress: () => void }) {
    const pan = useRef(new Animated.ValueXY()).current;
    const cardOpacity = useRef(new Animated.Value(1)).current;

    const panResponder = useRef(PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 10,
        onPanResponderMove: Animated.event([null, { dx: pan.x }], { useNativeDriver: false }),
        onPanResponderRelease: (_, gestureState) => {
            if (gestureState.dx > 120) {
                Animated.parallel([
                    Animated.timing(pan.x, { toValue: width, duration: 200, useNativeDriver: false }),
                    Animated.timing(cardOpacity, { toValue: 0, duration: 200, useNativeDriver: false })
                ]).start(() => {
                    pan.setValue({ x: 0, y: 0 });
                    cardOpacity.setValue(1);
                    onAccept();
                });
            } else if (gestureState.dx < -120) {
                Animated.parallel([
                    Animated.timing(pan.x, { toValue: -width, duration: 200, useNativeDriver: false }),
                    Animated.timing(cardOpacity, { toValue: 0, duration: 200, useNativeDriver: false })
                ]).start(() => {
                    pan.setValue({ x: 0, y: 0 });
                    cardOpacity.setValue(1);
                    onReject();
                });
            } else {
                Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
            }
        }
    })).current;

    const rotate = pan.x.interpolate({
        inputRange: [-width / 2, 0, width / 2],
        outputRange: ['-10deg', '0deg', '10deg']
    });

    const acceptOpacity = pan.x.interpolate({
        inputRange: [0, 100],
        outputRange: [0, 1],
        extrapolate: 'clamp'
    });

    const rejectOpacity = pan.x.interpolate({
        inputRange: [-100, 0],
        outputRange: [1, 0],
        extrapolate: 'clamp'
    });

    return (
        <Animated.View
            style={[
                styles.swipeCard,
                { transform: [{ translateX: pan.x }, { rotate }], opacity: cardOpacity }
            ]}
            {...panResponder.panHandlers}
        >
            {/* Accept Overlay */}
            <Animated.View style={[styles.swipeOverlay, styles.acceptOverlay, { opacity: acceptOpacity }]}>
                <Check size={48} color="white" />
                <Text style={{ color: 'white', fontWeight: 'bold', marginTop: 8 }}>ACEPTAR</Text>
            </Animated.View>

            {/* Reject Overlay */}
            <Animated.View style={[styles.swipeOverlay, styles.rejectOverlay, { opacity: rejectOpacity }]}>
                <X size={48} color="white" />
                <Text style={{ color: 'white', fontWeight: 'bold', marginTop: 8 }}>RECHAZAR</Text>
            </Animated.View>

            <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={{ flex: 1 }}>
                <View style={styles.swipeCardHeader}>
                    <View style={styles.leadIconBox}>
                        <Zap size={24} color={SUMEE_PURPLE} />
                    </View>
                    <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 18, color: TEXT_DARK }} numberOfLines={1}>
                            {job.title || job.category}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                            <MapPin size={14} color="#9CA3AF" />
                            <Text style={{ fontSize: 13, color: '#6B7280', marginLeft: 4 }} numberOfLines={1}>{job.location}</Text>
                        </View>
                    </View>
                </View>

                <Text style={{ color: '#6B7280', fontSize: 14, marginVertical: 12, lineHeight: 20 }} numberOfLines={3}>
                    {job.description}
                </Text>

                <View style={styles.swipeCardFooter}>
                    <View>
                        <Text style={{ fontSize: 12, color: '#9CA3AF' }}>Precio Estimado</Text>
                        <Text style={{ fontSize: 28, fontWeight: '900', color: SUMEE_GREEN }}>${job.price}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 12, color: '#9CA3AF' }}>Distancia</Text>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: TEXT_DARK }}>{job.distance_km || 2.5} km</Text>
                    </View>
                </View>

                <View style={styles.swipeHint}>
                    <Text style={{ color: '#9CA3AF', fontSize: 12 }}>← Desliza para rechazar • Desliza para aceptar →</Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

export default function HomeScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const { user, profile } = useAuth();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [currentJobIndex, setCurrentJobIndex] = useState(0);
    const [isOnline, setIsOnline] = useState(profile?.is_online ?? true);
    const [todayEarnings, setTodayEarnings] = useState(0);
    const [userBadges, setUserBadges] = useState<UserBadges | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loading, setLoading] = useState(true);
    const [showConfetti, setShowConfetti] = useState(false);

    // Default location (Mexico City)
    const defaultLocation = { latitude: 19.4326, longitude: -99.1332 };

    useEffect(() => {
        loadData();
    }, [user]);

    useEffect(() => {
        if (profile) {
            setIsOnline(profile.is_online);
        }
    }, [profile]);

    useEffect(() => {
        if (user) {
            NotificationsService.registerForPushNotificationsAsync(user.id);
        }
    }, [user]);

    const triggerCelebration = () => {
        setShowConfetti(false);
        setTimeout(() => setShowConfetti(true), 10);
    };

    const expedienteStatus = userBadges?.expediente_status || 'not_uploaded';

    useEffect(() => {
        const subscription = JobsService.subscribeToJobs((payload) => {
            console.log('Lead update:', payload);

            // Only notify for NEW jobs and if professional is online
            if (payload.eventType === 'INSERT' && isOnline) {
                NotificationsService.triggerLocalNotification(
                    '🔔 Nuevo Trabajo Disponible',
                    `${payload.new.title || payload.new.category || 'Misión Sumee'} por $${payload.new.price}`,
                    { jobId: payload.new.id }
                );
            }

            loadData();
        });

        return () => {
            if (subscription && subscription.unsubscribe) {
                subscription.unsubscribe();
            }
        };
    }, [isOnline]); // Re-subscribe if online status changes to ensure notification logic uses correct state

    const loadData = async () => {
        setIsLoading(true);
        try {
            const fetchedJobs = await JobsService.getJobs();
            setJobs(fetchedJobs);
            setCurrentJobIndex(0);

            if (user) {
                const earnings = await JobsService.getEarningsToday(user.id);
                setTodayEarnings(earnings);

                const badges = await BadgesService.getUserBadges(user.id);
                setUserBadges(badges);
            }
        } catch (error) {
            console.error('Failed to load jobs:', error);
        } finally {
            setIsLoading(false);
            setLoading(false);
        }
    };

    const nextJob = () => {
        setCurrentJobIndex(prev => prev + 1);
    };

    const handleAccept = async () => {
        const job = jobs[currentJobIndex];
        if (!job || !user) return;

        try {
            const { error } = await JobsService.acceptJob(job.id, user.id);
            if (error) {
                Alert.alert('Error', 'No se pudo aceptar el trabajo. Intenta de nuevo.');
                return;
            }
            triggerCelebration();
            // In a real app, navigate to job details or active job view
            Alert.alert('¡Éxito!', 'Misión aceptada. Ve a la pestaña de Trabajos para ver los detalles.');
            nextJob();
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Ocurrió un problema al aceptar el trabajo.');
        }
    };

    const handleAcceptJob = () => {
        handleAccept();
    };

    const handleRejectJob = () => {
        nextJob();
    };

    const handleSOS = async () => {
        Alert.alert(
            "🚨 ALERTA SOS",
            "¿Estás en una situación de peligro? Esto enviará tu ubicación exacta a los administradores de Sumee para asistencia inmediata.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "ENVIAR ALERTA",
                    style: "destructive",
                    onPress: async () => {
                        const { error } = await supabase
                            .from('admin_notifications')
                            .insert({
                                type: 'sos_alert',
                                title: '🚨 EMERGENCIA: Profesional en Peligro',
                                message: `El profesional ${user?.id} ha activado la alerta SOS.`,
                                user_id: user?.id,
                                metadata: {
                                    lat: defaultLocation.latitude, // In real app, get current GPS
                                    lng: defaultLocation.longitude,
                                    phone: user?.phone,
                                    timestamp: new Date().toISOString()
                                }
                            });

                        if (error) {
                            Alert.alert("Error", "No se pudo enviar la alerta. Llama al 911 si es una emergencia real.");
                        } else {
                            Alert.alert("Alerta Enviada", "Hemos recibido tu señal. Mantén la calma, estamos revisando tu ubicación.");
                        }
                    }
                }
            ]
        );
    };

    const currentJob = jobs[currentJobIndex];

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Cargando aplicación...</Text>
            </View>
        );
    }

    // Prepare markers from jobs
    const jobMarkers = jobs.map((job: any) => ({
        id: job.id,
        latitude: job.latitude || defaultLocation.latitude + (Math.random() - 0.5) * 0.02,
        longitude: job.longitude || defaultLocation.longitude + (Math.random() - 0.5) * 0.02,
        type: 'job' as const
    }));

    return (
        <View style={styles.container}>
            {/* INTERACTIVE MAP BACKGROUND */}
            <UniversalMap
                latitude={defaultLocation.latitude}
                longitude={defaultLocation.longitude}
                zoom={13}
                markers={jobMarkers}
                showUserLocation={true}
                userLocation={{
                    latitude: defaultLocation.latitude - 0.005,
                    longitude: defaultLocation.longitude - 0.005
                }}
                style={styles.mapBackground}
                interactive={true}
            />

            {/* HUD HEADER */}
            <View style={styles.hudContainer}>
                <View style={styles.glassHeader}>
                    <View style={styles.topRow}>
                        <TouchableOpacity onPress={() => router.push('/profile')} style={styles.profileSection}>
                            <View style={styles.avatarBorder}>
                                <User size={24} color={TEXT_DARK} />
                            </View>
                            <View style={{ marginLeft: 10 }}>
                                <Text style={{ fontWeight: 'bold', color: TEXT_DARK, fontSize: 16 }}>
                                    {profile?.full_name || 'Profesional'}
                                </Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={{ fontSize: 12, color: SUMEE_PURPLE, fontWeight: '600' }}>
                                        ⭐ {profile?.average_rating || '5.0'}
                                    </Text>
                                    {userBadges && (
                                        <View style={[styles.miniLevelBadge, { backgroundColor: BadgesService.getLevelColor(userBadges.currentLevel) }]}>
                                            <Trophy size={8} color="white" />
                                            <Text style={styles.miniLevelText}>{BadgesService.getLevelName(userBadges.currentLevel)}</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </TouchableOpacity>

                        <View style={styles.earningsBadge}>
                            <Text style={{ fontSize: 10, color: TEXT_DARK, opacity: 0.6 }}>GANANCIAS HOY</Text>
                            <Text style={{ fontWeight: '900', color: SUMEE_GREEN, fontSize: 20 }}>
                                ${todayEarnings.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.statusRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={[styles.statusDot, { backgroundColor: isOnline ? SUMEE_GREEN : '#9CA3AF' }]} />
                            <Text style={{ fontWeight: 'bold', fontSize: 16, color: TEXT_DARK, marginLeft: 8 }}>
                                {isOnline ? '🟢 Estás en línea' : '⚪ Desconectado'}
                            </Text>
                        </View>
                        <Switch
                            value={isOnline}
                            onValueChange={async (value) => {
                                setIsOnline(value);
                                if (user) {
                                    await AuthService.updateProfile(user.id, { is_online: value });
                                }
                            }}
                            trackColor={{ false: '#E5E7EB', true: '#C4B5FD' }}
                            thumbColor={isOnline ? SUMEE_PURPLE : '#F3F4F6'}
                        />
                    </View>
                </View>
            </View>

            {/* FABs */}
            <View style={styles.fabContainer}>
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => router.push('/profile')} // Quick access to profile/QR
                >
                    <QrCode size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: '#EF4444', marginTop: 12 }]}
                    onPress={handleSOS}
                >
                    <Shield size={24} color="white" />
                </TouchableOpacity>
            </View>

            {/* TINDER-STYLE LEAD CARDS */}
            {/* Conditional Overlay for Verification */}
            {expedienteStatus !== 'approved' && (
                <View style={styles.verificationOverlay}>
                    <View style={styles.verificationCard}>
                        {expedienteStatus === 'not_uploaded' ? (
                            <>
                                <FileText size={48} color={theme.primary} />
                                <Text variant="h2" style={styles.vTitle}>Expediente Incompleto</Text>
                                <Text style={styles.vDesc}>Para comenzar a recibir trabajos y ganar puntos, debes subir tu documentación oficial.</Text>
                                <TouchableOpacity
                                    onPress={() => router.push('/professional-docs')}
                                    style={{ width: '100%', marginTop: 10, backgroundColor: SUMEE_PURPLE, paddingVertical: 12, borderRadius: 24, alignItems: 'center' }}
                                >
                                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Subir Documentos</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <Clock size={48} color="#EAB308" />
                                <Text variant="h2" style={styles.vTitle}>Validación en Progreso</Text>
                                <Text style={styles.vDesc}>Estamos revisando tus documentos. Te notificaremos por WhatsApp en cuanto seas aprobado.</Text>
                                <View style={styles.statusBadgePending}>
                                    <Text style={styles.statusTextPending}>Pendiente de Aprobación</Text>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            )}

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {isLoading ? (
                    <View style={styles.cardStack}>
                        <View style={styles.skeletonCard}>
                            <Skeleton height={200} borderRadius={24} style={{ marginBottom: 16 }} />
                            <Skeleton width="60%" height={24} style={{ marginBottom: 8 }} />
                            <Skeleton width="40%" height={16} style={{ marginBottom: 20 }} />
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Skeleton width="30%" height={40} borderRadius={20} />
                                <Skeleton width="30%" height={40} borderRadius={20} />
                            </View>
                        </View>
                    </View>
                ) : isOnline ? (
                    currentJob ? (
                        <View style={styles.cardStack}>
                            <Text style={styles.sectionTitle}>⚡ Nueva Chamba Disponible</Text>
                            <SwipeableLeadCard
                                key={currentJob.id}
                                job={currentJob}
                                onAccept={handleAcceptJob}
                                onReject={handleRejectJob}
                                onPress={() => router.push({ pathname: '/job/[id]', params: { id: currentJob.id } })}
                            />
                            <Text style={{ textAlign: 'center', color: '#9CA3AF', marginTop: 12 }}>
                                {currentJobIndex + 1} de {jobs.length} trabajos
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.radarContainer}>
                            <ActivityIndicator size="large" color={SUMEE_PURPLE} />
                            <Text style={{ marginTop: 12, color: '#6B7280', fontWeight: '600' }}>
                                {jobs.length === 0 ? 'Buscando oportunidades cercanas...' : '¡Has revisado todos los trabajos!'}
                            </Text>
                            {jobs.length > 0 && (
                                <TouchableOpacity
                                    style={{ marginTop: 16, backgroundColor: SUMEE_PURPLE, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 }}
                                    onPress={() => setCurrentJobIndex(0)}
                                >
                                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Ver de nuevo</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )
                ) : (
                    <View style={styles.offlineContainer}>
                        <Text style={{ fontSize: 16, color: '#6B7280', textAlign: 'center' }}>
                            Conéctate para empezar a recibir alertas de trabajo.
                        </Text>
                        <TouchableOpacity
                            style={{ marginTop: 16, backgroundColor: SUMEE_PURPLE, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 }}
                            onPress={() => setIsOnline(true)}
                        >
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>Conectarme</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {showConfetti && (
                <ConfettiCannon
                    count={200}
                    origin={{ x: width / 2, y: -20 }}
                    fadeOut={true}
                    onAnimationEnd={() => setShowConfetti(false)}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    mapBackground: {
        ...StyleSheet.absoluteFillObject,
        height: '100%',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'flex-end',
        paddingBottom: 30, // Ensure content doesn't get cut off by bottom padding
    },
    // HUD
    hudContainer: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : Platform.OS === 'web' ? 20 : 40, left: 20, right: 20, zIndex: 10 },
    glassHeader: { backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: 20, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 12 },
    profileSection: { flexDirection: 'row', alignItems: 'center' },
    avatarBorder: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: SUMEE_GREEN, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6' },
    earningsBadge: { alignItems: 'flex-end' },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statusDot: { width: 12, height: 12, borderRadius: 6 },
    // FABs
    fabContainer: { position: 'absolute', right: 20, top: Platform.OS === 'web' ? 180 : 220, zIndex: 10 },
    fab: { width: 56, height: 56, borderRadius: 28, backgroundColor: TEXT_DARK, alignItems: 'center', justifyContent: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65, elevation: 8 },
    // Card Stack
    cardContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 30 }, // This is now redundant as content is in ScrollView
    cardStack: { paddingHorizontal: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: TEXT_DARK, marginBottom: 12, textShadowColor: 'rgba(255,255,255,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
    // Swipeable Card
    swipeCard: { backgroundColor: 'white', borderRadius: 24, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 10, minHeight: 280 },
    swipeCardHeader: { flexDirection: 'row', alignItems: 'center' },
    leadIconBox: { backgroundColor: '#F3E8FF', padding: 12, borderRadius: 16 },
    swipeCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
    swipeHint: { alignItems: 'center', marginTop: 16 },
    swipeOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 24, alignItems: 'center', justifyContent: 'center', zIndex: 100 },
    acceptOverlay: { backgroundColor: 'rgba(16, 185, 129, 0.9)' },
    rejectOverlay: { backgroundColor: 'rgba(239, 68, 68, 0.9)' },
    // States
    radarContainer: { height: 200, backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, alignItems: 'center', justifyContent: 'center', padding: 20, marginHorizontal: 20, borderRadius: 24, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 10 },
    offlineContainer: { height: 160, backgroundColor: 'white', borderRadius: 24, marginHorizontal: 20, alignItems: 'center', justifyContent: 'center', padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 8 },
    miniLevelBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        marginLeft: 8,
    },
    miniLevelText: {
        color: 'white',
        fontSize: 9,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    verificationOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        zIndex: 100,
        justifyContent: 'center',
        padding: 24,
    },
    verificationCard: {
        alignItems: 'center',
        padding: 30,
        backgroundColor: 'white',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        borderRadius: 24, // Added for consistency with other cards
    },
    vTitle: {
        marginTop: 20,
        marginBottom: 10,
        textAlign: 'center',
    },
    vDesc: {
        textAlign: 'center',
        color: '#64748B',
        marginBottom: 20,
        lineHeight: 20,
    },
    statusBadgePending: {
        backgroundColor: '#FEF9C3',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#EAB308',
    },
    statusTextPending: {
        color: '#854D0E',
        fontSize: 12,
        fontWeight: 'bold',
    },
    skeletonCard: {
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 24,
        padding: 20,
        height: 380,
    }
});
