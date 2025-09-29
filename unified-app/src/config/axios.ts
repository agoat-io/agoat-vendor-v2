import axios from 'axios'
import logger from '../utils/logger'
import eventBus from '../utils/eventBus'

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: '',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// The only existing user in the DB (temporary hardcoded fallback)
const HARDCODED_USER_ID = '1096773348868587521'
const HARDCODED_USER_ROLE = 'admin'

// Request interceptor to add authentication headers
apiClient.interceptors.request.use(
  (config) => {
    // Always set hardcoded user headers to ensure API accepts the request
    config.headers['X-User-ID'] = HARDCODED_USER_ID
    config.headers['X-User-Role'] = HARDCODED_USER_ROLE

    // Optionally enrich logs with any locally stored user (but headers remain hardcoded)
    const userData = localStorage.getItem('auth_user')
    if (userData) {
      try {
        const user = JSON.parse(userData)
        logger.info('api', 'request', 'API request (hardcoded auth applied)', {
          method: config.method,
          url: config.url,
          user_id_header: HARDCODED_USER_ID,
          user_role_header: HARDCODED_USER_ROLE,
          local_user_id: user.id,
          local_user_role: user.role
        })
      } catch (error: any) {
        logger.error('api', 'request', 'Error parsing user data', { error: error.message })
      }
    } else {
      logger.warning('api', 'request', 'API request without local session (hardcoded auth applied)', {
        method: config.method,
        url: config.url,
        user_id_header: HARDCODED_USER_ID,
        user_role_header: HARDCODED_USER_ROLE,
      })
    }

    return config
  },
  (error) => {
    logger.error('api', 'request', 'Request interceptor error', { error: error.message })
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    logger.info('api', 'response', 'API response received', {
      method: response.config.method,
      url: response.config.url,
      status: response.status,
      statusText: response.statusText
    })
    return response
  },
  (error) => {
    const errorData = {
      method: error.config?.method,
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      error: error.message
    }

    // Extract error details from response
    const errorResponse = error.response?.data
    if (errorResponse?.error) {
      const apiError = errorResponse.error
      logger.error('api', 'response', 'API error received', {
        ...errorData,
        error_code: apiError.code,
        error_message: apiError.message,
        error_id: apiError.error_id,
        is_business_error: apiError.code && !['DATABASE_ERROR', 'INTERNAL_ERROR'].includes(apiError.code)
      })

      // Emit global error event for UI popup
      eventBus.emit('api:error', {
        code: apiError.code,
        message: apiError.message,
        error_id: apiError.error_id,
        is_business: apiError.code && !['DATABASE_ERROR', 'INTERNAL_ERROR'].includes(apiError.code)
      })
    }

    if (error.response?.status === 401) {
      logger.warning('api', 'response', 'Unauthorized access', errorData)
      // Handle unauthorized access
      localStorage.removeItem('auth_user')
      window.location.href = '/'
    } else if (error.response?.status >= 500) {
      logger.error('api', 'response', 'Server error', errorData)
    } else if (error.response?.status >= 400) {
      logger.warning('api', 'response', 'Client error', errorData)
    } else {
      logger.error('api', 'response', 'Network error', errorData)
    }
    
    return Promise.reject(error)
  }
)

export default apiClient
