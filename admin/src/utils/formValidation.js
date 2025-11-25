import * as yup from 'yup';

// Схеми валідації для різних форм

export const loginSchema = yup.object({
  login: yup
    .string()
    .required('Логін обов\'язковий')
    .min(3, 'Логін повинен містити мінімум 3 символи')
    .max(50, 'Логін повинен містити максимум 50 символів'),
  password: yup
    .string()
    .required('Пароль обов\'язковий')
    .min(6, 'Пароль повинен містити мінімум 6 символів'),
  rememberMe: yup.boolean().default(false),
});

export const questionSchema = yup.object({
  text: yup
    .string()
    .required('Текст питання обов\'язковий')
    .min(10, 'Текст питання повинен містити мінімум 10 символів'),
  category: yup
    .string()
    .required('Категорія обов\'язкова'),
  difficulty: yup
    .number()
    .required('Складність обов\'язкова')
    .min(1, 'Складність повинна бути від 1 до 5')
    .max(5, 'Складність повинна бути від 1 до 5'),
  explanation: yup
    .string()
    .required('Пояснення обов\'язкове'),
  answers: yup
    .array()
    .of(
      yup.object({
        text: yup.string().required('Текст відповіді обов\'язковий'),
        isCorrect: yup.boolean(),
      })
    )
    .min(2, 'Повинно бути мінімум 2 варіанти відповіді')
    .test('at-least-one-correct', 'Повинна бути хоча б одна правильна відповідь', (answers) => {
      return answers && answers.some(answer => answer.isCorrect);
    }),
  positions: yup
    .array()
    .min(1, 'Необхідно вибрати хоча б одну посаду')
    .required('Посади обов\'язкові'),
  isActive: yup.boolean().default(true),
});

export const categorySchema = yup.object({
  name: yup
    .string()
    .required('Назва категорії обов\'язкова')
    .min(2, 'Назва повинна містити мінімум 2 символи')
    .max(100, 'Назва повинна містити максимум 100 символів'),
  description: yup.string(),
  isActive: yup.boolean().default(true),
});

export const citySchema = yup.object({
  name: yup
    .string()
    .required('Назва міста обов\'язкова')
    .min(2, 'Назва повинна містити мінімум 2 символи')
    .max(100, 'Назва повинна містити максимум 100 символів'),
  isActive: yup.boolean().default(true),
});

export const positionSchema = yup.object({
  name: yup
    .string()
    .required('Назва посади обов\'язкова')
    .min(2, 'Назва повинна містити мінімум 2 символи')
    .max(100, 'Назва повинна містити максимум 100 символів'),
  isActive: yup.boolean().default(true),
});

export const userSchema = yup.object({
  firstName: yup
    .string()
    .required('Ім\'я обов\'язкове')
    .min(2, 'Ім\'я повинно містити мінімум 2 символи')
    .max(50, 'Ім\'я повинно містити максимум 50 символів'),
  lastName: yup
    .string()
    .required('Прізвище обов\'язкове')
    .min(2, 'Прізвище повинно містити мінімум 2 символи')
    .max(50, 'Прізвище повинно містити максимум 50 символів'),
  login: yup
    .string()
    .required('Логін обов\'язковий')
    .min(3, 'Логін повинен містити мінімум 3 символи')
    .max(50, 'Логін повинен містити максимум 50 символів')
    .matches(/^[a-zA-Z0-9_]+$/, 'Логін може містити тільки літери, цифри та підкреслення'),
  password: yup
    .string()
    .when('$isEdit', {
      is: false,
      then: (schema) => schema.required('Пароль обов\'язковий').min(6, 'Пароль повинен містити мінімум 6 символів'),
      otherwise: (schema) => schema.min(6, 'Пароль повинен містити мінімум 6 символів'),
    }),
  city: yup.string().required('Місто обов\'язкове'),
  position: yup.string().required('Посада обов\'язкова'),
  role: yup.string().oneOf(['user', 'admin'], 'Невірна роль').required('Роль обов\'язкова'),
  isActive: yup.boolean().default(true),
});

