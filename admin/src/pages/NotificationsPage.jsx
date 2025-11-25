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
  Card,
  CardContent,
  CardHeader,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Divider,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Send as SendIcon,
  Notifications as NotificationsIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import api from '../services/api';
import { useToast } from '../components/ToastProvider';

const NotificationsPage = () => {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [stats, setStats] = useState(null);
  const [cities, setCities] = useState([]);
  const [positions, setPositions] = useState([]);
  const [users, setUsers] = useState([]);
  const toast = useToast();

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    recipients: 'all', // all, city, position, users
    cityId: '',
    positionId: '',
    userIds: [],
    data: {}
  });

  const [sendResults, setSendResults] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  // Діагностичний useEffect для відстеження змін
  useEffect(() => {
    console.log('FormData changed:', formData);
    console.log('Stats changed:', stats);
    if (stats) {
      const count = getRecipientsCount();
      console.log('Current recipients count:', count);
    }
  }, [formData.recipients, formData.cityId, formData.positionId, formData.userIds, stats]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, citiesRes, positionsRes, usersRes] = await Promise.all([
        api.get('/notifications/stats'),
        api.get('/cities'),
        api.get('/positions'),
        api.get('/users?limit=1000')
      ]);

      const statsData = statsRes.data.data;
      console.log('=== Loading Notification Data ===');
      console.log('Stats response:', statsRes.data);
      console.log('Stats data:', statsData);
      console.log('Users with tokens from stats:', statsData?.usersWithTokens);
      console.log('Total users from stats:', statsData?.totalUsers);
      setStats(statsData);
      
      setCities(citiesRes.data.data || []);
      setPositions(positionsRes.data.data || []);
      
      // Фільтрувати тільки користувачів з push токенами
      const allUsers = usersRes.data.data || [];
      const usersWithTokens = allUsers.filter(u => u.pushToken);
      console.log('Loaded all users:', allUsers.length);
      console.log('Users with push tokens:', usersWithTokens.length);
      console.log('Sample user with token:', usersWithTokens[0]);
      console.log('Stats citiesStats:', statsData?.citiesStats);
      console.log('Stats positionsStats:', statsData?.positionsStats);
      setUsers(usersWithTokens);
      
      // Якщо статистика показує 0, але є користувачі з токенами, оновити статистику
      if (statsData?.usersWithTokens === 0 && usersWithTokens.length > 0) {
        console.warn('Stats shows 0 users with tokens, but found', usersWithTokens.length, 'users with tokens');
        // Оновити статистику вручну
        setStats(prev => ({
          ...prev,
          usersWithTokens: usersWithTokens.length,
          usersWithoutTokens: (prev?.totalUsers || 0) - usersWithTokens.length
        }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Помилка завантаження даних');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Скинути залежні поля при зміні типу отримувачів
      if (field === 'recipients') {
        if (value !== 'city') newData.cityId = '';
        if (value !== 'position') newData.positionId = '';
        if (value !== 'users') newData.userIds = [];
      }
      
      return newData;
    });
    setError(null);
    setSuccess(false);
    setSendResults(null);
  };

  const handleUserToggle = (userId) => {
    setFormData(prev => {
      const userIds = prev.userIds || [];
      // Використовуємо String() для порівняння, щоб уникнути проблем з типами
      const userIdStr = String(userId);
      const newUserIds = userIds.some(id => String(id) === userIdStr)
        ? userIds.filter(id => String(id) !== userIdStr)
        : [...userIds, userId];
      console.log('User toggle:', userId, 'New userIds:', newUserIds);
      return { ...prev, userIds: newUserIds };
    });
  };

  const handleSend = async () => {
    if (!formData.title.trim()) {
      setError('Заголовок обов\'язковий');
      return;
    }

    if (!formData.message.trim()) {
      setError('Повідомлення обов\'язкове');
      return;
    }

    if (formData.recipients === 'city' && !formData.cityId) {
      setError('Виберіть місто');
      return;
    }

    if (formData.recipients === 'position' && !formData.positionId) {
      setError('Виберіть посаду');
      return;
    }

    if (formData.recipients === 'users' && (!formData.userIds || formData.userIds.length === 0)) {
      setError('Виберіть хоча б одного користувача');
      return;
    }

    try {
      setSending(true);
      setError(null);
      setSuccess(false);
      setSendResults(null);

      console.log('Sending notification with data:', {
        title: formData.title,
        message: formData.message,
        recipients: formData.recipients,
        cityId: formData.cityId,
        positionId: formData.positionId,
        userIds: formData.userIds,
        userIdsCount: formData.userIds?.length || 0
      });

      const response = await api.post('/notifications/send', formData);
      
      console.log('Notification send response:', response.data);
      
      setSendResults(response.data.results);
      setSuccess(true);
      toast.success(response.data.message);
      
      // Очистити форму
      setFormData({
        title: '',
        message: '',
        recipients: 'all',
        cityId: '',
        positionId: '',
        userIds: [],
        data: {}
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      const errorMessage = error.response?.data?.message || 'Помилка відправки сповіщення';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSending(false);
    }
  };

  const getRecipientsCount = () => {
    console.log('getRecipientsCount called:', {
      recipients: formData.recipients,
      cityId: formData.cityId,
      positionId: formData.positionId,
      userIds: formData.userIds,
      userIdsLength: formData.userIds?.length,
      stats: stats
    });

    if (formData.recipients === 'all') {
      // Якщо статистика не завантажена, використати кількість користувачів зі списку
      const count = stats?.usersWithTokens ?? users.filter(u => u.pushToken).length;
      console.log('All recipients count:', count, 'from stats:', stats?.usersWithTokens, 'from users list:', users.filter(u => u.pushToken).length);
      return count;
    } else if (formData.recipients === 'city' && formData.cityId) {
      const cityStat = stats?.citiesStats?.find(s => {
        const statId = String(s._id || s.city || s.cityId);
        const formId = String(formData.cityId);
        console.log('Comparing city IDs:', statId, '===', formId, statId === formId);
        return statId === formId;
      });
      const count = cityStat?.count || 0;
      console.log('City recipients count:', count, 'for cityId:', formData.cityId);
      return count;
    } else if (formData.recipients === 'position' && formData.positionId) {
      const positionStat = stats?.positionsStats?.find(s => {
        const statId = String(s._id || s.position || s.positionId);
        const formId = String(formData.positionId);
        console.log('Comparing position IDs:', statId, '===', formId, statId === formId);
        return statId === formId;
      });
      const count = positionStat?.count || 0;
      console.log('Position recipients count:', count, 'for positionId:', formData.positionId);
      return count;
    } else if (formData.recipients === 'users') {
      const count = formData.userIds?.length || 0;
      console.log('Users recipients count:', count);
      return count;
    }
    console.log('No recipients matched, returning 0');
    return 0;
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
          Відправка сповіщень
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {stats && stats.usersWithTokens === 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
            ⚠️ Увага: Немає користувачів з push токенами
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Для отримання push токенів користувачі повинні:
          </Typography>
          <Typography component="ul" variant="body2" sx={{ mt: 1, pl: 2, mb: 1 }}>
            <li>Увійти в мобільний додаток</li>
            <li>Дозволити сповіщення при першому вході</li>
            <li>Мати активний інтернет-зв'язок</li>
            <li><strong>Використовувати development build (не Expo Go)</strong></li>
          </Typography>
          <Alert severity="info" sx={{ mt: 1 }}>
            <Typography variant="body2">
              <strong>Важливо:</strong> Push-нотифікації не працюють в Expo Go (SDK 53+). 
              Для тестування push-нотифікацій потрібно зібрати development build через EAS Build.
            </Typography>
          </Alert>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Зараз в системі <strong>{stats.totalUsers || 0}</strong> активних користувачів, 
            але жоден з них не має push токену.
          </Typography>
        </Alert>
      )}

      {success && sendResults && (
        <Alert severity="success" sx={{ mb: 2 }}>
          <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
            Сповіщення відправлено!
          </Typography>
          <Typography variant="body2">
            Успішно: <strong>{sendResults.success}</strong> | Помилок: <strong>{sendResults.failed}</strong> з {sendResults.total} отримувачів
          </Typography>
          {sendResults.errors && sendResults.errors.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Помилки:
              </Typography>
              {sendResults.errors.slice(0, 5).map((err, index) => (
                <Typography key={index} variant="body2" color="error">
                  {err.userName}: {err.error}
                </Typography>
              ))}
              {sendResults.errors.length > 5 && (
                <Typography variant="body2" color="textSecondary">
                  ... та ще {sendResults.errors.length - 5} помилок
                </Typography>
              )}
            </Box>
          )}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Статистика */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader 
              title="Статистика" 
              avatar={<NotificationsIcon />}
            />
            <CardContent>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Всього користувачів
                  </Typography>
                  <Typography variant="h6">
                    {stats?.totalUsers || 0}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    З push токенами
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    {stats?.usersWithTokens || 0}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Без push токенів
                  </Typography>
                  <Typography variant="h6" color="warning.main">
                    {stats?.usersWithoutTokens || 0}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Отримувачів вибрано
                  </Typography>
                  <Typography variant="h6" color="primary.main">
                    {getRecipientsCount()}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Форма відправки */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader title="Нове сповіщення" />
            <CardContent>
              <Stack spacing={3}>
                <TextField
                  label="Заголовок"
                  fullWidth
                  required
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Наприклад: Важлива інформація"
                />

                <TextField
                  label="Повідомлення"
                  fullWidth
                  required
                  multiline
                  rows={4}
                  value={formData.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  placeholder="Текст сповіщення..."
                  helperText={`${formData.message.length} символів`}
                />

                <FormControl fullWidth>
                  <InputLabel>Отримувачі</InputLabel>
                  <Select
                    value={formData.recipients}
                    onChange={(e) => handleChange('recipients', e.target.value)}
                    label="Отримувачі"
                  >
                    <MenuItem value="all">Всі користувачі</MenuItem>
                    <MenuItem value="city">По місту</MenuItem>
                    <MenuItem value="position">По посаді</MenuItem>
                    <MenuItem value="users">Конкретні користувачі</MenuItem>
                  </Select>
                </FormControl>

                {formData.recipients === 'city' && (
                  <FormControl fullWidth>
                    <InputLabel>Місто</InputLabel>
                    <Select
                      value={formData.cityId}
                      onChange={(e) => handleChange('cityId', e.target.value)}
                      label="Місто"
                    >
                      {cities.map((city) => {
                        const cityStat = stats?.citiesStats?.find(s => s._id === city._id);
                        return (
                          <MenuItem key={city._id} value={city._id}>
                            {city.name} ({cityStat?.count || 0} користувачів)
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                )}

                {formData.recipients === 'position' && (
                  <FormControl fullWidth>
                    <InputLabel>Посада</InputLabel>
                    <Select
                      value={formData.positionId}
                      onChange={(e) => handleChange('positionId', e.target.value)}
                      label="Посада"
                    >
                      {positions.map((position) => {
                        const positionStat = stats?.positionsStats?.find(s => String(s._id) === String(position._id));
                        return (
                          <MenuItem key={position._id} value={position._id}>
                            {position.name} ({positionStat?.count || 0} користувачів)
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                )}

                {formData.recipients === 'users' && (
                  <Paper sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
                    <Typography variant="subtitle2" sx={{ mb: 2 }}>
                      Виберіть користувачів ({formData.userIds?.length || 0} вибрано)
                    </Typography>
                    <List dense>
                      {users
                        .filter(u => u.pushToken)
                        .map((user) => {
                          const isSelected = formData.userIds?.some(id => String(id) === String(user._id));
                          return (
                            <ListItem key={user._id}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={isSelected}
                                    onChange={() => handleUserToggle(user._id)}
                                  />
                                }
                                label={`${user.firstName} ${user.lastName} (${user.login})`}
                              />
                              <ListItemSecondaryAction>
                                {user.city?.name && (
                                  <Chip label={user.city.name} size="small" sx={{ mr: 1 }} />
                                )}
                                {user.position?.name && (
                                  <Chip label={user.position.name} size="small" />
                                )}
                              </ListItemSecondaryAction>
                            </ListItem>
                          );
                        })}
                    </List>
                  </Paper>
                )}

                <Box>
                  {getRecipientsCount() === 0 && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        Немає отримувачів для відправки. Переконайтеся, що:
                      </Typography>
                      <Typography component="ul" variant="body2" sx={{ mt: 1, pl: 2 }}>
                        <li>Вибрані правильні параметри отримувачів</li>
                        <li>Користувачі мають push токени (увійшли в мобільний додаток)</li>
                      </Typography>
                    </Alert>
                  )}
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                    onClick={handleSend}
                    disabled={sending || !formData.title.trim() || !formData.message.trim() || getRecipientsCount() === 0}
                    fullWidth
                  >
                    {sending 
                      ? 'Відправка...' 
                      : `Відправити сповіщення${getRecipientsCount() > 0 ? ` (${getRecipientsCount()} отримувачів)` : ' (0 отримувачів)'}`
                    }
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default NotificationsPage;

