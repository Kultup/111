import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Stack,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';
import api from '../services/api';

const UserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [coinHistory, setCoinHistory] = useState([]);
  const [ratingPosition, setRatingPosition] = useState(null);
  const [detailedStats, setDetailedStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    loadUserData();
  }, [id]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Завантажити основну інформацію про користувача
      const userResponse = await api.get(`/users/${id}`);
      setUser(userResponse.data.data);

      // Завантажити ачівки
      try {
        const achievementsResponse = await api.get(`/achievements/user/${id}`);
        setAchievements(achievementsResponse.data.data || []);
      } catch (err) {
        console.error('Error loading achievements:', err);
      }

      // Завантажити покупки
      try {
        const purchasesResponse = await api.get(`/shop/purchases/all?userId=${id}&limit=100`);
        setPurchases(purchasesResponse.data.data || []);
      } catch (err) {
        console.error('Error loading purchases:', err);
      }

      // Завантажити історію монет
      try {
        const coinsResponse = await api.get(`/coins/transactions/all?userId=${id}&limit=100`);
        setCoinHistory(coinsResponse.data.data || []);
      } catch (err) {
        console.error('Error loading coin history:', err);
      }

      // Завантажити детальну статистику
      try {
        const statsResponse = await api.get(`/users/${id}/detailed-stats`);
        setDetailedStats(statsResponse.data.data);
      } catch (err) {
        console.error('Error loading detailed stats:', err);
      }

      // Завантажити позицію в рейтингу
      try {
        const ratingResponse = await api.get(`/stats/user/${id}/position`);
        setRatingPosition(ratingResponse.data.data);
      } catch (err) {
        console.error('Error loading rating position:', err);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Помилка завантаження даних користувача');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getUserFullName = (user) => {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.login;
  };

  const earnedAchievements = achievements.filter(a => a.earned);
  const earnedCount = earnedAchievements.length;
  const totalCount = achievements.length;

  const handleExportStats = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Статистика користувача');

      // Загальна інформація
      worksheet.addRow(['Загальна інформація']);
      worksheet.addRow(['ПІБ', getUserFullName(user)]);
      worksheet.addRow(['Логін', user.login]);
      worksheet.addRow(['Місто', user.city?.name || '-']);
      worksheet.addRow(['Посада', user.position?.name || '-']);
      worksheet.addRow(['Дата реєстрації', formatDate(user.createdAt)]);
      worksheet.addRow([]);

      // Статистика тестування
      worksheet.addRow(['Статистика тестування']);
      worksheet.addRow(['Всього тестів', user.statistics?.totalTests || 0]);
      worksheet.addRow(['Завершено тестів', user.statistics?.completedTests || 0]);
      worksheet.addRow(['Правильних відповідей', `${user.statistics?.correctAnswers || 0} / ${user.statistics?.totalAnswers || 0}`]);
      worksheet.addRow(['Відсоток правильних', `${user.statistics?.totalAnswers > 0 ? Math.round((user.statistics.correctAnswers / user.statistics.totalAnswers) * 100) : 0}%`]);
      worksheet.addRow(['Середній бал', user.statistics?.averageScore?.toFixed(1) || '0.0']);
      worksheet.addRow([]);

      // Монети
      worksheet.addRow(['Монети "Мрійчики"']);
      worksheet.addRow(['Поточний баланс', user.coins || 0]);
      if (coinHistory.length > 0) {
        const earned = coinHistory.filter(t => t.type === 'earned' || t.amount > 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const spent = coinHistory.filter(t => t.type === 'spent' || t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
        worksheet.addRow(['Нараховано', earned]);
        worksheet.addRow(['Витрачено', spent]);
      }
      worksheet.addRow([]);

      // Ачівки
      worksheet.addRow(['Ачівки']);
      worksheet.addRow(['Отримано', `${earnedCount} / ${totalCount}`]);
      worksheet.addRow([]);

      // Статистика по категоріях
      if (detailedStats?.categoryStats) {
        worksheet.addRow(['Статистика по категоріях']);
        worksheet.addRow(['Категорія', 'Всього питань', 'Правильних', 'Точність (%)']);
        detailedStats.categoryStats.forEach(stat => {
          worksheet.addRow([
            stat.category.name,
            stat.totalQuestions,
            stat.correctAnswers,
            stat.accuracy
          ]);
        });
        worksheet.addRow([]);
      }

      // Результати тестів по днях
      if (detailedStats?.testResultsByDay) {
        worksheet.addRow(['Результати тестів по днях']);
        worksheet.addRow(['Дата', 'Кількість тестів', 'Середній бал', 'Монети']);
        detailedStats.testResultsByDay.forEach(day => {
          worksheet.addRow([day.date, day.count, day.avgScore, day.totalCoins]);
        });
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `user-stats-${user.login}-${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Помилка експорту статистики');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !user) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/users')}
          sx={{ mb: 2 }}
        >
          Назад до списку
        </Button>
        <Alert severity="error">{error || 'Користувача не знайдено'}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/users')}
        >
          Назад
        </Button>
        <Typography variant="h4" component="h1">
          {getUserFullName(user)}
        </Typography>
        <Button
          startIcon={<EditIcon />}
          variant="outlined"
          onClick={() => navigate(`/users/${id}/edit`)}
        >
          Редагувати
        </Button>
      </Stack>

      {/* Основна інформація */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Загальна інформація
            </Typography>
            <Stack spacing={1}>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Логін
                </Typography>
                <Typography variant="body1">{user.login}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Місто
                </Typography>
                <Typography variant="body1">{user.city?.name || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Посада
                </Typography>
                <Typography variant="body1">{user.position?.name || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Роль
                </Typography>
                <Chip
                  label={user.role === 'admin' ? 'Адмін' : 'Користувач'}
                  size="small"
                  color={user.role === 'admin' ? 'error' : 'default'}
                />
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Статус
                </Typography>
                <Chip
                  label={user.isActive ? 'Активний' : 'Неактивний'}
                  size="small"
                  color={user.isActive ? 'success' : 'default'}
                />
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Дата реєстрації
                </Typography>
                <Typography variant="body1">{formatDate(user.createdAt)}</Typography>
              </Box>
              {user.lastLogin && (
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Останній вхід
                  </Typography>
                  <Typography variant="body1">{formatDate(user.lastLogin)}</Typography>
                </Box>
              )}
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Статистика тестування
            </Typography>
            <Stack spacing={1}>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Всього тестів
                </Typography>
                <Typography variant="h5">
                  {user.statistics?.totalTests || 0}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Завершено тестів
                </Typography>
                <Typography variant="h5">
                  {user.statistics?.completedTests || 0}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Правильних відповідей
                </Typography>
                <Typography variant="h5">
                  {user.statistics?.correctAnswers || 0} / {user.statistics?.totalAnswers || 0}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Відсоток правильних
                </Typography>
                <Typography variant="h5">
                  {user.statistics?.totalAnswers > 0
                    ? Math.round((user.statistics.correctAnswers / user.statistics.totalAnswers) * 100)
                    : 0}%
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Середній бал
                </Typography>
                <Typography variant="h5">
                  {user.statistics?.averageScore?.toFixed(1) || '0.0'}
                </Typography>
              </Box>
              {ratingPosition && (
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Позиція в рейтингу
                  </Typography>
                  <Typography variant="h5">
                    #{ratingPosition.position || '-'}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Монети "Мрійчики"
            </Typography>
            <Stack spacing={1}>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Поточний баланс
                </Typography>
                <Typography variant="h4" color="primary">
                  {user.coins || 0} 🪙
                </Typography>
              </Box>
              {coinHistory.length > 0 && (
                <>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Нараховано
                    </Typography>
                    <Typography variant="body1" color="success.main">
                      +{coinHistory
                        .filter(t => t.type === 'earn' || t.amount > 0)
                        .reduce((sum, t) => sum + Math.abs(t.amount), 0)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Витрачено
                    </Typography>
                    <Typography variant="body1" color="error.main">
                      -{coinHistory
                        .filter(t => t.type === 'spend' || t.amount < 0)
                        .reduce((sum, t) => sum + Math.abs(t.amount), 0)}
                    </Typography>
                  </Box>
                </>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Таби для детальної інформації */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, pt: 2 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="Ачівки" />
            <Tab label="Покупки" />
            <Tab label="Історія монет" />
            <Tab label="Графіки" />
            <Tab label="Статистика" />
            <Tab label="Активність" />
          </Tabs>
          <Button
            startIcon={<DownloadIcon />}
            variant="outlined"
            onClick={handleExportStats}
            sx={{ ml: 2 }}
          >
            Експорт
          </Button>
        </Box>
      </Paper>

      {/* Контент табів */}
      {activeTab === 0 && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Ачівки</Typography>
            <Typography variant="body2" color="textSecondary">
              Отримано: {earnedCount} / {totalCount}
            </Typography>
          </Box>
          {achievements.length === 0 ? (
            <Typography color="textSecondary">Ачівки не знайдено</Typography>
          ) : (
            <Grid container spacing={2}>
              {achievements.map((item, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card
                    sx={{
                      opacity: item.earned ? 1 : 0.6,
                      border: item.earned ? '2px solid' : '1px solid',
                      borderColor: item.earned ? 'primary.main' : 'divider',
                    }}
                  >
                    <CardContent>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            bgcolor: item.earned ? 'primary.main' : 'grey.300',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px',
                          }}
                        >
                          {item.achievement?.icon || '🏆'}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" fontWeight="medium">
                            {item.achievement?.name || 'Ачівка'}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {item.achievement?.description || ''}
                          </Typography>
                          {item.earned ? (
                            <Chip
                              label={`Отримано: ${formatDate(item.earnedAt)}`}
                              size="small"
                              color="success"
                              sx={{ mt: 1 }}
                            />
                          ) : (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="caption" color="textSecondary">
                                Прогрес: {item.progress || 0} / {item.target || 0} ({item.percentage || 0}%)
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>
      )}

      {activeTab === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Історія покупок</Typography>
          {purchases.length === 0 ? (
            <Typography color="textSecondary">Покупки не знайдено</Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Товар</TableCell>
                    <TableCell>Тип</TableCell>
                    <TableCell>Ціна</TableCell>
                    <TableCell>Статус</TableCell>
                    <TableCell>Дата</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {purchases.map((purchase) => (
                    <TableRow key={purchase._id}>
                      <TableCell>{purchase.item?.name || '-'}</TableCell>
                      <TableCell>{purchase.item?.type || '-'}</TableCell>
                      <TableCell>{purchase.price || 0} 🪙</TableCell>
                      <TableCell>
                        <Chip
                          label={purchase.status || 'pending'}
                          size="small"
                          color={
                            purchase.status === 'approved' ? 'success' :
                            purchase.status === 'rejected' ? 'error' : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell>{formatDate(purchase.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {activeTab === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Історія транзакцій монет</Typography>
          {coinHistory.length === 0 ? (
            <Typography color="textSecondary">Історія транзакцій порожня</Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Тип</TableCell>
                    <TableCell>Сума</TableCell>
                    <TableCell>Опис</TableCell>
                    <TableCell>Дата</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {coinHistory.map((transaction) => (
                    <TableRow key={transaction._id}>
                      <TableCell>
                        <Chip
                          label={transaction.type === 'earn' ? 'Нарахування' : 'Списання'}
                          size="small"
                          color={transaction.type === 'earn' ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body1"
                          color={transaction.amount > 0 ? 'success.main' : 'error.main'}
                          fontWeight="medium"
                        >
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                        </Typography>
                      </TableCell>
                      <TableCell>{transaction.description || transaction.reason || '-'}</TableCell>
                      <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* Таб 3: Графіки */}
      {activeTab === 3 && (
        <Grid container spacing={3}>
          {/* Графік результатів тестів по днях */}
          {detailedStats?.testResultsByDay && detailedStats.testResultsByDay.length > 0 && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Результати тестів по днях
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={detailedStats.testResultsByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="avgScore" stroke="#8884d8" name="Середній бал" />
                    <Line type="monotone" dataKey="count" stroke="#82ca9d" name="Кількість тестів" />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          )}

          {/* Графік змін балансу монет */}
          {detailedStats?.coinBalanceHistory && detailedStats.coinBalanceHistory.length > 0 && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Зміни балансу монет
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={detailedStats.coinBalanceHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="balance" stroke="#8884d8" name="Баланс" />
                    <Line type="monotone" dataKey="earned" stroke="#82ca9d" name="Нараховано" />
                    <Line type="monotone" dataKey="spent" stroke="#ff7300" name="Витрачено" />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* Таб 4: Статистика по категоріях */}
      {activeTab === 4 && (
        <Grid container spacing={3}>
          {detailedStats?.categoryStats && detailedStats.categoryStats.length > 0 ? (
            <>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Статистика по категоріях питань
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Категорія</TableCell>
                          <TableCell align="right">Всього</TableCell>
                          <TableCell align="right">Правильних</TableCell>
                          <TableCell align="right">Точність (%)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {detailedStats.categoryStats.map((stat, index) => (
                          <TableRow key={index}>
                            <TableCell>{stat.category.name}</TableCell>
                            <TableCell align="right">{stat.totalQuestions}</TableCell>
                            <TableCell align="right">{stat.correctAnswers}</TableCell>
                            <TableCell align="right">{stat.accuracy}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Розподіл по категоріях
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={detailedStats.categoryStats}
                        dataKey="totalQuestions"
                        nameKey="category.name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {detailedStats.categoryStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'][index % 5]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            </>
          ) : (
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography color="textSecondary">Статистика по категоріях недоступна</Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* Таб 5: Активність */}
      {activeTab === 5 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Серія успішних тестів
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Максимальна серія
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {detailedStats?.maxStreak || 0}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Поточна серія
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {detailedStats?.currentStreak || 0}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Останні дії
              </Typography>
              {detailedStats?.recentActivity && detailedStats.recentActivity.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Дата</TableCell>
                        <TableCell>Статус</TableCell>
                        <TableCell align="right">Бал</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {detailedStats.recentActivity.map((activity, index) => (
                        <TableRow key={index}>
                          <TableCell>{formatDate(activity.completedAt || activity.createdAt)}</TableCell>
                          <TableCell>
                            <Chip
                              label={activity.status === 'completed' ? 'Завершено' : activity.status === 'in_progress' ? 'В процесі' : 'Очікує'}
                              size="small"
                              color={activity.status === 'completed' ? 'success' : activity.status === 'in_progress' ? 'warning' : 'default'}
                            />
                          </TableCell>
                          <TableCell align="right">{activity.score !== undefined ? activity.score : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="textSecondary">Активність не знайдено</Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default UserDetailPage;

