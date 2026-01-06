import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';
import { LocationService, LocationData } from './location';

export interface LocationTrackingOptions {
    jobId: string;
    userId: string;
    updateInterval?: number; // milliseconds, default 30000 (30 seconds)
    onLocationUpdate?: (location: LocationData) => void;
    onError?: (error: Error) => void;
}

export class LocationTracker {
    private subscription: Location.LocationSubscription | null = null;
    private updateInterval: NodeJS.Timeout | null = null;
    private isTracking: boolean = false;
    private options: LocationTrackingOptions;

    constructor(options: LocationTrackingOptions) {
        this.options = {
            updateInterval: 30000, // 30 seconds default
            ...options,
        };
    }

    /**
     * Start tracking location for an active job
     */
    async start(): Promise<boolean> {
        if (this.isTracking) {
            console.warn('[LocationTracker] Already tracking');
            return false;
        }

        try {
            // Request permissions
            const hasPermission = await LocationService.requestPermissions();
            if (!hasPermission) {
                this.options.onError?.(new Error('Location permission denied'));
                return false;
            }

            // Start watching position
            this.subscription = await LocationService.startWatchingLocation(
                async (location) => {
                    await this.updateLocation(location);
                },
                {
                    accuracy: Location.Accuracy.Balanced,
                    timeInterval: this.options.updateInterval || 30000,
                    distanceInterval: 50, // Update every 50 meters
                }
            );

            if (!this.subscription) {
                this.options.onError?.(new Error('Failed to start location tracking'));
                return false;
            }

            this.isTracking = true;
            console.log('[LocationTracker] Started tracking for job:', this.options.jobId);
            return true;
        } catch (error) {
            console.error('[LocationTracker] Start error:', error);
            this.options.onError?.(error as Error);
            return false;
        }
    }

    /**
     * Stop tracking location
     */
    stop(): void {
        if (this.subscription) {
            this.subscription.remove();
            this.subscription = null;
        }

        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        this.isTracking = false;
        console.log('[LocationTracker] Stopped tracking');
    }

    /**
     * Update location in Supabase
     */
    private async updateLocation(location: LocationData): Promise<void> {
        try {
            // Update in leads table (only if columns exist - requires SCHEMA_ESTADOS_GRANULARES.sql)
            const { error: leadsError } = await supabase
                .from('leads')
                .update({
                    professional_latitude: location.latitude,
                    professional_longitude: location.longitude,
                    professional_location_updated_at: location.timestamp,
                })
                .eq('id', this.options.jobId)
                .eq('professional_id', this.options.userId);

            if (leadsError) {
                // Handle column not found errors gracefully
                const isColumnError = 
                    leadsError.code === '42703' || // Column does not exist
                    leadsError.code === 'PGRST204' || // Column not found in schema cache
                    leadsError.message?.includes('does not exist') ||
                    leadsError.message?.includes('Could not find') ||
                    leadsError.message?.includes('column');

                if (isColumnError) {
                    // Columns don't exist - this is OK, tracking will still work via professional_stats
                    // and location_tracking table (if SCHEMA_LOCATION_TRACKING.sql is applied)
                    console.warn('[LocationTracker] Location tracking columns not found in leads table. Tracking via professional_stats only.');
                } else {
                    // Other error - log it
                    console.error('[LocationTracker] Update leads error:', leadsError);
                }
            }

            // Update in professional_stats for general location (this should always exist)
            const { error: statsError } = await supabase
                .from('professional_stats')
                .update({
                    last_location_lat: location.latitude,
                    last_location_lng: location.longitude,
                    updated_at: location.timestamp,
                })
                .eq('user_id', this.options.userId);

            if (statsError) {
                // Handle column not found errors gracefully
                const isColumnError = 
                    statsError.code === '42703' ||
                    statsError.code === 'PGRST204' ||
                    statsError.message?.includes('does not exist') ||
                    statsError.message?.includes('Could not find');

                if (isColumnError) {
                    console.warn('[LocationTracker] Location columns not found in professional_stats. Location tracking may be limited.');
                } else {
                    console.error('[LocationTracker] Update stats error:', statsError);
                }
            }

            // Call callback (always call, even if DB updates fail)
            this.options.onLocationUpdate?.(location);
        } catch (error) {
            console.error('[LocationTracker] Update location error:', error);
            // Don't call onError for column errors - they're not critical
            const isColumnError = 
                (error as any)?.code === '42703' ||
                (error as any)?.code === 'PGRST204' ||
                (error as any)?.message?.includes('does not exist') ||
                (error as any)?.message?.includes('Could not find');

            if (!isColumnError) {
                this.options.onError?.(error as Error);
            }
        }
    }

    /**
     * Check if currently tracking
     */
    get tracking(): boolean {
        return this.isTracking;
    }
}

