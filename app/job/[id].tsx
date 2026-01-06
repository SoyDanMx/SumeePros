import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Alert, Image, Platform, Linking, Dimensions, TouchableOpacity, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { JobsService, Job } from '@/services/jobs';
import { JobMap } from '@/components/JobMap';
import { RatingModal } from '@/components/RatingModal';
import { BidirectionalRatingModal } from '@/components/BidirectionalRatingModal';
import { ReviewsService } from '@/services/reviews';
import { ConfettiCelebration } from '@/components/ConfettiCelebration';
import { StreakService } from '@/services/streaks';
import { LocationTracker } from '@/services/location-tracking';
import {
    MapPin, Clock, DollarSign, ShieldAlert, ArrowLeft, Phone, MessageCircle,
    Navigation, User, CheckCircle, Sparkles, Timer, CheckSquare, Square,
    Camera, AlertCircle, ThumbsUp, FileText
} from 'lucide-react-native';
import { QuickQuoteModal } from '@/components/QuickQuoteModal';
import { ScheduleModal } from '@/components/ScheduleModal';
import { WorkInProgressModal } from '@/components/WorkInProgressModal';
import { ChatScreen } from '@/components/ChatScreen';
import { ChatService } from '@/services/chat';

const { width } = Dimensions.get('window');

// Brand Colors
const SUMEE_PURPLE = '#6D28D9';
const SUMEE_GREEN = '#10B981';

export default function JobDetailScreen() {
    const { id } = useLocalSearchParams();
    const { theme } = useTheme();
    const router = useRouter();
    const { user } = useAuth();
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(false);
    const [accepted, setAccepted] = useState(false);
    const [activeTab, setActiveTab] = useState<'detail' | 'map' | 'chat'>('detail');

    // Timer state
    const [elapsedTime, setElapsedTime] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const locationTrackerRef = useRef<LocationTracker | null>(null);

    // Checklist state
    const [checkedItems, setCheckedItems] = useState<boolean[]>([]);

    // Rating & Celebration
    const [showRating, setShowRating] = useState(false);
    const [showBidirectionalRating, setShowBidirectionalRating] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);
    const [canReview, setCanReview] = useState(false);

    // Quote & Schedule Modals
    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [selectedJobForSchedule, setSelectedJobForSchedule] = useState<Job | null>(null);
    
    // Work in Progress Modal
    const [showWorkProgressModal, setShowWorkProgressModal] = useState(false);
    
    // Chat
    const [conversation, setConversation] = useState<any>(null);
    const [loadingConversation, setLoadingConversation] = useState(false);

    useEffect(() => {
        loadJob();
        loadConversation();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [id]);

    useEffect(() => {
        if (accepted && !timerRef.current) {
            // Start timer when job is accepted
            timerRef.current = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);

            // Start location tracking when job is accepted
            if (job && user?.id) {
                locationTrackerRef.current = new LocationTracker({
                    jobId: job.id,
                    userId: user.id,
                    updateInterval: 30000, // 30 seconds
                    onLocationUpdate: (location) => {
                        console.log('[JobDetail] Location updated:', location);
                    },
                    onError: (error) => {
                        console.error('[JobDetail] Location tracking error:', error);
                    },
                });

                locationTrackerRef.current.start().catch(console.error);
            }
        }

        // Cleanup on unmount or when job is completed
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            if (locationTrackerRef.current) {
                locationTrackerRef.current.stop();
                locationTrackerRef.current = null;
            }
        };
    }, [accepted, job?.id, user?.id]);

    const loadJob = async () => {
        try {
            const found = await JobsService.getJobById(id as string);
            setJob(found);
            if (found?.checklist) {
                setCheckedItems(new Array(found.checklist.length).fill(false));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const loadConversation = async () => {
        if (!id || !user?.id) return;
        setLoadingConversation(true);
        try {
            const conv = await ChatService.getOrCreateConversation(id as string, user.id);
            setConversation(conv);
        } catch (error) {
            console.error('[JobDetail] Error loading conversation:', error);
        } finally {
            setLoadingConversation(false);
        }
    };

    const handleAccept = async () => {
        if (!job || !user?.id) return;
        
        setAccepting(true);
        
        // Optimistic update: actualizar UI inmediatamente
        const previousJob = job;
        setJob({ ...job, status: 'accepted' as const });
        setAccepted(true);
        
        try {
            // Usar servicio mejorado si está disponible
            try {
                const { JobsServiceEnhanced } = await import('@/services/jobs-enhanced');
                const result = await JobsServiceEnhanced.acceptJobAtomic(job.id, user.id, {
                    optimisticUpdate: true,
                    notifyClient: true,
                    validateAvailability: false, // Puedes habilitar esto si quieres
                    validateDistance: false,   // Puedes habilitar esto si quieres
                });

                if (!result.success) {
                    // Revertir optimistic update
                    setJob(previousJob);
                    setAccepted(false);
                    
                    // Mostrar error específico
                    const errorMessage = result.error?.message || 'No se pudo aceptar el trabajo.';
                    Alert.alert('Error', errorMessage);
                    return;
                }

                // Si ya estaba aceptado, mostrar mensaje diferente
                if (result.alreadyAccepted) {
                    Alert.alert('Trabajo Aceptado', 'Este trabajo ya estaba aceptado por ti.');
                } else {
                    // Reload job data to get updated status
                    await loadJob();
                    
                    // Show schedule modal after accepting
                    Alert.alert(
                        '¡Trabajo Aceptado!',
                        '¿Deseas agendar este trabajo ahora?',
                        [
                            {
                                text: 'Más tarde',
                                style: 'cancel',
                                onPress: () => {
                                    // Navigate back to jobs screen to see it in "Programados"
                                    router.replace('/(tabs)/jobs');
                                },
                            },
                            {
                                text: 'Agendar',
                                onPress: () => {
                                    setShowScheduleModal(true);
                                },
                            },
                        ]
                    );
                }
            } catch (importError) {
                // Fallback al servicio tradicional
                console.warn('[JobDetail] Enhanced service not available, using fallback');
                const { error } = await JobsService.acceptJob(job.id, user.id);
                
                if (error) {
                    // Revertir optimistic update
                    setJob(previousJob);
                    setAccepted(false);
                    
                    Alert.alert('Error', error.message || 'No se pudo aceptar el trabajo. Tal vez ya fue tomado.');
                    return;
                }
                
                // Reload job data
                await loadJob();
                
                // Show schedule modal
                Alert.alert(
                    '¡Trabajo Aceptado!',
                    '¿Deseas agendar este trabajo ahora?',
                    [
                        {
                            text: 'Más tarde',
                            style: 'cancel',
                            onPress: () => {
                                router.replace('/(tabs)/jobs');
                            },
                        },
                        {
                            text: 'Agendar',
                            onPress: () => {
                                setShowScheduleModal(true);
                            },
                        },
                    ]
                );
            }
        } catch (error: any) {
            // Revertir optimistic update
            setJob(previousJob);
            setAccepted(false);
            
            console.error('[JobDetail] Accept error:', error);
            Alert.alert('Error', error.message || 'No se pudo aceptar el trabajo. Por favor, intenta de nuevo.');
        } finally {
            setAccepting(false);
        }
    };

    const handleComplete = () => {
        Alert.alert(
            'Finalizar Trabajo',
            '¿Confirmas que has terminado el trabajo y cobrado al cliente?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar',
                    onPress: async () => {
                        setIsCompleting(true);
                        // Stop timer
                        if (timerRef.current) {
                            clearInterval(timerRef.current);
                            timerRef.current = null;
                        }
                        
                        // Complete job in database
                        if (job && user?.id) {
                            try {
                                const { error } = await JobsService.completeJob(job.id, user.id);
                                if (error) {
                                    console.error('[JobDetail] Complete error:', error);
                                } else {
                                    // Update streak (Duolingo style)
                                    try {
                                        const streakResult = await StreakService.updateStreakOnJobCompletion(user.id);
                                        
                                        // Show streak milestone celebration if reached
                                        if (streakResult.milestoneReached) {
                                            Alert.alert(
                                                '🔥 ¡Hito de Racha Alcanzado!',
                                                `¡${streakResult.milestoneReached.name}! Has ganado ${streakResult.milestoneReached.reward} puntos extra.`,
                                                [{ text: '¡Genial!' }]
                                            );
                                        }
                                        
                                        // Warn if streak is in danger
                                        if (streakResult.streakBroken) {
                                            Alert.alert(
                                                '💔 Racha Rota',
                                                'Tu racha se ha roto. ¡Comienza una nueva hoy!',
                                                [{ text: 'Entendido' }]
                                            );
                                        }
                                    } catch (streakError) {
                                        console.error('[JobDetail] Streak update error:', streakError);
                                    }
                                }
                            } catch (error) {
                                console.error('[JobDetail] Complete job error:', error);
                            }
                        }
                        
                        // Show celebration
                        setShowConfetti(true);
                        
                        // Verificar si puede calificar antes de mostrar modal
                        if (job && user?.id) {
                            const canReviewJob = await ReviewsService.canReviewJob(
                                job.id,
                                user.id,
                                'professional'
                            );
                            setCanReview(canReviewJob);
                            
                            if (canReviewJob && job.cliente_id) {
                                setTimeout(() => {
                                    setShowBidirectionalRating(true);
                                }, 1500);
                            } else {
                                // Si ya calificó o no puede, solo mostrar confetti
                                setTimeout(() => {
                                    router.replace('/(tabs)/jobs');
                                }, 2000);
                            }
                        } else {
                            setTimeout(() => {
                                router.replace('/(tabs)/jobs');
                            }, 2000);
                        }
                    }
                }
            ]
        );
    };

    const handleRatingSubmit = (rating: number, comment: string) => {
        console.log('Rating submitted:', { rating, comment, jobId: job?.id });
        // In production, save to Supabase
    };

    const toggleCheckItem = (index: number) => {
        const newChecked = [...checkedItems];
        newChecked[index] = !newChecked[index];
        setCheckedItems(newChecked);
    };

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const openNavigation = () => {
        if (!job?.latitude || !job?.longitude) return;
        
        const lat = job.latitude;
        const lng = job.longitude;
        const label = encodeURIComponent(job.title || job.location || 'Destino');
        
        // Improved navigation with Google Maps and Waze support (Uber/Rappi style)
        const urls = Platform.select({
            ios: {
                googleMaps: `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`,
                appleMaps: `maps://app?daddr=${lat},${lng}&dirflg=d`,
                waze: `waze://?ll=${lat},${lng}&navigate=yes`,
                fallback: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
            },
            android: {
                googleMaps: `google.navigation:q=${lat},${lng}`,
                waze: `waze://?ll=${lat},${lng}&navigate=yes`,
                fallback: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
            },
            default: {
                fallback: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
            }
        });

        // Try Google Maps first, then fallback
        if (Platform.OS === 'ios') {
            Linking.canOpenURL(urls?.googleMaps || '').then(supported => {
                if (supported) {
                    Linking.openURL(urls?.googleMaps || '');
                } else {
                    Linking.openURL(urls?.fallback || '');
                }
            }).catch(() => {
                Linking.openURL(urls?.fallback || '');
            });
        } else if (Platform.OS === 'android') {
            Linking.canOpenURL(urls?.googleMaps || '').then(supported => {
                if (supported) {
                    Linking.openURL(urls?.googleMaps || '');
                } else {
                    Linking.openURL(urls?.fallback || '');
                }
            }).catch(() => {
                Linking.openURL(urls?.fallback || '');
            });
        } else {
            Linking.openURL(urls?.fallback || '');
        }
    };

    const completedTasks = checkedItems.filter(Boolean).length;
    const totalTasks = checkedItems.length;
    const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    if (loading) return <Screen style={{ justifyContent: 'center' }}><ActivityIndicator color={theme.primary} /></Screen>;
    if (!job) return <Screen><Text>Trabajo no encontrado</Text></Screen>;

    // -------------------------------------------------------------------------
    // ACCEPTED VIEW (Active Dashboard)
    // -------------------------------------------------------------------------
    if (accepted) {
        return (
            <Screen>
                {/* Confetti */}
                <ConfettiCelebration visible={showConfetti} onComplete={() => setShowConfetti(false)} />

                {/* Rating Modal */}
                {/* Nuevo Modal Bidireccional */}
                {job && user?.id && job.cliente_id && (
                    <BidirectionalRatingModal
                        visible={showBidirectionalRating}
                        onClose={() => {
                            setShowBidirectionalRating(false);
                            router.replace('/(tabs)/jobs');
                        }}
                        onSuccess={() => {
                            // Recargar datos del perfil para actualizar ratings
                            console.log('[JobDetail] Review submitted successfully');
                        }}
                        jobId={job.id}
                        reviewerId={user.id}
                        reviewerType="professional"
                        revieweeId={job.cliente_id}
                        revieweeType="client"
                        revieweeName={job.client_name || job.nombre_cliente || 'Cliente'}
                        jobTitle={job.descripcion_proyecto || job.title || 'Trabajo'}
                    />
                )}

                {/* Modal Legacy (mantener por compatibilidad) */}
                <RatingModal
                    visible={showRating}
                    onClose={() => {
                        setShowRating(false);
                        router.replace('/');
                    }}
                    onSubmit={handleRatingSubmit}
                    clientName={job?.client_name}
                    jobTitle={job?.title}
                />

                {/* Work in Progress Modal */}
                <WorkInProgressModal
                    visible={showWorkProgressModal}
                    job={job}
                    professionalId={user?.id || ''}
                    onClose={() => setShowWorkProgressModal(false)}
                    onPhotoUploaded={() => {
                        // Refresh job data if needed
                        loadJob();
                    }}
                />

                {/* Active Tabs Header */}
                <View style={[styles.tabHeader, { backgroundColor: theme.primary, paddingTop: 60 }]}>
                    <TouchableOpacity onPress={() => setActiveTab('detail')} style={[styles.tabItem, activeTab === 'detail' && styles.activeTabItem]}>
                        <Text style={[styles.tabText, activeTab === 'detail' && styles.activeTabText]}>DETALLE</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setActiveTab('map')} style={[styles.tabItem, activeTab === 'map' && styles.activeTabItem]}>
                        <Text style={[styles.tabText, activeTab === 'map' && styles.activeTabText]}>MAPA</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setActiveTab('chat')} style={[styles.tabItem, activeTab === 'chat' && styles.activeTabItem]}>
                        <Text style={[styles.tabText, activeTab === 'chat' && styles.activeTabText]}>MENSAJES</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ flex: 1 }}>
                    {activeTab === 'detail' && (
                        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }}>
                            {/* Timer Card */}
                            <Card style={[styles.timerCard, { backgroundColor: SUMEE_PURPLE }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <View>
                                        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>TIEMPO ACTIVO</Text>
                                        <Text style={{ color: 'white', fontSize: 36, fontWeight: '900', letterSpacing: -1 }}>
                                            {formatTime(elapsedTime)}
                                        </Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>GANANCIA</Text>
                                        <Text style={{ color: SUMEE_GREEN, fontSize: 24, fontWeight: '900' }}>
                                            ${job.price}
                                        </Text>
                                    </View>
                                </View>
                            </Card>

                            {/* Job Header */}
                            <Card style={{ marginBottom: 16 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                    <View style={[styles.statusBadge, { backgroundColor: '#DCFCE7' }]}>
                                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: SUMEE_GREEN, marginRight: 6 }} />
                                        <Text style={{ color: '#166534', fontWeight: 'bold', fontSize: 12 }}>EN PROGRESO</Text>
                                    </View>
                                    <Text style={{ marginLeft: 8, color: theme.textSecondary, fontSize: 12 }}>ID: #{job.id.substring(0, 6)}</Text>
                                </View>
                                <Text variant="h2" style={{ marginBottom: 4 }}>{job.title}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <MapPin size={14} color={theme.textSecondary} />
                                    <Text color={theme.textSecondary} style={{ marginLeft: 4, fontSize: 13 }}>{job.location}</Text>
                                </View>
                            </Card>

                            {/* Client Contact */}
                            <Card style={{ marginBottom: 16 }} padding="sm">
                                <View style={{ flexDirection: 'row', alignItems: 'center', padding: 8 }}>
                                    <View style={styles.clientAvatar}>
                                        <User size={24} color={SUMEE_PURPLE} />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text weight="bold" style={{ fontSize: 16 }}>{job.client_name}</Text>
                                        <Text color={theme.textSecondary}>{job.client_phone}</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', gap: 12 }}>
                                        <TouchableOpacity onPress={() => Linking.openURL(`tel:${job.client_phone}`)} style={styles.contactBtn}>
                                            <Phone size={20} color="white" />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => Linking.openURL(`https://wa.me/${job.client_phone?.replace(/\s/g, '')}`)} style={[styles.contactBtn, { backgroundColor: '#25D366' }]}>
                                            <MessageCircle size={20} color="white" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </Card>

                            {/* Progress & Tasks */}
                            <View style={{ marginBottom: 16 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <Text variant="h3">Tareas del Servicio</Text>
                                    <Text style={{ color: SUMEE_PURPLE, fontWeight: 'bold' }}>{completedTasks}/{totalTasks}</Text>
                                </View>

                                {/* Progress Bar */}
                                <View style={styles.progressBarBg}>
                                    <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                                </View>
                            </View>

                            {/* Interactive Checklist */}
                            {job.checklist?.map((item, i) => (
                                <TouchableOpacity key={i} onPress={() => toggleCheckItem(i)} style={styles.checklistItem}>
                                    <View style={[styles.checkbox, checkedItems[i] && styles.checkboxChecked]}>
                                        {checkedItems[i] && <CheckCircle size={20} color="white" />}
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{item.label}</Text>
                                        <Text weight={checkedItems[i] ? 'normal' : '600'} style={[checkedItems[i] && styles.completedText]}>
                                            {item.value}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}

                            {/* Quick Actions */}
                            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                                <TouchableOpacity 
                                    style={[
                                        styles.quickAction,
                                        (job.status !== 'en_progreso' && job.status !== 'en_sitio' && job.status !== 'accepted') && {
                                            opacity: 0.5,
                                        }
                                    ]}
                                    onPress={() => {
                                        // Validar estado del trabajo antes de abrir modal
                                        const validStatuses = ['en_progreso', 'en_sitio', 'accepted'];
                                        if (!validStatuses.includes(job.status)) {
                                            Alert.alert(
                                                'No disponible',
                                                'Solo puedes documentar trabajos que están en progreso o aceptados.',
                                                [{ text: 'OK' }]
                                            );
                                            return;
                                        }
                                        setShowWorkProgressModal(true);
                                    }}
                                    disabled={job.status !== 'en_progreso' && job.status !== 'en_sitio' && job.status !== 'accepted'}
                                >
                                    <Camera size={20} color={SUMEE_PURPLE} />
                                    <Text style={{ marginLeft: 8, color: SUMEE_PURPLE, fontWeight: '600' }}>Documentar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.quickAction} onPress={openNavigation}>
                                    <Navigation size={20} color={SUMEE_PURPLE} />
                                    <Text style={{ marginLeft: 8, color: SUMEE_PURPLE, fontWeight: '600' }}>Navegar</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    )}

                    {activeTab === 'map' && (
                        <View style={{ flex: 1 }}>
                            <JobMap
                                latitude={job.latitude || 19.4326}
                                longitude={job.longitude || -99.1332}
                                userLocation={{ latitude: (job.latitude || 19.4326) - 0.005, longitude: (job.longitude || -99.1332) - 0.005 }}
                            />
                            <View style={{ position: 'absolute', bottom: 30, left: 20, right: 20 }}>
                                <Card>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <MapPin size={24} color={theme.primary} style={{ marginRight: 12 }} />
                                        <View style={{ flex: 1 }}>
                                            <Text weight="bold">Destino</Text>
                                            <Text color={theme.textSecondary} numberOfLines={1}>{job.location}</Text>
                                        </View>
                                        <TouchableOpacity style={styles.navBtn} onPress={openNavigation}>
                                            <Navigation size={18} color="white" />
                                            <Text style={{ color: 'white', fontWeight: '600', marginLeft: 6 }}>Ir</Text>
                                        </TouchableOpacity>
                                    </View>
                                </Card>
                            </View>
                        </View>
                    )}

                    {activeTab === 'chat' && (
                        <View style={{ flex: 1 }}>
                            {loadingConversation ? (
                                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                    <ActivityIndicator size="large" color={SUMEE_PURPLE} />
                                </View>
                            ) : conversation ? (
                                <ChatScreen
                                    conversationId={conversation.id}
                                    jobId={job.id}
                                    otherParticipantName={job.client_name || job.nombre_cliente || 'Cliente'}
                                />
                            ) : (
                                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
                                    <MessageCircle size={64} color={theme.textSecondary} style={{ marginBottom: 16 }} />
                                    <Text style={{ textAlign: 'center', color: theme.textSecondary }}>
                                        No se pudo cargar el chat. Intenta de nuevo.
                                    </Text>
                                    <TouchableOpacity
                                        style={[styles.waBtn, { marginTop: 20 }]}
                                        onPress={() => Linking.openURL(`https://wa.me/${job.client_phone?.replace(/\s/g, '')}`)}
                                    >
                                        <MessageCircle size={20} color="white" />
                                        <Text style={{ color: 'white', fontWeight: 'bold', marginLeft: 8 }}>Abrir WhatsApp</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    )}
                </View>

                {/* Footer - Complete Button */}
                {activeTab !== 'map' && !isCompleting && (
                    <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
                        <TouchableOpacity style={styles.completeBtn} onPress={handleComplete}>
                            <ThumbsUp size={24} color="white" />
                            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginLeft: 8 }}>
                                Finalizar Trabajo
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </Screen>
        );
    }

    // -------------------------------------------------------------------------
    // PRE-ACCEPT VIEW (Detail Preview)  - Same as before but with Back button fix
    // -------------------------------------------------------------------------
    return (
        <Screen>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                <ArrowLeft size={24} color="#1F2937" />
            </TouchableOpacity>

            <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
                {/* Map Header */}
                <View style={styles.mapContainer}>
                    <JobMap latitude={job.latitude || 19.4326} longitude={job.longitude || -99.1332} />
                    <View style={[styles.priceTag, { backgroundColor: 'white' }]}>
                        <DollarSign size={18} color={SUMEE_GREEN} />
                        <Text style={{ fontSize: 24, fontWeight: '900', color: SUMEE_GREEN }}>${job.price}</Text>
                    </View>
                </View>

                <View style={{ padding: 20 }}>
                    <View style={styles.headerRow}>
                        <View style={{ flex: 1 }}>
                            <Text variant="h1" style={{ fontSize: 24 }}>{job.title}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                <MapPin size={16} color={theme.textSecondary} />
                                <Text color={theme.textSecondary} style={{ marginLeft: 4 }}>{job.location}</Text>
                            </View>
                        </View>
                        {job.is_urgent && (
                            <View style={[styles.urgentBadge, { backgroundColor: '#FEF2F2' }]}>
                                <ShieldAlert size={20} color={theme.error} />
                            </View>
                        )}
                    </View>

                    {job.ai_tags && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
                            <View style={[styles.tag, { backgroundColor: '#EEF2FF' }]}>
                                <Sparkles size={14} color="#6366F1" />
                                <Text color="#6366F1" weight="600" style={{ fontSize: 12, marginLeft: 4 }}>IA SUMEE</Text>
                            </View>
                            {job.ai_tags.map((tag, i) => (
                                <View key={i} style={[styles.tag, { backgroundColor: theme.surface }]}>
                                    <Text variant="caption" color={theme.textSecondary}>{tag}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    <Text style={{ marginTop: 16, lineHeight: 24 }}>{job.description}</Text>

                    {/* Earnings Breakdown */}
                    <Card style={{ marginTop: 24, padding: 0, overflow: 'hidden' }}>
                        <View style={{ backgroundColor: theme.surface, padding: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                            <Text variant="h3" style={{ fontSize: 16 }}>Desglose de Ingresos</Text>
                        </View>
                        <View style={{ padding: 16 }}>
                            <View style={styles.breakdownRow}>
                                <Text color={theme.textSecondary}>Mano de Obra</Text>
                                <Text weight="600">${job.price}.00</Text>
                            </View>
                            <View style={styles.breakdownRow}>
                                <Text color={theme.textSecondary}>Materiales (estimado)</Text>
                                <Text weight="600">$105.00</Text>
                            </View>
                            {job.bonus && (
                                <View style={styles.breakdownRow}>
                                    <Text color={theme.textSecondary}>Bono por urgencia</Text>
                                    <Text weight="600" color={SUMEE_GREEN}>+${job.bonus}.00</Text>
                                </View>
                            )}
                            <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 12 }} />
                            <View style={[styles.breakdownRow, { marginBottom: 0 }]}>
                                <Text weight="bold" style={{ fontSize: 16 }}>Total a Recibir</Text>
                                <Text weight="bold" style={{ fontSize: 20 }} color={theme.primary}>${job.price + 105 + (job.bonus || 0)}.00</Text>
                            </View>
                        </View>
                    </Card>

                    {/* Checklist Preview */}
                    {job.checklist && job.checklist.length > 0 && (
                        <Card style={{ marginTop: 24 }}>
                            <Text variant="h3" style={{ marginBottom: 12 }}>Resumen del Servicio</Text>
                            {job.checklist.map((item, index) => (
                                <View key={index} style={styles.checkRow}>
                                    <CheckCircle size={16} color={theme.success} />
                                    <View style={{ marginLeft: 12 }}>
                                        <Text variant="caption" color={theme.textSecondary}>{item.label}</Text>
                                        <Text weight="600">{item.value}</Text>
                                    </View>
                                </View>
                            ))}
                        </Card>
                    )}

                    {/* Client (Hidden) */}
                    <Card style={{ marginTop: 24 }}>
                        <Text variant="h3" style={{ marginBottom: 12 }}>Cliente</Text>
                        <View style={styles.clientRow}>
                            <View style={[styles.avatarPlace, { backgroundColor: theme.surface }]}>
                                <User size={24} color={theme.textSecondary} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text weight="600">Cliente Sumee</Text>
                                <Text variant="caption" color={theme.textSecondary}>Acepta para ver datos de contacto</Text>
                            </View>
                        </View>
                    </Card>
                </View>
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
                <View style={styles.warningBox}>
                    <Clock size={16} color={theme.textSecondary} />
                    <Text variant="caption" color={theme.textSecondary} style={{ marginLeft: 8 }}>Llegada requerida: &lt; 60 mins</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity 
                        style={[styles.quoteBtn, { backgroundColor: SUMEE_PURPLE }]} 
                        onPress={() => setShowQuoteModal(true)}
                    >
                        <FileText size={20} color="white" />
                        <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 8 }}>Cotizar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept} disabled={accepting}>
                        {accepting ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Aceptar</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Quick Quote Modal */}
            <QuickQuoteModal
                visible={showQuoteModal}
                job={job}
                professionalId={user?.id || ''}
                onClose={() => setShowQuoteModal(false)}
                onQuoteSent={() => {
                    // Reload job after quote is sent
                    loadJob();
                    setShowQuoteModal(false);
                }}
            />

            {/* Schedule Modal */}
            <ScheduleModal
                visible={showScheduleModal}
                job={job}
                professionalId={user?.id || ''}
                onClose={() => setShowScheduleModal(false)}
                onScheduled={() => {
                    // Reload job after scheduling
                    loadJob();
                    setShowScheduleModal(false);
                }}
            />
        </Screen>
    );
}

const styles = StyleSheet.create({
    backBtn: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 100,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    mapContainer: { height: 250, width: '100%', position: 'relative' },
    priceTag: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 5,
        gap: 4,
    },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    urgentBadge: { padding: 8, borderRadius: 8 },
    tag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
    checkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    clientRow: { flexDirection: 'row', alignItems: 'center' },
    avatarPlace: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 34, borderTopWidth: 1 },
    warningBox: { flexDirection: 'row', justifyContent: 'center', marginBottom: 12 },
    breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    quoteBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
    },
    acceptBtn: {
        flex: 1,
        backgroundColor: SUMEE_GREEN,
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: SUMEE_GREEN,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    // Active Job Styles
    tabHeader: { flexDirection: 'row', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
    tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderBottomWidth: 3, borderBottomColor: 'transparent' },
    activeTabItem: { borderBottomColor: 'white' },
    tabText: { color: 'rgba(255,255,255,0.7)', fontWeight: '600', fontSize: 14 },
    activeTabText: { color: 'white', fontWeight: 'bold' },
    timerCard: { marginBottom: 16, padding: 20, borderRadius: 20 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    clientAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F3E8FF', alignItems: 'center', justifyContent: 'center' },
    contactBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: SUMEE_GREEN, alignItems: 'center', justifyContent: 'center' },
    progressBarBg: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: SUMEE_GREEN, borderRadius: 4 },
    checklistItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E5E7EB' },
    checkbox: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
    checkboxChecked: { backgroundColor: SUMEE_GREEN, borderColor: SUMEE_GREEN },
    completedText: { textDecorationLine: 'line-through', color: '#9CA3AF' },
    quickAction: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: '#F3E8FF', borderRadius: 12 },
    navBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: SUMEE_PURPLE, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
    waBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 20, backgroundColor: '#25D366', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
    completeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: SUMEE_GREEN,
        paddingVertical: 18,
        borderRadius: 16,
        shadowColor: SUMEE_GREEN,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
});
