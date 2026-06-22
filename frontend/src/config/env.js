export const config = {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
    environment: import.meta.env.MODE
}