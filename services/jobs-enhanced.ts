/**
 * Enhanced Jobs Service with Atomic Transactions
 * Solución innovadora para aceptación de trabajos sin fricciones
 */

import { supabase } from '@/lib/supabase';
import { Job } from './jobs';
import { NotificationsEnhancedService } from './notifications-enhanced';

export interface AcceptJobResult {
    success: boolean;
    data?: Job | null;
    error?: {
        code: string;
        message: string;
        details?: any;
    } | null;
    alreadyAccepted?: boolean;
    raceConditionResolved?: boolean;
}

export interface AcceptJobOptions {
    optimisticUpdate?: boolean; // Actualizar UI inmediatamente
    notifyClient?: boolean; // Notificar al cliente
    validateAvailability?: boolean; // Validar disponibilidad del técnico
    validateDistance?: boolean; // Validar distancia del trabajo
}

export const JobsServiceEnhanced = {
    /**
     * Acepta un trabajo de forma atómica usando RPC
     * Previene race conditions y garantiza consistencia
     */
    async acceptJobAtomic(
        jobId: string,
        userId: string,
        options: AcceptJobOptions = {}
    ): Promise<AcceptJobResult> {
        const {
            optimisticUpdate = true,
            notifyClient = true,
            validateAvailability = false,
            validateDistance = false,
        } = options;

        try {
            // 1. Validaciones previas (opcionales pero recomendadas)
            if (validateAvailability) {
                const availabilityCheck = await this.checkProfessionalAvailability(userId);
                if (!availabilityCheck.available) {
                    return {
                        success: false,
                        error: {
                            code: 'PROFESSIONAL_UNAVAILABLE',
                            message: availabilityCheck.reason || 'No estás disponible para aceptar más trabajos.',
                        },
                    };
                }
            }

            if (validateDistance) {
                const distanceCheck = await this.checkJobDistance(jobId, userId);
                if (!distanceCheck.withinRange) {
                    return {
                        success: false,
                        error: {
                            code: 'JOB_TOO_FAR',
                            message: `El trabajo está a ${distanceCheck.distance?.toFixed(1)} km. ¿Aún deseas aceptarlo?`,
                            details: { distance: distanceCheck.distance },
                        },
                    };
                }
            }

            // 2. Llamar a la función RPC atómica
            const { data: rpcResult, error: rpcError } = await supabase.rpc('accept_job_atomic', {
                p_job_id: jobId,
                p_professional_id: userId,
            });

            if (rpcError) {
                console.error('[JobsServiceEnhanced] RPC error:', rpcError);
                
                // Si la función RPC no existe, fallback a método tradicional
                if (rpcError.code === '42883' || rpcError.message?.includes('does not exist')) {
                    console.warn('[JobsServiceEnhanced] RPC function not found, using fallback method');
                    return await this.acceptJobFallback(jobId, userId, options);
                }

                return {
                    success: false,
                    error: {
                        code: rpcError.code || 'RPC_ERROR',
                        message: rpcError.message || 'Error al aceptar el trabajo.',
                        details: rpcError,
                    },
                };
            }

            // 3. Procesar resultado de RPC
            if (!rpcResult || !rpcResult.success) {
                return {
                    success: false,
                    error: rpcResult?.error || {
                        code: 'UNKNOWN_ERROR',
                        message: 'Error desconocido al aceptar el trabajo.',
                    },
                };
            }

            // 4. Si ya estaba aceptado, retornar éxito
            if (rpcResult.already_accepted) {
                return {
                    success: true,
                    data: rpcResult.data as any,
                    alreadyAccepted: true,
                };
            }

            // 5. Notificar al cliente (si está habilitado)
            if (notifyClient && rpcResult.data) {
                try {
                    await this.notifyClientJobAccepted(jobId, userId, rpcResult.data);
                } catch (notifyError) {
                    console.warn('[JobsServiceEnhanced] Failed to notify client:', notifyError);
                    // No fallar la aceptación si la notificación falla
                }
            }

            // 6. Invalidar cache y actualizar suscripciones
            await this.invalidateJobCache(jobId);

            return {
                success: true,
                data: rpcResult.data as any,
                raceConditionResolved: rpcResult.race_condition_resolved || false,
            };
        } catch (error: any) {
            console.error('[JobsServiceEnhanced] Accept job error:', error);
            return {
                success: false,
                error: {
                    code: 'EXCEPTION',
                    message: error.message || 'Error inesperado al aceptar el trabajo.',
                    details: error,
                },
            };
        }
    },

    /**
     * Método fallback si la función RPC no existe
     */
    async acceptJobFallback(
        jobId: string,
        userId: string,
        options: AcceptJobOptions = {}
    ): Promise<AcceptJobResult> {
        // Importar el servicio tradicional
        const { JobsService } = await import('./jobs');
        const result = await JobsService.acceptJob(jobId, userId);

        if (result.error) {
            return {
                success: false,
                error: {
                    code: result.error.code || 'ACCEPT_ERROR',
                    message: result.error.message || 'Error al aceptar el trabajo.',
                },
            };
        }

        // Notificar al cliente si está habilitado
        if (options.notifyClient && result.data) {
            try {
                await this.notifyClientJobAccepted(jobId, userId, result.data);
            } catch (notifyError) {
                console.warn('[JobsServiceEnhanced] Failed to notify client:', notifyError);
            }
        }

        return {
            success: true,
            data: result.data as any,
        };
    },

    /**
     * Verifica la disponibilidad del profesional
     */
    async checkProfessionalAvailability(userId: string): Promise<{
        available: boolean;
        reason?: string;
        activeJobsCount?: number;
    }> {
        try {
            const { data: activeJobs, error } = await supabase
                .from('leads')
                .select('id', { count: 'exact' })
                .eq('professional_id', userId)
                .in('status', ['accepted', 'en_camino', 'en_sitio', 'en_progreso']);

            if (error) {
                console.error('[JobsServiceEnhanced] Error checking availability:', error);
                return { available: true }; // Permitir si hay error en la verificación
            }

            const activeCount = activeJobs?.length || 0;
            const MAX_CONCURRENT_JOBS = 5; // Configurable

            if (activeCount >= MAX_CONCURRENT_JOBS) {
                return {
                    available: false,
                    reason: `Ya tienes ${activeCount} trabajos activos. Completa algunos antes de aceptar más.`,
                    activeJobsCount: activeCount,
                };
            }

            return { available: true, activeJobsCount: activeCount };
        } catch (error) {
            console.error('[JobsServiceEnhanced] Exception checking availability:', error);
            return { available: true }; // Permitir si hay excepción
        }
    },

    /**
     * Verifica la distancia del trabajo
     */
    async checkJobDistance(
        jobId: string,
        userId: string
    ): Promise<{
        withinRange: boolean;
        distance?: number;
        maxDistance?: number;
    }> {
        try {
            // Obtener ubicación del trabajo
            const { data: job, error: jobError } = await supabase
                .from('leads')
                .select('ubicacion_lat, ubicacion_lng')
                .eq('id', jobId)
                .single();

            if (jobError || !job?.ubicacion_lat || !job?.ubicacion_lng) {
                return { withinRange: true }; // Permitir si no hay coordenadas
            }

            // Obtener ubicación del profesional
            const { data: professional, error: profError } = await supabase
                .from('professional_stats')
                .select('last_location_lat, last_location_lng')
                .eq('user_id', userId)
                .single();

            if (profError || !professional?.last_location_lat || !professional?.last_location_lng) {
                return { withinRange: true }; // Permitir si no hay ubicación del profesional
            }

            // Calcular distancia (Haversine)
            const distance = this.calculateDistance(
                professional.last_location_lat,
                professional.last_location_lng,
                parseFloat(String(job.ubicacion_lat)),
                parseFloat(String(job.ubicacion_lng))
            );

            const MAX_DISTANCE_KM = 50; // Configurable

            return {
                withinRange: distance <= MAX_DISTANCE_KM,
                distance,
                maxDistance: MAX_DISTANCE_KM,
            };
        } catch (error) {
            console.error('[JobsServiceEnhanced] Exception checking distance:', error);
            return { withinRange: true }; // Permitir si hay excepción
        }
    },

    /**
     * Calcula distancia entre dos coordenadas (Haversine)
     */
    calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Radio de la Tierra en km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) *
                Math.cos(this.toRad(lat2)) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    },

    toRad(degrees: number): number {
        return degrees * (Math.PI / 180);
    },

    /**
     * Notifica al cliente que su trabajo fue aceptado
     */
    async notifyClientJobAccepted(
        jobId: string,
        professionalId: string,
        jobData: any
    ): Promise<void> {
        try {
            // Obtener datos del cliente
            const { data: job, error: jobError } = await supabase
                .from('leads')
                .select('nombre_cliente, whatsapp, descripcion_proyecto, client_id')
                .eq('id', jobId)
                .single();

            if (jobError || !job) {
                console.warn('[JobsServiceEnhanced] Could not fetch job for notification');
                return;
            }

            // Obtener datos del profesional
            const { data: professional, error: profError } = await supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', professionalId)
                .single();

            if (profError || !professional) {
                console.warn('[JobsServiceEnhanced] Could not fetch professional for notification');
                return;
            }

            // Enviar notificación push al cliente (si tiene token)
            // TODO: Implementar cuando tengamos tokens de push del cliente

            // Enviar notificación local al profesional
            await NotificationsEnhancedService.triggerLocalNotification({
                title: '✅ Trabajo Aceptado',
                body: `Has aceptado el trabajo: ${job.descripcion_proyecto || 'Trabajo Sumee'}`,
                data: {
                    type: 'job_accepted',
                    jobId,
                },
                sound: 'success',
            });
        } catch (error) {
            console.error('[JobsServiceEnhanced] Error notifying client:', error);
            // No lanzar error - la notificación es opcional
        }
    },

    /**
     * Invalida el cache del trabajo
     */
    async invalidateJobCache(jobId: string): Promise<void> {
        // Invalidar cache local si existe
        // TODO: Implementar cache invalidation si usamos cache local

        // Emitir evento de actualización para suscripciones en tiempo real
        // Esto se maneja automáticamente por Supabase Realtime
    },
};

