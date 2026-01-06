import { supabase } from '@/lib/supabase';
import { sortJobsByScore, JobScore } from './jobScoring';

export type Job = {
    id: string;
    title: string;
    description: string;
    price: number;
    location: string;
    status: 'pending' | 'accepted' | 'en_camino' | 'en_sitio' | 'en_progreso' | 'active' | 'completed' | 'cancelled';
    is_urgent: boolean;
    client_name?: string;
    client_phone?: string;
    latitude?: number;
    longitude?: number;
    created_at: string;
    updated_at?: string;
    category?: string;
    distance_km?: number;
    ai_tags?: string[];
    checklist?: { label: string; value: string; }[];
    bonus?: number;
    // Location tracking fields
    professional_latitude?: number;
    professional_longitude?: number;
    professional_location_updated_at?: string;
    // Status timestamps
    accepted_at?: string;
    en_camino_at?: string;
    en_sitio_at?: string;
    en_progreso_at?: string;
    completed_at?: string;
    // Real database fields mapping
    nombre_cliente?: string;
    whatsapp?: string;
    descripcion_proyecto?: string;
    ubicacion_direccion?: string;
    ubicacion_lat?: string;
    ubicacion_lng?: string;
    servicio?: string;
    servicio_solicitado?: string;
    estado?: string;
    agreed_price?: string | number;
    ai_suggested_price_min?: number;
    ai_suggested_price_max?: number;
    urgencia_ia?: string;
    diagnostico_ia?: string;
    photos_urls?: string[] | null;
    fecha_creacion?: string;
    disciplina_ia?: string;
};

// Services for real production data from Supabase
export const JobsService = {
    async getJobs(): Promise<Job[]> {
        try {
            // Order by updated_at descending (most recent first), fallback to fecha_creacion, then id
            // IMPORTANT: Only get jobs with status='pending' AND professional_id IS NULL
            // This ensures accepted jobs don't appear in available jobs list
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .eq('status', 'pending')
                .is('professional_id', null) // Only show jobs not yet assigned
                .order('updated_at', { ascending: false })
                .order('fecha_creacion', { ascending: false })
                .order('id', { ascending: false });

            if (error) {
                // If error is about missing column, try with fecha_creacion
                if (error.code === '42703' || error.message?.includes('does not exist')) {
                    const { data: fallbackData, error: fallbackError } = await supabase
                        .from('leads')
                        .select('*')
                        .eq('status', 'pending')
                        .is('professional_id', null) // Only show unassigned jobs
                        .order('fecha_creacion', { ascending: false })
                        .order('id', { ascending: false });
                    
                    if (fallbackError) {
                        // Last resort: order by id only
                        const { data: idOrderData, error: idOrderError } = await supabase
                            .from('leads')
                            .select('*')
                            .eq('status', 'pending')
                            .is('professional_id', null) // Only show unassigned jobs
                            .order('id', { ascending: false });
                        
                        if (idOrderError) {
                            console.error('[JobsService] Supabase error:', idOrderError);
                            return [];
                        }
                        return (idOrderData as Job[]) || [];
                    }
                    return (fallbackData as Job[]) || [];
                }
                console.error('[JobsService] Supabase error:', error);
                return [];
            }

            return (data as Job[]) || [];
        } catch (error) {
            console.error('[JobsService] Critical fetch error:', error);
            return [];
        }
    },

    /**
     * Get jobs ordered by intelligent scoring
     * @param professionalLocation - Current location of the professional
     * @param professionalSpecialties - Array of specialties/skills of the professional
     */
    async getJobsWithScoring(
        professionalLocation: { latitude: number; longitude: number },
        professionalSpecialties?: string[] | null
    ): Promise<Array<Job & { score?: JobScore }>> {
        try {
            const jobs = await this.getJobs();
            
            // If no jobs, return empty array
            if (jobs.length === 0) {
                return [];
            }

            // Sort jobs by score
            const sortedJobs = await sortJobsByScore(
                jobs,
                professionalLocation,
                professionalSpecialties
            );

            return sortedJobs;
        } catch (error) {
            console.error('[JobsService] Error getting jobs with scoring:', error);
            // Fallback to regular getJobs if scoring fails
            return await this.getJobs();
        }
    },

    subscribeToJobs(callback: (payload: any) => void) {
        const channel = supabase
            .channel('public:leads')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'leads',
                    filter: 'status=eq.pending', // Only listen to pending jobs
                },
                (payload) => {
                    console.log('[JobsService] Raw Supabase payload:', {
                        eventType: payload.eventType,
                        table: payload.table,
                        schema: payload.schema,
                        new: payload.new,
                        old: payload.old,
                        newKeys: payload.new ? Object.keys(payload.new) : [],
                    });
                    
                    // Normalize payload structure
                    const normalizedPayload = {
                        eventType: payload.eventType,
                        new: payload.new,
                        old: payload.old,
                        ...payload,
                    };
                    callback(normalizedPayload);
                }
            )
            .subscribe((status) => {
                console.log('[JobsService] Subscription status:', status);
            });

        return channel;
    },

    /**
     * Acepta un trabajo (wrapper que usa el servicio mejorado si está disponible)
     * Mantiene compatibilidad hacia atrás mientras migramos a JobsServiceEnhanced
     */
    async acceptJob(jobId: string, userId: string) {
        try {
            // Intentar usar el servicio mejorado primero
            try {
                const { JobsServiceEnhanced } = await import('./jobs-enhanced');
                const enhancedResult = await JobsServiceEnhanced.acceptJobAtomic(jobId, userId, {
                    optimisticUpdate: true,
                    notifyClient: true,
                    validateAvailability: false, // Deshabilitado por defecto para mantener compatibilidad
                    validateDistance: false,
                });

                if (enhancedResult.success) {
                    return { data: enhancedResult.data as any, error: null };
                }

                // Si falla, convertir el error al formato esperado
                return {
                    data: null,
                    error: enhancedResult.error || {
                        code: 'UNKNOWN_ERROR',
                        message: 'Error al aceptar el trabajo.',
                    },
                };
            } catch (importError) {
                // Si no se puede importar el servicio mejorado, usar método tradicional
                console.warn('[JobsService] Enhanced service not available, using fallback method');
            }

            // Método tradicional (fallback)
            return await this.acceptJobLegacy(jobId, userId);
        } catch (error: any) {
            console.error('[JobsService] Accept error:', error);
            return {
                data: null,
                error: {
                    code: 'EXCEPTION',
                    message: error.message || 'Error inesperado al aceptar el trabajo.',
                },
            };
        }
    },

    /**
     * Método legacy para aceptar trabajos (mantenido para compatibilidad)
     * @deprecated Usar JobsServiceEnhanced.acceptJobAtomic en su lugar
     */
    async acceptJobLegacy(jobId: string, userId: string) {
        try {
            // First, check if the job exists and its current status
            const { data: existingJob, error: fetchError } = await supabase
                .from('leads')
                .select('id, status, professional_id')
                .eq('id', jobId)
                .single();

            if (fetchError || !existingJob) {
                console.error('[JobsService] Job not found:', fetchError);
                return { 
                    data: null, 
                    error: { 
                        code: 'JOB_NOT_FOUND', 
                        message: 'El trabajo no existe o ya fue eliminado.' 
                    } 
                };
            }

            // Check if job is already accepted by someone else
            if (existingJob.status === 'accepted' && existingJob.professional_id && existingJob.professional_id !== userId) {
                return { 
                    data: null, 
                    error: { 
                        code: 'JOB_ALREADY_ACCEPTED', 
                        message: 'Este trabajo ya fue aceptado por otro técnico.' 
                    } 
                };
            }

            // Check if job is already accepted by this user
            if (existingJob.status === 'accepted' && existingJob.professional_id === userId) {
                console.log('[JobsService] Job already accepted by this user');
                return { data: existingJob, error: null };
            }

            const now = new Date().toISOString();
            
            // Start with minimal required fields (always exist)
            const minimalUpdate: any = {
                status: 'accepted',
                professional_id: userId,
                updated_at: now,
            };

            // Try to update with extended fields first (may not all exist)
            const extendedUpdate: any = {
                ...minimalUpdate,
                estado: 'Asignado',
                profesional_asignado_id: userId,
                fecha_asignacion: now,
            };

            // Try extended update first
            const { data, error } = await supabase
                .from('leads')
                .update(extendedUpdate)
                .eq('id', jobId)
                .eq('status', 'pending') // Solo actualizar si sigue pendiente
                .is('professional_id', null) // Solo si no tiene profesional asignado
                .select()
                .single();

            if (error) {
                // Handle PGRST116 (no rows returned) - job might have been accepted already
                if (error.code === 'PGRST116') {
                    // Re-check the job status
                    const { data: recheckJob } = await supabase
                        .from('leads')
                        .select('id, status, professional_id')
                        .eq('id', jobId)
                        .single();
                    
                    if (recheckJob?.status === 'accepted' && recheckJob.professional_id === userId) {
                        console.log('[JobsService] Job already accepted by this user (race condition)');
                        return { data: recheckJob, error: null };
                    }
                    
                    if (recheckJob?.status === 'accepted' && recheckJob.professional_id && recheckJob.professional_id !== userId) {
                        return { 
                            data: null, 
                            error: { 
                                code: 'JOB_ALREADY_ACCEPTED', 
                                message: 'Este trabajo ya fue aceptado por otro técnico.' 
                            } 
                        };
                    }
                    
                    return { 
                        data: null, 
                        error: { 
                            code: 'JOB_STATE_CHANGED', 
                            message: 'El trabajo cambió de estado. Por favor, recarga la página.' 
                        } 
                    };
                }

                // Handle various error codes for missing columns
                const isColumnError = 
                    error.code === '42703' ||
                    error.code === 'PGRST204' ||
                    error.message?.includes('does not exist') ||
                    error.message?.includes('Could not find') ||
                    error.message?.includes('column');

                if (isColumnError) {
                    console.warn('[JobsService] Some columns may not exist, using minimal update:', error.message);
                    
                    // Fallback to minimal update
                    const { data: fallbackData, error: fallbackError } = await supabase
                        .from('leads')
                        .update(minimalUpdate)
                        .eq('id', jobId)
                        .eq('status', 'pending')
                        .is('professional_id', null)
                        .select()
                        .single();
                    
                    if (fallbackError) {
                        if (fallbackError.code === 'PGRST116') {
                            const { data: recheckJob } = await supabase
                                .from('leads')
                                .select('id, status, professional_id')
                                .eq('id', jobId)
                                .single();
                            
                            if (recheckJob?.status === 'accepted' && recheckJob.professional_id === userId) {
                                console.log('[JobsService] Job already accepted by this user (fallback race condition)');
                                return { data: recheckJob, error: null };
                            }
                            
                            return { 
                                data: null, 
                                error: { 
                                    code: 'JOB_STATE_CHANGED', 
                                    message: 'El trabajo cambió de estado. Por favor, recarga la página.' 
                                } 
                            };
                        }
                        
                        console.error('[JobsService] Accept error (fallback):', fallbackError);
                        return { data: null, error: fallbackError };
                    }
                    
                    return { data: fallbackData, error: null };
                }
                
                console.error('[JobsService] Accept error:', error);
                return { data: null, error };
            }

            return { data, error: null };
        } catch (error: any) {
            console.error('[JobsService] Accept error:', error);
            return {
                data: null,
                error: {
                    code: 'EXCEPTION',
                    message: error.message || 'Error inesperado al aceptar el trabajo.',
                },
            };
        }
    },

    async completeJob(jobId: string, userId: string) {
        try {
            const { data, error } = await supabase
                .from('leads')
                .update({
                    status: 'completed',
                })
                .eq('id', jobId)
                .eq('professional_id', userId)
                .select()
                .single();

            // Update streak when job is completed (Duolingo style)
            if (!error && data) {
                try {
                    const { StreakService } = await import('./streaks');
                    await StreakService.updateStreakOnJobCompletion(userId);
                } catch (streakError) {
                    console.error('[JobsService] Streak update error:', streakError);
                    // Don't fail the job completion if streak update fails
                }
            }

            return { data, error };
        } catch (error) {
            console.error('[JobsService] Complete error:', error);
            return { data: null, error };
        }
    },

    async getJobById(jobId: string): Promise<Job | null> {
        try {
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .eq('id', jobId)
                .single();

            if (error) return null;
            return data as Job;
        } catch {
            return null;
        }
    },

    async getEarningsToday(userId: string): Promise<number> {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Try to fetch with created_at first, fallback to all if column doesn't exist
            const { data, error } = await supabase
                .from('leads')
                .select('price, created_at, updated_at')
                .eq('professional_id', userId)
                .eq('status', 'completed');

            if (error) {
                // If error is about missing column, try without date filtering
                if (error.code === '42703' || error.message?.includes('does not exist')) {
                    const { data: fallbackData, error: fallbackError } = await supabase
                        .from('leads')
                        .select('price')
                        .eq('professional_id', userId)
                        .eq('status', 'completed');
                    
                    if (fallbackError) {
                        console.error('[JobsService] Earnings error:', fallbackError);
                        return 0;
                    }
                    // Return all completed leads if we can't filter by date
                    return (fallbackData || []).reduce((acc, item) => acc + (Number(item.price) || 0), 0);
                }
                console.error('[JobsService] Earnings error:', error);
                return 0;
            }
            
            // Filter by date in JavaScript - try updated_at first, then created_at
            const filteredData = data?.filter(item => {
                const dateToUse = item.updated_at || item.created_at;
                if (!dateToUse) return true; // Include if no date
                return new Date(dateToUse) >= today;
            }) || [];

            return filteredData.reduce((acc, item) => acc + (Number(item.price) || 0), 0);
        } catch (error) {
            console.error('[JobsService] Earnings error:', error);
            return 0;
        }
    },

    /**
     * Get accepted jobs for a professional (for calendar view)
     * Filters by status: 'accepted', 'active', 'completed'
     */
    async getAcceptedJobs(userId: string, options?: {
        startDate?: Date;
        endDate?: Date;
        status?: ('accepted' | 'active' | 'completed')[];
    }): Promise<Job[]> {
        try {
            let query = supabase
                .from('leads')
                .select('*')
                .eq('professional_id', userId)
                .in('status', options?.status || ['accepted', 'active', 'completed']);

            // Filter by date range if provided
            // Use updated_at since created_at doesn't exist in the schema
            if (options?.startDate || options?.endDate) {
                if (options.startDate) {
                    query = query.gte('updated_at', options.startDate.toISOString());
                }
                if (options.endDate) {
                    const endDate = new Date(options.endDate);
                    endDate.setHours(23, 59, 59, 999);
                    query = query.lte('updated_at', endDate.toISOString());
                }
            }

            const { data, error } = await query.order('updated_at', { ascending: true });

            if (error) {
                console.error('[JobsService] Get accepted jobs error:', error);
                return [];
            }

            return (data as Job[]) || [];
        } catch (error) {
            console.error('[JobsService] Get accepted jobs error:', error);
            return [];
        }
    },

    /**
     * Get jobs grouped by date for calendar view
     */
    async getJobsByDate(userId: string, startDate: Date, endDate: Date): Promise<Record<string, Job[]>> {
        try {
            const jobs = await this.getAcceptedJobs(userId, {
                startDate,
                endDate,
                status: ['accepted', 'active', 'completed']
            });

            // Group jobs by date (YYYY-MM-DD)
            // Use updated_at since created_at doesn't exist in the schema
            const grouped: Record<string, Job[]> = {};
            
            jobs.forEach(job => {
                // Try updated_at first, fallback to any date field or use current date
                const dateStr = (job as any).updated_at || (job as any).created_at;
                const dateKey = dateStr ? new Date(dateStr).toISOString().split('T')[0] : 'unknown';
                if (!grouped[dateKey]) {
                    grouped[dateKey] = [];
                }
                grouped[dateKey].push(job);
            });

            return grouped;
        } catch (error) {
            console.error('[JobsService] Get jobs by date error:', error);
            return {};
        }
    },

    /**
     * Subscribe to accepted jobs changes for real-time updates
     */
    subscribeToAcceptedJobs(userId: string, callback: (payload: any) => void) {
        return supabase
            .channel(`accepted-jobs-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'leads',
                    filter: `professional_id=eq.${userId}`,
                },
                callback
            )
            .subscribe();
    },

    /**
     * Get active jobs for a professional (accepted, en_camino, en_sitio, en_progreso, or active status)
     * Active jobs are those that are currently being worked on
     */
    async getActiveJobs(userId: string): Promise<Job[]> {
        try {
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .eq('professional_id', userId)
                .in('status', ['accepted', 'en_camino', 'en_sitio', 'en_progreso', 'active'])
                .order('updated_at', { ascending: false });

            if (error) {
                console.error('[JobsService] Get active jobs error:', error);
                return [];
            }

            return (data as Job[]) || [];
        } catch (error) {
            console.error('[JobsService] Get active jobs error:', error);
            return [];
        }
    },

    /**
     * Update job status to 'en_camino' (professional is on the way)
     */
    async setJobEnCamino(jobId: string, userId: string): Promise<{ data: any; error: any }> {
        try {
            const { data, error } = await supabase
                .from('leads')
                .update({
                    status: 'en_camino',
                })
                .eq('id', jobId)
                .eq('professional_id', userId)
                .in('status', ['accepted']) // Only allow transition from accepted
                .select()
                .single();

            return { data, error };
        } catch (error) {
            console.error('[JobsService] Set job en camino error:', error);
            return { data: null, error };
        }
    },

    /**
     * Update job status to 'en_sitio' (professional has arrived)
     */
    async setJobEnSitio(jobId: string, userId: string): Promise<{ data: any; error: any }> {
        try {
            const { data, error } = await supabase
                .from('leads')
                .update({
                    status: 'en_sitio',
                })
                .eq('id', jobId)
                .eq('professional_id', userId)
                .in('status', ['en_camino', 'accepted']) // Allow from en_camino or accepted
                .select()
                .single();

            return { data, error };
        } catch (error) {
            console.error('[JobsService] Set job en sitio error:', error);
            return { data: null, error };
        }
    },

    /**
     * Update job status to 'en_progreso' (professional has started work)
     */
    async setJobEnProgreso(jobId: string, userId: string): Promise<{ data: any; error: any }> {
        try {
            const { data, error } = await supabase
                .from('leads')
                .update({
                    status: 'en_progreso',
                })
                .eq('id', jobId)
                .eq('professional_id', userId)
                .in('status', ['en_sitio', 'en_camino', 'accepted']) // Allow from previous states
                .select()
                .single();

            return { data, error };
        } catch (error) {
            console.error('[JobsService] Set job en progreso error:', error);
            return { data: null, error };
        }
    },

    /**
     * Update job status to 'active' (legacy support - maps to en_progreso)
     */
    async startJob(jobId: string, userId: string): Promise<{ data: any; error: any }> {
        return this.setJobEnProgreso(jobId, userId);
    },
};

/**
 * Earnings Service - Advanced earnings calculations and analytics
 */
export type EarningsPeriod = 'week' | 'month' | 'year';
export type ChartDataPoint = { day: string; amount: number; height: number; date: Date };

export interface EarningsStats {
    total: number;
    completed: number;
    pending: number;
    periodTotal: number;
    previousPeriodTotal: number;
    trendPercentage: number;
    averageDaily: number;
    bestDay: { date: Date; amount: number } | null;
    chartData: ChartDataPoint[];
    transactions: Array<{
        id: string;
        type: 'income' | 'pending';
        title: string;
        subtitle: string;
        amount: number;
        date: string;
        status: string;
    }>;
}

export const EarningsService = {
    /**
     * Get comprehensive earnings data for a period
     */
    async getEarningsData(
        userId: string,
        period: EarningsPeriod = 'week'
    ): Promise<EarningsStats> {
        try {
            const now = new Date();
            const { startDate, endDate, previousStartDate, previousEndDate } = this.getPeriodDates(period, now);

            // Fetch all leads for the professional
            const { data: allLeads, error } = await supabase
                .from('leads')
                .select('*')
                .eq('professional_id', userId)
                .order('id', { ascending: false });

            if (error) {
                console.error('[EarningsService] Error fetching leads:', error);
                return this.getEmptyStats();
            }

            const leads = allLeads || [];

            // Filter by period
            const periodLeads = leads.filter(lead => {
                const leadDate = this.getLeadDate(lead);
                return leadDate >= startDate && leadDate <= endDate;
            });

            const previousPeriodLeads = leads.filter(lead => {
                const leadDate = this.getLeadDate(lead);
                return leadDate >= previousStartDate && leadDate <= previousEndDate;
            });

            // Calculate totals
            const completedLeads = periodLeads.filter(l => l.status === 'completed');
            const pendingLeads = periodLeads.filter(l => l.status === 'accepted' || l.status === 'active');

            const total = leads
                .filter(l => l.status === 'completed')
                .reduce((acc, l) => acc + (Number(l.price) || 0), 0);

            const completed = completedLeads.reduce((acc, l) => acc + (Number(l.price) || 0), 0);
            const pending = pendingLeads.reduce((acc, l) => acc + (Number(l.price) || 0), 0);

            const periodTotal = completed;
            const previousPeriodTotal = previousPeriodLeads
                .filter(l => l.status === 'completed')
                .reduce((acc, l) => acc + (Number(l.price) || 0), 0);

            // Calculate trend
            const trendPercentage = previousPeriodTotal > 0
                ? ((periodTotal - previousPeriodTotal) / previousPeriodTotal) * 100
                : periodTotal > 0 ? 100 : 0;

            // Calculate average daily
            const daysInPeriod = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;
            const averageDaily = periodTotal / daysInPeriod;

            // Generate chart data
            const chartData = this.generateChartData(periodLeads, period, startDate, endDate);

            // Find best day
            const bestDay = chartData.reduce((best, current) => {
                return current.amount > best.amount ? current : best;
            }, chartData[0] || null);

            // Generate transactions list
            const transactions = periodLeads.map(lead => ({
                id: lead.id,
                type: lead.status === 'completed' ? 'income' as const : 'pending' as const,
                title: lead.title || lead.category || 'Servicio Profesional',
                subtitle: lead.status === 'completed'
                    ? `Completado • ${lead.location || 'Sin ubicación'}`
                    : `En proceso • ${lead.status}`,
                amount: Number(lead.price) || 0,
                date: this.formatTransactionDate(lead),
                status: lead.status
            }));

            return {
                total,
                completed,
                pending,
                periodTotal,
                previousPeriodTotal,
                trendPercentage,
                averageDaily,
                bestDay: bestDay ? { date: bestDay.date, amount: bestDay.amount } : null,
                chartData,
                transactions
            };
        } catch (error) {
            console.error('[EarningsService] Error:', error);
            return this.getEmptyStats();
        }
    },

    /**
     * Get period date ranges
     */
    getPeriodDates(period: EarningsPeriod, referenceDate: Date) {
        const now = new Date(referenceDate);
        now.setHours(23, 59, 59, 999);

        let startDate: Date;
        let endDate: Date = new Date(now);
        let previousStartDate: Date;
        let previousEndDate: Date;

        if (period === 'week') {
            // Current week (Monday to Sunday)
            const dayOfWeek = now.getDay();
            const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust for Monday start
            startDate = new Date(now);
            startDate.setDate(now.getDate() + diff);
            startDate.setHours(0, 0, 0, 0);

            // Previous week
            previousEndDate = new Date(startDate);
            previousEndDate.setMilliseconds(-1);
            previousStartDate = new Date(previousEndDate);
            previousStartDate.setDate(previousStartDate.getDate() - 6);
            previousStartDate.setHours(0, 0, 0, 0);
        } else if (period === 'month') {
            // Current month
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            startDate.setHours(0, 0, 0, 0);

            // Previous month
            previousEndDate = new Date(startDate);
            previousEndDate.setMilliseconds(-1);
            previousStartDate = new Date(previousEndDate.getFullYear(), previousEndDate.getMonth(), 1);
            previousStartDate.setHours(0, 0, 0, 0);
        } else {
            // Current year
            startDate = new Date(now.getFullYear(), 0, 1);
            startDate.setHours(0, 0, 0, 0);

            // Previous year
            previousEndDate = new Date(now.getFullYear() - 1, 11, 31);
            previousEndDate.setHours(23, 59, 59, 999);
            previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
            previousStartDate.setHours(0, 0, 0, 0);
        }

        return { startDate, endDate, previousStartDate, previousEndDate };
    },

    /**
     * Get date from lead (prefer updated_at, fallback to created_at)
     */
    getLeadDate(lead: any): Date {
        const dateStr = lead.updated_at || lead.created_at;
        if (!dateStr) return new Date();
        return new Date(dateStr);
    },

    /**
     * Generate chart data points for the period
     */
    generateChartData(
        leads: any[],
        period: EarningsPeriod,
        startDate: Date,
        endDate: Date
    ): ChartDataPoint[] {
        const dataPoints: ChartDataPoint[] = [];
        const maxAmount = Math.max(...leads.map(l => Number(l.price) || 0), 1);

        if (period === 'week') {
            // 7 days
            const dayNames = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
            for (let i = 0; i < 7; i++) {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + i);
                date.setHours(0, 0, 0, 0);

                const dayLeads = leads.filter(lead => {
                    const leadDate = this.getLeadDate(lead);
                    leadDate.setHours(0, 0, 0, 0);
                    return leadDate.getTime() === date.getTime() && lead.status === 'completed';
                });

                const amount = dayLeads.reduce((acc, l) => acc + (Number(l.price) || 0), 0);
                const height = maxAmount > 0 ? Math.max((amount / maxAmount) * 100, 5) : 0;

                dataPoints.push({
                    day: dayNames[i],
                    amount,
                    height,
                    date
                });
            }
        } else if (period === 'month') {
            // 4 weeks
            const weeks = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
            const daysPerWeek = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) / 4;
            
            for (let i = 0; i < 4; i++) {
                const weekStart = new Date(startDate);
                weekStart.setDate(startDate.getDate() + (i * daysPerWeek));
                weekStart.setHours(0, 0, 0, 0);

                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + daysPerWeek - 1);
                weekEnd.setHours(23, 59, 59, 999);

                const weekLeads = leads.filter(lead => {
                    const leadDate = this.getLeadDate(lead);
                    return leadDate >= weekStart && leadDate <= weekEnd && lead.status === 'completed';
                });

                const amount = weekLeads.reduce((acc, l) => acc + (Number(l.price) || 0), 0);
                const height = maxAmount > 0 ? Math.max((amount / maxAmount) * 100, 5) : 0;

                dataPoints.push({
                    day: weeks[i],
                    amount,
                    height,
                    date: weekStart
                });
            }
        } else {
            // 12 months
            const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            for (let i = 0; i < 12; i++) {
                const monthStart = new Date(startDate.getFullYear(), i, 1);
                const monthEnd = new Date(startDate.getFullYear(), i + 1, 0);
                monthEnd.setHours(23, 59, 59, 999);

                const monthLeads = leads.filter(lead => {
                    const leadDate = this.getLeadDate(lead);
                    return leadDate >= monthStart && leadDate <= monthEnd && lead.status === 'completed';
                });

                const amount = monthLeads.reduce((acc, l) => acc + (Number(l.price) || 0), 0);
                const height = maxAmount > 0 ? Math.max((amount / maxAmount) * 100, 5) : 0;

                dataPoints.push({
                    day: monthNames[i],
                    amount,
                    height,
                    date: monthStart
                });
            }
        }

        return dataPoints;
    },

    /**
     * Format transaction date for display
     */
    formatTransactionDate(lead: any): string {
        try {
            const dateStr = lead.updated_at || lead.created_at;
            if (!dateStr) return 'Reciente';
            
            const date = new Date(dateStr);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const leadDate = new Date(date);
            leadDate.setHours(0, 0, 0, 0);

            if (leadDate.getTime() === today.getTime()) {
                return 'Hoy';
            }

            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            if (leadDate.getTime() === yesterday.getTime()) {
                return 'Ayer';
            }

            return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
        } catch (e) {
            return 'Reciente';
        }
    },

    /**
     * Get empty stats object
     */
    getEmptyStats(): EarningsStats {
        return {
            total: 0,
            completed: 0,
            pending: 0,
            periodTotal: 0,
            previousPeriodTotal: 0,
            trendPercentage: 0,
            averageDaily: 0,
            bestDay: null,
            chartData: [],
            transactions: []
        };
    },

    /**
     * Subscribe to earnings changes for real-time updates
     */
    subscribeToEarnings(userId: string, callback: (payload: any) => void) {
        return supabase
            .channel(`earnings-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'leads',
                    filter: `professional_id=eq.${userId}`,
                },
                callback
            )
            .subscribe();
    }
};
