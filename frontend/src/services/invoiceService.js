import api from '../utils/api';

export const fetchInvoices = async () => {
    try {
        const response = await api.get('/api/invoices/invoice-list/');
        return response.data;
    } catch (error) {
        console.error('Error fetching invoices:', error);
        throw error;
    }
};
export const autoGenerateInvoices = async () => {
    try {
        const response = await api.post('/api/invoices/auto-generate/');
        return response.data;
    } catch (error) {
        console.error('Error generating invoices:', error);
        throw error;
    }
};
export const updateInvoiceStatus = async (invoiceId, status) => {
    try {
        const response = await api.patch(`/api/invoices/${invoiceId}/`, { status });
        return response.data;
    } catch (error) {
        console.error('Error updating invoice status:', error);
        throw error;
    }
};
export const fetchMonthlyFinancialReport = async (month, year) => {
    try {
        const response = await api.get('/api/invoices/monthly-report/', {
            params: { month, year }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching monthly financial report:', error);
        throw error;
    }
};

export const downloadMonthlyFinancialReportPDF = async (month, year) => {
    try {
        const response = await api.get('/api/invoices/monthly-report/', {
            params: { month, year, export: 'pdf' },
            responseType: 'blob'
        });
        return response.data;
    } catch (error) {
        console.error('Error downloading monthly financial report PDF:', error);
        throw error;
    }
};
