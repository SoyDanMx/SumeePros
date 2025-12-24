export const mockJobs = [
    {
        id: '1',
        serviceType: 'Fuga en baño – Plomería',
        clientName: 'Ana G.',
        address: 'Av. Reforma 222, CDMX',
        coordinates: { lat: 19.42, lng: -99.16 },
        scheduledTime: new Date(new Date().getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
        isUrgent: true,
        takeHome: 450,
        status: 'pending',
    },
    {
        id: '2',
        serviceType: 'Instalación de Ventilador',
        clientName: 'Carlos M.',
        address: 'Polanco V Secc, CDMX',
        scheduledTime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000), // Tomorrow
        isUrgent: false,
        takeHome: 350,
        status: 'pending',
    },
    {
        id: '3',
        serviceType: 'Revision Eléctrica',
        clientName: 'Local Comercial',
        address: 'Roma Norte, CDMX',
        scheduledTime: new Date(new Date().getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        isUrgent: false,
        takeHome: 800,
        status: 'active',
    },
    {
        id: '4',
        serviceType: 'Limpieza Profunda',
        clientName: 'Oficinas WeWork',
        address: 'Varsovia 36, CDMX',
        scheduledTime: new Date(new Date().getTime() - 48 * 60 * 60 * 1000), // 2 days ago
        isUrgent: false,
        takeHome: 1200,
        status: 'completed',
    },
];

export const mockEarnings = [
    { id: '1', amount: 450, date: '2023-10-20', jobId: 'Job #1234' },
    { id: '2', amount: 1200, date: '2023-10-18', jobId: 'Job #1102' },
    { id: '3', amount: 350, date: '2023-10-15', jobId: 'Job #1089' },
];

export const mockReviews = [
    { id: '1', rating: 5, comment: 'Excelente trabajo, muy limpio.', date: 'Hace 2 días' },
    { id: '2', rating: 5, comment: 'Llegó puntual y resolvió el problema.', date: 'Hace 1 semana' },
];
