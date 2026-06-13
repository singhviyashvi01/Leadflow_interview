// src/utils/auth.js
import api from './api';

const USER_KEY = 'leadflow_user';

/**
 * Register a new user
 */
export const signup = async (userData) => {
    // Split fullName into first and last name
    const [firstName, ...lastNames] = userData.fullName.trim().split(' ');
    const lastName = lastNames.join(' ') || '';

    // Map role to backend expected names
    const roleMapping = {
        'sales_manager': 'Sales Manager',
        'sales_representative': 'Sales Rep'
    };

    try {
        const response = await api.post('/api/leads/auth/signup/', {
            first_name: firstName,
            last_name: lastName,
            email: userData.email,
            password: userData.password,
            role_name: roleMapping[userData.role] || userData.role
        });

        const { user } = response.data;
        // Store user locally
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        return user;
    } catch (error) {
        const message = error.response?.data?.errors?.non_field_errors?.[0] || 
                      error.response?.data?.errors?.email?.[0] ||
                      'Registration failed. Please check your details.';
        throw new Error(message);
    }
};

/**
 * Verify credentials and start a session
 */
export const login = async (email, password, role) => {
    // Map role to backend expected names
    const roleMapping = {
        'sales_manager': 'Sales Manager',
        'sales_representative': 'Sales Rep'
    };

    try {
        const response = await api.post('/api/leads/auth/login/', {
            email,
            password,
            role_name: roleMapping[role] || role
        });

        const { user } = response.data;
        // Store user locally
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        return user;
    } catch (error) {
        const message = error.response?.data?.errors?.non_field_errors?.[0] || 
                      error.response?.data?.errors?.email?.[0] ||
                      error.response?.data?.errors?.role_name?.[0] ||
                      'Invalid email or password';
        throw new Error(message);
    }
};

/**
 * Get the currently logged in user from localStorage (UI only)
 */
export const getCurrentUser = () => {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
};

/**
 * End the current session
 */
export const logout = async () => {
    try {
        await api.post('/api/leads/auth/logout/');
    } catch (error) {
        console.error('Logout error', error);
    } finally {
        localStorage.removeItem(USER_KEY);
        // Clear old legacy keys if they exist
        localStorage.removeItem('leadflow_session');
        localStorage.removeItem('role');
        localStorage.removeItem('name');
    }
};

/**
 * Check if a user is logged in
 * (Note: true validation happens on backend requests)
 */
export const isAuthenticated = () => {
    return !!getCurrentUser();
};
