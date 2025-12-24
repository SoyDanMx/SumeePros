import React from 'react';
import { View, ScrollView, StyleSheet, Image } from 'react-native';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useTheme } from '@/contexts/ThemeContext';
import { ShoppingBag, Search, Filter, Star } from 'lucide-react-native';

const PRODUCTS = [
    { id: 1, name: 'Taladro Percutor 20V', price: '$1,299', rating: 4.8, category: 'Herramientas' },
    { id: 2, name: 'Set de Desarmadores', price: '$349', rating: 4.5, category: 'Manual' },
    { id: 3, name: 'Cinta Métrica 5m', price: '$89', rating: 4.9, category: 'Medición' },
    { id: 4, name: 'Nivel Láser', price: '$899', rating: 4.7, category: 'Medición' },
];

export default function MarketplaceScreen() {
    const { theme } = useTheme();

    return (
        <Screen>
            <View style={styles.header}>
                <Text variant="h2">Tienda Sumee</Text>
                <Button
                    title=""
                    icon={<ShoppingBag size={20} color={theme.text} />}
                    variant="ghost"
                    style={{ paddingHorizontal: 0 }}
                />
            </View>

            <View style={styles.searchBar}>
                <View style={[styles.searchInput, { backgroundColor: theme.surface }]}>
                    <Search size={20} color={theme.textSecondary} />
                    <Text color={theme.textSecondary} style={{ marginLeft: 8 }}>Buscar herramientas...</Text>
                </View>
                <View style={[styles.filterBtn, { backgroundColor: theme.surface }]}>
                    <Filter size={20} color={theme.text} />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Promo Banner */}
                <Card style={[styles.banner, { backgroundColor: theme.primary }]} padding="lg">
                    <Text variant="h2" color={theme.white}>Ofertas Semanales</Text>
                    <Text color={theme.white} style={{ opacity: 0.9 }}>Hasta 30% en herramientas eléctricas</Text>
                </Card>

                <Text variant="h3" style={{ marginBottom: 16 }}>Destacados</Text>

                <View style={styles.grid}>
                    {PRODUCTS.map(product => (
                        <Card key={product.id} style={styles.productCard} padding="none">
                            <View style={[styles.productImage, { backgroundColor: theme.surface }]}>
                                {/* Placeholder Image */}
                                <ShoppingBag size={40} color={theme.textSecondary} style={{ opacity: 0.2 }} />
                            </View>
                            <View style={styles.productInfo}>
                                <Text variant="label" numberOfLines={1}>{product.name}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                    <Star size={12} color={theme.warning} fill={theme.warning} />
                                    <Text variant="caption" style={{ marginLeft: 2 }}>{product.rating}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                                    <Text variant="h3" color={theme.primary}>{product.price}</Text>
                                    <View style={[styles.addBtn, { backgroundColor: theme.primary }]}>
                                        <Text color={theme.white}>+</Text>
                                    </View>
                                </View>
                            </View>
                        </Card>
                    ))}
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
        marginRight: 12,
    },
    filterBtn: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    banner: {
        marginBottom: 32,
        height: 120,
        justifyContent: 'center',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    productCard: {
        width: '48%',
        marginBottom: 16,
        overflow: 'hidden',
    },
    productImage: {
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
    },
    productInfo: {
        padding: 12,
    },
    addBtn: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
