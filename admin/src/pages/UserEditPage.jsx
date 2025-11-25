import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  MenuItem,
  Stack,
  CircularProgress,
  Alert,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import api from '../services/api';

const UserEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cities, setCities] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    city: '',
    position: '',
    role: 'user',
    isActive: true,
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Завантажити користувача
      const userResponse = await api.get(`/users/${id}`);
      const userData = userResponse.data.data;
      setUser(userData);

      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        city: userData.city?._id || userData.city || '',
        position: userData.position?._id || userData.position || '',
        role: userData.role || 'user',
        isActive: userData.isActive !== undefined ? userData.isActive : true,
      });

      // Завантажити міста та посади
      const [citiesResponse, positionsResponse] = await Promise.all([
        api.get('/cities'),
        api.get('/positions'),
      ]);

      setCities(citiesResponse.data.data || []);
      setPositions(positionsResponse.data.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Помилка завантаження даних');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    if (!formData.firstName.trim()) {
      setError('Ім\'я обов\'язкове');
      setSaving(false);
      return;
    }

    if (!formData.lastName.trim()) {
      setError('Прізвище обов\'язкове');
      setSaving(false);
      return;
    }

    if (!formData.city) {
      setError('Місто обов\'язкове');
      setSaving(false);
      return;
    }

    if (!formData.position) {
      setError('Посада обов\'язкова');
      setSaving(false);
      return;
    }

    try {
      await api.put(`/users/${id}`, formData);
      navigate(`/users/${id}`);
    } catch (error) {
      console.error('Error updating user:', error);
      setError(
        error.response?.data?.message || 'Помилка оновлення користувача'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !user) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/users')}
          sx={{ mb: 2 }}
        >
          Назад до списку
        </Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/users/${id}`)}
        >
          Назад
        </Button>
        <Typography variant="h4" component="h1">
          Редагувати користувача
        </Typography>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Ім'я"
                fullWidth
                required
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
              />
              <TextField
                label="Прізвище"
                fullWidth
                required
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
              />
            </Box>

            <TextField
              label="Логін"
              fullWidth
              value={user?.login || ''}
              disabled
              helperText="Логін не можна змінити"
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                select
                label="Місто"
                fullWidth
                required
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
              >
                {cities.map((city) => (
                  <MenuItem key={city._id} value={city._id}>
                    {city.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Посада"
                fullWidth
                required
                value={formData.position}
                onChange={(e) => handleChange('position', e.target.value)}
              >
                {positions.map((position) => (
                  <MenuItem key={position._id} value={position._id}>
                    {position.name}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                select
                label="Роль"
                fullWidth
                value={formData.role}
                onChange={(e) => handleChange('role', e.target.value)}
              >
                <MenuItem value="user">Користувач</MenuItem>
                <MenuItem value="admin">Адмін</MenuItem>
              </TextField>

              <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 200 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) => handleChange('isActive', e.target.checked)}
                    />
                  }
                  label="Активний користувач"
                />
              </Box>
            </Box>

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={() => navigate(`/users/${id}`)}
                disabled={saving}
              >
                Скасувати
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                disabled={saving}
              >
                {saving ? 'Збереження...' : 'Зберегти'}
              </Button>
            </Stack>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
};

export default UserEditPage;

