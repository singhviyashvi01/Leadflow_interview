import api from '../utils/api';

export const fetchNotifications = async () => {
    const response = await api.get('/api/leads/notifications/');
    return response.data; // { notifications: [...], unread_count: N }
};

export const markNotificationRead = async (id) => {
    await api.patch(`/api/leads/notifications/${id}/read/`);
};

export const markAllNotificationsRead = async () => {
    await api.patch('/api/leads/notifications/mark-all-read/');
};
