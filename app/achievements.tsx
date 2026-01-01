import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated, Platform } from 'react-native';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { ArrowLeft, Trophy, ChevronRight, Info, CheckCircle2, Lock } from 'lucide-react-native';
import { BadgesService, UserBadges, Badge, BadgeCategory, BADGE_COLORS } from '@/services/badges';

const { width } = Dimensions.get('window');

export default function AchievementsScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const [userBadges, setUserBadges] = useState<UserBadges | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | 'all'>('all');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await BadgesService.getUserBadges('me');
            setUserBadges(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !userBadges) {
        return (
            <Screen style={{ justifyContent: 'center', alignItems: 'center' }}>
                <Trophy size={48} color={theme.primary} />
                <Text style={{ marginTop: 16 }}>Cargando tus logros...</Text>
            </Screen>
        );
    }

    const filteredBadges = selectedCategory === 'all'
        ? userBadges.badges
        : userBadges.badges.filter(b => b.category === selectedCategory);

    const categories: { label: string; value: BadgeCategory | 'all' }[] = [
        { label: 'Todos', value: 'all' },
        { label: 'Trabajos', value: 'jobs' },
        { label: 'Confianza', value: 'social' },
        { label: 'Rapidez', value: 'speed' },
        { label: 'Fidelidad', value: 'loyalty' },
    ];

    const currentLevelName = BadgesService.getLevelName(userBadges.currentLevel);
    const currentLevelColor = BadgesService.getLevelColor(userBadges.currentLevel);

    // Progress for current level
    const prevThreshold = userBadges.currentLevel > 1 ? 100 : 0; // Simplified for demo
    const progressInLevel = userBadges.totalPoints;
    const pointsToNext = userBadges.nextLevelPoints - progressInLevel;
    const levelProgressPercent = (progressInLevel / userBadges.nextLevelPoints) * 100;

    return (
        <Screen style={{ backgroundColor: '#F8FAFC' }}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: currentLevelColor }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mi Prestigio</Text>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Level Card */}
                <View style={[styles.levelCard, { backgroundColor: currentLevelColor }]}>
                    <View style={styles.levelIconContainer}>
                        <Trophy size={40} color="white" />
                        <View style={styles.levelBadge}>
                            <Text style={styles.levelNumber}>{userBadges.currentLevel}</Text>
                        </View>
                    </View>

                    <Text style={styles.levelName}>{currentLevelName}</Text>
                    <Text style={styles.pointsText}>{userBadges.totalPoints} puntos totales</Text>

                    <View style={styles.progressContainer}>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${levelProgressPercent}%` }]} />
                        </View>
                        <View style={styles.progressLabels}>
                            <Text style={styles.progressSubtext}>Nivel {userBadges.currentLevel}</Text>
                            <Text style={styles.progressSubtext}>Faltan {pointsToNext} pts para el siguiente</Text>
                        </View>
                    </View>
                </View>

                {/* Categories Tab */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoryScroll}
                    contentContainerStyle={{ paddingHorizontal: 20 }}
                >
                    {categories.map((cat) => (
                        <TouchableOpacity
                            key={cat.value}
                            onPress={() => setSelectedCategory(cat.value)}
                            style={[
                                styles.categoryTab,
                                selectedCategory === cat.value && { backgroundColor: theme.primary }
                            ]}
                        >
                            <Text style={[
                                styles.categoryLabel,
                                selectedCategory === cat.value && { color: 'white' }
                            ]}>
                                {cat.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Badges Grid */}
                <View style={styles.badgesGrid}>
                    {filteredBadges.map((badge) => {
                        const isUnlocked = BadgesService.isBadgeUnlocked(badge);
                        const progress = BadgesService.getProgressPercentage(badge);
                        const levelColors = BADGE_COLORS[badge.level];

                        return (
                            <TouchableOpacity
                                key={badge.id}
                                style={[
                                    styles.badgeItem,
                                    !isUnlocked && styles.badgeItemLocked
                                ]}
                                activeOpacity={0.7}
                            >
                                <View style={[
                                    styles.iconCircle,
                                    { backgroundColor: isUnlocked ? levelColors.bg : '#F1F5F9' }
                                ]}>
                                    <Text style={{ fontSize: 32, opacity: isUnlocked ? 1 : 0.3 }}>
                                        {badge.icon}
                                    </Text>
                                    {!isUnlocked && (
                                        <View style={styles.lockOverlay}>
                                            <Lock size={14} color="#94A3B8" />
                                        </View>
                                    )}
                                </View>

                                <Text style={[styles.badgeName, !isUnlocked && { color: '#94A3B8' }]} numberOfLines={1}>
                                    {badge.name}
                                </Text>

                                {isUnlocked ? (
                                    <View style={[styles.statusTag, { backgroundColor: '#DCFCE7' }]}>
                                        <CheckCircle2 size={10} color="#166534" />
                                        <Text style={styles.statusText}>Obtenido</Text>
                                    </View>
                                ) : (
                                    <View style={styles.badgeProgressContainer}>
                                        <View style={styles.badgeProgressBg}>
                                            <View style={[styles.badgeProgressFill, { width: `${progress}%` }]} />
                                        </View>
                                        <Text style={styles.requirementText}>{badge.requirementLabel}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Info Box */}
                <Card style={styles.infoCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <Info size={16} color={theme.primary} />
                        <Text style={{ marginLeft: 8, fontWeight: 'bold', color: theme.primary }}>¿Cómo funciona?</Text>
                    </View>
                    <Text style={{ fontSize: 13, color: '#64748B', lineHeight: 18 }}>
                        Gana puntos desbloqueando insignias. Cada nivel te otorga mayor visibilidad en el mapa y prioridad para recibir nuevos trabajos. El nivel Maestro es el máximo reconocimiento de Sumee.
                    </Text>
                </Card>
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    header: {
        height: 100,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 40,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        marginLeft: 16,
    },
    levelCard: {
        margin: 20,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        marginTop: -10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 10,
    },
    levelIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    levelBadge: {
        position: 'absolute',
        bottom: -5,
        right: -5,
        backgroundColor: 'white',
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    levelNumber: {
        fontWeight: '900',
        fontSize: 14,
        color: '#1E293B',
    },
    levelName: {
        fontSize: 28,
        fontWeight: '900',
        color: 'white',
        letterSpacing: -0.5,
    },
    pointsText: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
        fontWeight: '600',
    },
    progressContainer: {
        width: '100%',
        marginTop: 24,
    },
    progressBarBg: {
        height: 10,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 5,
        width: '100%',
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: 'white',
        borderRadius: 5,
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    progressSubtext: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '500',
    },
    categoryScroll: {
        marginBottom: 20,
    },
    categoryTab: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: 'white',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    categoryLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    badgesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 15,
        justifyContent: 'space-between',
    },
    badgeItem: {
        width: (width - 60) / 2,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    badgeItemLocked: {
        opacity: 0.8,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    lockOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: 'white',
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    badgeName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1E293B',
        textAlign: 'center',
        marginBottom: 8,
    },
    statusTag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#166534',
        marginLeft: 4,
    },
    badgeProgressContainer: {
        width: '100%',
        alignItems: 'center',
    },
    badgeProgressBg: {
        height: 4,
        backgroundColor: '#F1F5F9',
        borderRadius: 2,
        width: '100%',
        marginBottom: 6,
    },
    badgeProgressFill: {
        height: '100%',
        backgroundColor: '#94A3B8',
        borderRadius: 2,
    },
    requirementText: {
        fontSize: 10,
        color: '#94A3B8',
        textAlign: 'center',
    },
    infoCard: {
        margin: 20,
        backgroundColor: '#EFF6FF',
        borderWidth: 1,
        borderColor: '#BFDBFE',
    }
});
