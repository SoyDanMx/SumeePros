import React from 'react';
import { View, StyleSheet, Platform, Image, Dimensions } from 'react-native';
import { Zap, MapPin } from 'lucide-react-native';
import { Text } from './Text';

const { width } = Dimensions.get('window');

// Brand colors
const SUMEE_PURPLE = '#6D28D9';
const SUMEE_GREEN = '#10B981';

interface UniversalMapProps {
    latitude: number;
    longitude: number;
    zoom?: number;
    markers?: Array<{
        id: string;
        latitude: number;
        longitude: number;
        type?: 'job' | 'user';
    }>;
    showUserLocation?: boolean;
    userLocation?: { latitude: number; longitude: number };
    style?: any;
    interactive?: boolean;
}

/**
 * UniversalMap - Cross-platform map component
 * Uses Leaflet iframe for web, visual fallback for native (react-native-maps can be added separately)
 */
export function UniversalMap({
    latitude,
    longitude,
    zoom = 15,
    markers = [],
    showUserLocation = false,
    userLocation,
    style,
    interactive = true,
}: UniversalMapProps) {

    // For web: Use Leaflet embedded via iframe
    if (Platform.OS === 'web') {
        // Leaflet embed HTML for interactive map
        const leafletHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    html, body, #map { width: 100%; height: 100%; }
                    .job-marker {
                        background: ${SUMEE_PURPLE};
                        border: 3px solid white;
                        border-radius: 50%;
                        width: 32px;
                        height: 32px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0 3px 10px rgba(0,0,0,0.3);
                    }
                    .user-marker {
                        background: ${SUMEE_GREEN};
                        border: 3px solid white;
                        border-radius: 50%;
                        width: 20px;
                        height: 20px;
                        box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.3);
                    }
                    .leaflet-control-attribution { font-size: 9px !important; }
                </style>
            </head>
            <body>
                <div id="map"></div>
                <script>
                    var map = L.map('map', {
                        zoomControl: false,
                        attributionControl: true
                    }).setView([${latitude}, ${longitude}], ${zoom});
                    
                    // Use CartoDB Voyager for cleaner look
                    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png', {
                        attribution: '© <a href="https://carto.com/">CARTO</a> | © <a href="https://osm.org/">OSM</a>',
                        maxZoom: 19
                    }).addTo(map);
                    
                    // Job marker icon
                    var jobIcon = L.divIcon({
                        className: '',
                        html: '<div class="job-marker"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div>',
                        iconSize: [32, 32],
                        iconAnchor: [16, 16]
                    });
                    
                    // User marker icon
                    var userIcon = L.divIcon({
                        className: '',
                        html: '<div class="user-marker"></div>',
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                    });
                    
                    // Add job markers
                    ${markers.map(m => `
                        L.marker([${m.latitude}, ${m.longitude}], {icon: ${m.type === 'user' ? 'userIcon' : 'jobIcon'}}).addTo(map);
                    `).join('')}
                    
                    // Add user location if available
                    ${showUserLocation && userLocation ? `
                        L.marker([${userLocation.latitude}, ${userLocation.longitude}], {icon: userIcon}).addTo(map);
                    ` : ''}
                    
                    // Add a circle around center for visual effect
                    L.circle([${latitude}, ${longitude}], {
                        color: '${SUMEE_PURPLE}',
                        fillColor: '${SUMEE_PURPLE}',
                        fillOpacity: 0.1,
                        weight: 1,
                        radius: 500
                    }).addTo(map);
                </script>
            </body>
            </html>
        `;

        return (
            <View style={[styles.container, style]}>
                <iframe
                    srcDoc={leafletHtml}
                    style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        borderRadius: 0,
                    }}
                    title="Mapa de ubicación"
                    sandbox="allow-scripts allow-same-origin"
                />
            </View>
        );
    }

    // For Native (iOS/Android): Visual placeholder
    // Note: To use react-native-maps, create a separate NativeMap.tsx component
    // and import it conditionally at the app level, not here
    return (
        <View style={[styles.container, styles.fallback, style]}>
            <View style={styles.gridPattern}>
                {[...Array(6)].map((_, i) => (
                    <View key={`h-${i}`} style={[styles.gridLineH, { top: `${(i + 1) * 16}%` }]} />
                ))}
                {[...Array(5)].map((_, i) => (
                    <View key={`v-${i}`} style={[styles.gridLineV, { left: `${(i + 1) * 20}%` }]} />
                ))}
            </View>

            <View style={styles.heatCircle} />

            {/* Job markers visual */}
            {markers.slice(0, 5).map((m, i) => (
                <View
                    key={m.id}
                    style={[
                        styles.markerDotSmall,
                        {
                            position: 'absolute',
                            top: `${25 + i * 10}%`,
                            left: `${20 + i * 12}%`
                        }
                    ]}
                >
                    <Zap size={10} color="white" />
                </View>
            ))}

            <View style={styles.centerMarker}>
                <View style={styles.markerPulse} />
                <View style={styles.markerDot}>
                    <MapPin size={16} color="white" />
                </View>
            </View>

            {showUserLocation && userLocation && (
                <View style={[styles.userDot, { position: 'absolute', bottom: '30%', right: '30%' }]}>
                    <View style={styles.userPulse} />
                    <View style={styles.userCenter} />
                </View>
            )}

            <View style={styles.coordsBadge}>
                <Text style={{ color: '#6B7280', fontSize: 10 }}>
                    📍 {latitude.toFixed(4)}, {longitude.toFixed(4)}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 250,
        borderRadius: 16,
        overflow: 'hidden',
    },
    fallback: {
        backgroundColor: '#E0E7FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    gridPattern: {
        ...StyleSheet.absoluteFillObject,
    },
    gridLineH: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: 'rgba(109, 40, 217, 0.1)',
    },
    gridLineV: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 1,
        backgroundColor: 'rgba(109, 40, 217, 0.1)',
    },
    heatCircle: {
        position: 'absolute',
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(109, 40, 217, 0.15)',
    },
    centerMarker: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    markerPulse: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(109, 40, 217, 0.2)',
    },
    markerDot: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: SUMEE_PURPLE,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    markerDotSmall: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: SUMEE_PURPLE,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    userDot: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    userPulse: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
    },
    userCenter: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: SUMEE_GREEN,
        borderWidth: 2,
        borderColor: 'white',
    },
    coordsBadge: {
        position: 'absolute',
        bottom: 12,
        backgroundColor: 'white',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
});

export default UniversalMap;
