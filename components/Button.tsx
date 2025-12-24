import React from 'react';
import { TouchableOpacity, ActivityIndicator, StyleSheet, TouchableOpacityProps, View } from 'react-native';
import { Text } from './Text';
import { useTheme } from '@/contexts/ThemeContext';

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    icon?: React.ReactNode;
}

export function Button({ title, variant = 'primary', size = 'md', loading, icon, style, disabled, ...props }: ButtonProps) {
    const { theme } = useTheme();

    const getBgColor = () => {
        if (disabled) return theme.surface;
        switch (variant) {
            case 'primary': return theme.primary;
            case 'secondary': return theme.surface;
            case 'outline': return 'transparent';
            case 'ghost': return 'transparent';
            default: return theme.primary;
        }
    };

    const getTextColor = () => {
        if (disabled) return theme.textSecondary;
        switch (variant) {
            case 'primary': return theme.white;
            case 'secondary': return theme.text;
            case 'outline': return theme.primary;
            case 'ghost': return theme.textSecondary;
            default: return theme.white;
        }
    };

    const getHeight = () => {
        switch (size) {
            case 'sm': return 36;
            case 'lg': return 56;
            default: return 48;
        }
    };

    return (
        <TouchableOpacity
            style={[
                styles.button,
                {
                    backgroundColor: getBgColor(),
                    height: getHeight(),
                    borderColor: variant === 'outline' ? theme.border : 'transparent',
                    borderWidth: variant === 'outline' ? 1 : 0,
                },
                style
            ]}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <View style={styles.content}>
                    {icon && <View style={styles.icon}>{icon}</View>}
                    <Text
                        weight="600"
                        style={{
                            color: getTextColor(),
                            fontSize: size === 'sm' ? 13 : size === 'lg' ? 18 : 16
                        }}
                    >
                        {title}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        paddingHorizontal: 16,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        marginRight: 8,
    }
});
