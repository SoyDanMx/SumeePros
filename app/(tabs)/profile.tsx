import React from 'react';
import { View, ScrollView, StyleSheet, Image, TouchableOpacity, Linking } from 'react-native';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Star, ShieldCheck, MapPin, Briefcase, User, LogOut, HelpCircle, FileText, QrCode, ShoppingBag, Building2, Wallet } from 'lucide-react-native';

export default function ProfileScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const { user, signOut } = useAuth();

    const handleLogout = () => {
        signOut();
    };

    return (
        <Screen style={{ backgroundColor: theme.surface }}>
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                {/* ID Card / Header */}
                <Card style={[styles.profileCard, { borderColor: theme.border }]}>
                    {/* Blue Header Background */}
                    <View style={[styles.blueHeader, { backgroundColor: theme.primary }]}>
                        <View style={styles.logoBadge}>
                            <ShieldCheck size={16} color="white" />
                            <Text style={{ fontSize: 10, color: 'white', fontWeight: 'bold', marginLeft: 4 }}>Sumee Pro</Text>
                        </View>
                    </View>

                    <View style={styles.profileContent}>
                        <View style={styles.avatarRow}>
                            <Image
                                source={{ uri: 'https://github.com/shadcn.png' }} // Placeholder or user.avatar
                                style={[styles.avatar, { borderColor: theme.card }]}
                            />
                            <View style={{ flex: 1, marginLeft: 16, paddingTop: 8 }}>
                                <Text variant="h2">{/*user?.name ||*/ 'Dan Nuno'}</Text>
                                <Text color={theme.textSecondary} style={{ marginBottom: 4 }}>Especialista en CCTV y Seguridad</Text>
                                <Text variant="caption" color={theme.textSecondary}>danaserviciosintegrales@gmail.com</Text>

                                <View style={styles.ratingRow}>
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <Star key={i} size={14} color="#F59E0B" fill="#F59E0B" style={{ marginRight: 2 }} />
                                    ))}
                                    <Text variant="caption" weight="bold" style={{ marginLeft: 4 }}>5.0/5.0</Text>
                                    <View style={[styles.idBadge, { backgroundColor: theme.surface }]}>
                                        <Text variant="caption" style={{ fontSize: 10 }}>ID: 158107</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <Text variant="caption" color={theme.textSecondary} style={{ marginTop: 12, fontStyle: 'italic' }}>
                            Especialista: CCTV y Alarmas, Electricistas...
                        </Text>

                        {/* Action Buttons */}
                        <View style={styles.statsActions}>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.surface }]}>
                                <Briefcase size={16} color={theme.primary} />
                                <Text variant="caption" style={{ marginLeft: 6 }}>Trabajos...</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.surface }]}>
                                <MapPin size={16} color={theme.primary} />
                                <Text variant="caption" style={{ marginLeft: 6 }}>Mapa...</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#F59E0B' }]}>
                                <FileText size={16} color="white" />
                                <Text variant="caption" color="white" style={{ marginLeft: 6 }}>Identificac...</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Card>

                {/* Grid Menu */}
                <View style={styles.menuGrid}>
                    <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.card, borderColor: theme.primary, borderWidth: 1 }]}>
                        <User size={24} color={theme.primary} />
                        <Text weight="600" style={{ marginTop: 8 }}>Perfil Profesional</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.push('/marketplace')} style={[styles.menuItem, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}>
                        <ShoppingBag size={24} color={theme.textSecondary} />
                        <Text weight="600" style={{ marginTop: 8 }}>Tienda Sumee</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.push('/bank-account')} style={[styles.menuItem, { backgroundColor: '#DCFCE7', borderColor: '#10B981', borderWidth: 1 }]}>
                        <Building2 size={24} color="#10B981" />
                        <Text weight="600" style={{ marginTop: 8, color: '#065F46' }}>Datos Bancarios</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}>
                        <HelpCircle size={24} color={theme.textSecondary} />
                        <Text weight="600" style={{ marginTop: 8 }}>Centro de Ayuda</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleLogout} style={[styles.menuItem, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}>
                        <LogOut size={24} color={theme.textSecondary} />
                        <Text weight="600" style={{ marginTop: 8 }}>Cerrar Sesión</Text>
                    </TouchableOpacity>
                </View>

                {/* Footer Info */}
                <Card style={{ marginTop: 20 }}>
                    <View style={styles.infoRow}>
                        <Text variant="caption" color={theme.textSecondary}>Estado:</Text>
                        <Text variant="caption" color={theme.success} weight="bold">Activo</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text variant="caption" color={theme.textSecondary}>Miembro desde:</Text>
                        <Text variant="caption" weight="bold">oct 2025</Text>
                    </View>

                    <View style={{ alignItems: 'center', marginTop: 16 }}>
                        <View style={{ padding: 8, borderWidth: 1, borderColor: theme.border, borderRadius: 8 }}>
                            <QrCode size={64} color={theme.primary} />
                        </View>
                        <Text variant="caption" color={theme.primary} style={{ marginTop: 8 }}>Código QR</Text>
                        <Text variant="caption" color={theme.textSecondary}>Escanea para verificar</Text>
                    </View>
                </Card>

            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    profileCard: {
        padding: 0,
        overflow: 'hidden',
    },
    blueHeader: {
        height: 80,
        padding: 16,
    },
    logoBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    profileContent: {
        padding: 16,
        paddingTop: 0,
    },
    avatarRow: {
        flexDirection: 'row',
        marginTop: -30,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    idBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 8,
    },
    statsActions: {
        flexDirection: 'row',
        marginTop: 16,
        gap: 8,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 8,
    },
    menuGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 20,
    },
    menuItem: {
        width: '48%',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        aspectRatio: 1.4,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    }
});
