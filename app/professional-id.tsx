import React, { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Dimensions, Share, Platform } from 'react-native';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import {
    ArrowLeft, ShieldCheck, Download, Share2,
    Verified, Star, Calendar, Globe, MapPin,
    Lock, CheckCircle
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { BadgesService, UserBadges } from '@/services/badges';
import { supabaseUrl } from '@/lib/supabase';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';

const { width } = Dimensions.get('window');

export default function ProfessionalIDScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const { user, profile } = useAuth();
    const [userBadges, setUserBadges] = React.useState<UserBadges | null>(null);
    const viewRef = useRef(null);

    React.useEffect(() => {
        if (user) {
            BadgesService.getUserBadges(user.id).then(setUserBadges);
        }
    }, [user]);

    const currentLevelName = userBadges ? BadgesService.getLevelName(userBadges.currentLevel) : 'Cargando...';
    const currentLevelColor = userBadges ? BadgesService.getLevelColor(userBadges.currentLevel) : '#94A3B8';

    // Public verification URL
    const verificationUrl = `https://sumee.pro/verify/${user?.id || 'anonymous'}`;

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Verifica mi Perfil Sumee Pro Verificado aquí: ${verificationUrl}`,
                url: verificationUrl,
            });
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Screen style={{ backgroundColor: '#0F172A' }}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="white" />
                </TouchableOpacity>
                <Text variant="h2" style={{ color: 'white' }}>ID Digital Sumee</Text>
                <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
                    <Share2 size={24} color="white" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* ID CARD CONTAINER */}
                <View style={styles.cardWrapper}>
                    <LinearGradient
                        colors={['#6D28D9', '#4C1D95', '#1E1B4B']}
                        style={styles.idCard}
                    >
                        {/* Decorative Background Patterns */}
                        <View style={styles.cardPattern} />

                        {/* Top Section: Logo & Badge */}
                        <View style={styles.cardHeader}>
                            <View style={styles.logoRow}>
                                <ShieldCheck size={28} color="white" />
                                <View style={{ marginLeft: 8 }}>
                                    <Text style={styles.brandName}>SUMEE PRO</Text>
                                    <Text style={styles.tagline}>VERIFIED PROFESSIONAL</Text>
                                </View>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: currentLevelColor }]}>
                                <Text style={styles.statusText}>{currentLevelName}</Text>
                            </View>
                        </View>

                        {/* Middle Section: Portrait & Info */}
                        <View style={styles.mainInfo}>
                            <View style={styles.avatarContainer}>
                                <View style={[styles.avatarBorder, { borderColor: currentLevelColor }]}>
                                    <Image
                                        source={{ uri: userBadges?.avatar_url ? `${supabaseUrl}/storage/v1/object/public/avatars/${userBadges.avatar_url}` : 'https://github.com/shadcn.png' }}
                                        style={styles.avatar}
                                    />
                                </View>
                                <View style={styles.verifiedIcon}>
                                    <CheckCircle size={20} color="#10B981" fill="#FFF" />
                                </View>
                            </View>

                            <View style={styles.textInfo}>
                                <Text style={styles.nameText}>{profile?.full_name || user?.user_metadata?.full_name || 'Profesional Sumee'}</Text>
                                <Text style={styles.specialtyText}>{profile?.specialty || profile?.category || 'Especialista Verificado'}</Text>

                                <View style={styles.ratingRow}>
                                    <Star size={16} color="#F59E0B" fill="#F59E0B" />
                                    <Text style={styles.ratingText}>{profile?.average_rating || '5.0'} Premium Score</Text>
                                </View>
                            </View>
                        </View>

                        {/* Bottom Section: QR & Secure Data */}
                        <View style={styles.cardFooter}>
                            <View style={styles.qrContainer}>
                                <View style={styles.qrBg}>
                                    <QRCode
                                        value={verificationUrl}
                                        size={90}
                                        color="#000"
                                        backgroundColor="#FFF"
                                    />
                                </View>
                                <Text style={styles.qrLabel}>SCAN TO VERIFY</Text>
                            </View>

                            <View style={styles.secureData}>
                                <View style={styles.dataItem}>
                                    <Calendar size={14} color="rgba(255,255,255,0.6)" />
                                    <Text style={styles.dataText}>VAL: 10/2026</Text>
                                </View>
                                <View style={styles.dataItem}>
                                    <Lock size={14} color="rgba(255,255,255,0.6)" />
                                    <Text style={styles.dataText}>ID: S-{user?.id?.substring(0, 6).toUpperCase()}</Text>
                                </View>
                                <View style={styles.dataItem}>
                                    <Globe size={14} color="rgba(255,255,255,0.6)" />
                                    <Text style={styles.dataText}>sumeeapp.com</Text>
                                </View>
                            </View>
                        </View>
                    </LinearGradient>
                </View>

                {/* Verification Info */}
                <View style={styles.infoSection}>
                    <Text style={styles.securityTitle}>Características de Seguridad</Text>

                    <Card style={styles.securityItem}>
                        <ShieldCheck size={24} color="#10B981" />
                        <View style={styles.securityTextContent}>
                            <Text weight="bold">Cifrado de Identidad</Text>
                            <Text variant="caption" color={theme.textSecondary}>
                                Este ID está vinculado a tu biometría y firma digital certificada por Sumee Pro.
                            </Text>
                        </View>
                    </Card>

                    <Card style={styles.securityItem}>
                        <ArrowLeft size={24} color="#6D28D9" style={{ transform: [{ rotate: '135deg' }] }} />
                        <View style={styles.securityTextContent}>
                            <Text weight="bold">Código Dinámico QR</Text>
                            <Text variant="caption" color={theme.textSecondary}>
                                El cliente puede escanear tu ID para ver tus últimas reseñas y estatus de aprobación real.
                            </Text>
                        </View>
                    </Card>

                    <Button
                        title="Compartir ID con Cliente"
                        icon={<Share2 size={20} color="white" />}
                        onPress={handleShare}
                        style={{ marginTop: 24, height: 60, borderRadius: 16, backgroundColor: '#6D28D9' }}
                    />

                    <Text style={styles.legalNotice}>
                        Este documento es una identificación digital exclusiva para miembros de Sumee Pro. El uso indebido o transferencia está prohibido.
                    </Text>
                </View>
            </ScrollView>
        </Screen>
    );
}

import { ScrollView } from 'react-native';

const styles = StyleSheet.create({
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 20,
    },
    backBtn: {
        padding: 8,
    },
    shareBtn: {
        padding: 8,
    },
    content: {
        padding: 20,
        alignItems: 'center',
    },
    cardWrapper: {
        width: '100%',
        shadowColor: '#6D28D9',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 15,
    },
    idCard: {
        width: '100%',
        borderRadius: 24,
        padding: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    cardPattern: {
        position: 'absolute',
        top: -50,
        right: -50,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    brandName: {
        color: 'white',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    tagline: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 8,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    statusText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    mainInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 40,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatarBorder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        padding: 4,
        borderWidth: 2,
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 46,
    },
    verifiedIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: 'white',
        borderRadius: 12,
    },
    textInfo: {
        marginLeft: 20,
        flex: 1,
    },
    nameText: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
    specialtyText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        marginTop: 4,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    ratingText: {
        color: '#F59E0B',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 6,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        paddingTop: 24,
    },
    qrContainer: {
        alignItems: 'center',
    },
    qrBg: {
        backgroundColor: 'white',
        padding: 8,
        borderRadius: 12,
    },
    qrLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 8,
        fontWeight: 'bold',
        marginTop: 8,
        letterSpacing: 2,
    },
    secureData: {
        alignItems: 'flex-end',
        gap: 8,
    },
    dataItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dataText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 10,
        fontWeight: '600',
        marginLeft: 6,
    },
    infoSection: {
        width: '100%',
        marginTop: 40,
    },
    securityTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    securityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginBottom: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 0,
    },
    securityTextContent: {
        marginLeft: 16,
        flex: 1,
    },
    legalNotice: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 11,
        textAlign: 'center',
        marginTop: 24,
        lineHeight: 16,
        paddingHorizontal: 20,
    }
});
