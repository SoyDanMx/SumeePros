import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Text } from './Text';

interface AnimatedCounterProps {
    value: number;
    prefix?: string;
    suffix?: string;
    duration?: number;
    textStyle?: any;
    color?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SIZES = {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 42,
};

/**
 * AnimatedCounter - Smoothly animated number counter
 * Use for earnings, stats, etc.
 */
export function AnimatedCounter({
    value,
    prefix = '',
    suffix = '',
    duration = 1000,
    textStyle,
    color = '#10B981',
    size = 'lg',
}: AnimatedCounterProps) {
    const animatedValue = useRef(new Animated.Value(0)).current;
    const [displayValue, setDisplayValue] = React.useState(0);

    useEffect(() => {
        // Animate from current to new value
        Animated.timing(animatedValue, {
            toValue: value,
            duration,
            useNativeDriver: false,
        }).start();

        // Update display value during animation
        const listener = animatedValue.addListener(({ value: v }) => {
            setDisplayValue(Math.floor(v));
        });

        return () => {
            animatedValue.removeListener(listener);
        };
    }, [value]);

    const formattedValue = displayValue.toLocaleString('es-MX', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    return (
        <View style={styles.container}>
            <Text style={[
                styles.text,
                { color, fontSize: SIZES[size] },
                textStyle,
            ]}>
                {prefix}{formattedValue}{suffix}
            </Text>
        </View>
    );
}

/**
 * AnimatedEarnings - Specialized counter for money display
 */
export function AnimatedEarnings({
    amount,
    size = 'lg',
    color = '#10B981'
}: {
    amount: number;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    color?: string;
}) {
    return (
        <AnimatedCounter
            value={amount}
            prefix="$"
            color={color}
            size={size}
            textStyle={{ fontWeight: '900', letterSpacing: -1 }}
        />
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    text: {
        fontWeight: '900',
    },
});

export default AnimatedCounter;
