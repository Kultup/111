import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Stack,
  Tabs,
  Tab,
  Button,
  IconButton,
  Autocomplete,
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
import { Link } from 'react-router-dom';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import api from '../services/api';

const StatsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rating, setRating] = useState([]);
  const [cities, setCities] = useState([]);
  const [positions, setPositions] = useState([]);
  const [statsByCities, setStatsByCities] = useState([]);
  const [statsByPositions, setStatsByPositions] = useState([]);
  const [coinsStats, setCoinsStats] = useState(null);
  const [testsStats, setTestsStats] = useState(null);
  const [categoryStats, setCategoryStats] = useState([]);
  const [combinedStats, setCombinedStats] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  
  // Завантажити збережені фільтри з localStorage
  const loadSavedFilters = () => {
    try {
      const saved = localStorage.getItem('statsFilters');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading saved filters:', error);
    }
    return {
      positions: [],
      cities: [],
      startDate: '',
      endDate: '',
    };
  };

  const [filters, setFilters] = useState(loadSavedFilters());

  useEffect(() => {
    loadCities();
    loadPositions();
    loadStatsByCities();
    loadStatsByPositions();
  }, []);

  useEffect(() => {
    if (activeTab === 0) {
      loadRating();
    } else if (activeTab === 3) {
      loadCoinsStats();
    } else if (activeTab === 4) {
      loadTestsStats();
    } else if (activeTab === 5) {
      loadCategoryStats();
    } else if (activeTab === 6) {
      loadCombinedStats();
    }
  }, [filters, activeTab]);

  const loadCities = async () => {
    try {
      const response = await api.get('/cities');
      setCities(response.data.data || []);
    } catch (error) {
      console.error('Error loading cities:', error);
    }
  };

  const loadPositions = async () => {
    try {
      const response = await api.get('/positions');
      setPositions(response.data.data || []);
    } catch (error) {
      console.error('Error loading positions:', error);
    }
  };

  const loadRating = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      // Підтримка множинного вибору
      if (filters.positions && filters.positions.length > 0) {
        params.position = filters.positions.join(',');
      }
      if (filters.cities && filters.cities.length > 0) {
        params.city = filters.cities.join(',');
      }
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await api.get('/stats/rating', { params });
      setRating(response.data.data || []);
    } catch (error) {
      console.error('Error loading rating:', error);
      setError('Помилка завантаження рейтингу');
    } finally {
      setLoading(false);
    }
  };

  const loadStatsByCities = async () => {
    try {
      const response = await api.get('/stats/by-cities');
      setStatsByCities(response.data.data || []);
    } catch (error) {
      console.error('Error loading stats by cities:', error);
    }
  };

  const loadStatsByPositions = async () => {
    try {
      const response = await api.get('/stats/by-positions');
      setStatsByPositions(response.data.data || []);
    } catch (error) {
      console.error('Error loading stats by positions:', error);
    }
  };

  const loadCoinsStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/stats/coins');
      setCoinsStats(response.data.data);
    } catch (error) {
      console.error('Error loading coins stats:', error);
      setError('Помилка завантаження статистики монет');
    } finally {
      setLoading(false);
    }
  };

  const loadTestsStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (filters.cities && filters.cities.length > 0) {
        params.city = filters.cities.join(',');
      }
      if (filters.positions && filters.positions.length > 0) {
        params.position = filters.positions.join(',');
      }
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      const response = await api.get('/stats/tests', { params });
      setTestsStats(response.data.data);
    } catch (error) {
      console.error('Error loading tests stats:', error);
      setError('Помилка завантаження статистики по тестах');
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/stats/categories');
      setCategoryStats(response.data.data || []);
    } catch (error) {
      console.error('Error loading category stats:', error);
      setError('Помилка завантаження статистики по категоріях');
    } finally {
      setLoading(false);
    }
  };

  const loadCombinedStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/stats/combined');
      setCombinedStats(response.data.data || []);
    } catch (error) {
      console.error('Error loading combined stats:', error);
      setError('Помилка завантаження комбінованої статистики');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    // Зберегти фільтри в localStorage
    try {
      localStorage.setItem('statsFilters', JSON.stringify(newFilters));
    } catch (error) {
      console.error('Error saving filters:', error);
    }
  };

  const clearFilters = () => {
    const defaultFilters = {
      positions: [],
      cities: [],
      startDate: '',
      endDate: '',
    };
    setFilters(defaultFilters);
    try {
      localStorage.setItem('statsFilters', JSON.stringify(defaultFilters));
    } catch (error) {
      console.error('Error clearing filters:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getUserFullName = (user) => {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Невідомий';
  };

  // Підрахунок статистики
  const totalUsers = rating.length;
  const avgCorrectAnswers = totalUsers > 0
    ? Math.round(rating.reduce((sum, r) => sum + (r.statistics?.correctAnswers || 0), 0) / totalUsers)
    : 0;
  const avgCompletedTests = totalUsers > 0
    ? Math.round(rating.reduce((sum, r) => sum + (r.statistics?.completedTests || 0), 0) / totalUsers)
    : 0;
  const avgScore = totalUsers > 0
    ? (rating.reduce((sum, r) => sum + (r.statistics?.averageScore || 0), 0) / totalUsers).toFixed(1)
    : '0.0';

  const exportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Статистика');

      if (activeTab === 0) {
        // Експорт рейтингу користувачів
        worksheet.columns = [
          { header: 'Місце', key: 'position', width: 10 },
          { header: 'Ім\'я', key: 'firstName', width: 20 },
          { header: 'Прізвище', key: 'lastName', width: 20 },
          { header: 'Місто', key: 'city', width: 20 },
          { header: 'Посада', key: 'positionName', width: 20 },
          { header: 'Правильних відповідей', key: 'correctAnswers', width: 20 },
          { header: 'Пройдено тестів', key: 'completedTests', width: 15 },
          { header: 'Середній бал', key: 'averageScore', width: 15 },
          { header: 'Монети', key: 'coins', width: 15 },
        ];

        rating.forEach((item) => {
          worksheet.addRow({
            position: item.position,
            firstName: item.user?.firstName || '',
            lastName: item.user?.lastName || '',
            city: item.user?.city?.name || '-',
            positionName: item.user?.position?.name || '-',
            correctAnswers: item.statistics?.correctAnswers || 0,
            completedTests: item.statistics?.completedTests || 0,
            averageScore: item.statistics?.averageScore?.toFixed(1) || '0.0',
            coins: item.coins || 0,
          });
        });

        // Додати загальну статистику
        worksheet.addRow({});
        worksheet.addRow({ position: 'Загальна статистика:', firstName: '' });
        worksheet.addRow({ position: 'Користувачів у рейтингу:', firstName: totalUsers });
        worksheet.addRow({ position: 'Середня кількість правильних відповідей:', firstName: avgCorrectAnswers });
        worksheet.addRow({ position: 'Середня кількість тестів:', firstName: avgCompletedTests });
        worksheet.addRow({ position: 'Середній бал:', firstName: avgScore });
      } else if (activeTab === 1) {
        // Експорт статистики по містах
        worksheet.columns = [
          { header: 'Місто', key: 'city', width: 25 },
          { header: 'Всього користувачів', key: 'totalUsers', width: 18 },
          { header: 'Активних', key: 'activeUsers', width: 15 },
          { header: 'Пройдено тестів', key: 'totalTests', width: 18 },
          { header: 'Середній бал', key: 'avgScore', width: 15 },
          { header: 'Середня кількість тестів на користувача', key: 'avgTestsPerUser', width: 30 },
          { header: 'Всього монет', key: 'totalCoins', width: 15 },
        ];

        statsByCities.forEach((stat) => {
          worksheet.addRow({
            city: stat.city.name,
            totalUsers: stat.totalUsers,
            activeUsers: stat.activeUsers,
            totalTests: stat.totalTests,
            avgScore: stat.avgScore?.toFixed(1) || '0.0',
            avgTestsPerUser: stat.avgTestsPerUser?.toFixed(1) || '0.0',
            totalCoins: stat.totalCoins,
          });
        });
      } else if (activeTab === 2) {
        // Експорт статистики по посадах
        worksheet.columns = [
          { header: 'Посада', key: 'position', width: 25 },
          { header: 'Всього користувачів', key: 'totalUsers', width: 18 },
          { header: 'Активних', key: 'activeUsers', width: 15 },
          { header: 'Пройдено тестів', key: 'totalTests', width: 18 },
          { header: 'Середній бал', key: 'avgScore', width: 15 },
          { header: 'Середня кількість тестів на користувача', key: 'avgTestsPerUser', width: 30 },
          { header: 'Всього монет', key: 'totalCoins', width: 15 },
        ];

        statsByPositions.forEach((stat) => {
          worksheet.addRow({
            position: stat.position.name,
            totalUsers: stat.totalUsers,
            activeUsers: stat.activeUsers,
            totalTests: stat.totalTests,
            avgScore: stat.avgScore?.toFixed(1) || '0.0',
            avgTestsPerUser: stat.avgTestsPerUser?.toFixed(1) || '0.0',
            totalCoins: stat.totalCoins,
          });
        });
      } else if (activeTab === 3) {
        // Експорт статистики монет
        worksheet.columns = [
          { header: 'Показник', key: 'indicator', width: 30 },
          { header: 'Значення', key: 'value', width: 20 },
        ];

        if (coinsStats) {
          worksheet.addRow({ indicator: 'Всього монет в системі', value: coinsStats.totalCoinsInSystem });
          worksheet.addRow({ indicator: 'Накопичено', value: coinsStats.totalEarned });
          worksheet.addRow({ indicator: 'Витрачено', value: coinsStats.totalSpent });
          worksheet.addRow({ indicator: 'Ручне нарахування', value: coinsStats.totalManualAdded });
          worksheet.addRow({ indicator: 'Ручне списання', value: coinsStats.totalManualSubtracted });
          worksheet.addRow({ indicator: 'Повернення', value: coinsStats.totalRefunded });
          worksheet.addRow({ indicator: 'Чистий баланс', value: coinsStats.netCoins });
        }
      } else if (activeTab === 4) {
        // Експорт статистики по тестах
        worksheet.columns = [
          { header: 'Показник', key: 'indicator', width: 30 },
          { header: 'Значення', key: 'value', width: 20 },
        ];

        if (testsStats) {
          worksheet.addRow({ indicator: 'Всього тестів', value: testsStats.summary.totalTests });
          worksheet.addRow({ indicator: 'Середній бал', value: testsStats.summary.avgScore });
          worksheet.addRow({ indicator: 'Середній відсоток', value: `${testsStats.summary.avgPercentage}%` });
          worksheet.addRow({ indicator: 'Зароблено монет', value: testsStats.summary.totalCoinsEarned });
          
          if (testsStats.cityStats && testsStats.cityStats.length > 0) {
            worksheet.addRow({});
            worksheet.addRow({ indicator: 'Статистика по містах', value: '' });
            worksheet.addRow({ indicator: 'Місто', value: 'Кількість тестів / Середній бал / Монети' });
            testsStats.cityStats.forEach(stat => {
              worksheet.addRow({ 
                indicator: stat.city.name, 
                value: `${stat.count} / ${stat.avgScore} / ${stat.totalCoins}` 
              });
            });
          }

          if (testsStats.positionStats && testsStats.positionStats.length > 0) {
            worksheet.addRow({});
            worksheet.addRow({ indicator: 'Статистика по посадах', value: '' });
            worksheet.addRow({ indicator: 'Посада', value: 'Кількість тестів / Середній бал / Монети' });
            testsStats.positionStats.forEach(stat => {
              worksheet.addRow({ 
                indicator: stat.position.name, 
                value: `${stat.count} / ${stat.avgScore} / ${stat.totalCoins}` 
              });
            });
          }
        }
      }

      // Стилізація заголовків
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      // Генерація файлу
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      let fileName = '';
      if (activeTab === 0) {
        fileName = `Рейтинг_користувачів_${new Date().toISOString().split('T')[0]}.xlsx`;
      } else if (activeTab === 1) {
        fileName = `Статистика_по_містах_${new Date().toISOString().split('T')[0]}.xlsx`;
      } else if (activeTab === 2) {
        fileName = `Статистика_по_посадах_${new Date().toISOString().split('T')[0]}.xlsx`;
      } else if (activeTab === 3) {
        fileName = `Статистика_монет_${new Date().toISOString().split('T')[0]}.xlsx`;
      } else if (activeTab === 4) {
        fileName = `Статистика_по_тестах_${new Date().toISOString().split('T')[0]}.xlsx`;
      } else if (activeTab === 5) {
        // Експорт статистики по категоріях
        worksheet.columns = [
          { header: 'Категорія', key: 'category', width: 30 },
          { header: 'Питань в категорії', key: 'totalQuestionsInCategory', width: 20 },
          { header: 'Використано в тестах', key: 'totalQuestions', width: 20 },
          { header: 'Правильних відповідей', key: 'correctAnswers', width: 20 },
          { header: 'Точність (%)', key: 'accuracy', width: 15 }
        ];
        categoryStats.forEach(stat => {
          worksheet.addRow({
            category: stat.category.name,
            totalQuestionsInCategory: stat.totalQuestionsInCategory || 0,
            totalQuestions: stat.totalQuestions,
            correctAnswers: stat.correctAnswers,
            accuracy: parseFloat(stat.accuracy).toFixed(1)
          });
        });
        fileName = `Статистика_по_категоріях_${new Date().toISOString().split('T')[0]}.xlsx`;
      } else if (activeTab === 6) {
        // Експорт комбінованої статистики
        worksheet.columns = [
          { header: 'Місто', key: 'city', width: 25 },
          { header: 'Посада', key: 'position', width: 25 },
          { header: 'Користувачів', key: 'totalUsers', width: 15 },
          { header: 'Тестів', key: 'totalTests', width: 15 },
          { header: 'Середній бал', key: 'avgScore', width: 15 },
          { header: 'Тестів/користувача', key: 'avgTestsPerUser', width: 18 },
          { header: 'Монет', key: 'totalCoins', width: 15 }
        ];
        combinedStats.forEach(stat => {
          worksheet.addRow({
            city: stat.city.name,
            position: stat.position.name,
            totalUsers: stat.totalUsers,
            totalTests: stat.totalTests,
            avgScore: stat.avgScore,
            avgTestsPerUser: stat.avgTestsPerUser,
            totalCoins: stat.totalCoins
          });
        });
        fileName = `Комбінована_статистика_${new Date().toISOString().split('T')[0]}.xlsx`;
      }
      
      saveAs(blob, fileName);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Помилка при експорті в Excel');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          Статистика та рейтинг
        </Typography>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={exportToExcel}
          disabled={loading}
        >
          Експорт в Excel
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Таби */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Рейтинг користувачів" />
          <Tab label="Статистика по містах" />
          <Tab label="Статистика по посадах" />
          <Tab label="Статистика монет" />
          <Tab label="Статистика по тестах" />
          <Tab label="Статистика по категоріях" />
          <Tab label="Комбінована статистика" />
        </Tabs>
      </Paper>

      {/* Фільтри (для рейтингу та статистики тестів) */}
      {(activeTab === 0 || activeTab === 4) && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <Autocomplete
              multiple
              options={positions}
              getOptionLabel={(option) => option.name}
              value={positions.filter(p => filters.positions?.includes(p._id))}
              onChange={(e, newValue) => {
                handleFilterChange('positions', newValue.map(v => v._id));
              }}
              renderInput={(params) => (
                <TextField {...params} label="Посади" size="small" sx={{ minWidth: 200 }} />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    key={option._id}
                    label={option.name}
                    size="small"
                    {...getTagProps({ index })}
                  />
                ))
              }
            />

            <Autocomplete
              multiple
              options={cities}
              getOptionLabel={(option) => option.name}
              value={cities.filter(c => filters.cities?.includes(c._id))}
              onChange={(e, newValue) => {
                handleFilterChange('cities', newValue.map(v => v._id));
              }}
              renderInput={(params) => (
                <TextField {...params} label="Міста" size="small" sx={{ minWidth: 200 }} />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    key={option._id}
                    label={option.name}
                    size="small"
                    {...getTagProps({ index })}
                  />
                ))
              }
            />

            <TextField
              type="date"
              label="Дата від"
              size="small"
              value={filters.startDate || ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 150 }}
            />

            <TextField
              type="date"
              label="Дата до"
              size="small"
              value={filters.endDate || ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 150 }}
            />

            {(filters.positions?.length > 0 || filters.cities?.length > 0 || filters.startDate || filters.endDate) && (
              <Button
                variant="outlined"
                onClick={clearFilters}
                size="small"
              >
                Очистити
              </Button>
            )}
          </Stack>
        </Paper>
      )}

      {/* Контент залежно від активного табу */}
      {activeTab === 0 && (
        <>
          {/* Статистика */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Користувачів у рейтингу
                  </Typography>
                  <Typography variant="h4">{totalUsers}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Середня кількість правильних відповідей
                  </Typography>
                  <Typography variant="h4">{avgCorrectAnswers}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Середня кількість тестів
                  </Typography>
                  <Typography variant="h4">{avgCompletedTests}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Середній бал
                  </Typography>
                  <Typography variant="h4">{avgScore}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Таблиця рейтингу */}
          {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Місце</TableCell>
                <TableCell>Користувач</TableCell>
                <TableCell>Місто</TableCell>
                <TableCell>Посада</TableCell>
                <TableCell align="right">Правильних відповідей</TableCell>
                <TableCell align="right">Пройдено тестів</TableCell>
                <TableCell align="right">Середній бал</TableCell>
                <TableCell align="right">Монети</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rating.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="textSecondary" sx={{ py: 3 }}>
                      Користувачі не знайдено
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rating.map((item, index) => (
                  <TableRow key={item.user?.id || index} hover>
                    <TableCell>
                      <Typography
                        variant="h6"
                        color={index < 3 ? 'primary.main' : 'text.primary'}
                        fontWeight={index < 3 ? 'bold' : 'normal'}
                      >
                        {item.position}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {getUserFullName(item.user)}
                      </Typography>
                    </TableCell>
                    <TableCell>{item.user?.city?.name || '-'}</TableCell>
                    <TableCell>{item.user?.position?.name || '-'}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body1" fontWeight="medium">
                        {item.statistics?.correctAnswers || 0}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {item.statistics?.completedTests || 0}
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body1"
                        color={item.statistics?.averageScore >= 80 ? 'success.main' : 'text.primary'}
                        fontWeight="medium"
                      >
                        {item.statistics?.averageScore?.toFixed(1) || '0.0'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1" fontWeight="medium">
                        {item.coins || 0} 🪙
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
          )}
        </>
      )}

      {activeTab === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Місто</TableCell>
                <TableCell align="right">Всього користувачів</TableCell>
                <TableCell align="right">Активних</TableCell>
                <TableCell align="right">Пройдено тестів</TableCell>
                <TableCell align="right">Середній бал</TableCell>
                <TableCell align="right">Середня кількість тестів на користувача</TableCell>
                <TableCell align="right">Всього монет</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {statsByCities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="textSecondary" sx={{ py: 3 }}>
                      Статистика не знайдена
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                statsByCities.map((stat) => (
                  <TableRow key={stat.city._id} hover>
                    <TableCell>
                      <Button
                        component={Link}
                        to={`/users?city=${stat.city._id}`}
                        variant="text"
                        color="primary"
                      >
                        {stat.city.name}
                      </Button>
                    </TableCell>
                    <TableCell align="right">{stat.totalUsers}</TableCell>
                    <TableCell align="right">{stat.activeUsers}</TableCell>
                    <TableCell align="right">{stat.totalTests}</TableCell>
                    <TableCell align="right">{stat.avgScore}</TableCell>
                    <TableCell align="right">{stat.avgTestsPerUser}</TableCell>
                    <TableCell align="right">{stat.totalCoins} 🪙</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {activeTab === 2 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Посада</TableCell>
                <TableCell align="right">Всього користувачів</TableCell>
                <TableCell align="right">Активних</TableCell>
                <TableCell align="right">Пройдено тестів</TableCell>
                <TableCell align="right">Середній бал</TableCell>
                <TableCell align="right">Середня кількість тестів на користувача</TableCell>
                <TableCell align="right">Всього монет</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {statsByPositions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="textSecondary" sx={{ py: 3 }}>
                      Статистика не знайдена
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                statsByPositions.map((stat) => (
                  <TableRow key={stat.position._id} hover>
                    <TableCell>
                      <Button
                        component={Link}
                        to={`/users?position=${stat.position._id}`}
                        variant="text"
                        color="primary"
                      >
                        {stat.position.name}
                      </Button>
                    </TableCell>
                    <TableCell align="right">{stat.totalUsers}</TableCell>
                    <TableCell align="right">{stat.activeUsers}</TableCell>
                    <TableCell align="right">{stat.totalTests}</TableCell>
                    <TableCell align="right">{stat.avgScore}</TableCell>
                    <TableCell align="right">{stat.avgTestsPerUser}</TableCell>
                    <TableCell align="right">{stat.totalCoins} 🪙</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Статистика монет */}
      {activeTab === 3 && (
        <>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : coinsStats ? (
            <>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Всього монет в системі
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">
                        {coinsStats.totalCoinsInSystem.toLocaleString()} 🪙
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Накопичено
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" color="success.main">
                        {coinsStats.totalEarned.toLocaleString()} 🪙
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Витрачено
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" color="error.main">
                        {coinsStats.totalSpent.toLocaleString()} 🪙
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Ручне нарахування
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" color="info.main">
                        {coinsStats.totalManualAdded.toLocaleString()} 🪙
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Ручне списання
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" color="warning.main">
                        {coinsStats.totalManualSubtracted.toLocaleString()} 🪙
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Повернення
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" color="success.main">
                        {coinsStats.totalRefunded.toLocaleString()} 🪙
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Чистий баланс
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">
                        {coinsStats.netCoins.toLocaleString()} 🪙
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </>
          ) : (
            <Typography color="textSecondary" sx={{ py: 3, textAlign: 'center' }}>
              Статистика не завантажена
            </Typography>
          )}
        </>
      )}

      {/* Статистика по тестах */}
      {activeTab === 4 && (
        <>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : testsStats ? (
            <>
              {/* Загальна статистика */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Всього тестів
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">
                        {testsStats.summary.totalTests}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Середній бал
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">
                        {testsStats.summary.avgScore}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Середній відсоток
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">
                        {testsStats.summary.avgPercentage}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Зароблено монет
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" color="success.main">
                        {testsStats.summary.totalCoinsEarned.toLocaleString()} 🪙
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Розподіл по балах */}
              <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Розподіл по балах
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Бал</TableCell>
                        <TableCell align="right">Кількість</TableCell>
                        <TableCell align="right">Відсоток</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {testsStats.scoreDistribution.map((dist) => (
                        <TableRow key={dist.score}>
                          <TableCell>{dist.score}/5</TableCell>
                          <TableCell align="right">{dist.count}</TableCell>
                          <TableCell align="right">{dist.percentage}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              {/* Статистика по містах */}
              {testsStats.cityStats && testsStats.cityStats.length > 0 && (
                <Paper sx={{ p: 2, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Статистика по містах
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Місто</TableCell>
                          <TableCell align="right">Кількість тестів</TableCell>
                          <TableCell align="right">Середній бал</TableCell>
                          <TableCell align="right">Зароблено монет</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {testsStats.cityStats.map((stat) => (
                          <TableRow key={stat.city._id} hover>
                            <TableCell>{stat.city.name}</TableCell>
                            <TableCell align="right">{stat.count}</TableCell>
                            <TableCell align="right">{stat.avgScore}</TableCell>
                            <TableCell align="right">{stat.totalCoins.toLocaleString()} 🪙</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}

              {/* Статистика по посадах */}
              {testsStats.positionStats && testsStats.positionStats.length > 0 && (
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Статистика по посадах
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Посада</TableCell>
                          <TableCell align="right">Кількість тестів</TableCell>
                          <TableCell align="right">Середній бал</TableCell>
                          <TableCell align="right">Зароблено монет</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {testsStats.positionStats.map((stat) => (
                          <TableRow key={stat.position._id} hover>
                            <TableCell>{stat.position.name}</TableCell>
                            <TableCell align="right">{stat.count}</TableCell>
                            <TableCell align="right">{stat.avgScore}</TableCell>
                            <TableCell align="right">{stat.totalCoins.toLocaleString()} 🪙</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}
            </>
          ) : (
            <Typography color="textSecondary" sx={{ py: 3, textAlign: 'center' }}>
              Статистика не завантажена
            </Typography>
          )}
        </>
      )}

      {/* Таб 5: Статистика по категоріях */}
      {activeTab === 5 && (
        <>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Категорія</TableCell>
                    <TableCell align="right">Питань в категорії</TableCell>
                    <TableCell align="right">Використано в тестах</TableCell>
                    <TableCell align="right">Правильних відповідей</TableCell>
                    <TableCell align="right">Точність (%)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categoryStats.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography color="textSecondary">Статистика недоступна</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    categoryStats.map((stat) => (
                      <TableRow key={stat.category._id} hover>
                        <TableCell>{stat.category.name}</TableCell>
                        <TableCell align="right">{stat.totalQuestionsInCategory || 0}</TableCell>
                        <TableCell align="right">{stat.totalQuestions}</TableCell>
                        <TableCell align="right">{stat.correctAnswers}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${parseFloat(stat.accuracy).toFixed(1)}%`}
                            size="small"
                            color={parseFloat(stat.accuracy) >= 70 ? 'success' : parseFloat(stat.accuracy) >= 50 ? 'warning' : 'error'}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* Таб 6: Комбінована статистика (місто + посада) */}
      {activeTab === 6 && (
        <>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Місто</TableCell>
                    <TableCell>Посада</TableCell>
                    <TableCell align="right">Користувачів</TableCell>
                    <TableCell align="right">Тестів</TableCell>
                    <TableCell align="right">Середній бал</TableCell>
                    <TableCell align="right">Тестів/користувача</TableCell>
                    <TableCell align="right">Монет</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {combinedStats.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography color="textSecondary" sx={{ py: 3 }}>
                          Комбінована статистика не знайдена
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    combinedStats.map((stat, index) => (
                      <TableRow key={`${stat.city._id}-${stat.position._id}`} hover>
                        <TableCell>
                          <Button
                            component={Link}
                            to={`/users?city=${stat.city._id}&position=${stat.position._id}`}
                            variant="text"
                            color="primary"
                          >
                            {stat.city.name}
                          </Button>
                        </TableCell>
                        <TableCell>{stat.position.name}</TableCell>
                        <TableCell align="right">{stat.totalUsers}</TableCell>
                        <TableCell align="right">{stat.totalTests}</TableCell>
                        <TableCell align="right">{stat.avgScore}</TableCell>
                        <TableCell align="right">{stat.avgTestsPerUser}</TableCell>
                        <TableCell align="right">{stat.totalCoins} 🪙</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* Графіки для табів з містами та посадами */}
      {activeTab === 1 && statsByCities.length > 0 && (
        <Grid container spacing={3} sx={{ mt: 3 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Користувачі по містах
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statsByCities}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="city.name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalUsers" fill="#8884d8" name="Всього користувачів" />
                  <Bar dataKey="activeUsers" fill="#82ca9d" name="Активних" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Середній бал по містах
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statsByCities}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="city.name" angle={-45} textAnchor="end" height={100} />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avgScore" fill="#ffc658" name="Середній бал" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Монети по містах
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statsByCities}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="city.name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalCoins" fill="#ff7300" name="Монети" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Розподіл користувачів по містах
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statsByCities}
                    dataKey="totalUsers"
                    nameKey="city.name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {statsByCities.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff'][index % 6]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && statsByPositions.length > 0 && (
        <Grid container spacing={3} sx={{ mt: 3 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Користувачі по посадах
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statsByPositions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="position.name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalUsers" fill="#8884d8" name="Всього користувачів" />
                  <Bar dataKey="activeUsers" fill="#82ca9d" name="Активних" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Середній бал по посадах
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statsByPositions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="position.name" angle={-45} textAnchor="end" height={100} />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avgScore" fill="#ffc658" name="Середній бал" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Монети по посадах
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statsByPositions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="position.name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalCoins" fill="#ff7300" name="Монети" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Розподіл користувачів по посадах
      </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statsByPositions}
                    dataKey="totalUsers"
                    nameKey="position.name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {statsByPositions.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff'][index % 6]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default StatsPage;
