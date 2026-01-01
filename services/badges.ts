// Badge System for Sumee Pro
// Gamification system to drive engagement and competition

export type BadgeLevel = 'bronze' | 'silver' | 'gold' | 'diamond';
export type BadgeCategory = 'jobs' | 'rating' | 'speed' | 'loyalty' | 'specialty' | 'social';
import { supabase } from '@/lib/supabase';

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string; // emoji or icon name
    category: BadgeCategory;
    level: BadgeLevel;
    requirement: number; // e.g., 10 jobs, 4.5 rating
    requirementLabel: string;
    unlockedAt?: Date;
    progress?: number; // current progress towards requirement
}

export interface UserBadges {
    userId: string;
    badges: Badge[];
    totalPoints: number;
    currentLevel: number;
    nextLevelPoints: number;
    avatar_url?: string;
    expediente_status?: string;
}

// Badge Definitions
export const BADGE_DEFINITIONS: Omit<Badge, 'unlockedAt' | 'progress'>[] = [
    // JOBS COMPLETED BADGES
    {
        id: 'first_job',
        name: 'Primera Chamba',
        description: '¡Completaste tu primer trabajo en Sumee!',
        icon: '🎯',
        category: 'jobs',
        level: 'bronze',
        requirement: 1,
        requirementLabel: '1 trabajo completado',
    },
    {
        id: 'jobs_10',
        name: 'Manos a la Obra',
        description: 'Has completado 10 trabajos exitosamente',
        icon: '🔧',
        category: 'jobs',
        level: 'bronze',
        requirement: 10,
        requirementLabel: '10 trabajos completados',
    },
    {
        id: 'jobs_50',
        name: 'Profesional Dedicado',
        description: '50 clientes han confiado en ti',
        icon: '⚡',
        category: 'jobs',
        level: 'silver',
        requirement: 50,
        requirementLabel: '50 trabajos completados',
    },
    {
        id: 'jobs_100',
        name: 'Centenario',
        description: '¡100 trabajos completados! Eres una leyenda',
        icon: '💯',
        category: 'jobs',
        level: 'gold',
        requirement: 100,
        requirementLabel: '100 trabajos completados',
    },
    {
        id: 'jobs_500',
        name: 'Maestro Artesano',
        description: '500 trabajos. Tu reputación te precede',
        icon: '👑',
        category: 'jobs',
        level: 'diamond',
        requirement: 500,
        requirementLabel: '500 trabajos completados',
    },

    // RATING BADGES
    {
        id: 'rating_4',
        name: 'Buena Reputación',
        description: 'Mantén un promedio de 4+ estrellas',
        icon: '⭐',
        category: 'rating',
        level: 'bronze',
        requirement: 4.0,
        requirementLabel: '4.0+ promedio',
    },
    {
        id: 'rating_45',
        name: 'Excelencia',
        description: 'Promedio de 4.5+ estrellas',
        icon: '🌟',
        category: 'rating',
        level: 'silver',
        requirement: 4.5,
        requirementLabel: '4.5+ promedio',
    },
    {
        id: 'rating_5_perfect',
        name: 'Perfección Total',
        description: '10 trabajos consecutivos con 5 estrellas',
        icon: '💎',
        category: 'rating',
        level: 'diamond',
        requirement: 10,
        requirementLabel: '10 trabajos perfectos seguidos',
    },

    // SPEED BADGES
    {
        id: 'speed_demon',
        name: 'Veloz',
        description: 'Acepta un trabajo en menos de 30 segundos',
        icon: '🚀',
        category: 'speed',
        level: 'bronze',
        requirement: 30,
        requirementLabel: 'Respuesta < 30 seg',
    },
    {
        id: 'early_bird',
        name: 'Madrugador',
        description: 'Completa 5 trabajos antes de las 9am',
        icon: '🌅',
        category: 'speed',
        level: 'silver',
        requirement: 5,
        requirementLabel: '5 trabajos matutinos',
    },
    {
        id: 'night_owl',
        name: 'Búho Nocturno',
        description: 'Completa 5 trabajos después de las 8pm',
        icon: '🦉',
        category: 'speed',
        level: 'silver',
        requirement: 5,
        requirementLabel: '5 trabajos nocturnos',
    },

    // LOYALTY BADGES
    {
        id: 'week_streak',
        name: 'Semana Activa',
        description: '7 días consecutivos trabajando',
        icon: '🔥',
        category: 'loyalty',
        level: 'bronze',
        requirement: 7,
        requirementLabel: '7 días seguidos',
    },
    {
        id: 'month_streak',
        name: 'Mes Imparable',
        description: '30 días consecutivos con actividad',
        icon: '📆',
        category: 'loyalty',
        level: 'gold',
        requirement: 30,
        requirementLabel: '30 días seguidos',
    },
    {
        id: 'veteran',
        name: 'Veterano Sumee',
        description: '1 año siendo parte de la comunidad',
        icon: '🎖️',
        category: 'loyalty',
        level: 'diamond',
        requirement: 365,
        requirementLabel: '1 año en Sumee',
    },

    // SPECIALTY BADGES
    {
        id: 'plumber_pro',
        name: 'Plomero Pro',
        description: '20 trabajos de plomería completados',
        icon: '🔧',
        category: 'specialty',
        level: 'silver',
        requirement: 20,
        requirementLabel: '20 trabajos de plomería',
    },
    {
        id: 'electrician_pro',
        name: 'Electricista Pro',
        description: '20 trabajos eléctricos completados',
        icon: '⚡',
        category: 'specialty',
        level: 'silver',
        requirement: 20,
        requirementLabel: '20 trabajos eléctricos',
    },
    {
        id: 'handyman_master',
        name: 'Todólogo Maestro',
        description: 'Completa trabajos en 5+ categorías',
        icon: '🛠️',
        category: 'specialty',
        level: 'gold',
        requirement: 5,
        requirementLabel: '5+ categorías diferentes',
    },

    // SOCIAL BADGES
    {
        id: 'first_referral',
        name: 'Embajador',
        description: 'Refiere a tu primer profesional',
        icon: '🤝',
        category: 'social',
        level: 'bronze',
        requirement: 1,
        requirementLabel: '1 referido',
    },
    {
        id: 'referral_5',
        name: 'Reclutador',
        description: '5 profesionales referidos',
        icon: '👥',
        category: 'social',
        level: 'silver',
        requirement: 5,
        requirementLabel: '5 referidos',
    },
    {
        id: 'community_leader',
        name: 'Líder Comunitario',
        description: '20 profesionales referidos',
        icon: '🏆',
        category: 'social',
        level: 'diamond',
        requirement: 20,
        requirementLabel: '20 referidos',
    },

    // TRUST BADGES (BlaBlaCar Style)
    {
        id: 'identity_verified',
        name: 'Identidad Verificada',
        description: 'Documentos oficiales validados por el equipo',
        icon: '🆔',
        category: 'social',
        level: 'silver',
        requirement: 1,
        requirementLabel: 'INE/Pasaporte validado',
    },
    {
        id: 'profile_perfect',
        name: 'Perfil de Hierro',
        description: 'Perfil completo con foto, bio y galería',
        icon: '👤',
        category: 'social',
        level: 'bronze',
        requirement: 100,
        requirementLabel: '100% completado',
    },
    {
        id: 'super_pro',
        name: 'Super PRO',
        description: 'Estatus de élite: Calidad, confianza y rapidez',
        icon: '🛡️',
        category: 'rating',
        level: 'diamond',
        requirement: 1,
        requirementLabel: 'Badge de Excelencia Sumee',
    },
];

// Level thresholds optimized for the 5-tier hierarchy
export const LEVEL_THRESHOLDS = [
    0,      // Nivel 1: Técnico Bronce
    250,    // Nivel 2: Técnico Plata
    750,    // Nivel 3: Técnico Oro
    2000,   // Nivel 4: Técnico Platino
    4000,   // Nivel 5: Maestro Sumee
];

// Points per badge level
export const BADGE_POINTS: Record<BadgeLevel, number> = {
    bronze: 10,
    silver: 25,
    gold: 50,
    diamond: 100,
};

// Badge colors by level (Tailored for Sumee Pro)
export const BADGE_COLORS: Record<BadgeLevel, { bg: string; border: string; text: string }> = {
    bronze: { bg: '#FFFAF5', border: '#D97706', text: '#92400E' }, // Cálido Bronce
    silver: { bg: '#F8FAFC', border: '#64748B', text: '#334155' }, // Plata sutil
    gold: { bg: '#FFFDF0', border: '#EAB308', text: '#854D0E' }, // Oro brillante
    diamond: { bg: '#F5F3FF', border: '#6D28D9', text: '#4C1D95' }, // Púrpura Sumee (Para nivel Maestro)
};

export const BadgesService = {
    /**
     * Get all badge definitions
     */
    getAllBadges(): Omit<Badge, 'unlockedAt' | 'progress'>[] {
        return BADGE_DEFINITIONS;
    },

    /**
     * Get badges by category
     */
    getBadgesByCategory(category: BadgeCategory): Omit<Badge, 'unlockedAt' | 'progress'>[] {
        return BADGE_DEFINITIONS.filter(b => b.category === category);
    },

    /**
     * Get user badges with progress from Supabase
     */
    async getUserBadges(userId: string): Promise<UserBadges> {
        try {
            // In a real app 'me' should be auth.uid()
            const { data: stats, error: statsError } = await supabase
                .from('professional_stats')
                .select('*')
                .single();

            const { data: userBadges, error: badgesError } = await supabase
                .from('user_badges')
                .select('*');

            if (statsError || !stats) {
                // Fallback to mock for development if no DB record exists
                return this.getMockBadges(userId);
            }

            const badges = BADGE_DEFINITIONS.map(def => {
                const unlocked = userBadges?.find(ub => ub.badge_id === def.id);
                return {
                    ...def,
                    unlockedAt: unlocked ? new Date(unlocked.unlocked_at) : undefined,
                    progress: unlocked ? unlocked.progress : stats.jobs_completed_count * 0.1, // Mock logic for demo
                };
            });

            const currentLevel = stats.current_level_id || 1;

            return {
                userId: stats.user_id,
                badges,
                totalPoints: stats.total_points || 0,
                currentLevel,
                nextLevelPoints: LEVEL_THRESHOLDS[currentLevel] || 4000,
                avatar_url: stats.avatar_url,
                expediente_status: stats.expediente_status
            };
        } catch (e) {
            return this.getMockBadges(userId);
        }
    },

    /**
     * Internal Mock Fallback
     */
    getMockBadges(userId: string): UserBadges {
        const mockUnlockedBadges: Badge[] = [
            { ...BADGE_DEFINITIONS.find(b => b.id === 'first_job')!, unlockedAt: new Date('2024-01-15'), progress: 1 },
            { ...BADGE_DEFINITIONS.find(b => b.id === 'jobs_10')!, unlockedAt: new Date('2024-02-20'), progress: 10 },
            { ...BADGE_DEFINITIONS.find(b => b.id === 'rating_4')!, unlockedAt: new Date('2024-02-25'), progress: 4.2 },
        ];

        const lockedBadges: Badge[] = BADGE_DEFINITIONS
            .filter(def => !mockUnlockedBadges.find(b => b.id === def.id))
            .map(def => ({
                ...def,
                progress: Math.random() * def.requirement * 0.3,
            }));

        const totalPoints = mockUnlockedBadges.reduce((sum, badge) => sum + BADGE_POINTS[badge.level], 250); // Start at level 2

        return {
            userId,
            badges: [...mockUnlockedBadges, ...lockedBadges],
            totalPoints,
            currentLevel: 2,
            nextLevelPoints: LEVEL_THRESHOLDS[2],
            avatar_url: undefined
        };
    },
    /**
     * Check if user has unlocked a specific badge
     */
    isBadgeUnlocked(badge: Badge): boolean {
        return !!badge.unlockedAt;
    },

    /**
     * Calculate progress percentage towards a badge
     */
    getProgressPercentage(badge: Badge): number {
        if (!badge.progress) return 0;
        return Math.min((badge.progress / badge.requirement) * 100, 100);
    },

    /**
     * Get level name based on user points
     */
    getLevelName(level: number): string {
        if (level >= 5) return 'Maestro Sumee';
        if (level === 4) return 'Técnico Platino';
        if (level === 3) return 'Técnico Oro';
        if (level === 2) return 'Técnico Plata';
        return 'Técnico Bronce';
    },

    /**
     * Get level tier color
     */
    getLevelColor(level: number): string {
        if (level >= 5) return '#6D28D9'; // Sumee Purple (Maestro)
        if (level === 4) return '#64748B'; // Platino (Slate)
        if (level === 3) return '#EAB308'; // Oro
        if (level === 2) return '#94A3B8'; // Plata (Steel)
        return '#D97706'; // Bronce
    }
};

export default BadgesService;
