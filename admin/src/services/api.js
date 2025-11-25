import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Retry логіка для невдалих запитів
const retryRequest = async (error, retryCount = 0) => {
  const maxRetries = 3;
  const retryDelay = 1000; // 1 секунда

  // Не повторюємо запити для помилок авторизації або клієнтських помилок (4xx)
  if (error.response?.status >= 400 && error.response?.status < 500) {
    return Promise.reject(error);
  }

  // Повторюємо тільки для мережевих помилок або серверних помилок (5xx)
  if (retryCount < maxRetries && (
    !error.response || // Мережева помилка
    (error.response.status >= 500 && error.response.status < 600) // Серверна помилка
  )) {
    await new Promise(resolve => setTimeout(resolve, retryDelay * (retryCount + 1)));
    
    // Повторюємо запит
    try {
      return await api.request({
        ...error.config,
        headers: {
          ...error.config.headers,
          'X-Retry-Count': retryCount + 1,
        },
      });
    } catch (retryError) {
      return retryRequest(retryError, retryCount + 1);
    }
  }

  return Promise.reject(error);
};

// Додавання токену до запитів
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Обробка помилок з retry логікою
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    // Логування помилок для дебагу
    if (error.response) {
      console.error('API Error:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url,
        retryCount: error.config?.headers?.['X-Retry-Count'] || 0
      });
    } else if (error.request) {
      console.error('Network Error:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    
    // Спробувати повторити запит
    const retryCount = error.config?.headers?.['X-Retry-Count'] || 0;
    if (retryCount === 0) {
      return retryRequest(error, 0);
    }
    
    return Promise.reject(error);
  }
);

export default api;

