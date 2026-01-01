import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { ArrowLeft, ShoppingBag, Info, RefreshCw } from 'lucide-react-native';

export default function MarketplaceScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [key, setKey] = useState(0);

    const marketplaceUrl = 'http://localhost:3000/marketplace';

    const handleRefresh = () => {
        setKey(prev => prev + 1);
    };

    return (
        <Screen style={{ backgroundColor: '#fff' }}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#1E293B" />
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                    <ShoppingBag size={20} color={theme.primary} />
                    <Text variant="h1" style={styles.title}>Marketplace</Text>
                </View>
                <TouchableOpacity onPress={handleRefresh} style={styles.refreshBtn}>
                    <RefreshCw size={20} color="#64748B" />
                </TouchableOpacity>
            </View>

            {/* PRO Promo Banner */}
            <View style={styles.promoBanner}>
                <Info size={18} color="#1D4ED8" />
                <Text style={styles.promoText}>
                    Busca consumibles, herramientas y equipos para tus proyectos. ¡Ofrecemos un <Text weight="bold" style={{ color: '#1D4ED8' }}>precio preferencial al PRO</Text>!
                </Text>
            </View>

            {/* WebView Container */}
            <View style={styles.webviewContainer}>
                {Platform.OS === 'web' ? (
                    <View style={styles.webFallback}>
                        <ShoppingBag size={48} color={theme.primary} opacity={0.5} />
                        <Text style={styles.webFallbackText}>
                            El Marketplace se abre en una nueva pestaña en modo web.
                        </Text>
                        <TouchableOpacity
                            onPress={() => window.open(marketplaceUrl, '_blank')}
                            style={[styles.openBtn, { backgroundColor: theme.primary }]}
                        >
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>Abrir Marketplace</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <WebView
                            key={key}
                            source={{ uri: marketplaceUrl }}
                            style={{ flex: 1 }}
                            onLoadStart={() => setLoading(true)}
                            onLoadEnd={() => setLoading(false)}
                            startInLoadingState={true}
                            renderLoading={() => (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color={theme.primary} />
                                </View>
                            )}
                        />
                    </>
                )}
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 15,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    backBtn: {
        padding: 8,
    },
    refreshBtn: {
        padding: 8,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1E293B',
        marginLeft: 8,
    },
    promoBanner: {
        flexDirection: 'row',
        backgroundColor: '#EFF6FF',
        padding: 12,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#DBEAFE',
    },
    promoText: {
        flex: 1,
        marginLeft: 10,
        fontSize: 13,
        color: '#1E40AF',
        lineHeight: 18,
    },
    webviewContainer: {
        flex: 1,
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
    },
    webFallback: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    webFallbackText: {
        textAlign: 'center',
        color: '#64748B',
        marginTop: 16,
        marginBottom: 24,
        fontSize: 16,
    },
    openBtn: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    }
});
