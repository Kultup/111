import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Button,
  Stack,
  MenuItem,
  TextField,
  Tabs,
  Tab,
} from '@mui/material';
import {
  People as PeopleIcon,
  Quiz as QuizIcon,
  Category as CategoryIcon,
  EmojiEvents as EmojiEventsIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as AttachMoneyIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import api from '../services/api';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
  const [activityData, setActivityData] = useState({
    registrations: [],
    tests: [],
    logins: [],
  });
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityDays, setActivityDays] = useState(30);
  const [activityTab, setActivityTab] = useState(0);

  useEffect(() => {
    loadStats();
    loadActivityStats();
  }, [activityDays]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Завантажити статистику паралельно
      const [
        usersResponse,
        questionsResponse,
        categoriesResponse,
        achievementsResponse,
      ] = await Promise.all([
        api.get('/users?limit=1'),
        api.get('/questions?limit=1'),
        api.get('/categories'),
        api.get('/achievements'),
      ]);

      // Підрахувати користувачів
      const totalUsers = usersResponse.data.total || 0;
      const activeUsers = usersResponse.data.data?.filter(u => u.isActive).length || 0;

      // Підрахувати питання
      const totalQuestions = questionsResponse.data.total || 0;
      const activeQuestions = questionsResponse.data.data?.filter(q => q.isActive).length || 0;

      // Підрахувати категорії
      const totalCategories = categoriesResponse.data.count || 0;
      const activeCategories = categoriesResponse.data.data?.filter(c => c.isActive).length || 0;

      // Підрахувати ачівки
      const totalAchievements = achievementsResponse.data.count || 0;

      // Отримати загальну статистику по користувачах
      let totalTests = 0;
      let totalCoins = 0;
      
      try {
        const allUsersResponse = await api.get('/users?limit=1000');
        const allUsers = allUsersResponse.data.data || [];
        totalTests = allUsers.reduce((sum, user) => sum + (user.statistics?.completedTests || 0), 0);
        totalCoins = allUsers.reduce((sum, user) => sum + (user.coins || 0), 0);
      } catch (err) {
        console.error('Error loading users stats:', err);
      }

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
      setError('Помилка завантаження статистики');
    } finally {
      setLoading(false);
    }
  };

  const loadActivityStats = async () => {
    try {
      setActivityLoading(true);
      const response = await api.get(`/stats/activity?days=${activityDays}`);
      if (response.data && response.data.success) {
        setActivityData(response.data.data || {
          registrations: [],
          tests: [],
          logins: [],
        });
      }
    } catch (error) {
      console.error('Error loading activity stats:', error);
    } finally {
      setActivityLoading(false);
    }
  };

  // Підготувати дані для графіка (об'єднати всі дати)
  const prepareChartData = () => {
    const allDates = new Set();
    
    activityData.registrations.forEach(item => allDates.add(item.date));
    activityData.tests.forEach(item => allDates.add(item.date));
    activityData.logins.forEach(item => allDates.add(item.date));
    
    const sortedDates = Array.from(allDates).sort();
    
    const dataMap = {};
    sortedDates.forEach(date => {
      dataMap[date] = {
        date: date,
        registrations: 0,
        tests: 0,
        logins: 0,
      };
    });
    
    activityData.registrations.forEach(item => {
      if (dataMap[item.date]) {
        dataMap[item.date].registrations = item.count;
      }
    });
    
    activityData.tests.forEach(item => {
      if (dataMap[item.date]) {
        dataMap[item.date].tests = item.count;
      }
    });
    
    activityData.logins.forEach(item => {
      if (dataMap[item.date]) {
        dataMap[item.date].logins = item.count;
      }
    });
    
    return Object.values(dataMap);
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color, onClick }) => (
    <Card
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        } : {},
      }}
      onClick={onClick}
    >
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: `${color}.light`,
              color: `${color}.main`,
            }}
          >
            <Icon sx={{ fontSize: 32 }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" component="div" fontWeight="bold">
              {value}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Дашборд
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Користувачі */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Користувачі"
            value={stats.totalUsers}
            subtitle={`Активних: ${stats.activeUsers}`}
            icon={PeopleIcon}
            color="primary"
            onClick={() => navigate('/users')}
          />
        </Grid>

        {/* Питання */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Питання"
            value={stats.totalQuestions}
            subtitle={`Активних: ${stats.activeQuestions}`}
            icon={QuizIcon}
            color="success"
            onClick={() => navigate('/questions')}
          />
        </Grid>

        {/* Категорії */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Категорії"
            value={stats.totalCategories}
            subtitle={`Активних: ${stats.activeCategories}`}
            icon={CategoryIcon}
            color="info"
            onClick={() => navigate('/categories')}
          />
        </Grid>

        {/* Ачівки */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Ачівки"
            value={stats.totalAchievements}
            icon={EmojiEventsIcon}
            color="warning"
          />
        </Grid>

        {/* Тести */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Пройдено тестів"
            value={stats.totalTests}
            icon={TrendingUpIcon}
            color="secondary"
          />
        </Grid>

        {/* Монети */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Монети в системі"
            value={stats.totalCoins.toLocaleString()}
            subtitle="🪙"
            icon={AttachMoneyIcon}
            color="success"
          />
        </Grid>
      </Grid>

      {/* Графіки активності */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Активність користувачів
          </Typography>
          <TextField
            select
            size="small"
            value={activityDays}
            onChange={(e) => setActivityDays(Number(e.target.value))}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value={7}>Останні 7 днів</MenuItem>
            <MenuItem value={14}>Останні 14 днів</MenuItem>
            <MenuItem value={30}>Останні 30 днів</MenuItem>
            <MenuItem value={60}>Останні 60 днів</MenuItem>
            <MenuItem value={90}>Останні 90 днів</MenuItem>
          </TextField>
        </Box>

        {activityLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Tabs value={activityTab} onChange={(e, newValue) => setActivityTab(newValue)} sx={{ mb: 2 }}>
              <Tab label="Лінійний графік" />
              <Tab label="Стовпчастий графік" />
            </Tabs>

            {activityTab === 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={prepareChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="registrations" 
                    stroke="#8884d8" 
                    name="Реєстрації"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="tests" 
                    stroke="#82ca9d" 
                    name="Завершені тести"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="logins" 
                    stroke="#ffc658" 
                    name="Входи в систему"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={prepareChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="registrations" fill="#8884d8" name="Реєстрації" />
                  <Bar dataKey="tests" fill="#82ca9d" name="Завершені тести" />
                  <Bar dataKey="logins" fill="#ffc658" name="Входи в систему" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </>
        )}
      </Paper>

      {/* Швидкі дії */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Швидкі дії
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Button
            variant="outlined"
            onClick={() => navigate('/users')}
          >
            Переглянути користувачів
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/questions')}
          >
            Управління питаннями
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/categories')}
          >
            Управління категоріями
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/cities')}
          >
            Управління містами
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/positions')}
          >
            Управління посадами
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/stats')}
          >
            Детальна статистика
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default DashboardPage;
