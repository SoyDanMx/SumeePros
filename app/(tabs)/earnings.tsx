import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import {
    TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft,
    CreditCard, DollarSign, Wallet, ChevronRight,
    Calendar, Eye, EyeOff, Clock, CheckCircle2, AlertCircle
} from 'lucide-react-native';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { RefreshControl } from 'react-native';

interface Transaction {
    id: string;
    type: 'income' | 'withdrawal' | 'pending';
    title: string;
    subtitle: string;
    amount: number;
    date: string;
    status: string;
}

const { width } = Dimensions.get('window');

// Brand Colors (Nubank-inspired with Sumee Purple)
const SUMEE_PURPLE = '#6D28D9';
const SUMEE_PURPLE_DARK = '#4C1D95';
const SUMEE_PURPLE_LIGHT = '#A78BFA';
const SUCCESS_GREEN = '#10B981';
const TEXT_WHITE = '#FFFFFF';

export default function EarningsScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const { user, profile } = useAuth();
    const [showBalance, setShowBalance] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [totalBalance, setTotalBalance] = useState(0);
    const [pendingBalance, setPendingBalance] = useState(0);
    const [weeklyData, setWeeklyData] = useState<any[]>([]);

    useEffect(() => {
        loadEarningsData();
    }, [user]);

    const loadEarningsData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // 1. Fetch completed and pending leads
            const { data: leads, error } = await supabase
                .from('leads')
                .select('*')
                .eq('professional_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const txs: Transaction[] = (leads || []).map(lead => ({
                id: lead.id,
                type: lead.status === 'completed' ? 'income' : 'pending',
                title: lead.title || lead.category || 'Servicio Profesional',
                subtitle: lead.status === 'completed' ? `Completado • ${lead.location}` : 'En proceso',
                amount: Number(lead.price) || 0,
                date: new Date(lead.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
                status: lead.status
            }));

            setTransactions(txs);

            // 2. Calculate balances
            const completedTotal = txs
                .filter(t => t.status === 'completed')
                .reduce((acc, t) => acc + t.amount, 0);

            const pendingTotal = txs
                .filter(t => t.status === 'pending')
                .reduce((acc, t) => acc + t.amount, 0);

            setTotalBalance(completedTotal);
            setPendingBalance(pendingTotal);

            // 3. Simple Weekly Data calculation (mocked for chart structure but based on actual sum)
            setWeeklyData([
                { day: 'L', amount: 450, height: 45 },
                { day: 'M', amount: 780, height: 78 },
                { day: 'X', amount: 320, height: 32 },
                { day: 'J', amount: 890, height: 89 },
                { day: 'V', amount: completedTotal > 0 ? 100 : 0, height: completedTotal > 0 ? 100 : 0 },
                { day: 'S', amount: 0, height: 0 },
                { day: 'D', amount: 0, height: 0 },
            ]);

        } catch (error) {
            console.error('[Earnings] Load error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadEarningsData();
    };

    const weeklyTotal = weeklyData.reduce((acc, d) => acc + d.amount, 0);

    return (
        <View style={styles.container}>
            {/* Purple Header Section (Nubank style) */}
            <View style={styles.purpleHeader}>
                <View style={styles.headerTop}>
                    <Text style={styles.headerTitle}>Billetera</Text>
                    <TouchableOpacity onPress={() => setShowBalance(!showBalance)}>
                        {showBalance ? <Eye size={24} color="white" /> : <EyeOff size={24} color="white" />}
                    </TouchableOpacity>
                </View>

                {/* Main Balance */}
                <View style={styles.balanceSection}>
                    <Text style={styles.balanceLabel}>Saldo disponible</Text>
                    <Text style={styles.balanceAmount}>
                        {showBalance ? `$${totalBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '••••••'}
                    </Text>
                    <View style={styles.trendBadge}>
                        <TrendingUp size={14} color={SUCCESS_GREEN} />
                        <Text style={styles.trendText}>+12.5% vs semana pasada</Text>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/bank-account')}>
                        <View style={styles.actionIcon}>
                            <ArrowUpRight size={24} color={SUMEE_PURPLE} />
                        </View>
                        <Text style={styles.actionText}>Retirar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                        <View style={styles.actionIcon}>
                            <CreditCard size={24} color={SUMEE_PURPLE} />
                        </View>
                        <Text style={styles.actionText}>Tarjeta</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                        <View style={styles.actionIcon}>
                            <Calendar size={24} color={SUMEE_PURPLE} />
                        </View>
                        <Text style={styles.actionText}>Historial</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.scrollContent}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="white" />
                }
            >
                {/* Pending Balance Alert */}
                {pendingBalance > 0 && (
                    <TouchableOpacity style={styles.pendingCard}>
                        <View style={styles.pendingIcon}>
                            <Clock size={20} color="#F59E0B" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontWeight: 'bold', color: '#92400E' }}>Pago en proceso</Text>
                            <Text style={{ color: '#B45309', fontSize: 13 }}>
                                ${pendingBalance.toFixed(2)} será depositado en 24-48 hrs
                            </Text>
                        </View>
                        <ChevronRight size={20} color="#92400E" />
                    </TouchableOpacity>
                )}

                {/* Weekly Chart Section */}
                <View style={styles.chartSection}>
                    <View style={styles.chartHeader}>
                        <Text style={styles.sectionTitle}>Ingresos de la semana</Text>
                        <Text style={styles.chartTotal}>${weeklyTotal.toLocaleString()}</Text>
                    </View>

                    {/* Period Selector */}
                    <View style={styles.periodSelector}>
                        {(['week', 'month', 'year'] as const).map((period) => (
                            <TouchableOpacity
                                key={period}
                                style={[styles.periodButton, selectedPeriod === period && styles.periodButtonActive]}
                                onPress={() => setSelectedPeriod(period)}
                            >
                                <Text style={[styles.periodText, selectedPeriod === period && styles.periodTextActive]}>
                                    {period === 'week' ? 'Semana' : period === 'month' ? 'Mes' : 'Año'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Bar Chart */}
                    <View style={styles.chartContainer}>
                        {weeklyData.map((data, index) => (
                            <View key={index} style={styles.barColumn}>
                                <View style={styles.barWrapper}>
                                    <View style={[styles.bar, { height: `${data.height}%` }]} />
                                </View>
                                <Text style={styles.barLabel}>{data.day}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={[styles.statCard, { backgroundColor: '#DCFCE7' }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <ArrowDownLeft size={16} color={SUCCESS_GREEN} />
                            <Text style={{ marginLeft: 4, color: SUCCESS_GREEN, fontSize: 12 }}>Total</Text>
                        </View>
                        <Text style={styles.statAmount}>${totalBalance.toLocaleString()}</Text>
                        <Text style={styles.statPeriod}>Acumulado</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#FEE2E2' }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <ArrowUpRight size={16} color="#EF4444" />
                            <Text style={{ marginLeft: 4, color: '#EF4444', fontSize: 12 }}>Retiros</Text>
                        </View>
                        <Text style={[styles.statAmount, { color: '#EF4444' }]}>$0.00</Text>
                        <Text style={styles.statPeriod}>Este mes</Text>
                    </View>
                </View>

                {/* Transactions List */}
                <View style={styles.transactionsSection}>
                    <View style={styles.transactionsHeader}>
                        <Text style={styles.sectionTitle}>Movimientos recientes</Text>
                        <TouchableOpacity>
                            <Text style={{ color: SUMEE_PURPLE, fontWeight: '600' }}>Ver todo</Text>
                        </TouchableOpacity>
                    </View>

                    {transactions.length > 0 ? transactions.map((tx) => (
                        <TouchableOpacity key={tx.id} style={styles.transactionRow}>
                            <View style={[
                                styles.txIcon,
                                { backgroundColor: tx.type === 'income' ? '#DCFCE7' : tx.type === 'withdrawal' ? '#FEE2E2' : '#FEF3C7' }
                            ]}>
                                {tx.type === 'income' ? (
                                    <ArrowDownLeft size={20} color={SUCCESS_GREEN} />
                                ) : tx.type === 'withdrawal' ? (
                                    <ArrowUpRight size={20} color="#EF4444" />
                                ) : (
                                    <Clock size={20} color="#F59E0B" />
                                )}
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={{ fontWeight: '600', color: '#1F2937' }}>{tx.title}</Text>
                                <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }} numberOfLines={1}>{tx.subtitle}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={{
                                    fontWeight: 'bold',
                                    fontSize: 16,
                                    color: tx.status === 'completed' ? SUCCESS_GREEN : '#F59E0B'
                                }}>
                                    {tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                                </Text>
                                <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{tx.date}</Text>
                            </View>
                        </TouchableOpacity>
                    )) : (
                        <View style={{ padding: 40, alignItems: 'center' }}>
                            <Text style={{ color: '#9CA3AF' }}>No hay movimientos aún</Text>
                        </View>
                    )}
                </View>

                {/* Withdraw CTA */}
                <TouchableOpacity style={styles.withdrawButton} onPress={() => router.push('/bank-account')}>
                    <Wallet size={24} color="white" />
                    <Text style={styles.withdrawText}>Retirar dinero ahora</Text>
                    <ChevronRight size={24} color="white" />
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    // Purple Header
    purpleHeader: {
        backgroundColor: SUMEE_PURPLE,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 20,
        paddingBottom: 30,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    balanceSection: {
        marginBottom: 24,
    },
    balanceLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 4,
    },
    balanceAmount: {
        fontSize: 42,
        fontWeight: '900',
        color: 'white',
        letterSpacing: -1,
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
        marginTop: 8,
    },
    trendText: {
        color: SUCCESS_GREEN,
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 4,
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    actionButton: {
        alignItems: 'center',
    },
    actionIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    actionText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '600',
    },
    // Content
    scrollContent: {
        flex: 1,
        marginTop: -20,
    },
    pendingCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        marginHorizontal: 20,
        marginTop: 30,
        padding: 16,
        borderRadius: 16,
    },
    pendingIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FDE68A',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    // Chart
    chartSection: {
        backgroundColor: 'white',
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    chartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    chartTotal: {
        fontSize: 20,
        fontWeight: '900',
        color: SUMEE_PURPLE,
    },
    periodSelector: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 4,
        marginBottom: 20,
    },
    periodButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 10,
    },
    periodButtonActive: {
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    periodText: {
        color: '#6B7280',
        fontWeight: '500',
    },
    periodTextActive: {
        color: SUMEE_PURPLE,
        fontWeight: 'bold',
    },
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 120,
    },
    barColumn: {
        flex: 1,
        alignItems: 'center',
    },
    barWrapper: {
        width: 24,
        height: 100,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        justifyContent: 'flex-end',
        overflow: 'hidden',
    },
    bar: {
        width: '100%',
        backgroundColor: SUMEE_PURPLE,
        borderRadius: 12,
    },
    barLabel: {
        marginTop: 8,
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    // Stats
    statsGrid: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginTop: 16,
        gap: 12,
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
    },
    statAmount: {
        fontSize: 24,
        fontWeight: '900',
        color: SUCCESS_GREEN,
        marginTop: 8,
    },
    statPeriod: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
    },
    // Transactions
    transactionsSection: {
        marginTop: 24,
        paddingHorizontal: 20,
    },
    transactionsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    transactionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 16,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    txIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Withdraw CTA
    withdrawButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: SUMEE_PURPLE,
        marginHorizontal: 20,
        marginTop: 24,
        padding: 18,
        borderRadius: 16,
        shadowColor: SUMEE_PURPLE,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    withdrawText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginHorizontal: 12,
    },
});
