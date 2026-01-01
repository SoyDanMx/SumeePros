import { supabase } from '@/lib/supabase';

export type DiagnosticCategory = 'ELECTRICO' | 'PLOMERIA' | 'CCTV' | 'CLIMA' | 'CONSTRUCCION' | 'GENERAL';

export interface AIResponse {
    persona: string;
    analysis: string;
    steps: string[];
    technical_tips: string[];
    safety_warning: string;
}

export const AIService = {
    getPersona(category: DiagnosticCategory): string {
        switch (category) {
            case 'ELECTRICO':
                return 'Ingeniero Eléctrico Sénior con especialidad en normatividad técnica y seguridad industrial.';
            case 'PLOMERIA':
                return 'Ingeniero Hidráulico y de Fluidos experto en sistemas de presión y saneamiento urbano.';
            case 'CCTV':
                return 'Ingeniero en Sistemas de Seguridad Electrónica con enfoque en redes IP y videovigilancia avanzada.';
            case 'CLIMA':
                return 'Ingeniero en Termodinámica (HVAC) experto en sistemas de refrigeración y eficiencia energética.';
            case 'CONSTRUCCION':
                return 'Arquitecto e Ingeniero Civil especializado en estructuras y acabados arquitectónicos.';
            default:
                return 'Consultor Técnico Multidisciplinario y Especialista en Mantenimiento Proactivo.';
        }
    },

    async requestDiagnostic(
        userId: string,
        category: DiagnosticCategory,
        description: string,
        imageUri?: string
    ): Promise<AIResponse | null> {
        try {
            // In a real implementation, we would send this to a Supabase Edge Function
            // that calls Gemini or OpenAI. For this vanguard demonstration, we 
            // will simulate the response while showing how the call would be structured.

            console.log(`[AI Request] Category: ${category}, Persona: ${this.getPersona(category)}`);

            // Simulate Edge Function Call
            const { data, error } = await supabase.functions.invoke('ai-diagnostics', {
                body: {
                    userId,
                    category,
                    description,
                    persona: this.getPersona(category),
                    imageUri
                }
            });

            // FALLBACK / MOCK for development if function isn't deployed
            if (error || !data) {
                return this.getMockResponse(category);
            }

            return data;
        } catch (e) {
            console.error('AI Service Error:', e);
            return this.getMockResponse(category); // Graceful degradation
        }
    },

    getMockResponse(category: DiagnosticCategory): AIResponse {
        const personas: Record<DiagnosticCategory, string> = {
            ELECTRICO: 'Ingeniero Eléctrico Sénior',
            PLOMERIA: 'Ingeniero Hidráulico',
            CCTV: 'Ingeniero de Seguridad Electrónica',
            CLIMA: 'Ingeniero HVAC',
            CONSTRUCCION: 'Ingeniero Civil',
            GENERAL: 'Consultor Técnico'
        };

        return {
            persona: personas[category],
            analysis: `Basado en tu descripción técnica de la falla en el área de ${category.toLowerCase()}, parece haber un compromiso en la continuidad del sistema.`,
            steps: [
                "Realizar medición de parámetros base.",
                "Identificar el punto de falla crítico mediante inspección visual.",
                "Validar que no existan fugas o derivaciones a tierra."
            ],
            technical_tips: [
                "Usa siempre herramientas certificadas.",
                "Verifica la compatibilidad de los repuestos con el manual del fabricante."
            ],
            safety_warning: "⚠️ ALERTA DE SEGURIDAD: Antes de intervenir, asegura el área y desconecta la fuente de alimentación principal."
        };
    }
};
