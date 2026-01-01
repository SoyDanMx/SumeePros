import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Home, Briefcase, Calendar, DollarSign, User } from 'lucide-react-native';
import { NotificationsService } from '@/services/notifications';

export default function TabsLayout() {
    const { theme } = useTheme();

    useEffect(() => {
        const cleanup = NotificationsService.setupListeners((notification) => {
            console.log('Notification received in foreground:', notification.request.content.title);
        });
        return cleanup;
    }, []);

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: theme.card,
                    borderTopColor: theme.border,
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: theme.primary,
                tabBarInactiveTintColor: theme.textSecondary,
                tabBarShowLabel: true,
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '600',
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Inicio',
                    tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="jobs"
                options={{
                    title: 'Trabajos',
                    tabBarLabel: 'Trabajos',
                    headerTitle: 'Trabajos Disponibles',
                    tabBarIcon: ({ color, size }) => <Briefcase size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="calendar"
                options={{
                    title: 'Agenda',
                    tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="earnings"
                options={{
                    title: 'Ganancias',
                    tabBarIcon: ({ color, size }) => <DollarSign size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Perfil',
                    tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
                }}
            />
        </Tabs>
    );
}
