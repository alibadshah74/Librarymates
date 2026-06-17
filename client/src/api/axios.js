import axios from 'axios';

export const API_BASE_URL = (
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_BASEURL ||
    ''
).replace(/\/$/, '')

export const getApiErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
    if (!error.response) {
        return 'Unable to reach the server. Please check your connection and try again.'
    }

    const message = error.response.data?.message
    if (message) return message

    switch (error.response.status) {
        case 401:
            return 'Please sign in again to continue.'
        case 403:
            return 'You do not have permission to do that.'
        case 404:
            return 'The requested resource was not found.'
        case 500:
            return 'The server had a problem. Please try again later.'
        default:
            return fallback
    }
}

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
})

api.interceptors.response.use(
    (response) => response,
    (error) => {
        error.friendlyMessage = getApiErrorMessage(error)
        return Promise.reject(error)
    }
)

export default api
