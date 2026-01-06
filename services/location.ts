import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';

export interface LocationData {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp: string;
}

export const LocationService = {
    /**
     * Request location permissions
     */
    async requestPermissions(): Promise<boolean> {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            return status === 'granted';
        } catch (error) {
            console.error('[LocationService] Permission error:', error);
            return false;
        }
    },

    /**
     * Get current location
     */
    async getCurrentLocation(): Promise<LocationData | null> {
        try {
            const hasPermission = await this.requestPermissions();
            if (!hasPermission) {
                return null;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            return {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                accuracy: location.coords.accuracy || undefined,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('[LocationService] Get location error:', error);
            return null;
        }
    },

    /**
     * Start watching location (for active job tracking)
     */
    async startWatchingLocation(
        callback: (location: LocationData) => void,
        options?: {
            accuracy?: Location.Accuracy;
            timeInterval?: number;
            distanceInterval?: number;
        }
    ): Promise<Location.LocationSubscription | null> {
        try {
            const hasPermission = await this.requestPermissions();
            if (!hasPermission) {
                return null;
            }

            const subscription = await Location.watchPositionAsync(
                {
                    accuracy: options?.accuracy || Location.Accuracy.Balanced,
                    timeInterval: options?.timeInterval || 30000, // 30 seconds
                    distanceInterval: options?.distanceInterval || 50, // 50 meters
                },
                (location) => {
                    callback({
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        accuracy: location.coords.accuracy || undefined,
                        timestamp: new Date().toISOString(),
                    });
                }
            );

            return subscription;
        } catch (error) {
            console.error('[LocationService] Watch location error:', error);
            return null;
        }
    },

    /**
     * Update professional location in Supabase (for active job tracking)
     * Note: Requires SCHEMA_ESTADOS_GRANULARES.sql to add these columns
     */
    async updateProfessionalLocation(
        userId: string,
        jobId: string,
        location: LocationData
    ): Promise<{ error: any }> {
        try {
            const { error } = await supabase
                .from('leads')
                .update({
                    professional_latitude: location.latitude,
                    professional_longitude: location.longitude,
                    professional_location_updated_at: location.timestamp,
                })
                .eq('id', jobId)
                .eq('professional_id', userId);

            // Handle column not found errors gracefully
            if (error) {
                const isColumnError = 
                    error.code === '42703' || // Column does not exist
                    error.code === 'PGRST204' || // Column not found in schema cache
                    error.message?.includes('does not exist') ||
                    error.message?.includes('Could not find') ||
                    error.message?.includes('column');

                if (isColumnError) {
                    // Columns don't exist - this is OK, return null error to indicate it's not critical
                    console.warn('[LocationService] Location tracking columns not found. This is OK if SCHEMA_ESTADOS_GRANULARES.sql has not been applied.');
                    return { error: null };
                }
            }

            return { error };
        } catch (error) {
            console.error('[LocationService] Update location error:', error);
            return { error };
        }
    },

    /**
     * Calculate distance between two coordinates (Haversine formula)
     */
    calculateDistance(
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
    ): number {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) *
                Math.cos(this.toRad(lat2)) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in kilometers
    },

    /**
     * Convert degrees to radians
     */
    toRad(degrees: number): number {
        return degrees * (Math.PI / 180);
    },

    /**
     * Estimate time to arrival (ETA) based on distance
     * Assumes average speed of 30 km/h in city
     */
    estimateETA(distanceKm: number, averageSpeedKmh: number = 30): number {
        return Math.ceil((distanceKm / averageSpeedKmh) * 60); // Returns minutes
    },
};

