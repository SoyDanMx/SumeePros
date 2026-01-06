import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';
import { LocationService, LocationData } from './location';

export interface LocationTrackingOptions {
    jobId: string;
    userId: string;
    updateInterval?: number; // milliseconds, default 30000 (30 seconds)
    onLocationUpdate?: (location: LocationData & { 
        accuracy?: number;
        heading?: number;
        speed?: number;
        address?: string;
    }) => void;
    onError?: (error: Error) => void;
    onSessionCreated?: (sessionId: string) => void;
}

export interface TrackingSession {
    id: string;
    job_id: string;
    professional_id: string;
    status: 'active' | 'paused' | 'stopped';
    start_latitude?: number;
    start_longitude?: number;
    end_latitude?: number;
    end_longitude?: number;
    total_distance_km: number;
    total_duration_minutes: number;
    average_speed_kmh?: number;
    max_speed_kmh?: number;
    started_at: string;
    paused_at?: string;
    stopped_at?: string;
    last_update_at: string;
}

export interface LocationPoint {
    latitude: number;
    longitude: number;
    accuracy?: number;
    heading?: number;
    speed?: number;
    address?: string;
    tracked_at: string;
}

export class LocationTrackerEnhanced {
    private subscription: Location.LocationSubscription | null = null;
    private updateInterval: NodeJS.Timeout | null = null;
    private isTracking: boolean = false;
    private options: LocationTrackingOptions;
    private sessionId: string | null = null;
    private lastLocation: LocationData | null = null;
    private locationHistory: LocationPoint[] = [];
    private batteryOptimizationEnabled: boolean = true;

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
            console.warn('[LocationTrackerEnhanced] Already tracking');
            return false;
        }

        try {
            // Request permissions
            const hasPermission = await LocationService.requestPermissions();
            if (!hasPermission) {
                this.options.onError?.(new Error('Location permission denied'));
                return false;
            }

            // Create or resume tracking session
            const session = await this.getOrCreateSession();
            if (!session) {
                this.options.onError?.(new Error('Failed to create tracking session'));
                return false;
            }

            this.sessionId = session.id;
            this.options.onSessionCreated?.(session.id);

            // Get initial location
            const initialLocation = await LocationService.getCurrentLocation();
            if (initialLocation) {
                this.lastLocation = initialLocation;
                await this.saveLocationPoint(initialLocation);
            }

            // Start watching position with optimized settings
            const accuracy = this.batteryOptimizationEnabled 
                ? Location.Accuracy.Balanced 
                : Location.Accuracy.High;

            this.subscription = await Location.watchPositionAsync(
                {
                    accuracy,
                    timeInterval: this.options.updateInterval || 30000,
                    distanceInterval: 50, // Update every 50 meters
                    mayShowUserSettingsDialog: false,
                },
                async (location) => {
                    const locationData: LocationData & {
                        accuracy?: number;
                        heading?: number;
                        speed?: number;
                    } = {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        accuracy: location.coords.accuracy || undefined,
                        heading: location.coords.heading || undefined,
                        speed: location.coords.speed || undefined,
                        timestamp: new Date().toISOString(),
                    };

                    // Only update if location changed significantly or enough time passed
                    if (this.shouldUpdateLocation(locationData)) {
                        await this.updateLocation(locationData);
                        this.lastLocation = locationData;
                    }
                }
            );

            if (!this.subscription) {
                this.options.onError?.(new Error('Failed to start location tracking'));
                return false;
            }

            this.isTracking = true;
            console.log('[LocationTrackerEnhanced] Started tracking for job:', this.options.jobId);
            return true;
        } catch (error) {
            console.error('[LocationTrackerEnhanced] Start error:', error);
            this.options.onError?.(error as Error);
            return false;
        }
    }

    /**
     * Stop tracking location
     */
    async stop(): Promise<void> {
        if (this.subscription) {
            this.subscription.remove();
            this.subscription = null;
        }

        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        // Stop session
        if (this.sessionId) {
            await this.stopSession();
        }

        this.isTracking = false;
        this.sessionId = null;
        this.lastLocation = null;
        console.log('[LocationTrackerEnhanced] Stopped tracking');
    }

    /**
     * Pause tracking (keeps session active)
     */
    async pause(): Promise<void> {
        if (this.subscription) {
            this.subscription.remove();
            this.subscription = null;
        }

        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        if (this.sessionId) {
            await this.pauseSession();
        }

        this.isTracking = false;
        console.log('[LocationTrackerEnhanced] Paused tracking');
    }

    /**
     * Resume paused tracking
     */
    async resume(): Promise<boolean> {
        if (this.isTracking) {
            return false;
        }

        return await this.start();
    }

    /**
     * Get or create tracking session
     */
    private async getOrCreateSession(): Promise<TrackingSession | null> {
        try {
            // Check for existing active session
            const { data: existingSession, error: findError } = await supabase
                .from('tracking_sessions')
                .select('*')
                .eq('job_id', this.options.jobId)
                .eq('professional_id', this.options.userId)
                .eq('status', 'active')
                .single();

            if (existingSession && !findError) {
                return existingSession as TrackingSession;
            }

            // Get current location for start point
            const currentLocation = await LocationService.getCurrentLocation();
            
            // Create new session
            const { data: newSession, error: createError } = await supabase
                .from('tracking_sessions')
                .insert({
                    job_id: this.options.jobId,
                    professional_id: this.options.userId,
                    status: 'active',
                    start_latitude: currentLocation?.latitude,
                    start_longitude: currentLocation?.longitude,
                    started_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (createError) {
                console.error('[LocationTrackerEnhanced] Create session error:', createError);
                return null;
            }

            return newSession as TrackingSession;
        } catch (error) {
            console.error('[LocationTrackerEnhanced] Get/create session error:', error);
            return null;
        }
    }

    /**
     * Stop tracking session
     */
    private async stopSession(): Promise<void> {
        if (!this.sessionId) return;

        try {
            const currentLocation = await LocationService.getCurrentLocation();

            const { error } = await supabase
                .from('tracking_sessions')
                .update({
                    status: 'stopped',
                    end_latitude: currentLocation?.latitude,
                    end_longitude: currentLocation?.longitude,
                    stopped_at: new Date().toISOString(),
                    last_update_at: new Date().toISOString(),
                })
                .eq('id', this.sessionId);

            if (error) {
                console.error('[LocationTrackerEnhanced] Stop session error:', error);
            } else {
                // Calculate and update session statistics
                await this.updateSessionStats();
            }
        } catch (error) {
            console.error('[LocationTrackerEnhanced] Stop session error:', error);
        }
    }

    /**
     * Pause tracking session
     */
    private async pauseSession(): Promise<void> {
        if (!this.sessionId) return;

        try {
            const { error } = await supabase
                .from('tracking_sessions')
                .update({
                    status: 'paused',
                    paused_at: new Date().toISOString(),
                    last_update_at: new Date().toISOString(),
                })
                .eq('id', this.sessionId);

            if (error) {
                console.error('[LocationTrackerEnhanced] Pause session error:', error);
            }
        } catch (error) {
            console.error('[LocationTrackerEnhanced] Pause session error:', error);
        }
    }

    /**
     * Update location in Supabase
     */
    private async updateLocation(location: LocationData & {
        accuracy?: number;
        heading?: number;
        speed?: number;
    }): Promise<void> {
        try {
            // Save location point to history
            await this.saveLocationPoint(location);

            // Update in leads table (for real-time client view)
            // Note: Requires SCHEMA_ESTADOS_GRANULARES.sql to add these columns
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
                    // Columns don't exist - this is OK, tracking will still work via location_tracking table
                    console.warn('[LocationTrackerEnhanced] Location tracking columns not found in leads table. Using location_tracking table only.');
                } else {
                    // Other error - log it
                    console.error('[LocationTrackerEnhanced] Update leads error:', leadsError);
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
                    console.warn('[LocationTrackerEnhanced] Location columns not found in professional_stats. Location tracking may be limited.');
                } else {
                    console.error('[LocationTrackerEnhanced] Update stats error:', statsError);
                }
            }

            // Update session last_update_at
            if (this.sessionId) {
                await supabase
                    .from('tracking_sessions')
                    .update({
                        last_update_at: new Date().toISOString(),
                    })
                    .eq('id', this.sessionId);
            }

            // Call callback (always call, even if DB updates fail)
            this.options.onLocationUpdate?.(location);
        } catch (error) {
            console.error('[LocationTrackerEnhanced] Update location error:', error);
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
     * Save location point to tracking history
     */
    private async saveLocationPoint(location: LocationData & {
        accuracy?: number;
        heading?: number;
        speed?: number;
    }): Promise<void> {
        try {
            // Get reverse geocoding for address (non-blocking)
            let address: string | undefined;
            try {
                const geocodeResult = await Location.reverseGeocodeAsync({
                    latitude: location.latitude,
                    longitude: location.longitude,
                });
                if (geocodeResult && geocodeResult.length > 0) {
                    const addr = geocodeResult[0];
                    address = [
                        addr.street,
                        addr.streetNumber,
                        addr.district,
                        addr.city,
                    ].filter(Boolean).join(', ');
                }
            } catch (geocodeError) {
                // Non-critical, continue without address
                console.warn('[LocationTrackerEnhanced] Geocoding error:', geocodeError);
            }

            // Get battery level (if available)
            let batteryLevel: number | undefined;
            try {
                // Note: Battery API not available in Expo, would need native module
                // For now, we'll skip this
            } catch (batteryError) {
                // Ignore
            }

            const { error } = await supabase
                .from('location_tracking')
                .insert({
                    job_id: this.options.jobId,
                    professional_id: this.options.userId,
                    latitude: location.latitude,
                    longitude: location.longitude,
                    accuracy: location.accuracy,
                    heading: location.heading,
                    speed: location.speed,
                    address: address,
                    tracked_at: location.timestamp,
                    battery_level: batteryLevel,
                    is_moving: location.speed ? location.speed > 0.5 : false,
                });

            if (error) {
                console.error('[LocationTrackerEnhanced] Save location point error:', error);
            } else {
                // Add to local history (keep last 100 points)
                this.locationHistory.push({
                    latitude: location.latitude,
                    longitude: location.longitude,
                    accuracy: location.accuracy,
                    heading: location.heading,
                    speed: location.speed,
                    address: address,
                    tracked_at: location.timestamp,
                });

                if (this.locationHistory.length > 100) {
                    this.locationHistory.shift();
                }
            }
        } catch (error) {
            console.error('[LocationTrackerEnhanced] Save location point error:', error);
        }
    }

    /**
     * Determine if location should be updated
     */
    private shouldUpdateLocation(newLocation: LocationData): boolean {
        if (!this.lastLocation) {
            return true;
        }

        // Calculate distance from last location
        const distance = this.calculateDistance(
            this.lastLocation.latitude,
            this.lastLocation.longitude,
            newLocation.latitude,
            newLocation.longitude
        );

        // Update if moved more than 50 meters or 30 seconds passed
        const timeDiff = new Date(newLocation.timestamp).getTime() - 
                        new Date(this.lastLocation.timestamp).getTime();
        
        return distance > 0.05 || timeDiff > (this.options.updateInterval || 30000);
    }

    /**
     * Calculate distance between two points (Haversine formula)
     */
    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private toRad(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    /**
     * Update session statistics
     */
    private async updateSessionStats(): Promise<void> {
        if (!this.sessionId) return;

        try {
            const { data, error } = await supabase.rpc('calculate_tracking_session_stats', {
                p_session_id: this.sessionId,
            });

            if (error || !data || data.length === 0) {
                console.warn('[LocationTrackerEnhanced] Could not calculate stats:', error);
                return;
            }

            const stats = data[0];
            
            await supabase
                .from('tracking_sessions')
                .update({
                    total_distance_km: stats.total_distance_km || 0,
                    total_duration_minutes: stats.total_duration_minutes || 0,
                    average_speed_kmh: stats.average_speed_kmh || null,
                    max_speed_kmh: stats.max_speed_kmh || null,
                })
                .eq('id', this.sessionId);
        } catch (error) {
            console.error('[LocationTrackerEnhanced] Update stats error:', error);
        }
    }

    /**
     * Get location history for current job
     */
    async getLocationHistory(limit: number = 100): Promise<LocationPoint[]> {
        try {
            const { data, error } = await supabase.rpc('get_job_route', {
                p_job_id: this.options.jobId,
                p_limit: limit,
            });

            if (error) {
                console.error('[LocationTrackerEnhanced] Get history error:', error);
                return this.locationHistory; // Return local history as fallback
            }

            return (data as LocationPoint[]) || [];
        } catch (error) {
            console.error('[LocationTrackerEnhanced] Get history error:', error);
            return this.locationHistory;
        }
    }

    /**
     * Get last location for current job
     */
    async getLastLocation(): Promise<LocationPoint | null> {
        try {
            const { data, error } = await supabase.rpc('get_last_location_for_job', {
                p_job_id: this.options.jobId,
            });

            if (error || !data || data.length === 0) {
                return this.lastLocation ? {
                    latitude: this.lastLocation.latitude,
                    longitude: this.lastLocation.longitude,
                    accuracy: this.lastLocation.accuracy,
                    tracked_at: this.lastLocation.timestamp,
                } : null;
            }

            return data[0] as LocationPoint;
        } catch (error) {
            console.error('[LocationTrackerEnhanced] Get last location error:', error);
            return this.lastLocation ? {
                latitude: this.lastLocation.latitude,
                longitude: this.lastLocation.longitude,
                accuracy: this.lastLocation.accuracy,
                tracked_at: this.lastLocation.timestamp,
            } : null;
        }
    }

    /**
     * Enable/disable battery optimization
     */
    setBatteryOptimization(enabled: boolean): void {
        this.batteryOptimizationEnabled = enabled;
        
        // If currently tracking, restart with new settings
        if (this.isTracking) {
            this.stop().then(() => {
                this.start();
            });
        }
    }

    /**
     * Check if currently tracking
     */
    get tracking(): boolean {
        return this.isTracking;
    }

    /**
     * Get current session ID
     */
    get session(): string | null {
        return this.sessionId;
    }
}

