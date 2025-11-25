// Уніфікована валідація логіну
const validateLogin = (login) => {
  const loginRegex = /^[a-zA-Z0-9_]{3,30}$/;
  
  if (!login) {
    return { isValid: false, message: 'Логін обов\'язковий' };
  }
  
  if (login.length < 3) {
    return { isValid: false, message: 'Логін має містити мінімум 3 символи' };
  }
  
  if (login.length > 30) {
    return { isValid: false, message: 'Логін має містити максимум 30 символів' };
  }
  
  if (!loginRegex.test(login)) {
    return { isValid: false, message: 'Логін може містити тільки латинські літери, цифри та підкреслення' };
  }
  
  return { isValid: true };
};

module.exports = validateLogin;

