import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface CardProps extends ViewProps {
    variant?: 'elevated' | 'outlined' | 'flat';
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ style, variant = 'elevated', padding = 'md', ...props }: CardProps) {
    const { theme, isDark } = useTheme();

    const getPadding = () => {
        switch (padding) {
            case 'none': return 0;
            case 'sm': return 12;
            case 'lg': return 24;
            default: return 16;
        }
    };

    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    borderWidth: variant === 'outlined' ? 1 : 0,
                    padding: getPadding(),
                    shadowColor: isDark ? '#000' : '#64748B',
                    shadowOpacity: variant === 'elevated' ? (isDark ? 0.3 : 0.08) : 0,
                },
                style
            ]}
            {...props}
        />
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 12,
        elevation: 2,
    }
});
