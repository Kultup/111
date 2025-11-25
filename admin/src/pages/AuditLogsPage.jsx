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
  Stack,
  Pagination,
  Autocomplete,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  Alert as MuiAlert,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Warning as WarningIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import api from '../services/api';

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [suspiciousActivities, setSuspiciousActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0 - логи, 1 - підозрілі дії
  const limit = 50;

  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    entity: '',
    startDate: '',
    endDate: '',
  });

  const [admins, setAdmins] = useState([]);

  useEffect(() => {
    loadAdmins();
    if (activeTab === 0) {
      loadLogs();
      loadStats();
    } else {
      loadSuspiciousActivities();
    }
  }, [page, filters, activeTab]);

  const loadAdmins = async () => {
    try {
      const response = await api.get('/users?role=admin&limit=100');
      setAdmins(response.data.data || []);
    } catch (error) {
      console.error('Error loading admins:', error);
    }
  };

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        limit,
        ...filters,
      };

      const response = await api.get('/audit-logs', { params });
      setLogs(response.data.data || []);
      setTotalPages(response.data.pages || 1);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      setError('Помилка завантаження логів');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await api.get('/audit-logs/stats', { params });
      setStats(response.data.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadSuspiciousActivities = async () => {
    try {
      setLoading(true);
      const response = await api.get('/audit-logs/suspicious', { params: { days: 7 } });
      setSuspiciousActivities(response.data.data || []);
    } catch (error) {
      console.error('Error loading suspicious activities:', error);
      setError('Помилка завантаження підозрілих дій');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      userId: '',
      action: '',
      entity: '',
      startDate: '',
      endDate: '',
    });
    setPage(1);
  };

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setDetailDialogOpen(true);
  };

  const handleExport = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Логи дій');

      worksheet.columns = [
        { header: 'Дата', key: 'date', width: 20 },
        { header: 'Адміністратор', key: 'admin', width: 25 },
        { header: 'Дія', key: 'action', width: 15 },
        { header: 'Сутність', key: 'entity', width: 15 },
        { header: 'Опис', key: 'description', width: 50 },
        { header: 'IP адреса', key: 'ip', width: 15 },
      ];

      logs.forEach(log => {
        worksheet.addRow({
          date: new Date(log.createdAt).toLocaleString('uk-UA'),
          admin: log.user ? `${log.user.firstName} ${log.user.lastName} (${log.user.login})` : 'Невідомий',
          action: log.action,
          entity: log.entity,
          description: log.description,
          ip: log.ipAddress || '-',
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `audit-logs-${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Помилка експорту логів');
    }
  };

  const getActionLabel = (action) => {
    const labels = {
      create: 'Створення',
      update: 'Оновлення',
      delete: 'Видалення',
      approve: 'Підтвердження',
      reject: 'Відхилення',
      login: 'Вхід',
      logout: 'Вихід',
      export: 'Експорт',
      import: 'Імпорт',
      bulk_operation: 'Масові операції',
      settings_change: 'Зміна налаштувань',
      manual_coins: 'Ручні операції з монетами',
      block_user: 'Блокування користувача',
      unblock_user: 'Розблокування користувача',
    };
    return labels[action] || action;
  };

  const getEntityLabel = (entity) => {
    const labels = {
      user: 'Користувач',
      question: 'Питання',
      category: 'Категорія',
      city: 'Місто',
      position: 'Посада',
      achievement: 'Ачівка',
      shop_item: 'Товар',
      purchase: 'Покупка',
      coin_transaction: 'Транзакція монет',
      knowledge_base: 'База знань',
      feedback: 'Звернення',
      daily_test: 'Щоденний тест',
      settings: 'Налаштування',
    };
    return labels[entity] || entity;
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff'];

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1">
          Логи дій адміністраторів
        </Typography>
        <Button
          startIcon={<DownloadIcon />}
          variant="outlined"
          onClick={handleExport}
          disabled={activeTab === 1}
        >
          Експорт
        </Button>
      </Stack>

      {/* Таби */}
      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Всі логи" icon={<SecurityIcon />} iconPosition="start" />
        <Tab 
          label={`Підозрілі дії ${suspiciousActivities.length > 0 ? `(${suspiciousActivities.length})` : ''}`} 
          icon={<WarningIcon />} 
          iconPosition="start"
        />
      </Tabs>

      {activeTab === 1 && (
        <Box sx={{ mb: 3 }}>
          <MuiAlert severity="warning" sx={{ mb: 2 }}>
            Моніторинг підозрілих дій за останні 7 днів. Перевіряються масові операції, видалення, зміни налаштувань та дії в незвичний час.
          </MuiAlert>
        </Box>
      )}

      {/* Статистика (тільки для вкладки логів) */}
      {activeTab === 0 && stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Дії по типах
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={stats.actions}
                      dataKey="count"
                      nameKey="_id"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {stats.actions.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Дії по днях
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={stats.daily}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#8884d8" name="Кількість дій" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Фільтри (тільки для вкладки логів) */}
      {activeTab === 0 && (
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <Autocomplete
            options={admins}
            getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.login})`}
            value={admins.find(a => a._id === filters.userId) || null}
            onChange={(e, value) => handleFilterChange('userId', value?._id || '')}
            renderInput={(params) => <TextField {...params} label="Адміністратор" size="small" sx={{ minWidth: 200 }} />}
          />
          <TextField
            select
            label="Дія"
            value={filters.action}
            onChange={(e) => handleFilterChange('action', e.target.value)}
            size="small"
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">Всі</MenuItem>
            <MenuItem value="create">Створення</MenuItem>
            <MenuItem value="update">Оновлення</MenuItem>
            <MenuItem value="delete">Видалення</MenuItem>
            <MenuItem value="approve">Підтвердження</MenuItem>
            <MenuItem value="reject">Відхилення</MenuItem>
            <MenuItem value="bulk_operation">Масові операції</MenuItem>
            <MenuItem value="settings_change">Зміна налаштувань</MenuItem>
            <MenuItem value="manual_coins">Ручні операції</MenuItem>
          </TextField>
          <TextField
            select
            label="Сутність"
            value={filters.entity}
            onChange={(e) => handleFilterChange('entity', e.target.value)}
            size="small"
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">Всі</MenuItem>
            <MenuItem value="user">Користувач</MenuItem>
            <MenuItem value="question">Питання</MenuItem>
            <MenuItem value="category">Категорія</MenuItem>
            <MenuItem value="city">Місто</MenuItem>
            <MenuItem value="position">Посада</MenuItem>
            <MenuItem value="achievement">Ачівка</MenuItem>
            <MenuItem value="shop_item">Товар</MenuItem>
            <MenuItem value="purchase">Покупка</MenuItem>
            <MenuItem value="coin_transaction">Транзакція</MenuItem>
            <MenuItem value="knowledge_base">База знань</MenuItem>
            <MenuItem value="feedback">Звернення</MenuItem>
            <MenuItem value="settings">Налаштування</MenuItem>
          </TextField>
          <TextField
            type="date"
            label="Дата від"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            type="date"
            label="Дата до"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
          <Button variant="outlined" onClick={clearFilters}>
            Очистити
          </Button>
        </Stack>
      </Paper>
      )}

      {/* Таблиця логів або підозрілі дії */}
      {activeTab === 0 ? (
        loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <>
            <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Дата</TableCell>
                  <TableCell>Адміністратор</TableCell>
                  <TableCell>Дія</TableCell>
                  <TableCell>Сутність</TableCell>
                  <TableCell>Опис</TableCell>
                  <TableCell>IP адреса</TableCell>
                  <TableCell>Дії</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="textSecondary">Логи не знайдено</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log._id} hover>
                      <TableCell>
                        {new Date(log.createdAt).toLocaleString('uk-UA')}
                      </TableCell>
                      <TableCell>
                        {log.user
                          ? `${log.user.firstName} ${log.user.lastName} (${log.user.login})`
                          : 'Невідомий'}
                      </TableCell>
                      <TableCell>
                        <Chip label={getActionLabel(log.action)} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip label={getEntityLabel(log.entity)} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>{log.description}</TableCell>
                      <TableCell>{log.ipAddress || '-'}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => handleViewDetails(log)}
                        >
                          Деталі
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Пагінація */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
        )
      ) : (
        /* Підозрілі дії */
        loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : suspiciousActivities.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="textSecondary">
              Підозрілі дії не знайдено
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              За останні 7 днів не виявлено підозрілих активностей
            </Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Важливість</TableCell>
                  <TableCell>Тип</TableCell>
                  <TableCell>Опис</TableCell>
                  <TableCell>Адміністратор</TableCell>
                  <TableCell>Дата</TableCell>
                  <TableCell>Деталі</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {suspiciousActivities.map((activity, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Chip
                        label={
                          activity.severity === 'high' ? 'Високий' :
                          activity.severity === 'medium' ? 'Середній' : 'Низький'
                        }
                        color={
                          activity.severity === 'high' ? 'error' :
                          activity.severity === 'medium' ? 'warning' : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          activity.type === 'mass_operations' ? 'Масові операції' :
                          activity.type === 'mass_deletions' ? 'Масове видалення' :
                          activity.type === 'settings_change' ? 'Зміна налаштувань' :
                          activity.type === 'unusual_time' ? 'Незвичний час' :
                          activity.type === 'large_coin_operation' ? 'Велика операція з монетами' :
                          activity.type
                        }
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{activity.description}</TableCell>
                    <TableCell>
                      {activity.user
                        ? `${activity.user.name} (${activity.user.login})`
                        : 'Невідомий'}
                    </TableCell>
                    <TableCell>
                      {new Date(activity.timestamp).toLocaleString('uk-UA')}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => {
                          setSelectedLog({
                            ...activity,
                            createdAt: activity.timestamp,
                            action: activity.type,
                            entity: activity.entity || 'unknown',
                            description: activity.description,
                            changes: activity.changes || activity.details,
                          });
                          setDetailDialogOpen(true);
                        }}
                      >
                        Деталі
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )
      )}

      {/* Діалог деталей */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Деталі дії</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="caption" color="textSecondary">Дата</Typography>
                <Typography>{new Date(selectedLog.createdAt).toLocaleString('uk-UA')}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">Адміністратор</Typography>
                <Typography>
                  {selectedLog.user
                    ? `${selectedLog.user.firstName} ${selectedLog.user.lastName} (${selectedLog.user.login})`
                    : 'Невідомий'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">Дія</Typography>
                <Typography>{getActionLabel(selectedLog.action)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">Сутність</Typography>
                <Typography>{getEntityLabel(selectedLog.entity)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">Опис</Typography>
                <Typography>{selectedLog.description}</Typography>
              </Box>
              {selectedLog.changes && (
                <Box>
                  <Typography variant="caption" color="textSecondary">Зміни</Typography>
                  <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
                    {JSON.stringify(selectedLog.changes, null, 2)}
                  </pre>
                </Box>
              )}
              <Box>
                <Typography variant="caption" color="textSecondary">IP адреса</Typography>
                <Typography>{selectedLog.ipAddress || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">User Agent</Typography>
                <Typography>{selectedLog.userAgent || '-'}</Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Закрити</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuditLogsPage;

