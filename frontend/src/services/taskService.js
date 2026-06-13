import api from '../utils/api';

const API_URL = '/api/tasks/';

export const fetchTasks = async (userId) => {
    const response = await api.get(`${API_URL}${userId ? `?user=${userId}` : ''}`);
    return response.data;
};

export const createTask = async (taskData) => {
    const response = await api.post(API_URL, taskData);
    return response.data;
};

export const updateTask = async (id, taskData) => {
    const response = await api.patch(`${API_URL}${id}/`, taskData);
    return response.data;
};

export const deleteTask = async (id) => {
    const response = await api.delete(`${API_URL}${id}/`);
    return response.data;
};

export const completeTask = async (id) => {
    const response = await api.patch(`${API_URL}${id}/complete/`);
    return response.data;
};
