import { supabase } from '@/lib/supabase';

export interface PortfolioItem {
    id: string;
    user_id: string;
    image_url: string;
    description: string;
    created_at: string;
}

export const PortfolioService = {
    async getPortfolio(userId: string): Promise<PortfolioItem[]> {
        const { data, error } = await supabase
            .from('portfolio_items')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching portfolio:', error);
            return [];
        }

        return data || [];
    },

    async addPortfolioItem(userId: string, imageUrl: string, description: string): Promise<PortfolioItem | null> {
        const { data, error } = await supabase
            .from('portfolio_items')
            .insert({
                user_id: userId,
                image_url: imageUrl,
                description: description
            })
            .select()
            .single();

        if (error) {
            console.error('Error adding portfolio item:', error);
            return null;
        }

        return data;
    },

    async deletePortfolioItem(id: string): Promise<boolean> {
        const { error } = await supabase
            .from('portfolio_items')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting portfolio item:', error);
            return false;
        }

        return true;
    }
};
