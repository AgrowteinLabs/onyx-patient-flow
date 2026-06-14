export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || '';

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    USER_AUTH: '/api/auth/auth',
    USER_AUTH_VERIFY: '/api/auth/auth-verify',
    SIGNIN_NON_USER: '/api/auth/signin-non-user',
    VERIFY_NON_USER: '/api/auth/verify-non-user',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
  },
  
  // Session endpoints
  SESSION: {
    GET_ALL: '/api/session/sessionDetails',
    VIEW: (id: string) => `/api/session/view/${id}`,
  },
  
  // Session Item endpoints
  SESSION_ITEM: {
    LIST_BY_SESSION: (sessionId: string) => `/sessions/${sessionId}/items`,
    VIEW_URLS: (id: string) => `/session-items/${id}/view-urls`,
    LIST_MEDIA: (id: string) => `/session-items/${id}/media`,
  },
  
  // User endpoints
  USER: {
    VIEW: '/view/user',
  },
  
  // Report endpoints
  REPORT: {
    BY_USER: (id: string) => `/api/report/byUser/${id}`,
    BY_SESSION: (id: string) => `/api/report/bySession/${id}`,
  },
};
