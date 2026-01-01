import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, Easing, Dimensions, StyleSheet } from 'react-native';

const { width, height } = Dimensions.get('window');

interface ConfettiPiece {
    id: number;
    x: Animated.Value;
    y: Animated.Value;
    rotation: Animated.Value;
    color: string;
}

const CONFETTI_COLORS = ['#6D28D9', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899'];

interface ConfettiCelebrationProps {
    visible: boolean;
    onComplete?: () => void;
    duration?: number;
}

/**
 * ConfettiCelebration - Beautiful confetti animation for celebrations
 * Use when: Job completed, payment received, level up, etc.
 */
export function ConfettiCelebration({ visible, onComplete, duration = 3000 }: ConfettiCelebrationProps) {
    const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

    useEffect(() => {
        if (visible) {
            // Generate confetti pieces
            const newPieces: ConfettiPiece[] = [];
            for (let i = 0; i < 50; i++) {
                newPieces.push({
                    id: i,
                    x: new Animated.Value(Math.random() * width),
                    y: new Animated.Value(-50),
                    rotation: new Animated.Value(0),
                    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
                });
            }
            setPieces(newPieces);

            // Animate each piece
            newPieces.forEach((piece, index) => {
                const delay = index * 30;
                const fallDuration = 2000 + Math.random() * 1000;

                Animated.parallel([
                    Animated.timing(piece.y, {
                        toValue: height + 50,
                        duration: fallDuration,
                        delay,
                        easing: Easing.quad,
                        useNativeDriver: true,
                    }),
                    Animated.timing(piece.rotation, {
                        toValue: 360 * (2 + Math.random() * 3),
                        duration: fallDuration,
                        delay,
                        easing: Easing.linear,
                        useNativeDriver: true,
                    }),
                    Animated.sequence([
                        Animated.timing(piece.x, {
                            toValue: (Math.random() - 0.5) * 100 + parseFloat(JSON.stringify(piece.x)),
                            duration: fallDuration / 2,
                            delay,
                            useNativeDriver: true,
                        }),
                        Animated.timing(piece.x, {
                            toValue: (Math.random() - 0.5) * 100 + parseFloat(JSON.stringify(piece.x)),
                            duration: fallDuration / 2,
                            useNativeDriver: true,
                        }),
                    ]),
                ]).start();
            });

            // Cleanup after animation
            setTimeout(() => {
                setPieces([]);
                onComplete?.();
            }, duration);
        }
    }, [visible]);

    if (!visible || pieces.length === 0) return null;

    return (
        <View style={styles.container} pointerEvents="none">
            {pieces.map((piece) => (
                <Animated.View
                    key={piece.id}
                    style={[
                        styles.confetti,
                        {
                            backgroundColor: piece.color,
                            transform: [
                                { translateX: piece.x },
                                { translateY: piece.y },
                                {
                                    rotate: piece.rotation.interpolate({
                                        inputRange: [0, 360],
                                        outputRange: ['0deg', '360deg'],
                                    })
                                },
                            ],
                        },
                    ]}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1000,
        overflow: 'hidden',
    },
    confetti: {
        position: 'absolute',
        width: 10,
        height: 10,
        borderRadius: 2,
    },
});

export default ConfettiCelebration;
