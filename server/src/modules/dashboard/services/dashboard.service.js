import { dashboardConfigs } from '../config/dashboards.js';

/**
 * Fetch default dashboard widget configuration for a user role
 * @param {string} role 
 */
export async function getDashboardConfigForRole(role) {
    const config = dashboardConfigs[role] || dashboardConfigs.USER;
    return config;
}
