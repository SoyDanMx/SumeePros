import React from 'react';
import { Image, StyleSheet } from 'react-native';

interface JobMapProps {
    latitude: number;
    longitude: number;
}

export function JobMap({ latitude, longitude }: JobMapProps) {
    return (
        <Image
            source={{ uri: 'https://www.google.com/maps/d/thumbnail?mid=1yD5ig-8Hj4Z8m2-8Z9zX8Z9zX8Z&hl=en' }}
            style={styles.map}
        />
    );
}

const styles = StyleSheet.create({
    map: {
        width: '100%',
        height: '100%',
    },
});
