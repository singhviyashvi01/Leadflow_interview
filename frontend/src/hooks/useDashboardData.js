import { useState, useEffect } from 'react';
import api from '../utils/api';

const useDashboardData = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/leads/dashboard/stats/');
            setData(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            if (err.response?.status === 401) {
                // Force logout and re-sync if unauthorized
                localStorage.removeItem('leadflow_user');
                window.location.href = '/login';
            }
            setError(err.message || 'Failed to fetch dashboard data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    return { data, loading, error, refresh: fetchDashboardData };
};

export default useDashboardData;
