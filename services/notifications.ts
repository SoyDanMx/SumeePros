import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

// Configure how notifications are handled when the app is open
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export const NotificationsService = {
    /**
     * Register the device for push notifications and save token to Supabase
     * @param userId The current authenticated user's ID
     */
    async registerForPushNotificationsAsync(userId: string) {
        let token;

        if (Platform.OS === 'web') {
            return null;
        }

        if (!Device.isDevice) {
            console.warn('Must use physical device for Push Notifications');
            return null;
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.warn('Failed to get push token for push notification!');
            return null;
        }

        try {
            const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;

            token = (await Notifications.getExpoPushTokenAsync({
                projectId,
            })).data;

            if (token && userId) {
                // Save token to professional_stats
                await supabase
                    .from('professional_stats')
                    .update({ push_token: token })
                    .eq('user_id', userId);
            }
        } catch (e) {
            console.error('Error getting push token:', e);
        }

        if (Platform.OS === 'android') {
            Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#6D28D9',
            });
        }

        return token;
    },

    /**
     * Setup listeners for notification events
     */
    setupListeners(onNotification: (notification: Notifications.Notification) => void) {
        const notificationListener = Notifications.addNotificationReceivedListener(onNotification);
        const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
            // Handle when user taps on the notification
            console.log('Notification tapped:', response.notification.request.content.data);
        });

        return () => {
            notificationListener.remove();
            responseListener.remove();
        };
    }
};
