import React from 'react';
import { View, StyleSheet } from 'react-native';
import { UniversalMap } from './UniversalMap';

interface JobMapProps {
    latitude: number;
    longitude: number;
    userLocation?: { latitude: number; longitude: number };
    children?: React.ReactNode;
}

/**
 * JobMap - Wrapper around UniversalMap for job-specific use cases
 * Works on both web (Leaflet) and native (fallback, or native maps if configured)
 */
export function JobMap({ latitude, longitude, userLocation, children }: JobMapProps) {
    const jobLat = latitude || 19.4326;
    const jobLng = longitude || -99.1332;

    return (
        <View style={styles.container}>
            <UniversalMap
                latitude={jobLat}
                longitude={jobLng}
                zoom={15}
                showUserLocation={!!userLocation}
                userLocation={userLocation}
                markers={[
                    { id: 'job', latitude: jobLat, longitude: jobLng, type: 'job' }
                ]}
                interactive={true}
                style={styles.map}
            />
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    map: {
        width: '100%',
        height: '100%',
        borderRadius: 0,
    },
});

export default JobMap;
