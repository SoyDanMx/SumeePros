import React from 'react';
import { View, StyleSheet, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export function Screen({ children, style, statusBarStyle = 'dark' }: { children: React.ReactNode, style?: any, statusBarStyle?: 'light' | 'dark' }) {
    const { theme } = useTheme();
    return (
        <View style={[styles.container, { backgroundColor: theme.background }, style]}>
            <StatusBar
                barStyle={statusBarStyle === 'light' ? 'light-content' : 'dark-content'}
                backgroundColor="transparent"
                translucent
            />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.content}>
                    {children}
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    content: {
        flex: 1,
    }
});
