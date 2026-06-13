import api from '../utils/api';

export const fetchPipelineData = async () => {
    try {
        const response = await api.get('/api/pipeline/pipeline/');
        return response.data;
    } catch (error) {
        console.error('Error fetching pipeline data:', error);
        throw error;
    }
};

export const createDeal = async (dealData) => {
    try {
        const response = await api.post('/api/pipeline/pipeline/add/', dealData);
        return response.data;
    } catch (error) {
        console.error('Error creating deal:', error);
        throw error;
    }
};

export const updateDeal = async (dealId, dealData) => {
    try {
        const response = await api.patch(`/api/pipeline/pipeline/update/${dealId}/`, dealData);
        return response.data;
    } catch (error) {
        console.error('Error updating deal:', error);
        throw error;
    }
};

export const deleteDeal = async (dealId) => {
    try {
        const response = await api.delete(`/api/pipeline/pipeline/delete/${dealId}/`);
        return response.data;
    } catch (error) {
        console.error('Error deleting deal:', error);
        throw error;
    }
};

export const updateDealStage = async (dealId, stageId) => {
    try {
        const response = await api.patch(`/api/pipeline/pipeline/update-stage/${dealId}/`, {
            stage_id: stageId
        });
        return response.data;
    } catch (error) {
        console.error('Error updating deal stage:', error);
        throw error;
    }
};

export const closeDeal = async (dealId, status) => {
    try {
        const response = await api.patch(`/api/pipeline/pipeline/close/${dealId}/`, {
            status: status // 'won' or 'lost'
        });
        return response.data;
    } catch (error) {
        console.error('Error closing deal:', error);
        throw error;
    }
};
export const searchDeals = async (query) => {
    try {
        const response = await api.get(`/api/pipeline/pipeline/search/?q=${query}`);
        return response.data;
    } catch (error) {
        console.error('Error searching deals:', error);
        throw error;
    }
};
