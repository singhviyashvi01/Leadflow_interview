import api from '../utils/api';

export const fetchCalendarEvents = async () => {
    const response = await api.get('/api/scheduling/events/');
    const raw = response.data;
    // Normalize to array regardless of response shape
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.results)) return raw.results;
    if (raw && Array.isArray(raw.data)) return raw.data;
    return [];
};

export const createCalendarEvent = async (eventData) => {
    const response = await api.post('/api/scheduling/events/', eventData);
    // Response shape is { message, data } — return the event object
    const raw = response.data;
    return raw?.data ?? raw;
};

export const fetchUsers = async (query = '') => {
    const response = await api.get('/api/scheduling/users/', { params: query ? { q: query } : {} });
    const raw = response.data;
    return Array.isArray(raw) ? raw : [];
};

export const updateCalendarEvent = async (id, eventData) => {
    const response = await api.patch(`/api/scheduling/events/${id}/`, eventData);
    const raw = response.data;
    return raw?.data ?? raw;
};

export const deleteCalendarEvent = async (id) => {
    await api.delete(`/api/scheduling/events/${id}/`);
};

