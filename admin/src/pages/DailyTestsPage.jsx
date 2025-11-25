import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  Pagination,
  Grid,
  Card,
  CardContent,
  Autocomplete,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';
import api from '../services/api';

const DailyTestsPage = () => {
  const [tests, setTests] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState(null);
  const limit = 20;

  const [filters, setFilters] = useState({
    status: '',
    userId: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    loadTests();
  }, [page, filters]);

  const loadUsers = async () => {
    try {
      const response = await api.get('/users?limit=1000');
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadTests = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit,
        ...(filters.status && { status: filters.status }),
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      };

      const response = await api.get('/daily-tests', { params });
      setTests(response.data.data || []);
      setTotalPages(response.data.pages || 1);
      setTotal(response.data.total || 0);
      setStats(response.data.stats || null);
    } catch (error) {
      console.error('Error loading tests:', error);
      setError('Помилка завантаження тестів');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateForUser = async (userId) => {
    try {
      setError(null);
      await api.post(`/daily-tests/generate-for-user/${userId}`);
      loadTests();
    } catch (error) {
      console.error('Error generating test:', error);
      setError(
        error.response?.data?.message || 'Помилка генерації тесту'
      );
    }
  };

  const handleViewDetails = async (test) => {
    try {
      // Завантажити повну інформацію про тест з питаннями
      const response = await api.get(`/daily-tests/${test._id}/results`);
      setSelectedTest(response.data.data);
      setOpenDetailsDialog(true);
    } catch (error) {
      console.error('Error loading test details:', error);
      setError('Помилка завантаження деталей тесту');
    }
  };

  const handleGenerateAll = async () => {
    try {
      setError(null);
      await api.post('/cron/generate-tests');
      loadTests();
    } catch (error) {
      console.error('Error generating all tests:', error);
      setError(
        error.response?.data?.message || 'Помилка генерації тестів'
      );
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'info';
      case 'pending':
        return 'warning';
      case 'expired':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed':
        return 'Завершено';
      case 'in_progress':
        return 'В процесі';
      case 'pending':
        return 'Очікує';
      case 'expired':
        return 'Прострочено';
      default:
        return status;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Щоденні тести
        </Typography>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={handleGenerateAll}
        >
          Згенерувати для всіх
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Статистика */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Всього тестів
                </Typography>
                <Typography variant="h4">{stats.total || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Завершено
                </Typography>
                <Typography variant="h4" color="success.main">
                  {stats.completed || 0}
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
                <Typography variant="h4">
                  {stats.avgScore ? stats.avgScore.toFixed(1) : '0.0'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Монет нараховано
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {stats.totalCoins || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Фільтри */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <TextField
            select
            label="Статус"
            size="small"
            value={filters.status}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value });
              setPage(1);
            }}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">Всі статуси</MenuItem>
            <MenuItem value="pending">Очікує</MenuItem>
            <MenuItem value="in_progress">В процесі</MenuItem>
            <MenuItem value="completed">Завершено</MenuItem>
            <MenuItem value="expired">Прострочено</MenuItem>
          </TextField>

          <Autocomplete
            options={users}
            getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.login})`}
            value={users.find(u => u._id === filters.userId) || null}
            onChange={(e, newValue) => {
              setFilters({ ...filters, userId: newValue?._id || '' });
              setPage(1);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Користувач"
                size="small"
                sx={{ minWidth: 250 }}
              />
            )}
          />

          <TextField
            label="Дата від"
            type="date"
            size="small"
            value={filters.startDate}
            onChange={(e) => {
              setFilters({ ...filters, startDate: e.target.value });
              setPage(1);
            }}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
          />

          <TextField
            label="Дата до"
            type="date"
            size="small"
            value={filters.endDate}
            onChange={(e) => {
              setFilters({ ...filters, endDate: e.target.value });
              setPage(1);
            }}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
          />

          <Button
            variant="outlined"
            onClick={() => {
              setFilters({
                status: '',
                userId: '',
                startDate: '',
                endDate: '',
              });
              setPage(1);
            }}
          >
            Очистити
          </Button>
        </Stack>
      </Paper>

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
                  <TableCell>Користувач</TableCell>
                  <TableCell>Дата</TableCell>
                  <TableCell>Статус</TableCell>
                  <TableCell>Бал</TableCell>
                  <TableCell>Монети</TableCell>
                  <TableCell>Завершено</TableCell>
                  <TableCell align="right">Дії</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="textSecondary" sx={{ py: 3 }}>
                        Тести не знайдено
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  tests.map((test) => (
                    <TableRow key={test._id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {test.user?.firstName} {test.user?.lastName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {test.user?.city?.name || '-'} • {test.user?.position?.name || '-'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {formatDate(test.date)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(test.status)}
                          size="small"
                          color={getStatusColor(test.status)}
                        />
                      </TableCell>
                      <TableCell>
                        {test.status === 'completed' ? (
                          <Typography variant="body2" fontWeight="medium">
                            {test.score}/5
                          </Typography>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {test.coinsEarned > 0 ? (
                          <Typography variant="body2" color="primary.main">
                            +{test.coinsEarned}
                          </Typography>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {test.completedAt ? formatDate(test.completedAt) : '-'}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(test)}
                          color="primary"
                        >
                          <VisibilityIcon />
                        </IconButton>
                        {test.status !== 'completed' && test.status !== 'expired' && (
                          <IconButton
                            size="small"
                            onClick={() => handleGenerateForUser(test.user._id)}
                            color="success"
                            title="Згенерувати новий тест"
                          >
                            <PlayArrowIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

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

      {/* Діалог деталей тесту */}
      <Dialog
        open={openDetailsDialog}
        onClose={() => setOpenDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Деталі тесту
        </DialogTitle>
        <DialogContent>
          {selectedTest && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Користувач
                </Typography>
                <Typography variant="body1">
                  {selectedTest.user?.firstName} {selectedTest.user?.lastName}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {selectedTest.user?.city?.name || '-'} • {selectedTest.user?.position?.name || '-'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Дата тесту
                </Typography>
                <Typography variant="body1">
                  {formatDate(selectedTest.date)}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Статус
                </Typography>
                <Chip
                  label={getStatusLabel(selectedTest.status)}
                  size="small"
                  color={getStatusColor(selectedTest.status)}
                />
              </Box>

              {selectedTest.status === 'completed' && (
                <>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">
                      Результат
                    </Typography>
                    <Typography variant="h6">
                      {selectedTest.score}/5 ({((selectedTest.score / 5) * 100).toFixed(0)}%)
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">
                      Монети
                    </Typography>
                    <Typography variant="body1" color="primary.main">
                      +{selectedTest.coinsEarned}
                    </Typography>
                  </Box>
                </>
              )}

              <Box>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Питання та відповіді
                </Typography>
                {selectedTest.questions?.map((q, index) => (
                  <Paper key={index} sx={{ p: 2, mb: 2 }}>
                    <Typography variant="body2" fontWeight="medium" gutterBottom>
                      Питання {index + 1}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {q.question?.text || 'Питання не завантажено'}
                    </Typography>
                    
                    {q.question?.answers && (
                      <Box sx={{ mb: 1, pl: 2 }}>
                        {q.question.answers.map((answer, ansIndex) => (
                          <Typography
                            key={ansIndex}
                            variant="body2"
                            sx={{
                              color: ansIndex === q.userAnswer
                                ? (q.isCorrect ? 'success.main' : 'error.main')
                                : 'text.secondary',
                              fontWeight: ansIndex === q.userAnswer ? 'bold' : 'normal',
                            }}
                          >
                            {ansIndex + 1}. {answer.text}
                            {answer.isCorrect && ' ✓'}
                            {ansIndex === q.userAnswer && !q.isCorrect && ' (ваша відповідь)'}
                          </Typography>
                        ))}
                      </Box>
                    )}

                    {q.userAnswer !== null ? (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="textSecondary">
                          Відповідь користувача: Варіант {q.userAnswer + 1}
                        </Typography>
                        <Chip
                          label={q.isCorrect ? 'Правильно' : 'Неправильно'}
                          size="small"
                          color={q.isCorrect ? 'success' : 'error'}
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    ) : (
                      <Typography variant="caption" color="textSecondary">
                        Не відповів
                      </Typography>
                    )}

                    {q.question?.explanation && (
                      <Box sx={{ mt: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                        <Typography variant="caption" color="textSecondary">
                          Пояснення: {q.question.explanation}
                        </Typography>
                      </Box>
                    )}

                    {q.answeredAt && (
                      <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
                        Час відповіді: {formatDate(q.answeredAt)}
                      </Typography>
                    )}
                  </Paper>
                ))}
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailsDialog(false)}>Закрити</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DailyTestsPage;

