// API Configuration
export const API_CONFIG = {
  // Base URLs for different environments
  BASE_URL: {
    development: process.env.EXPO_PUBLIC_API_BASE_URL_DEV || 'http://localhost:8000/api',
    production: process.env.EXPO_PUBLIC_API_BASE_URL_PROD || 'https://your-production-api.com/api',
    staging: process.env.EXPO_PUBLIC_API_BASE_URL_STAGING || 'https://your-staging-api.com/api',
  },

  // Current environment (change this based on your build)
  ENVIRONMENT: process.env.EXPO_PUBLIC_ENVIRONMENT || (__DEV__ ? 'development' : 'production'),

  // API endpoints
  ENDPOINTS: {
    // Authentication
    AUTH: {
      LOGIN: '/auth/login/',
      REGISTER: '/auth/register/',
      LOGOUT: '/auth/logout/',
      REFRESH: '/auth/token/refresh/',
    },

    // PhotoHunts
    PHOTOHUNTS: {
      LIST: '/photohunts/',
      DETAIL: (id: string) => `/photohunts/${id}/`,
      CREATE: '/photohunts/',
      UPDATE: (id: string) => `/photohunts/${id}/`,
      DELETE: (id: string) => `/photohunts/${id}/`,
      MY: '/photohunts/my/',
      NEARBY: '/photohunts/nearby/',
    },

    // Photo submission and validation
    PHOTOS: {
      SUBMIT: '/photos/submit/',
      UPLOAD: '/upload/', // If you have a separate upload endpoint
    },

    // User profile
    PROFILE: {
      GET: '/profile/',
      UPDATE: '/profile/update/',
    },

    // Completions
    COMPLETIONS: {
      LIST: '/completions/',
    },
  },

  // Request configuration
  REQUEST: {
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 second
  },

  // Image upload configuration
  UPLOAD: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    COMPRESSION_QUALITY: 0.8,
  },

  // Photo validation thresholds
  VALIDATION: {
    SIMILARITY_THRESHOLD: 0.7, // 70% similarity required
    CONFIDENCE_THRESHOLD: 0.8, // 80% confidence required
  },
};

// Helper function to get current base URL
export const getBaseUrl = (): string => {
  return API_CONFIG.BASE_URL[API_CONFIG.ENVIRONMENT as keyof typeof API_CONFIG.BASE_URL];
};

// Helper function to build full endpoint URL
export const buildEndpointUrl = (endpoint: string): string => {
  return `${getBaseUrl()}${endpoint}`;
};
