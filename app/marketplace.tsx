import React from 'react';
import { View, ScrollView, StyleSheet, Image } from 'react-native';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useTheme } from '@/contexts/ThemeContext';
import { ShoppingBag, Search, Filter, Star, Zap, Hammer, HardHat, Truck, ArrowRight } from 'lucide-react-native';

const CATEGORIES = [
    { id: 1, name: 'Herramientas Eléctricas', icon: <Zap size={32} color="#F59E0B" /> },
    { id: 2, name: 'Materiales', icon: <Hammer size={32} color="#EF4444" /> },
    { id: 3, name: 'Seguridad', icon: <HardHat size={32} color="#3B82F6" /> },
    { id: 4, name: 'Renta de Equipo', icon: <Truck size={32} color="#10B981" /> },
];

export default function MarketplaceScreen() {
    const { theme } = useTheme();

    return (
        <Screen>
            <View style={styles.header}>
                <View>
                    <Text variant="caption" color={theme.textSecondary}>Marketplace Profesional</Text>
                    <Text variant="h2">¿Qué necesitas hoy?</Text>
                </View>
                <Button
                    title=""
                    icon={<ShoppingBag size={24} color={theme.text} />}
                    variant="ghost"
                    style={{ paddingHorizontal: 0 }}
                />
            </View>

            <View style={styles.searchBar}>
                <View style={[styles.searchInput, { backgroundColor: theme.surface }]}>
                    <Search size={20} color={theme.textSecondary} />
                    <Text color={theme.textSecondary} style={{ marginLeft: 8 }}>Buscar tornillos, taladros...</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Promo Banner - AORA Style */}
                <Card style={[styles.banner, { backgroundColor: theme.background }]} padding="none">
                    <View style={styles.bannerContent}>
                        <View style={{ flex: 1, padding: 20 }}>
                            <Text variant="h3" style={{ marginBottom: 4 }}>Renueva tu Kit</Text>
                            <Text variant="caption" color={theme.textSecondary} style={{ marginBottom: 12 }}>
                                Descuentos exclusivos en marcas premium para miembros PRO.
                            </Text>
                            <Button
                                title="Ver Ofertas"
                                size="sm"
                                style={{ alignSelf: 'flex-start', backgroundColor: theme.text }}
                            />
                        </View>
                        <View style={{ width: 120, height: '100%', backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' }}>
                            <ShoppingBag size={40} color={theme.textSecondary} />
                        </View>
                    </View>
                </Card>

                {/* Categories Grid - AORA Style */}
                <Text variant="h3" style={{ marginBottom: 16 }}>Categorías</Text>
                <View style={styles.grid}>
                    {CATEGORIES.map(cat => (
                        <Card key={cat.id} style={styles.categoryCard} padding="lg">
                            <View style={{ alignItems: 'center', justifyContent: 'center', height: 80 }}>
                                {cat.icon}
                            </View>
                            <Text weight="600" style={{ textAlign: 'center', marginTop: 8 }}>{cat.name}</Text>
                        </Card>
                    ))}
                </View>

                {/* Quick Access */}
                <View style={{ marginTop: 24 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <Text variant="h3">Tus Favoritos</Text>
                        <ArrowRight size={20} color={theme.primary} />
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginLeft: -20, paddingLeft: 20 }}>
                        {[1, 2, 3].map(i => (
                            <Card key={i} style={{ width: 140, marginRight: 12 }} padding="md">
                                <View style={{ height: 80, backgroundColor: theme.surface, borderRadius: 8, marginBottom: 8 }} />
                                <Text weight="600">Kit Básico</Text>
                                <Text variant="caption" color={theme.textSecondary}>$499</Text>
                            </Card>
                        ))}
                    </ScrollView>
                </View>
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 16,
    },
    searchBar: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    searchInput: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    banner: {
        marginBottom: 24,
        overflow: 'hidden',
    },
    bannerContent: {
        flexDirection: 'row',
        height: 140,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    categoryCard: {
        width: '48%',
        marginBottom: 16,
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
