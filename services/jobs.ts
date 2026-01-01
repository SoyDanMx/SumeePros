import { supabase } from '@/lib/supabase';

export type Job = {
    id: string;
    title: string;
    description: string;
    price: number;
    location: string;
    status: 'pending' | 'accepted' | 'in_progress' | 'completed';
    is_urgent: boolean;
    client_name?: string;
    client_phone?: string;
    latitude?: number;
    longitude?: number;
    created_at: string;
    // Enhanced fields
    category?: string;
    ai_tags?: string[];
    checklist?: { label: string; value: string; }[];
    photos?: string[];
    distance_km?: number;
    estimated_duration?: string;
    materials_included?: boolean;
    bonus?: number;
};

// Mock jobs for development - realistic Mexican service data
const MOCK_JOBS: Job[] = [
    {
        id: 'job-001',
        title: 'Instalación de Contactos Eléctricos',
        description: 'El cliente necesita instalar 3 contactos eléctricos nuevos en sala y recámara. Ya existe instalación eléctrica. Se requiere cotizar materiales por separado.',
        price: 455,
        location: 'Calle Atenas #123, Col. Juárez, CDMX',
        status: 'pending',
        is_urgent: true,
        created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
        client_name: 'María García',
        client_phone: '55 1234 5678',
        latitude: 19.42847,
        longitude: -99.16766,
        category: 'Electricidad',
        ai_tags: ['Electricidad', 'Urgencia 7/10', 'Trabajo seguro'],
        checklist: [
            { label: 'Acción', value: 'Instalar contactos' },
            { label: 'Cantidad', value: '3 unidades' },
            { label: '¿Tienes los materiales?', value: 'No, cotizar aparte' },
            { label: '¿Ya existe instalación?', value: 'Sí' }
        ],
        photos: ['https://images.unsplash.com/photo-1558402529-d2638a7023e9?w=400'],
        distance_km: 2.5,
        estimated_duration: '2-3 horas',
        bonus: 50
    },
    {
        id: 'job-002',
        title: 'Fuga de Agua en Baño',
        description: 'Fuga importante debajo del lavabo del baño principal. El cliente reporta que lleva 2 días con la fuga y ya hay humedad en el piso.',
        price: 650,
        location: 'Av. Insurgentes Sur #456, Col. Roma Norte',
        status: 'pending',
        is_urgent: true,
        created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        client_name: 'Roberto Martínez',
        client_phone: '55 9876 5432',
        latitude: 19.4194,
        longitude: -99.1622,
        category: 'Plomería',
        ai_tags: ['Plomería', 'Urgencia 9/10', 'Fuga activa'],
        checklist: [
            { label: 'Problema', value: 'Fuga de agua' },
            { label: 'Ubicación', value: 'Baño principal - lavabo' },
            { label: 'Tiempo con el problema', value: '2 días' }
        ],
        distance_km: 3.8,
        estimated_duration: '1-2 horas'
    },
    {
        id: 'job-003',
        title: 'Mantenimiento de Aire Acondicionado',
        description: 'Servicio de mantenimiento preventivo para 2 minisplits. Incluye limpieza de filtros, revisión de gas y limpieza general.',
        price: 1200,
        location: 'Av. Masaryk #789, Col. Polanco',
        status: 'pending',
        is_urgent: false,
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        client_name: 'Andrea López',
        client_phone: '55 5555 1234',
        latitude: 19.4332,
        longitude: -99.1957,
        category: 'Aire Acondicionado',
        ai_tags: ['HVAC', 'Mantenimiento', 'Programado'],
        checklist: [
            { label: 'Tipo servicio', value: 'Mantenimiento preventivo' },
            { label: 'Equipos', value: '2 minisplits' },
            { label: 'Marca', value: 'Mirage' }
        ],
        distance_km: 5.2,
        estimated_duration: '2-3 horas',
        materials_included: true,
        bonus: 100
    },
    {
        id: 'job-004',
        title: 'Instalación de Calentador Solar',
        description: 'Instalación completa de calentador solar de 150 litros. El cliente ya tiene el equipo, solo requiere mano de obra.',
        price: 2500,
        location: 'Calle Durango #234, Col. Condesa',
        status: 'pending',
        is_urgent: false,
        created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        client_name: 'Carlos Hernández',
        client_phone: '55 4444 3333',
        latitude: 19.4128,
        longitude: -99.1732,
        category: 'Plomería',
        ai_tags: ['Plomería', 'Instalación', 'Trabajo grande'],
        checklist: [
            { label: 'Equipo', value: 'Calentador solar 150L' },
            { label: 'Cliente tiene equipo', value: 'Sí' },
            { label: 'Altura', value: '2do piso' }
        ],
        distance_km: 4.1,
        estimated_duration: '4-5 horas'
    },
    {
        id: 'job-005',
        title: 'Reparación de Cortocircuito',
        description: 'Se fue la luz en toda la casa después de conectar un aparato. El cliente sospecha cortocircuito en la cocina.',
        price: 550,
        location: 'Calle Sonora #567, Col. Hipódromo',
        status: 'pending',
        is_urgent: true,
        created_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
        client_name: 'Laura Sánchez',
        client_phone: '55 2222 1111',
        latitude: 19.4089,
        longitude: -99.1691,
        category: 'Electricidad',
        ai_tags: ['Electricidad', 'Urgencia 8/10', 'Sin luz'],
        checklist: [
            { label: 'Problema', value: 'Cortocircuito' },
            { label: 'Zona afectada', value: 'Cocina' },
            { label: 'Casa sin luz', value: 'Sí, completa' }
        ],
        distance_km: 1.8,
        estimated_duration: '1-2 horas'
    }
];

export const JobsService = {
    async getJobs(): Promise<Job[]> {
        // Check if Supabase is configured with real credentials
        const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';

        if (!supabaseUrl || supabaseUrl.includes('placeholder') || supabaseUrl.includes('your-project')) {
            // Return mock data for development
            console.log('[JobsService] Using mock data');
            return MOCK_JOBS;
        }

        try {
            const { data, error } = await supabase
                .from('jobs')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('[JobsService] Supabase error:', error);
                return MOCK_JOBS; // Fallback to mock
            }

            return (data as Job[]) || MOCK_JOBS;
        } catch (error) {
            console.error('[JobsService] Error fetching jobs:', error);
            return MOCK_JOBS;
        }
    },

    subscribeToJobs(callback: (payload: any) => void) {
        const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';

        if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
            // Simulate real-time updates in development
            const interval = setInterval(() => {
                // Occasionally trigger a mock update
                if (Math.random() > 0.8) {
                    callback({ eventType: 'INSERT', new: MOCK_JOBS[0] });
                }
            }, 30000); // Every 30 seconds

            return {
                unsubscribe: () => clearInterval(interval)
            };
        }

        return supabase
            .channel('public:jobs')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, callback)
            .subscribe();
    },

    async acceptJob(jobId: string, userId: string) {
        const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';

        if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
            // Mock acceptance
            console.log('[JobsService] Mock accepting job:', jobId);
            return { data: { id: jobId, status: 'accepted' }, error: null };
        }

        try {
            const { data, error } = await supabase
                .from('jobs')
                .update({
                    status: 'accepted',
                    worker_id: userId,
                    accepted_at: new Date().toISOString()
                })
                .eq('id', jobId)
                .eq('status', 'pending') // Only accept if still pending
                .select()
                .single();

            return { data, error };
        } catch (error) {
            console.error('[JobsService] Error accepting job:', error);
            return { data: null, error };
        }
    },

    async completeJob(jobId: string, userId: string) {
        const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';

        if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
            console.log('[JobsService] Mock completing job:', jobId);
            return { data: { id: jobId, status: 'completed' }, error: null };
        }

        try {
            const { data, error } = await supabase
                .from('jobs')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString()
                })
                .eq('id', jobId)
                .eq('worker_id', userId)
                .select()
                .single();

            return { data, error };
        } catch (error) {
            console.error('[JobsService] Error completing job:', error);
            return { data: null, error };
        }
    },

    async getJobById(jobId: string): Promise<Job | null> {
        const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';

        if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
            return MOCK_JOBS.find(j => j.id === jobId) || null;
        }

        try {
            const { data, error } = await supabase
                .from('jobs')
                .select('*')
                .eq('id', jobId)
                .single();

            if (error) return MOCK_JOBS.find(j => j.id === jobId) || null;
            return data as Job;
        } catch {
            return MOCK_JOBS.find(j => j.id === jobId) || null;
        }
    }
};
