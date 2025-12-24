import React from 'react';
import { View, ScrollView, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { useTheme } from '@/contexts/ThemeContext';
import { User, Shield, Wrench, Settings, ChevronRight, Star, LogOut } from 'lucide-react-native';

export default function ProfileScreen() {
    const { theme } = useTheme();

    const renderMenuItem = (icon: React.ReactNode, title: string, subtitle?: string) => (
        <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.iconBox, { backgroundColor: theme.surface }]}>
                {icon}
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
                <Text weight="600">{title}</Text>
                {subtitle && <Text variant="caption" color={theme.textSecondary}>{subtitle}</Text>}
            </View>
            <ChevronRight size={20} color={theme.textSecondary} />
        </TouchableOpacity>
    );

    return (
        <Screen>
            <View style={styles.header}>
                <Text variant="h1">Perfil</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatar}>
                        <Text variant="h1" color={theme.textSecondary}>CM</Text>
                    </View>
                    <View style={{ marginLeft: 16 }}>
                        <Text variant="h2">Carlos Martinez</Text>
                        <Text color={theme.textSecondary}>Electricista & Plomero</Text>
                        <View style={styles.ratingRow}>
                            <Star size={16} color={theme.warning} fill={theme.warning} />
                            <Text weight="600" style={{ marginLeft: 4 }}>4.9</Text>
                            <Text color={theme.textSecondary} style={{ marginLeft: 4 }}>(124 reseñas)</Text>
                        </View>
                    </View>
                </View>

                {/* Verification Badge (PAS-AORA Style: "Certified Pro") */}
                <Card style={[styles.verificationCard, { backgroundColor: '#F0F9FF', borderColor: theme.primary, borderWidth: 1 }]}>
                    <Shield size={24} color={theme.primary} />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text weight="600" color={theme.primary}>Profesional Verificado</Text>
                        <Text variant="caption" color="#0369A1">Documentación aprobada y vigente.</Text>
                    </View>
                </Card>

                {/* Menu */}
                <View style={styles.menuSection}>
                    <Text variant="label" color={theme.textSecondary} style={{ marginBottom: 12, marginLeft: 16 }}>CUENTA</Text>
                    <Card padding="none">
                        {renderMenuItem(<User size={20} color={theme.text} />, "Editar Perfil", "Información personal y foto")}
                        <View style={[styles.divider, { backgroundColor: theme.border }]} />
                        {renderMenuItem(<Shield size={20} color={theme.text} />, "Certificaciones", "Subir documentos y licencias")}
                        <View style={[styles.divider, { backgroundColor: theme.border }]} />
                        {renderMenuItem(<Wrench size={20} color={theme.text} />, "Mis Herramientas", "Gestionar inventario de materiales")}
                    </Card>
                </View>

                <View style={styles.menuSection}>
                    <Text variant="label" color={theme.textSecondary} style={{ marginBottom: 12, marginLeft: 16 }}>APLICACIÓN</Text>
                    <Card padding="none">
                        {renderMenuItem(<Settings size={20} color={theme.text} />, "Configuración", "Notificaciones y privacidad")}
                    </Card>
                </View>

                <TouchableOpacity style={styles.logoutButton}>
                    <LogOut size={20} color={theme.error} />
                    <Text color={theme.error} weight="600" style={{ marginLeft: 8 }}>Cerrar Sesión</Text>
                </TouchableOpacity>

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
        paddingBottom: 40,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    verificationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
        padding: 16,
    },
    menuSection: {
        marginBottom: 24,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    divider: {
        height: 1,
        marginLeft: 72,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        padding: 16,
    }
});
