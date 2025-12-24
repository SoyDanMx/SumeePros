import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { useTheme } from '@/contexts/ThemeContext';
import { TrendingUp, ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';

export default function EarningsScreen() {
    const { theme } = useTheme();

    return (
        <Screen>
            <View style={styles.header}>
                <Text variant="h1">Ganancias</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Total Balance Card */}
                <Card style={styles.balanceCard}>
                    <Text color={theme.textSecondary} variant="label">Saldo Disponible</Text>
                    <Text variant="h1" style={{ fontSize: 40, marginTop: 4 }}>$3,450.00</Text>
                    <View style={styles.trendRow}>
                        <TrendingUp size={16} color={theme.success} />
                        <Text color={theme.success} weight="600" style={{ marginLeft: 4 }}>+12% vs semana pasada</Text>
                    </View>
                </Card>

                {/* Breakdown */}
                <View style={styles.row}>
                    <Card style={{ flex: 1, marginRight: 8 }}>
                        <Text variant="caption" color={theme.textSecondary}>Ingresos</Text>
                        <Text variant="h3">$4,100</Text>
                    </Card>
                    <Card style={{ flex: 1, marginLeft: 8 }}>
                        <Text variant="caption" color={theme.textSecondary}>Retiros</Text>
                        <Text variant="h3">-$650</Text>
                    </Card>
                </View>

                <Text variant="h3" style={{ marginTop: 32, marginBottom: 16 }}>Movimientos Recientes</Text>

                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center' }} padding="sm">
                        <View style={[styles.iconBox, { backgroundColor: theme.surface }]}>
                            <ArrowDownLeft size={20} color={theme.success} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text weight="600">Servicio Completado</Text>
                            <Text variant="caption" color={theme.textSecondary}>Reparación #8392</Text>
                        </View>
                        <Text weight="600" color={theme.success}>+$450.00</Text>
                    </Card>
                ))}
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 16,
    },
    content: {
        paddingHorizontal: 20,
    },
    balanceCard: {
        padding: 24,
        marginBottom: 24,
    },
    trendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        backgroundColor: '#DCFCE7',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    row: {
        flexDirection: 'row',
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
