import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { useTheme } from '@/contexts/ThemeContext';
import { ChevronRight } from 'lucide-react-native';

export default function CalendarScreen() {
    const { theme } = useTheme();

    // Quick MVP of a list view, user can expand to full calendar later
    const days = [
        { day: 'Lun', date: '24', jobs: 2 },
        { day: 'Mar', date: '25', jobs: 0 },
        { day: 'Mié', date: '26', jobs: 3, active: true },
        { day: 'Jue', date: '27', jobs: 1 },
        { day: 'Vie', date: '28', jobs: 4 },
        { day: 'Sáb', date: '29', jobs: 0 },
    ];

    return (
        <Screen>
            <View style={styles.header}>
                <Text variant="h1">Agenda</Text>
                <Text color={theme.textSecondary}>Diciembre 2025</Text>
            </View>

            {/* Horizontal Calendar Strip */}
            <View style={{ height: 100 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.calendarStrip}>
                    {days.map((d, i) => (
                        <View
                            key={i}
                            style={[
                                styles.dayCard,
                                {
                                    backgroundColor: d.active ? theme.primary : theme.card,
                                    borderColor: theme.border,
                                    borderWidth: d.active ? 0 : 1
                                }
                            ]}
                        >
                            <Text color={d.active ? theme.white : theme.textSecondary} variant="caption">{d.day}</Text>
                            <Text color={d.active ? theme.white : theme.text} variant="h3">{d.date}</Text>
                            {d.jobs > 0 && (
                                <View style={[styles.dot, { backgroundColor: d.active ? theme.white : theme.primary }]} />
                            )}
                        </View>
                    ))}
                </ScrollView>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text variant="label" color={theme.textSecondary} style={{ marginBottom: 16 }}>HOY, MIÉRCOLES 26</Text>

                <View style={styles.timeBlock}>
                    <Text variant="label" color={theme.textSecondary} style={{ width: 50 }}>09:00</Text>
                    <Card style={{ flex: 1, marginBottom: 16 }} padding="sm">
                        <Text variant="label" color={theme.primary}>Instalación</Text>
                        <Text variant="body" weight="600">Ventilador de Techo</Text>
                        <Text variant="caption" color={theme.textSecondary}>Familia Rodriguez • 1h est.</Text>
                    </Card>
                </View>

                <View style={styles.timeBlock}>
                    <Text variant="label" color={theme.textSecondary} style={{ width: 50 }}>13:30</Text>
                    <Card style={{ flex: 1, marginBottom: 16 }} padding="sm">
                        <Text variant="label" color={theme.warning}>Revisión</Text>
                        <Text variant="body" weight="600">Fugas de Gas</Text>
                        <Text variant="caption" color={theme.textSecondary}>Restaurante El Centro • 2h est.</Text>
                    </Card>
                </View>

                <View style={styles.timeBlock}>
                    <Text variant="label" color={theme.textSecondary} style={{ width: 50 }}>16:00</Text>
                    <View style={[styles.freeBlock, { borderColor: theme.border }]}>
                        <Text color={theme.textSecondary} variant="caption">Tiempo Disponible</Text>
                    </View>
                </View>
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 24,
    },
    calendarStrip: {
        paddingHorizontal: 20,
    },
    dayCard: {
        width: 60,
        height: 80,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        marginTop: 6,
    },
    content: {
        padding: 20,
    },
    timeBlock: {
        flexDirection: 'row',
    },
    freeBlock: {
        flex: 1,
        height: 60,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    }
});
