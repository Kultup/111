import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Stack,
  CircularProgress,
  Alert,
  Divider,
  Grid,
  Card,
  CardContent,
  CardHeader,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import api from '../services/api';
import { useToast } from '../components/ToastProvider';

const SettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const toast = useToast();

  const [settings, setSettings] = useState({
    dailyTestTime: '12:00',
    testDeadline: '00:00',
    coinsPerCorrectAnswer: 10,
    coinsPerTestCompletion: 50,
    loginMinLength: 3,
    loginMaxLength: 30,
    loginPattern: '^[a-zA-Z0-9_]+$',
    maxFileSize: 5242880,
    reminderTime1: '16:00',
    reminderTime2: '19:00',
    systemName: 'Навчальна система "Країна Мрій"',
    systemDescription: 'Система навчання та тестування персоналу',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/settings');
      if (response.data && response.data.success && response.data.data) {
        setSettings(response.data.data);
      } else {
        // Якщо налаштування не знайдено, використовуємо значення за замовчуванням
        console.warn('Settings not found, using defaults');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Помилка завантаження налаштувань';
      setError(errorMessage);
      // Використовуємо значення за замовчуванням при помилці
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setSuccess(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      await api.put('/settings', settings);
      setSuccess(true);
      toast.success('Налаштування успішно збережено');
      
      // Очистити повідомлення через 3 секунди
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      const errorMessage = error.response?.data?.message || 'Помилка збереження налаштувань';
      setError(errorMessage);
      toast.error(errorMessage, 'Помилка збереження');
    } finally {
      setSaving(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Налаштування системи
        </Typography>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Збереження...' : 'Зберегти зміни'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(false)}>
          Налаштування успішно збережено
        </Alert>
      )}

      <Stack spacing={3}>
        {/* Налаштування тестів */}
        <Card>
          <CardHeader title="Налаштування тестів" />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Час розсилки тестів"
                  type="time"
                  fullWidth
                  value={settings.dailyTestTime}
                  onChange={(e) => handleChange('dailyTestTime', e.target.value)}
                  helperText="Час, коли генеруються щоденні тести"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Дедлайн тестів"
                  type="time"
                  fullWidth
                  value={settings.testDeadline}
                  onChange={(e) => handleChange('testDeadline', e.target.value)}
                  helperText="Час, до якого потрібно завершити тест"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Час першого нагадування"
                  type="time"
                  fullWidth
                  value={settings.reminderTime1}
                  onChange={(e) => handleChange('reminderTime1', e.target.value)}
                  helperText="Час першого нагадування про незавершений тест"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Час другого нагадування"
                  type="time"
                  fullWidth
                  value={settings.reminderTime2}
                  onChange={(e) => handleChange('reminderTime2', e.target.value)}
                  helperText="Час другого нагадування про незавершений тест"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Налаштування монет */}
        <Card>
          <CardHeader title="Налаштування монет" />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Монет за правильну відповідь"
                  type="number"
                  fullWidth
                  value={settings.coinsPerCorrectAnswer}
                  onChange={(e) => handleChange('coinsPerCorrectAnswer', parseInt(e.target.value) || 0)}
                  helperText="Кількість монет за кожну правильну відповідь"
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Монет за завершення тесту"
                  type="number"
                  fullWidth
                  value={settings.coinsPerTestCompletion}
                  onChange={(e) => handleChange('coinsPerTestCompletion', parseInt(e.target.value) || 0)}
                  helperText="Бонусні монети за завершення тесту"
                  inputProps={{ min: 0 }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Налаштування валідації логіну */}
        <Card>
          <CardHeader title="Валідація логіну" />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Мінімальна довжина"
                  type="number"
                  fullWidth
                  value={settings.loginMinLength}
                  onChange={(e) => handleChange('loginMinLength', parseInt(e.target.value) || 3)}
                  helperText="Мінімальна кількість символів в логіні"
                  inputProps={{ min: 3, max: 30 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Максимальна довжина"
                  type="number"
                  fullWidth
                  value={settings.loginMaxLength}
                  onChange={(e) => handleChange('loginMaxLength', parseInt(e.target.value) || 30)}
                  helperText="Максимальна кількість символів в логіні"
                  inputProps={{ min: 3, max: 30 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Паттерн (регулярний вираз)"
                  fullWidth
                  value={settings.loginPattern}
                  onChange={(e) => handleChange('loginPattern', e.target.value)}
                  helperText="Дозволені символи в логіні (регулярний вираз)"
                />
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                  Поточний паттерн: {settings.loginPattern} - дозволяє латинські літери, цифри та підкреслення
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Системні налаштування */}
        <Card>
          <CardHeader title="Системні налаштування" />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  label="Назва системи"
                  fullWidth
                  value={settings.systemName}
                  onChange={(e) => handleChange('systemName', e.target.value)}
                  helperText="Назва системи, що відображається користувачам"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Опис системи"
                  fullWidth
                  multiline
                  rows={3}
                  value={settings.systemDescription}
                  onChange={(e) => handleChange('systemDescription', e.target.value)}
                  helperText="Опис системи"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Максимальний розмір файлу"
                  type="number"
                  fullWidth
                  value={settings.maxFileSize}
                  onChange={(e) => handleChange('maxFileSize', parseInt(e.target.value) || 0)}
                  helperText={`Поточний розмір: ${formatFileSize(settings.maxFileSize)}`}
                  inputProps={{ min: 0 }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
};

export default SettingsPage;

