import { supabase } from '@/lib/supabase';

export type Job = {
    id: string;
    title: string;
    description: string;
    price: number;
    location: string;
    status: 'pending' | 'accepted' | 'active' | 'completed' | 'cancelled';
    is_urgent: boolean;
    client_name?: string;
    client_phone?: string;
    latitude?: number;
    longitude?: number;
    created_at: string;
    category?: string;
    distance_km?: number;
    ai_tags?: string[];
    checklist?: { label: string; value: string; }[];
    bonus?: number;
};

// Services for real production data from Supabase
export const JobsService = {
    async getJobs(): Promise<Job[]> {
        try {
            const { data, error } = await supabase
                .from('jobs')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('[JobsService] Supabase error:', error);
                return [];
            }

            return (data as Job[]) || [];
        } catch (error) {
            console.error('[JobsService] Critical fetch error:', error);
            return [];
        }
    },

    subscribeToJobs(callback: (payload: any) => void) {
        return supabase
            .channel('public:jobs')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, callback)
            .subscribe();
    },

    async acceptJob(jobId: string, userId: string) {
        try {
            const { data, error } = await supabase
                .from('jobs')
                .update({
                    status: 'accepted',
                    professional_id: userId,
                })
                .eq('id', jobId)
                .eq('status', 'pending')
                .select()
                .single();

            return { data, error };
        } catch (error) {
            console.error('[JobsService] Accept error:', error);
            return { data: null, error };
        }
    },

    async completeJob(jobId: string, userId: string) {
        try {
            const { data, error } = await supabase
                .from('jobs')
                .update({
                    status: 'completed',
                })
                .eq('id', jobId)
                .eq('professional_id', userId)
                .select()
                .single();

            return { data, error };
        } catch (error) {
            console.error('[JobsService] Complete error:', error);
            return { data: null, error };
        }
    },

    async getJobById(jobId: string): Promise<Job | null> {
        try {
            const { data, error } = await supabase
                .from('jobs')
                .select('*')
                .eq('id', jobId)
                .single();

            if (error) return null;
            return data as Job;
        } catch {
            return null;
        }
    }
};
