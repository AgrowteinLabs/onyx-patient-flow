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
  
  // Profile endpoints
  PROFILE: {
    CREATE: '/create/profile',
    GET_ALL: '/get/deviceprofile',
    VIEW: (id: string) => `/view/profile/${id}`,
    UPDATE: (id: string) => `/update/profile/${id}`,
    DELETE: (id: string) => `/delete/profile/${id}`,
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
    BY_PROFILE: (id: string) => `/api/report/byProfile/${id}`,
  },

  // Doctor endpoints
  DOCTOR: {
    LIST: '/api/doctor/list',
    AVAILABILITY: (id: string) => `/api/doctor/availability/${id}`,
  },

  // Booking endpoints
  BOOKING: {
    CREATE: '/api/booking/create',
    CONFIRM: '/api/booking/confirm',
    LIST: '/api/booking/list',
  },

  // Ticket endpoints
  TICKET: {
    CREATE: '/api/ticket/create',
    ADMIN_LIST: '/api/ticket/admin/list',
  },

  // Video endpoints
  VIDEO: {
    TOKEN: (bookingId: string) => `/api/video/token/${bookingId}`,
  }
};
