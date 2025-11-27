# Детальний покроковий план для всіх сторінок адмін-панелі

## 📋 Зміст

1. [DashboardPage - Головна панель](#1-dashboardpage---головна-панель)
2. [LoginPage - Авторизація](#2-loginpage---авторизація)
3. [UsersPage - Користувачі](#3-userspage---користувачі)
4. [UserDetailPage - Деталі користувача](#4-userdetailpage---деталі-користувача)
5. [UserEditPage - Редагування користувача](#5-usereditpage---редагування-користувача)
6. [QuestionsPage - Управління питаннями](#6-questionspage---управління-питаннями)
7. [CategoriesPage - Категорії](#7-categoriespage---категорії)
8. [CitiesPage - Міста](#8-citiespage---міста)
9. [PositionsPage - Посади](#9-positionspage---посади)
10. [StatsPage - Статистика](#10-statspage---статистика)
11. [DailyTestsPage - Щоденні тести](#11-dailytestspage---щоденні-тести)
12. [AchievementsPage - Ачівки](#12-achievementspage---ачівки)
13. [ShopPage - Магазин](#13-shoppage---магазин)
14. [KnowledgeBasePage - База знань](#14-knowledgebasepage---база-знань)
15. [FeedbackPage - Зворотний зв'язок](#15-feedbackpage---зворотний-звязок)
16. [SettingsPage - Налаштування](#16-settingspage---налаштування)
17. [PendingApprovalsPage - Підтвердження](#17-pendingapprovalspage---підтвердження)
18. [ManualCoinsPage - Ручні операції з монетами](#18-manualcoinspage---ручні-операції-з-монетами)
19. [AuditLogsPage - Аудит логи](#19-auditlogspage---аудит-логи)
20. [NotificationsPage - Сповіщення](#20-notificationspage---сповіщення)
21. [TournamentsPage - Турніри](#21-tournamentspage---турніри)

---

## 1. DashboardPage - Головна панель

### Загальна інформація
**Мета**: Відображення загальної статистики системи та швидкий доступ до основних розділів.

### Крок 1: Структура компонента
```jsx
// admin/src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react';
import { Box, Grid, Card, CardContent, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
```

### Крок 2: Створення стану
```jsx
const [stats, setStats] = useState({
  totalUsers: 0,
  activeUsers: 0,
  totalQuestions: 0,
  activeQuestions: 0,
  totalCategories: 0,
  activeCategories: 0,
  totalAchievements: 0,
  totalTests: 0,
  totalCoins: 0,
});
const [loading, setLoading] = useState(true);
```

### Крок 3: Завантаження статистики
```jsx
useEffect(() => {
  loadDashboardStats();
}, []);

const loadDashboardStats = async () => {
  try {
    setLoading(true);
    
    // Завантаження статистики користувачів
    const usersRes = await api.get('/users?limit=1');
    const totalUsers = usersRes.data.total || 0;
    const activeUsers = usersRes.data.users?.filter(u => u.status === 'active').length || 0;
    
    // Завантаження статистики питань
    const questionsRes = await api.get('/questions?limit=1');
    const totalQuestions = questionsRes.data.total || 0;
    const activeQuestions = questionsRes.data.questions?.filter(q => q.isActive !== false).length || 0;
    
    // Завантаження статистики категорій
    const categoriesRes = await api.get('/categories');
    const totalCategories = categoriesRes.data.data?.length || 0;
    const activeCategories = categoriesRes.data.data?.filter(c => c.isActive !== false).length || 0;
    
    // Завантаження статистики ачівок
    const achievementsRes = await api.get('/achievements');
    const totalAchievements = achievementsRes.data.data?.length || 0;
    
    // Завантаження статистики тестів
    const testsRes = await api.get('/daily-tests?limit=1');
    const totalTests = testsRes.data.total || 0;
    
    // Завантаження загальної кількості монет
    const coinsRes = await api.get('/stats/coins');
    const totalCoins = coinsRes.data.data?.totalCoins || 0;
    
    setStats({
      totalUsers,
      activeUsers,
      totalQuestions,
      activeQuestions,
      totalCategories,
      activeCategories,
      totalAchievements,
      totalTests,
      totalCoins,
    });
  } catch (error) {
    console.error('Error loading dashboard stats:', error);
  } finally {
    setLoading(false);
  }
};
```

### Крок 4: Створення карток статистики
```jsx
const StatCard = ({ title, value, subtitle, icon, color, onClick }) => (
  <Card 
    sx={{ 
      height: '100%', 
      cursor: onClick ? 'pointer' : 'default',
      transition: 'transform 0.2s',
      '&:hover': onClick ? { transform: 'scale(1.02)' } : {},
    }}
    onClick={onClick}
  >
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography color="textSecondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" component="div" color={color || 'primary'}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="textSecondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        {icon && (
          <Box sx={{ fontSize: 48, color: color || 'primary.main' }}>
            {icon}
          </Box>
        )}
      </Box>
    </CardContent>
  </Card>
);
```

### Крок 5: Основна розмітка
```jsx
return (
  <Box>
    <Typography variant="h4" gutterBottom>
      Панель управління
    </Typography>
    
    {loading ? (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    ) : (
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Користувачі */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Користувачі"
            value={stats.totalUsers}
            subtitle={`${stats.activeUsers} активних`}
            icon={<PeopleIcon />}
            color="primary"
            onClick={() => navigate('/users')}
          />
        </Grid>
        
        {/* Питання */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Питання"
            value={stats.totalQuestions}
            subtitle={`${stats.activeQuestions} активних`}
            icon={<QuizIcon />}
            color="secondary"
            onClick={() => navigate('/questions')}
          />
        </Grid>
        
        {/* Категорії */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Категорії"
            value={stats.totalCategories}
            subtitle={`${stats.activeCategories} активних`}
            icon={<CategoryIcon />}
            color="info"
            onClick={() => navigate('/categories')}
          />
        </Grid>
        
        {/* Ачівки */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Ачівки"
            value={stats.totalAchievements}
            icon={<EmojiEventsIcon />}
            color="warning"
            onClick={() => navigate('/achievements')}
          />
        </Grid>
        
        {/* Тести */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Тести"
            value={stats.totalTests}
            icon={<AssignmentIcon />}
            color="success"
            onClick={() => navigate('/daily-tests')}
          />
        </Grid>
        
        {/* Монети */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Монети в системі"
            value={stats.totalCoins.toLocaleString()}
            icon={<MonetizationOnIcon />}
            color="warning"
          />
        </Grid>
      </Grid>
    )}
    
    {/* Швидкі дії */}
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Швидкі дії
      </Typography>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item>
          <Button variant="contained" onClick={() => navigate('/questions/new')}>
            Створити питання
          </Button>
        </Grid>
        <Grid item>
          <Button variant="contained" onClick={() => navigate('/achievements/new')}>
            Створити ачівку
          </Button>
        </Grid>
        <Grid item>
          <Button variant="contained" onClick={() => navigate('/shop/new')}>
            Додати товар
          </Button>
        </Grid>
        <Grid item>
          <Button variant="outlined" onClick={() => navigate('/pending-approvals')}>
            Операції на підтвердження
          </Button>
        </Grid>
      </Grid>
    </Box>
  </Box>
);
```

### Крок 6: Імпорти необхідних іконок
```jsx
import PeopleIcon from '@mui/icons-material/People';
import QuizIcon from '@mui/icons-material/Quiz';
import CategoryIcon from '@mui/icons-material/Category';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import CircularProgress from '@mui/material/CircularProgress';
```

---

## 2. LoginPage - Авторизація

### Загальна інформація
**Мета**: Авторизація адміністратора в системі.

### Крок 1: Створення форми
```jsx
// admin/src/pages/LoginPage.jsx
import { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, Alert } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();
```

### Крок 2: Валідація форми
```jsx
const validateForm = () => {
  if (!login.trim()) {
    setError('Введіть логін');
    return false;
  }
  if (login.length < 3 || login.length > 30) {
    setError('Логін має бути від 3 до 30 символів');
    return false;
  }
  if (!/^[a-zA-Z0-9_]+$/.test(login)) {
    setError('Логін може містити тільки латинські літери, цифри та підкреслення');
    return false;
  }
  if (!password) {
    setError('Введіть пароль');
    return false;
  }
  if (password.length < 6) {
    setError('Пароль має бути не менше 6 символів');
    return false;
  }
  return true;
};
```

### Крок 3: Обробка відправки форми
```jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  
  if (!validateForm()) {
    return;
  }
  
  try {
    setLoading(true);
    await authLogin(login, password);
    navigate('/dashboard');
  } catch (err) {
    setError(err.response?.data?.message || 'Помилка авторизації');
  } finally {
    setLoading(false);
  }
};
```

### Крок 4: Розмітка форми
```jsx
return (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: 'grey.100',
    }}
  >
    <Paper sx={{ p: 4, maxWidth: 400, width: '100%' }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Адмін панель
      </Typography>
      <Typography variant="body2" color="textSecondary" align="center" gutterBottom>
        Введіть дані для входу
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
        <TextField
          fullWidth
          label="Логін"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          margin="normal"
          autoFocus
          disabled={loading}
          error={!!error}
        />
        <TextField
          fullWidth
          label="Пароль"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          margin="normal"
          disabled={loading}
          error={!!error}
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={loading}
        >
          {loading ? 'Вхід...' : 'Увійти'}
        </Button>
      </Box>
    </Paper>
  </Box>
);
```

---

## 3. UsersPage - Користувачі

### Загальна інформація
**Мета**: Список всіх користувачів з фільтрацією, пошуком та пагінацією.

### Крок 1: Структура та стан
```jsx
// admin/src/pages/UsersPage.jsx
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Pagination,
  Autocomplete,
  Checkbox,
  Toolbar,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [cities, setCities] = useState([]);
  const [positions, setPositions] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [actionMenuUser, setActionMenuUser] = useState(null);
  const navigate = useNavigate();
```

### Крок 2: Завантаження міст та посад
```jsx
useEffect(() => {
  loadCities();
  loadPositions();
}, []);

const loadCities = async () => {
  try {
    const res = await api.get('/cities');
    setCities(res.data.data || []);
  } catch (error) {
    console.error('Error loading cities:', error);
  }
};

const loadPositions = async () => {
  try {
    const res = await api.get('/positions');
    setPositions(res.data.data || []);
  } catch (error) {
    console.error('Error loading positions:', error);
  }
};
```

### Крок 3: Завантаження користувачів
```jsx
useEffect(() => {
  loadUsers();
}, [page, search, selectedCity, selectedPosition, selectedRole]);

const loadUsers = async () => {
  try {
    setLoading(true);
    const params = {
      page,
      limit: 20,
    };
    
    if (search) params.search = search;
    if (selectedCity) params.city = selectedCity._id;
    if (selectedPosition) params.position = selectedPosition._id;
    if (selectedRole) params.role = selectedRole;
    
    const res = await api.get('/users', { params });
    setUsers(res.data.users || []);
    setTotalPages(Math.ceil((res.data.total || 0) / 20));
  } catch (error) {
    console.error('Error loading users:', error);
  } finally {
    setLoading(false);
  }
};
```

### Крок 4: Обробка вибору користувачів
```jsx
const handleSelectAll = (event) => {
  if (event.target.checked) {
    setSelectedUsers(users.map(u => u._id));
  } else {
    setSelectedUsers([]);
  }
};

const handleSelectUser = (userId) => {
  setSelectedUsers(prev => 
    prev.includes(userId)
      ? prev.filter(id => id !== userId)
      : [...prev, userId]
  );
};
```

### Крок 5: Масові операції
```jsx
const handleBulkDelete = async () => {
  if (!selectedUsers.length) return;
  
  if (!window.confirm(`Видалити ${selectedUsers.length} користувачів?`)) {
    return;
  }
  
  try {
    await api.post('/users/bulk-delete', { userIds: selectedUsers });
    setSelectedUsers([]);
    loadUsers();
  } catch (error) {
    console.error('Error deleting users:', error);
  }
};

const handleBulkBlock = async () => {
  if (!selectedUsers.length) return;
  
  try {
    await api.post('/users/bulk-block', { userIds: selectedUsers });
    setSelectedUsers([]);
    loadUsers();
  } catch (error) {
    console.error('Error blocking users:', error);
  }
};

const handleBulkUnblock = async () => {
  if (!selectedUsers.length) return;
  
  try {
    await api.post('/users/bulk-unblock', { userIds: selectedUsers });
    setSelectedUsers([]);
    loadUsers();
  } catch (error) {
    console.error('Error unblocking users:', error);
  }
};
```

### Крок 6: Індивідуальні операції
```jsx
const handleDeleteUser = async (userId) => {
  if (!window.confirm('Видалити користувача?')) return;
  
  try {
    await api.delete(`/users/${userId}`);
    loadUsers();
  } catch (error) {
    console.error('Error deleting user:', error);
  }
};

const handleBlockUser = async (userId) => {
  try {
    await api.put(`/users/${userId}/block`);
    loadUsers();
    setActionMenuAnchor(null);
  } catch (error) {
    console.error('Error blocking user:', error);
  }
};

const handleUnblockUser = async (userId) => {
  try {
    await api.put(`/users/${userId}/unblock`);
    loadUsers();
    setActionMenuAnchor(null);
  } catch (error) {
    console.error('Error unblocking user:', error);
  }
};
```

### Крок 7: Експорт користувачів
```jsx
const handleExport = async () => {
  try {
    const params = {};
    if (search) params.search = search;
    if (selectedCity) params.city = selectedCity._id;
    if (selectedPosition) params.position = selectedPosition._id;
    if (selectedRole) params.role = selectedRole;
    
    const res = await api.get('/users/export', { 
      params,
      responseType: 'blob',
    });
    
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `users_${new Date().toISOString()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error('Error exporting users:', error);
  }
};
```

### Крок 8: Розмітка таблиці
```jsx
return (
  <Box>
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
      <Typography variant="h4">Користувачі</Typography>
      <Button variant="outlined" onClick={handleExport}>
        Експорт в Excel
      </Button>
    </Box>
    
    {/* Фільтри */}
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box display="flex" gap={2} flexWrap="wrap">
        <TextField
          label="Пошук"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ flexGrow: 1, minWidth: 200 }}
        />
        <Autocomplete
          options={cities}
          getOptionLabel={(option) => option.name}
          value={selectedCity}
          onChange={(e, value) => setSelectedCity(value)}
          renderInput={(params) => <TextField {...params} label="Місто" size="small" />}
          sx={{ width: 200 }}
        />
        <Autocomplete
          options={positions}
          getOptionLabel={(option) => option.name}
          value={selectedPosition}
          onChange={(e, value) => setSelectedPosition(value)}
          renderInput={(params) => <TextField {...params} label="Посада" size="small" />}
          sx={{ width: 200 }}
        />
        <Autocomplete
          options={['user', 'admin']}
          value={selectedRole}
          onChange={(e, value) => setSelectedRole(value)}
          renderInput={(params) => <TextField {...params} label="Роль" size="small" />}
          sx={{ width: 150 }}
        />
        <Button
          variant="outlined"
          onClick={() => {
            setSearch('');
            setSelectedCity(null);
            setSelectedPosition(null);
            setSelectedRole(null);
          }}
        >
          Очистити
        </Button>
      </Box>
    </Paper>
    
    {/* Панель масових операцій */}
    {selectedUsers.length > 0 && (
      <Toolbar sx={{ bgcolor: 'primary.light', color: 'white' }}>
        <Typography sx={{ flex: 1 }}>
          Вибрано: {selectedUsers.length}
        </Typography>
        <Button color="inherit" onClick={handleBulkUnblock}>
          Розблокувати
        </Button>
        <Button color="inherit" onClick={handleBulkBlock}>
          Заблокувати
        </Button>
        <Button color="error" onClick={handleBulkDelete}>
          Видалити
        </Button>
        <IconButton color="inherit" onClick={() => setSelectedUsers([])}>
          <CloseIcon />
        </IconButton>
      </Toolbar>
    )}
    
    {/* Таблиця */}
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                checked={users.length > 0 && selectedUsers.length === users.length}
                indeterminate={selectedUsers.length > 0 && selectedUsers.length < users.length}
                onChange={handleSelectAll}
              />
            </TableCell>
            <TableCell>Ім'я</TableCell>
            <TableCell>Логін</TableCell>
            <TableCell>Місто</TableCell>
            <TableCell>Посада</TableCell>
            <TableCell>Роль</TableCell>
            <TableCell>Статус</TableCell>
            <TableCell>Монети</TableCell>
            <TableCell>Дії</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={9} align="center">
                <CircularProgress />
              </TableCell>
            </TableRow>
          ) : users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} align="center">
                Користувачів не знайдено
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user._id} hover>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedUsers.includes(user._id)}
                    onChange={() => handleSelectUser(user._id)}
                  />
                </TableCell>
                <TableCell>
                  {user.firstName} {user.lastName}
                </TableCell>
                <TableCell>{user.login}</TableCell>
                <TableCell>{user.city?.name || '-'}</TableCell>
                <TableCell>{user.position?.name || '-'}</TableCell>
                <TableCell>
                  <Chip
                    label={user.role || 'user'}
                    size="small"
                    color={user.role === 'admin' ? 'primary' : 'default'}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.status || 'active'}
                    size="small"
                    color={user.status === 'active' ? 'success' : 'error'}
                  />
                </TableCell>
                <TableCell>{user.coins || 0} 🪙</TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/users/${user._id}`)}
                  >
                    <VisibilityIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      setActionMenuAnchor(e.currentTarget);
                      setActionMenuUser(user);
                    }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
    
    {/* Меню дій */}
    <Menu
      anchorEl={actionMenuAnchor}
      open={!!actionMenuAnchor}
      onClose={() => setActionMenuAnchor(null)}
    >
      <MenuItem onClick={() => {
        navigate(`/users/${actionMenuUser?._id}/edit`);
        setActionMenuAnchor(null);
      }}>
        Редагувати
      </MenuItem>
      {actionMenuUser?.status === 'active' ? (
        <MenuItem onClick={() => handleBlockUser(actionMenuUser._id)}>
          Заблокувати
        </MenuItem>
      ) : (
        <MenuItem onClick={() => handleUnblockUser(actionMenuUser._id)}>
          Розблокувати
        </MenuItem>
      )}
      <MenuItem
        onClick={() => {
          handleDeleteUser(actionMenuUser?._id);
          setActionMenuAnchor(null);
        }}
        sx={{ color: 'error.main' }}
      >
        Видалити
      </MenuItem>
    </Menu>
    
    {/* Пагінація */}
    <Box display="flex" justifyContent="center" mt={3}>
      <Pagination
        count={totalPages}
        page={page}
        onChange={(e, value) => setPage(value)}
        color="primary"
      />
    </Box>
  </Box>
);
```

### Крок 9: Додаткові імпорти
```jsx
import CircularProgress from '@mui/material/CircularProgress';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CloseIcon from '@mui/icons-material/Close';
```

---

*[Продовження в наступних розділах...]*

