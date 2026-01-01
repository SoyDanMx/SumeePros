import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

// Brand colors
const SUMEE_PURPLE = '#6D28D9';

interface SkeletonProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: any;
}

/**
 * Skeleton - Animated loading placeholder
 */
export function Skeleton({
    width: skeletonWidth = '100%',
    height = 20,
    borderRadius = 8,
    style
}: SkeletonProps) {
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(animatedValue, {
                toValue: 1,
                duration: 1500,
                easing: Easing.bezier(0.4, 0, 0.6, 1),
                useNativeDriver: false,
            })
        ).start();
    }, []);

    const backgroundColor = animatedValue.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: ['#E5E7EB', '#F3F4F6', '#E5E7EB'],
    });

    return (
        <Animated.View
            style={[
                {
                    width: skeletonWidth,
                    height,
                    borderRadius,
                    backgroundColor,
                },
                style,
            ]}
        />
    );
}

/**
 * SkeletonCard - Card-shaped skeleton for job cards
 */
export function SkeletonCard() {
    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Skeleton width={48} height={48} borderRadius={12} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Skeleton width="70%" height={18} style={{ marginBottom: 8 }} />
                    <Skeleton width="50%" height={14} />
                </View>
                <Skeleton width={60} height={32} borderRadius={12} />
            </View>
            <Skeleton width="100%" height={14} style={{ marginTop: 16, marginBottom: 8 }} />
            <Skeleton width="80%" height={14} />
            <View style={styles.cardFooter}>
                <View>
                    <Skeleton width={80} height={12} style={{ marginBottom: 4 }} />
                    <Skeleton width={100} height={28} />
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Skeleton width={60} height={12} style={{ marginBottom: 4 }} />
                    <Skeleton width={50} height={20} />
                </View>
            </View>
        </View>
    );
}

/**
 * SkeletonDashboard - Full dashboard skeleton
 */
export function SkeletonDashboard() {
    return (
        <View style={styles.dashboard}>
            {/* Map skeleton */}
            <View style={styles.mapSkeleton}>
                <View style={styles.mapPulse} />
            </View>

            {/* HUD skeleton */}
            <View style={styles.hudSkeleton}>
                <View style={styles.hudRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Skeleton width={48} height={48} borderRadius={24} />
                        <View style={{ marginLeft: 10 }}>
                            <Skeleton width={100} height={16} style={{ marginBottom: 6 }} />
                            <Skeleton width={60} height={12} />
                        </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Skeleton width={80} height={10} style={{ marginBottom: 4 }} />
                        <Skeleton width={70} height={20} />
                    </View>
                </View>
                <View style={[styles.hudRow, { marginTop: 16 }]}>
                    <Skeleton width={140} height={16} />
                    <Skeleton width={50} height={28} borderRadius={14} />
                </View>
            </View>

            {/* Card skeleton */}
            <View style={styles.cardSkeleton}>
                <Skeleton width={180} height={18} style={{ marginBottom: 16, marginLeft: 20 }} />
                <SkeletonCard />
            </View>
        </View>
    );
}

/**
 * SkeletonEarnings - Earnings screen skeleton
 */
export function SkeletonEarnings() {
    return (
        <View style={styles.earnings}>
            {/* Purple header skeleton */}
            <View style={styles.earningsHeader}>
                <Skeleton width={100} height={24} style={{ marginBottom: 24, opacity: 0.3 }} />
                <Skeleton width={80} height={14} style={{ marginBottom: 8, opacity: 0.3 }} />
                <Skeleton width={180} height={42} style={{ marginBottom: 12, opacity: 0.3 }} />
                <Skeleton width={140} height={28} borderRadius={20} style={{ opacity: 0.3 }} />

                <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 24 }}>
                    {[1, 2, 3].map(i => (
                        <View key={i} style={{ alignItems: 'center' }}>
                            <Skeleton width={56} height={56} borderRadius={28} style={{ opacity: 0.5, backgroundColor: 'white' }} />
                            <Skeleton width={50} height={12} style={{ marginTop: 8, opacity: 0.3 }} />
                        </View>
                    ))}
                </View>
            </View>

            {/* Chart skeleton */}
            <View style={styles.chartSkeleton}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                    <Skeleton width={150} height={16} />
                    <Skeleton width={80} height={20} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', height: 100, alignItems: 'flex-end' }}>
                    {[45, 78, 32, 89, 100, 65, 18].map((h, i) => (
                        <Skeleton key={i} width={24} height={h} borderRadius={12} />
                    ))}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 20,
        marginHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    dashboard: {
        flex: 1,
        backgroundColor: '#E0E7FF',
    },
    mapSkeleton: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapPulse: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(109, 40, 217, 0.1)',
    },
    hudSkeleton: {
        position: 'absolute',
        top: 60,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 20,
        padding: 16,
    },
    hudRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardSkeleton: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
    },
    earnings: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    earningsHeader: {
        backgroundColor: SUMEE_PURPLE,
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 30,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    chartSkeleton: {
        backgroundColor: 'white',
        margin: 20,
        padding: 20,
        borderRadius: 20,
    },
});

export default Skeleton;
