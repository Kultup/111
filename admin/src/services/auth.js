import api from './api';

const REMEMBERED_LOGIN_KEY = 'remembered_login';

export const login = async (loginValue, password, rememberMe = false) => {
  try {
    const response = await api.post('/auth/login', { login: loginValue, password });
    const { token, user } = response.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    // Зберегти логін якщо вибрано "Запам'ятати мене"
    if (rememberMe) {
      localStorage.setItem(REMEMBERED_LOGIN_KEY, loginValue);
    } else {
      // Видалити збережений логін якщо не вибрано
      localStorage.removeItem(REMEMBERED_LOGIN_KEY);
    }
    
    return { success: true, token, user };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Помилка при вході'
    };
  }
};

export const logout = async () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  // Не видаляємо збережений логін при виході, щоб користувач міг швидко увійти знову
  return { success: true };
};

export const getRememberedLogin = () => {
  try {
    return localStorage.getItem(REMEMBERED_LOGIN_KEY) || null;
  } catch (error) {
    return null;
  }
};

export const clearRememberedLogin = () => {
  try {
    localStorage.removeItem(REMEMBERED_LOGIN_KEY);
    return { success: true };
  } catch (error) {
    return { success: false };
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    return { success: true, user: response.data.user };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Помилка при отриманні даних'
    };
  }
};

