export const API_ENDPOINTS = {
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
      PROFILE: '/api/auth/profile',
    },
    VIRTUAL_ACCOUNT: {
      BASE: '/api/virtual-accounts',
      BY_ID: (id: string) => `/api/virtual-accounts/${id}`,
    },
    TRANSACTION: {
      BASE: '/api/transactions',
      BY_ID: (id: string) => `/api/transactions/${id}`,
    },
    POINT: {
      BASE: '/api/points',
      BY_ID: (id: string) => `/api/points/${id}`,
    },
    ADMIN: {
      USERS: '/api/admin/users',
      USER_BY_ID: (id: string) => `/api/admin/users/${id}`,
    },
  };
  
  export const DEFAULT_API_CONFIG = {
    TIMEOUT: 30000, // 30 seconds
    RETRY_COUNT: 3,
    RETRY_DELAY: 1000, // 1 second
  };