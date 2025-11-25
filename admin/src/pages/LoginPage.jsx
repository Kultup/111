import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { login as loginService, getRememberedLogin } from '../services/auth';
import { useNavigate } from 'react-router-dom';

// Схема валідації
const loginSchema = yup.object({
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

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      login: '',
      password: '',
      rememberMe: false,
    },
  });

  const rememberMe = watch('rememberMe');

  // Завантажити збережений логін при завантаженні сторінки
  useEffect(() => {
    const savedLogin = getRememberedLogin();
    if (savedLogin) {
      setValue('login', savedLogin);
      setValue('rememberMe', true);
    }
  }, [setValue]);

  const [submitError, setSubmitError] = React.useState('');

  const onSubmit = async (data) => {
    setSubmitError('');
    const result = await loginService(data.login, data.password, data.rememberMe);

    if (result.success) {
      login(result.user);
      navigate('/');
    } else {
      setSubmitError(result.message);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Адмін панель
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Вхід до системи
          </Typography>

          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Controller
              name="login"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Логін"
                  margin="normal"
                  autoComplete="username"
                  error={!!errors.login}
                  helperText={errors.login?.message}
                />
              )}
            />
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Пароль"
                  type="password"
                  margin="normal"
                  autoComplete="current-password"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                />
              )}
            />
            <Controller
              name="rememberMe"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={field.value}
                      onChange={field.onChange}
                      color="primary"
                    />
                  }
                  label="Запам'ятати мене"
                  sx={{ mt: 1 }}
                />
              )}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Вхід...' : 'Увійти'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage;

