import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemedTextProps extends TextProps {
    variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'label';
    color?: string;
    weight?: 'normal' | 'medium' | 'bold' | '600';
}

export function Text({ style, variant = 'body', color, weight, ...props }: ThemedTextProps) {
    const { theme } = useTheme();

    const getVariantStyle = () => {
        switch (variant) {
            case 'h1': return styles.h1;
            case 'h2': return styles.h2;
            case 'h3': return styles.h3;
            case 'caption': return styles.caption;
            case 'label': return styles.label;
            default: return styles.body;
        }
    };

    const fontWeight = weight === 'medium' ? '500' : weight === 'bold' ? '700' : weight === '600' ? '600' : '400';

    return (
        <RNText
            style={[
                getVariantStyle(),
                { color: color || theme.text, fontWeight: weight ? fontWeight : (getVariantStyle() as any).fontWeight },
                style
            ]}
            {...props}
        />
    );
}

const styles = StyleSheet.create({
    h1: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
    h2: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
    h3: { fontSize: 18, fontWeight: '600' },
    body: { fontSize: 16, lineHeight: 24 },
    caption: { fontSize: 12, lineHeight: 16 },
    label: { fontSize: 14, fontWeight: '500' },
});
