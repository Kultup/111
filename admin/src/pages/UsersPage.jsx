import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  IconButton,
  TextField,
  MenuItem,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Checkbox,
  Toolbar,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Download as DownloadIcon,
  RestartAlt as RestartAltIcon,
  DeleteSweep as DeleteSweepIcon,
} from '@mui/icons-material';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import api from '../services/api';

const UsersPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [cities, setCities] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState({ open: false });
  const [resetTestDialog, setResetTestDialog] = useState({ open: false, id: null });
  const [resetAllTestsDialog, setResetAllTestsDialog] = useState({ open: false, id: null });
  const [bulkResetDialog, setBulkResetDialog] = useState({ open: false });
  const [bulkResetAllDialog, setBulkResetAllDialog] = useState({ open: false });
  const [selectedUsers, setSelectedUsers] = useState([]);
  
  // Фільтри та пошук
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    city: searchParams.get('city') || '',
    position: searchParams.get('position') || '',
    role: '',
  });
  
  // Пагінація
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    loadCities();
    loadPositions();
  }, []);

  useEffect(() => {
    // Застосувати фільтри з URL параметрів
    const cityParam = searchParams.get('city');
    const positionParam = searchParams.get('position');
    if (cityParam || positionParam) {
      setFilters(prev => ({
        ...prev,
        ...(cityParam && { city: cityParam }),
        ...(positionParam && { position: positionParam }),
      }));
    }
  }, [searchParams]);

  useEffect(() => {
    loadUsers();
  }, [page, search, filters]);

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

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        limit,
        ...(search && { search }),
        ...(filters.city && { city: filters.city }),
        ...(filters.position && { position: filters.position }),
        ...(filters.role && { role: filters.role }),
      };

      const response = await api.get('/users', { params });
      setUsers(response.data.data || []);
      setTotalPages(response.data.pages || 1);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Помилка завантаження користувачів');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/users/${id}`);
      loadUsers();
      setDeleteDialog({ open: false, id: null });
      setSelectedUsers([]);
    } catch (error) {
      console.error('Error deleting user:', error);
      setError(
        error.response?.data?.message || 'Помилка видалення користувача'
      );
    }
  };

  const handleBulkDelete = async () => {
    try {
      setLoading(true);
      const response = await api.post('/users/bulk-delete', {
        userIds: selectedUsers
      });
      setError(null);
      setBulkDeleteDialog({ open: false });
      setSelectedUsers([]);
      loadUsers();
    } catch (error) {
      console.error('Error bulk deleting users:', error);
      setError(
        error.response?.data?.message || 'Помилка масового видалення користувачів'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBulkBlock = async (isActive) => {
    try {
      setLoading(true);
      const response = await api.post('/users/bulk-update', {
        userIds: selectedUsers,
        isActive: !isActive
      });
      setError(null);
      setSelectedUsers([]);
      loadUsers();
    } catch (error) {
      console.error('Error bulk updating users:', error);
      setError(
        error.response?.data?.message || 'Помилка масового оновлення користувачів'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userId, currentStatus) => {
    try {
      setLoading(true);
      await api.post('/users/bulk-update', {
        userIds: [userId],
        isActive: !currentStatus
      });
      loadUsers();
    } catch (error) {
      console.error('Error toggling user active status:', error);
      setError(
        error.response?.data?.message || 'Помилка зміни статусу користувача'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetTest = async (userId) => {
    try {
      setLoading(true);
      await api.post(`/daily-tests/reset-user-test/${userId}`);
      setError(null);
      setResetTestDialog({ open: false, id: null });
      loadUsers();
    } catch (error) {
      console.error('Error resetting test:', error);
      setError(
        error.response?.data?.message || 'Помилка скидання тесту'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetAllTests = async (userId) => {
    try {
      setLoading(true);
      await api.post(`/daily-tests/reset-all-user-tests/${userId}`);
      setError(null);
      setResetAllTestsDialog({ open: false, id: null });
      loadUsers();
    } catch (error) {
      console.error('Error resetting all tests:', error);
      setError(
        error.response?.data?.message || 'Помилка скидання всієї статистики'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBulkResetTests = async () => {
    try {
      setLoading(true);
      await api.post('/daily-tests/bulk-reset', {
        userIds: selectedUsers
      });
      setError(null);
      setBulkResetDialog({ open: false });
      setSelectedUsers([]);
      loadUsers();
    } catch (error) {
      console.error('Error bulk resetting tests:', error);
      setError(
        error.response?.data?.message || 'Помилка масового скидання тестів'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBulkResetAllTests = async () => {
    try {
      setLoading(true);
      await api.post('/daily-tests/bulk-reset-all', {
        userIds: selectedUsers
      });
      setError(null);
      setBulkResetAllDialog({ open: false });
      setSelectedUsers([]);
      loadUsers();
    } catch (error) {
      console.error('Error bulk resetting all tests:', error);
      setError(
        error.response?.data?.message || 'Помилка масового скидання всієї статистики'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u._id));
    }
  };

  const exportToExcel = async () => {
    try {
      // Завантажити всіх користувачів з поточними фільтрами
      const params = {
        limit: 10000, // Велике число для отримання всіх
        ...(search && { search }),
        ...(filters.city && { city: filters.city }),
        ...(filters.position && { position: filters.position }),
        ...(filters.role && { role: filters.role }),
      };

      const response = await api.get('/users', { params });
      const allUsers = response.data.data || [];

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Користувачі');

      worksheet.columns = [
        { header: 'ПІБ', key: 'fullName', width: 25 },
        { header: 'Логін', key: 'login', width: 20 },
        { header: 'Місто', key: 'city', width: 20 },
        { header: 'Посада', key: 'position', width: 20 },
        { header: 'Роль', key: 'role', width: 15 },
        { header: 'Монети', key: 'coins', width: 15 },
        { header: 'Тестів пройдено', key: 'completedTests', width: 18 },
        { header: 'Питань пройдено', key: 'questionsAnswered', width: 20 },
        { header: 'Питань залишилось', key: 'remainingQuestions', width: 20 },
        { header: 'Правильних відповідей', key: 'correctAnswers', width: 22 },
        { header: 'Середній бал', key: 'averageScore', width: 15 },
        { header: 'Статус', key: 'status', width: 15 },
        { header: 'Дата реєстрації', key: 'createdAt', width: 20 },
      ];

      allUsers.forEach((user) => {
        worksheet.addRow({
          fullName: getUserFullName(user),
          login: user.login || '',
          city: user.city?.name || '-',
          position: user.position?.name || '-',
          role: user.role === 'admin' ? 'Адмін' : 'Користувач',
          coins: user.coins || 0,
          completedTests: user.statistics?.completedTests || 0,
          questionsAnswered: user.remainingQuestions?.answered || 0,
          remainingQuestions: user.remainingQuestions 
            ? `${user.remainingQuestions.remaining} з ${user.remainingQuestions.total}`
            : '-',
          correctAnswers: user.statistics?.correctAnswers || 0,
          averageScore: user.statistics?.averageScore?.toFixed(1) || '0.0',
          status: user.isActive ? 'Активний' : 'Заблокований',
          createdAt: formatDate(user.createdAt),
        });
      });

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
      const fileName = `Користувачі_${new Date().toISOString().split('T')[0]}.xlsx`;
      saveAs(blob, fileName);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      setError('Помилка при експорті в Excel');
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1); // Скинути на першу сторінку при зміні фільтрів
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(1); // Скинути на першу сторінку при зміні пошуку
  };

  const clearFilters = () => {
    setSearch('');
    setFilters({ city: '', position: '', role: '' });
    setPage(1);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getUserFullName = (user) => {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.login;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1">
        Користувачі
      </Typography>
          <Typography variant="body2" color="textSecondary">
            Всього: {total}
          </Typography>
        </Box>
        <Button
          variant="outlined"
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

      {/* Фільтри та пошук */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack spacing={2}>
          <TextField
            label="Пошук"
            variant="outlined"
            size="small"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Ім'я, прізвище або логін"
            sx={{ minWidth: 300 }}
          />
          
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <TextField
              select
              label="Місто"
              size="small"
              value={filters.city}
              onChange={(e) => handleFilterChange('city', e.target.value)}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">Всі міста</MenuItem>
              {cities.map((city) => (
                <MenuItem key={city._id} value={city._id}>
                  {city.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Посада"
              size="small"
              value={filters.position}
              onChange={(e) => handleFilterChange('position', e.target.value)}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">Всі посади</MenuItem>
              {positions.map((position) => (
                <MenuItem key={position._id} value={position._id}>
                  {position.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Роль"
              size="small"
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">Всі ролі</MenuItem>
              <MenuItem value="user">Користувач</MenuItem>
              <MenuItem value="admin">Адмін</MenuItem>
            </TextField>

            {(search || filters.city || filters.position || filters.role) && (
              <Button
                variant="outlined"
                onClick={clearFilters}
                sx={{ alignSelf: 'flex-start' }}
              >
                Очистити фільтри
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>

      {/* Панель масових операцій */}
      {selectedUsers.length > 0 && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
          <Toolbar disableGutters>
            <Typography variant="body1" sx={{ flexGrow: 1 }}>
              Вибрано: {selectedUsers.length} користувачів
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                color="info"
                startIcon={<RestartAltIcon />}
                onClick={() => setBulkResetDialog({ open: true })}
                disabled={loading}
              >
                Скинути поточні тести
              </Button>
              <Button
                variant="contained"
                color="warning"
                startIcon={<DeleteSweepIcon />}
                onClick={() => setBulkResetAllDialog({ open: true })}
                disabled={loading}
              >
                Скинути всю статистику
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={() => {
                  const allActive = selectedUsers.every(id => {
                    const user = users.find(u => u._id === id);
                    return user?.isActive;
                  });
                  handleBulkBlock(allActive);
                }}
                disabled={loading}
              >
                Розблокувати
              </Button>
              <Button
                variant="contained"
                color="warning"
                startIcon={<BlockIcon />}
                onClick={() => {
                  const allInactive = selectedUsers.every(id => {
                    const user = users.find(u => u._id === id);
                    return !user?.isActive;
                  });
                  handleBulkBlock(allInactive);
                }}
                disabled={loading}
              >
                Заблокувати
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setBulkDeleteDialog({ open: true })}
                disabled={loading}
              >
                Видалити
              </Button>
              <Button
                variant="outlined"
                onClick={() => setSelectedUsers([])}
              >
                Скасувати вибір
              </Button>
            </Stack>
          </Toolbar>
        </Paper>
      )}

      {/* Таблиця користувачів */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedUsers.length > 0 && selectedUsers.length < users.length}
                      checked={users.length > 0 && selectedUsers.length === users.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>ПІБ / Логін</TableCell>
                  <TableCell>Місто</TableCell>
                  <TableCell>Посада</TableCell>
                  <TableCell>Роль</TableCell>
                  <TableCell>Монети</TableCell>
                  <TableCell>Тестів пройдено</TableCell>
                  <TableCell>Питань пройдено</TableCell>
                  <TableCell>Питань залишилось</TableCell>
                  <TableCell>Дата реєстрації</TableCell>
                  <TableCell>Статус</TableCell>
                  <TableCell align="right">Дії</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} align="center">
                      <Typography color="textSecondary" sx={{ py: 3 }}>
                        Користувачі не знайдено
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user._id} hover selected={selectedUsers.includes(user._id)}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedUsers.includes(user._id)}
                          onChange={() => handleSelectUser(user._id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {getUserFullName(user)}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {user.login}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {user.city?.name || '-'}
                      </TableCell>
                      <TableCell>
                        {user.position?.name || '-'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.role === 'admin' ? 'Адмін' : 'Користувач'}
                          size="small"
                          color={user.role === 'admin' ? 'error' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {user.coins || 0} 🪙
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {user.statistics?.completedTests || 0}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {user.remainingQuestions ? (
                          <Box>
                            <Typography 
                              variant="body2" 
                              fontWeight="medium"
                              color="success.main"
                            >
                              {user.remainingQuestions.answered}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              унікальних
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.remainingQuestions ? (
                          <Box>
                            <Typography 
                              variant="body2" 
                              fontWeight="medium"
                              color={user.remainingQuestions.remaining === 0 ? 'error' : 'primary'}
                            >
                              {user.remainingQuestions.remaining}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              з {user.remainingQuestions.total}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(user.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.isActive ? 'Активний' : 'Неактивний'}
                          size="small"
                          color={user.isActive ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/users/${user._id}`)}
                            color="primary"
                            title="Переглянути деталі"
                          >
                            <VisibilityIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/users/${user._id}/edit`)}
                            color="primary"
                            title="Редагувати"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => setResetTestDialog({ open: true, id: user._id })}
                            color="info"
                            title="Скинути поточний тест"
                            disabled={loading}
                          >
                            <RestartAltIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => setResetAllTestsDialog({ open: true, id: user._id })}
                            color="warning"
                            title="Скинути всю статистику"
                            disabled={loading}
                          >
                            <DeleteSweepIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleActive(user._id, user.isActive)}
                            color={user.isActive ? 'warning' : 'success'}
                            title={user.isActive ? 'Заблокувати' : 'Розблокувати'}
                            disabled={loading}
                          >
                            {user.isActive ? <BlockIcon /> : <CheckCircleIcon />}
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => setDeleteDialog({ open: true, id: user._id })}
                            color="error"
                            title="Видалити"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Stack>
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
      )}

      {/* Діалог підтвердження видалення */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null })}
      >
        <DialogTitle>Підтвердження видалення</DialogTitle>
        <DialogContent>
          <Typography>
            Ви впевнені, що хочете видалити цього користувача?
            {users.find(u => u._id === deleteDialog.id) && (
              <Box component="span" fontWeight="bold" sx={{ ml: 1 }}>
                "{getUserFullName(users.find(u => u._id === deleteDialog.id))}"
              </Box>
            )}
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Ця дія незворотна. Всі дані користувача будуть видалені.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, id: null })}>
            Скасувати
          </Button>
          <Button
            onClick={() => handleDelete(deleteDialog.id)}
            color="error"
            variant="contained"
          >
            Видалити
          </Button>
        </DialogActions>
      </Dialog>

      {/* Діалог масового видалення */}
      <Dialog
        open={bulkDeleteDialog.open}
        onClose={() => setBulkDeleteDialog({ open: false })}
      >
        <DialogTitle>Підтвердження масового видалення</DialogTitle>
        <DialogContent>
          <Typography>
            Ви впевнені, що хочете видалити {selectedUsers.length} користувачів?
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Ця дія незворотна. Всі дані вибраних користувачів будуть видалені.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteDialog({ open: false })}>
            Скасувати
          </Button>
          <Button
            onClick={handleBulkDelete}
            color="error"
            variant="contained"
            disabled={loading}
          >
            Видалити всіх
          </Button>
        </DialogActions>
      </Dialog>

      {/* Діалог скидання поточного тесту */}
      <Dialog
        open={resetTestDialog.open}
        onClose={() => setResetTestDialog({ open: false, id: null })}
      >
        <DialogTitle>Підтвердження скидання поточного тесту</DialogTitle>
        <DialogContent>
          <Typography>
            Ви впевнені, що хочете скинути поточний тест для користувача
            {users.find(u => u._id === resetTestDialog.id) && (
              <Box component="span" fontWeight="bold" sx={{ ml: 1 }}>
                "{getUserFullName(users.find(u => u._id === resetTestDialog.id))}"
              </Box>
            )}?
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Тест на сьогодні буде видалено, і користувач зможе згенерувати новий тест.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetTestDialog({ open: false, id: null })}>
            Скасувати
          </Button>
          <Button
            onClick={() => handleResetTest(resetTestDialog.id)}
            color="info"
            variant="contained"
            disabled={loading}
          >
            Скинути тест
          </Button>
        </DialogActions>
      </Dialog>

      {/* Діалог скидання всієї статистики одного користувача */}
      <Dialog
        open={resetAllTestsDialog.open}
        onClose={() => setResetAllTestsDialog({ open: false, id: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: 'warning.main' }}>
          ⚠️ Підтвердження скидання ВСІЄЇ статистики
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Ви впевнені, що хочете скинути ВСЮ статистику тестів для користувача
            {users.find(u => u._id === resetAllTestsDialog.id) && (
              <Box component="span" fontWeight="bold" sx={{ ml: 1 }}>
                "{getUserFullName(users.find(u => u._id === resetAllTestsDialog.id))}"
              </Box>
            )}?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2" fontWeight="bold">
              УВАГА! Ця дія незворотна!
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Будуть видалені:
            </Typography>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Всі пройдені тести</li>
              <li>Історія відповідей на питання</li>
              <li>Статистика по категоріях</li>
            </ul>
            <Typography variant="body2">
              Користувач зможе проходити всі питання заново.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetAllTestsDialog({ open: false, id: null })}>
            Скасувати
          </Button>
          <Button
            onClick={() => handleResetAllTests(resetAllTestsDialog.id)}
            color="warning"
            variant="contained"
            disabled={loading}
          >
            Так, скинути всю статистику
          </Button>
        </DialogActions>
      </Dialog>

      {/* Діалог масового скидання поточних тестів */}
      <Dialog
        open={bulkResetDialog.open}
        onClose={() => setBulkResetDialog({ open: false })}
      >
        <DialogTitle>Підтвердження масового скидання поточних тестів</DialogTitle>
        <DialogContent>
          <Typography>
            Ви впевнені, що хочете скинути поточні тести для {selectedUsers.length} користувачів?
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Тести на сьогодні будуть видалені, і користувачі зможуть згенерувати нові тести.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkResetDialog({ open: false })}>
            Скасувати
          </Button>
          <Button
            onClick={handleBulkResetTests}
            color="info"
            variant="contained"
            disabled={loading}
          >
            Скинути поточні тести
          </Button>
        </DialogActions>
      </Dialog>

      {/* Діалог масового скидання ВСІЄЇ статистики */}
      <Dialog
        open={bulkResetAllDialog.open}
        onClose={() => setBulkResetAllDialog({ open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: 'warning.main' }}>
          ⚠️ Підтвердження масового скидання ВСІЄЇ статистики
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Ви впевнені, що хочете скинути ВСЮ статистику тестів для {selectedUsers.length} користувачів?
          </Typography>
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="body2" fontWeight="bold">
              УВАГА! Ця дія незворотна!
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Для кожного користувача будуть видалені:
            </Typography>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Всі пройдені тести</li>
              <li>Історія відповідей на питання</li>
              <li>Статистика по категоріях</li>
            </ul>
            <Typography variant="body2">
              Користувачі зможуть проходити всі питання заново.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkResetAllDialog({ open: false })}>
            Скасувати
          </Button>
          <Button
            onClick={handleBulkResetAllTests}
            color="error"
            variant="contained"
            disabled={loading}
          >
            Так, скинути всю статистику
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersPage;
