import api from '../utils/api';

export const fetchReportsSummary = async (range) => {
    try {
        const response = await api.get('/api/reports/', { params: { range } });
        return response.data;
    } catch (error) {
        console.error('Error fetching reports summary:', error);
        throw error;
    }
};

export const fetchReportsDashboard = async () => {
    try {
        const response = await api.get('/api/reports/dashboard/');
        return response.data;
    } catch (error) {
        console.error('Error fetching reports dashboard:', error);
        throw error;
    }
};

export const setMonthlyTarget = async (targetAmount) => {
    try {
        const response = await api.post('/api/reports/set-target/', { target_amount: targetAmount });
        return response.data;
    } catch (error) {
        console.error('Error setting monthly target:', error);
        throw error;
    }
};
