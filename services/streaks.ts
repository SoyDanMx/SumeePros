import { supabase } from '@/lib/supabase';

export interface StreakData {
    userId: string;
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: string | null;
    streakStartDate: string | null;
    totalDaysActive: number;
}

export interface StreakMilestone {
    days: number;
    badgeId: string;
    reward: number;
    name: string;
}

// Milestones tipo Duolingo
export const STREAK_MILESTONES: StreakMilestone[] = [
    { days: 3, badgeId: 'streak_3', reward: 25, name: 'Racha de 3 días' },
    { days: 7, badgeId: 'streak_7', reward: 50, name: 'Semana de Fuego' },
    { days: 14, badgeId: 'streak_14', reward: 100, name: 'Racha de 2 Semanas' },
    { days: 30, badgeId: 'streak_30', reward: 250, name: 'Mes Imparable' },
    { days: 50, badgeId: 'streak_50', reward: 500, name: 'Racha Legendaria' },
    { days: 100, badgeId: 'streak_100', reward: 1000, name: 'Centenario de Fuego' },
    { days: 200, badgeId: 'streak_200', reward: 2000, name: 'Maestro de la Racha' },
    { days: 365, badgeId: 'streak_365', reward: 5000, name: 'Año Completo' },
];

export const StreakService = {
    /**
     * Get or create streak data for a user
     */
    async getUserStreak(userId: string): Promise<StreakData> {
        try {
            const { data, error } = await supabase
                .from('user_streaks')
                .select('*')
                .eq('user_id', userId)
                .single();

            // Table doesn't exist - return default streak (user needs to run SQL)
            if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
                console.warn('[StreakService] Table user_streaks does not exist. Please run SCHEMA_STREAKS.sql in Supabase.');
                return this.getDefaultStreak(userId);
            }

            if (error && error.code === 'PGRST116') {
                // No streak record exists, try to create one
                return await this.createStreak(userId);
            }

            if (error) {
                console.error('[StreakService] Get streak error:', error);
                return this.getDefaultStreak(userId);
            }

            return {
                userId: data.user_id,
                currentStreak: data.current_streak || 0,
                longestStreak: data.longest_streak || 0,
                lastActivityDate: data.last_activity_date,
                streakStartDate: data.streak_start_date,
                totalDaysActive: data.total_days_active || 0,
            };
        } catch (error: any) {
            // Handle table doesn't exist error gracefully
            if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
                console.warn('[StreakService] Table user_streaks does not exist. Please run SCHEMA_STREAKS.sql in Supabase.');
                return this.getDefaultStreak(userId);
            }
            console.error('[StreakService] Get streak error:', error);
            return this.getDefaultStreak(userId);
        }
    },

    /**
     * Create initial streak record
     */
    async createStreak(userId: string): Promise<StreakData> {
        try {
            const today = new Date().toISOString().split('T')[0];
            const { data, error } = await supabase
                .from('user_streaks')
                .insert({
                    user_id: userId,
                    current_streak: 0,
                    longest_streak: 0,
                    last_activity_date: null,
                    streak_start_date: null,
                    total_days_active: 0,
                })
                .select()
                .single();

            // Table doesn't exist - return default streak
            if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
                console.warn('[StreakService] Table user_streaks does not exist. Please run SCHEMA_STREAKS.sql in Supabase.');
                return this.getDefaultStreak(userId);
            }

            if (error) {
                console.error('[StreakService] Create streak error:', error);
                return this.getDefaultStreak(userId);
            }

            return {
                userId: data.user_id,
                currentStreak: 0,
                longestStreak: 0,
                lastActivityDate: null,
                streakStartDate: null,
                totalDaysActive: 0,
            };
        } catch (error: any) {
            // Handle table doesn't exist error gracefully
            if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
                console.warn('[StreakService] Table user_streaks does not exist. Please run SCHEMA_STREAKS.sql in Supabase.');
                return this.getDefaultStreak(userId);
            }
            console.error('[StreakService] Create streak error:', error);
            return this.getDefaultStreak(userId);
        }
    },

    /**
     * Update streak when a job is completed
     * This should be called whenever a professional completes a job
     */
    async updateStreakOnJobCompletion(userId: string): Promise<{
        streakData: StreakData;
        streakMaintained: boolean;
        milestoneReached?: StreakMilestone;
        streakBroken: boolean;
        }> {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayStr = today.toISOString().split('T')[0];

            // Get current streak (will return default if table doesn't exist)
            const currentStreak = await this.getUserStreak(userId);
            
            // If table doesn't exist, return default response without error
            // Check if this is a fresh default streak (no lastActivityDate and both streaks are 0)
            if (!currentStreak.lastActivityDate && currentStreak.currentStreak === 0 && currentStreak.longestStreak === 0) {
                // Try to create streak record, but if table doesn't exist, just return default
                try {
                    const created = await this.createStreak(userId);
                    // If creation succeeded, use the created streak, otherwise continue with default
                    if (created.userId === userId) {
                        // Table exists and record was created, continue with update logic
                    } else {
                        // Table doesn't exist, return default
                        return {
                            streakData: currentStreak,
                            streakMaintained: false,
                            streakBroken: false,
                        };
                    }
                } catch (e: any) {
                    // Table doesn't exist, return default without error
                    const errorCode = e?.code || e?.error?.code;
                    const errorMessage = e?.message || e?.error?.message || String(e || '');
                    const isTableError = 
                        errorCode === '42P01' || 
                        errorCode === 'PGRST204' ||
                        errorMessage?.includes('does not exist') ||
                        errorMessage?.includes('relation') ||
                        errorMessage?.includes('table');
                    
                    if (isTableError) {
                        console.warn('[StreakService] Table user_streaks does not exist. Please run SCHEMA_STREAKS.sql in Supabase.');
                        return {
                            streakData: currentStreak,
                            streakMaintained: false,
                            streakBroken: false,
                        };
                    }
                    // Log unexpected errors but don't throw - return default instead
                    console.warn('[StreakService] Unexpected error creating streak (non-critical):', e);
                    return {
                        streakData: currentStreak,
                        streakMaintained: false,
                        streakBroken: false,
                    };
                }
            }
            
            // Re-fetch current streak after potential creation
            const updatedCurrentStreak = await this.getUserStreak(userId);
            const lastActivity = updatedCurrentStreak.lastActivityDate
                ? new Date(updatedCurrentStreak.lastActivityDate)
                : null;
            lastActivity?.setHours(0, 0, 0, 0);

            let newStreak = currentStreak.currentStreak;
            let streakMaintained = false;
            let streakBroken = false;
            let milestoneReached: StreakMilestone | undefined;

            if (!lastActivity) {
                // First activity ever
                newStreak = 1;
                streakMaintained = true;
            } else {
                const daysDiff = Math.floor(
                    (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
                );

                if (daysDiff === 0) {
                    // Already logged today, maintain streak
                    newStreak = updatedCurrentStreak.currentStreak;
                    streakMaintained = true;
                } else if (daysDiff === 1) {
                    // Consecutive day, increment streak
                    newStreak = updatedCurrentStreak.currentStreak + 1;
                    streakMaintained = true;
                } else {
                    // Streak broken, start over
                    newStreak = 1;
                    streakBroken = true;
                }
            }

            // Check for milestone
            const previousMilestone = this.getCurrentMilestone(updatedCurrentStreak.currentStreak);
            const newMilestone = this.getCurrentMilestone(newStreak);

            if (newMilestone && newMilestone.days > (previousMilestone?.days || 0)) {
                milestoneReached = newMilestone;
            }

            // Update longest streak if needed
            const longestStreak = Math.max(updatedCurrentStreak.longestStreak, newStreak);

            // Calculate total days active increment
            let daysActiveIncrement = 0;
            if (!lastActivity) {
                // First activity ever
                daysActiveIncrement = 1;
            } else {
                const daysDiff = Math.floor(
                    (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
                );
                if (daysDiff === 1) {
                    // Consecutive day
                    daysActiveIncrement = 1;
                } else if (daysDiff === 0) {
                    // Same day, no increment
                    daysActiveIncrement = 0;
                } else {
                    // Streak broken, but still count as active day
                    daysActiveIncrement = 1;
                }
            }

            // Update in database
            const { data, error } = await supabase
                .from('user_streaks')
                .upsert({
                    user_id: userId,
                    current_streak: newStreak,
                    longest_streak: longestStreak,
                    last_activity_date: todayStr,
                    streak_start_date: newStreak === 1 ? todayStr : updatedCurrentStreak.streakStartDate || todayStr,
                    total_days_active: updatedCurrentStreak.totalDaysActive + daysActiveIncrement,
                })
                .select()
                .single();

            // Handle table doesn't exist error gracefully
            const errorCode = error?.code || error?.error?.code;
            const errorMessage = error?.message || error?.error?.message || String(error || '');
            const isTableError = 
                errorCode === '42P01' || 
                errorCode === 'PGRST204' ||
                errorMessage?.includes('does not exist') ||
                errorMessage?.includes('relation') ||
                errorMessage?.includes('table');

            if (error && isTableError) {
                console.warn('[StreakService] Table user_streaks does not exist. Please run SCHEMA_STREAKS.sql in Supabase.');
                return {
                    streakData: updatedCurrentStreak,
                    streakMaintained: false,
                    streakBroken: false,
                };
            }

            if (error) {
                // Log error details for debugging
                console.error('[StreakService] Update streak error:', {
                    code: errorCode,
                    message: errorMessage,
                    fullError: error,
                });
                return {
                    streakData: updatedCurrentStreak,
                    streakMaintained: false,
                    streakBroken: false,
                };
            }

            const updatedStreak: StreakData = {
                userId: data.user_id,
                currentStreak: data.current_streak,
                longestStreak: data.longest_streak,
                lastActivityDate: data.last_activity_date,
                streakStartDate: data.streak_start_date,
                totalDaysActive: data.total_days_active,
            };

            return {
                streakData: updatedStreak,
                streakMaintained,
                milestoneReached,
                streakBroken,
            };
        } catch (error: any) {
            // Handle various error types gracefully
            const errorCode = error?.code || error?.error?.code;
            const errorMessage = error?.message || error?.error?.message || String(error || '');
            const isTableError = 
                errorCode === '42P01' || 
                errorCode === 'PGRST204' ||
                errorMessage?.includes('does not exist') ||
                errorMessage?.includes('relation') ||
                errorMessage?.includes('table');

            if (isTableError) {
                console.warn('[StreakService] Table user_streaks does not exist. Please run SCHEMA_STREAKS.sql in Supabase.');
            } else {
                console.error('[StreakService] Update streak error:', {
                    code: errorCode,
                    message: errorMessage,
                    fullError: error,
                });
            }

            // Always return default streak data to prevent app crash
            try {
                const fallbackStreak = await this.getUserStreak(userId);
                return {
                    streakData: fallbackStreak,
                    streakMaintained: false,
                    streakBroken: false,
                };
            } catch (fallbackError) {
                // Even getUserStreak failed, return minimal default
                return {
                    streakData: this.getDefaultStreak(userId),
                    streakMaintained: false,
                    streakBroken: false,
                };
            }
        }
    },

    /**
     * Get current milestone based on streak days
     */
    getCurrentMilestone(streakDays: number): StreakMilestone | null {
        // Find the highest milestone reached
        let milestone: StreakMilestone | null = null;
        for (const m of STREAK_MILESTONES) {
            if (streakDays >= m.days) {
                milestone = m;
            } else {
                break;
            }
        }
        return milestone;
    },

    /**
     * Get next milestone to reach
     */
    getNextMilestone(streakDays: number): StreakMilestone | null {
        for (const m of STREAK_MILESTONES) {
            if (streakDays < m.days) {
                return m;
            }
        }
        return null; // All milestones reached!
    },

    /**
     * Check if streak is in danger (last activity was yesterday)
     */
    async isStreakInDanger(userId: string): Promise<boolean> {
        try {
            const streak = await this.getUserStreak(userId);
            if (!streak.lastActivityDate || streak.currentStreak === 0) {
                return false;
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const lastActivity = new Date(streak.lastActivityDate);
            lastActivity.setHours(0, 0, 0, 0);

            const daysDiff = Math.floor(
                (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
            );

            // Streak is in danger if last activity was yesterday (1 day ago)
            return daysDiff === 1;
        } catch (error) {
            console.error('[StreakService] Check streak danger error:', error);
            return false;
        }
    },

    /**
     * Get default streak data (fallback)
     */
    getDefaultStreak(userId: string): StreakData {
        return {
            userId,
            currentStreak: 0,
            longestStreak: 0,
            lastActivityDate: null,
            streakStartDate: null,
            totalDaysActive: 0,
        };
    },
};

