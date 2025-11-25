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
  TextareaAutosize,
  Tabs,
  Tab,
  LinearProgress,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Reply as ReplyIcon,
  Delete as DeleteIcon,
  BarChart as BarChartIcon,
  Download as DownloadIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '../services/api';
import { useToast } from '../components/ToastProvider';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const FeedbackPage = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [openReplyDialog, setOpenReplyDialog] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState(null);
  const [detailedStats, setDetailedStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const limit = 20;
  const toast = useToast();

  const [filters, setFilters] = useState({
    type: '',
    status: '',
    priority: '',
    search: '',
  });

  const [replyText, setReplyText] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    loadFeedbacks();
    loadDetailedStats();
  }, [page, filters]);

  const loadDetailedStats = async () => {
    try {
      setStatsLoading(true);
      const response = await api.get('/feedback/stats');
      setDetailedStats(response.data.data);
    } catch (error) {
      console.error('Error loading detailed stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadFeedbacks = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit,
        ...(filters.type && { type: filters.type }),
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.search && { search: filters.search }),
      };

      const response = await api.get('/feedback', { params });
      setFeedbacks(response.data.data || []);
      setTotalPages(response.data.pages || 1);
      setTotal(response.data.total || 0);
      
      // Обчислити статистику
      calculateStats(response.data.data || []);
    } catch (error) {
      console.error('Error loading feedbacks:', error);
      setError('Помилка завантаження звернень');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (feedbacks) => {
    const statsData = {
      total: feedbacks.length,
      pending: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
      byType: {},
    };

    feedbacks.forEach((fb) => {
      if (fb.status === 'new') statsData.pending++;
      else if (fb.status === 'in_progress') statsData.inProgress++;
      else if (fb.status === 'resolved') statsData.resolved++;
      else if (fb.status === 'closed') statsData.closed++;

      if (!statsData.byType[fb.type]) {
        statsData.byType[fb.type] = 0;
      }
      statsData.byType[fb.type]++;
    });

    setStats(statsData);
  };

  const handleViewDetails = async (feedback) => {
    try {
      const response = await api.get(`/feedback/${feedback._id}`);
      setSelectedFeedback(response.data.data);
      setOpenDetailsDialog(true);
    } catch (error) {
      console.error('Error loading feedback details:', error);
      setError('Помилка завантаження деталей звернення');
    }
  };

  const handleOpenReply = (feedback) => {
    setSelectedFeedback(feedback);
    setReplyText(feedback.response?.text || '');
    setOpenReplyDialog(true);
  };

  const handleReply = async () => {
    if (!replyText.trim()) {
      const errorMsg = 'Текст відповіді не може бути порожнім';
      setError(errorMsg);
      toast.warning(errorMsg);
      return;
    }

    try {
      setError(null);
      await api.put(`/feedback/${selectedFeedback._id}`, {
        response: {
          text: replyText,
        },
        status: 'resolved',
      });
      setOpenReplyDialog(false);
      setReplyText('');
      toast.success('Відповідь успішно відправлена');
      loadFeedbacks();
    } catch (error) {
      console.error('Error replying to feedback:', error);
      const errorMsg = error.response?.data?.message || 'Помилка відправки відповіді';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleUpdateStatus = async (feedbackId, newStatus) => {
    try {
      setError(null);
      await api.put(`/feedback/${feedbackId}`, { status: newStatus });
      loadFeedbacks();
    } catch (error) {
      console.error('Error updating status:', error);
      setError(
        error.response?.data?.message || 'Помилка оновлення статусу'
      );
    }
  };

  const handleUpdatePriority = async (feedbackId, newPriority) => {
    try {
      setError(null);
      await api.put(`/feedback/${feedbackId}`, { priority: newPriority });
      loadFeedbacks();
    } catch (error) {
      console.error('Error updating priority:', error);
      setError(
        error.response?.data?.message || 'Помилка оновлення пріоритету'
      );
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Ви впевнені, що хочете видалити це звернення?')) {
      return;
    }

    try {
      await api.delete(`/feedback/${id}`);
      toast.success('Звернення успішно видалено');
      loadFeedbacks();
    } catch (error) {
      console.error('Error deleting feedback:', error);
      const errorMsg = error.response?.data?.message || 'Помилка видалення звернення';
      setError(errorMsg);
      toast.error(errorMsg);
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
      case 'new':
        return 'warning';
      case 'in_progress':
        return 'info';
      case 'resolved':
        return 'success';
      case 'closed':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'new':
        return 'Нове';
      case 'in_progress':
        return 'В роботі';
      case 'resolved':
        return 'Вирішено';
      case 'closed':
        return 'Закрито';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low':
        return 'default';
      case 'medium':
        return 'info';
      case 'high':
        return 'warning';
      case 'urgent':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'low':
        return 'Низький';
      case 'medium':
        return 'Середній';
      case 'high':
        return 'Високий';
      case 'urgent':
        return 'Терміново';
      default:
        return priority;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'bug':
        return 'Помилка';
      case 'feature':
        return 'Функціонал';
      case 'improvement':
        return 'Покращення';
      case 'complaint':
        return 'Скарга';
      case 'praise':
        return 'Подяка';
      case 'other':
        return 'Інше';
      default:
        return type;
    }
  };

  const exportToExcel = async () => {
    try {
      setLoading(true);
      // Отримуємо всі звернення з поточними фільтрами
      const response = await api.get('/feedback', {
        params: { ...filters, limit: total, page: 1 },
      });
      const allFeedbacks = response.data.data;

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Звернення');

      worksheet.columns = [
        { header: 'ID', key: 'id', width: 30 },
        { header: 'Користувач', key: 'user', width: 25 },
        { header: 'Тип', key: 'type', width: 15 },
        { header: 'Тема', key: 'subject', width: 30 },
        { header: 'Повідомлення', key: 'message', width: 50 },
        { header: 'Статус', key: 'status', width: 15 },
        { header: 'Пріоритет', key: 'priority', width: 15 },
        { header: 'Прикріплення', key: 'attachments', width: 30 },
        { header: 'Відповідь', key: 'response', width: 50 },
        { header: 'Відповів', key: 'respondedBy', width: 25 },
        { header: 'Дата відповіді', key: 'respondedAt', width: 20 },
        { header: 'Дата створення', key: 'createdAt', width: 20 },
      ];

      allFeedbacks.forEach((feedback) => {
        worksheet.addRow({
          id: feedback._id,
          user: feedback.user
            ? `${feedback.user.firstName} ${feedback.user.lastName} (${feedback.user.login})`
            : 'Анонімний',
          type: getTypeLabel(feedback.type),
          subject: feedback.subject || '-',
          message: feedback.message,
          status: getStatusLabel(feedback.status),
          priority: getPriorityLabel(feedback.priority || 'medium'),
          attachments: feedback.attachments && feedback.attachments.length > 0
            ? feedback.attachments.join('; ')
            : '-',
          response: feedback.response?.text || '-',
          respondedBy: feedback.response?.respondedBy
            ? `${feedback.response.respondedBy.firstName} ${feedback.response.respondedBy.lastName}`
            : '-',
          respondedAt: feedback.response?.respondedAt
            ? formatDate(feedback.response.respondedAt)
            : '-',
          createdAt: formatDate(feedback.createdAt),
        });
      });

      // Стилізація заголовків
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      saveAs(blob, `Звернення_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Експорт успішно виконано');
    } catch (error) {
      console.error('Error exporting feedbacks:', error);
      toast.error('Помилка при експорті звернень');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Звернення користувачів
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
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Список звернень" />
          <Tab label="Статистика" icon={<BarChartIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {activeTab === 0 && (
        <>
          {/* Статистика */}
          {stats && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Всього звернень
                    </Typography>
                    <Typography variant="h4">{stats.total || 0}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Очікує
                    </Typography>
                    <Typography variant="h4" color="warning.main">
                      {stats.pending || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      В роботі
                    </Typography>
                    <Typography variant="h4" color="info.main">
                      {stats.inProgress || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Вирішено
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {stats.resolved || 0}
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
                label="Пошук"
                size="small"
                value={filters.search}
                onChange={(e) => {
                  setFilters({ ...filters, search: e.target.value });
                  setPage(1);
                }}
                placeholder="Пошук по темі або повідомленню..."
                sx={{ minWidth: 250 }}
              />
          <TextField
            select
            label="Тип"
            size="small"
            value={filters.type}
            onChange={(e) => {
              setFilters({ ...filters, type: e.target.value });
              setPage(1);
            }}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">Всі типи</MenuItem>
            <MenuItem value="bug">Помилка</MenuItem>
            <MenuItem value="feature">Функціонал</MenuItem>
            <MenuItem value="improvement">Покращення</MenuItem>
            <MenuItem value="complaint">Скарга</MenuItem>
            <MenuItem value="praise">Подяка</MenuItem>
            <MenuItem value="other">Інше</MenuItem>
          </TextField>

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
            <MenuItem value="new">Нове</MenuItem>
            <MenuItem value="in_progress">В роботі</MenuItem>
            <MenuItem value="resolved">Вирішено</MenuItem>
            <MenuItem value="closed">Закрито</MenuItem>
          </TextField>

          <TextField
            select
            label="Пріоритет"
            size="small"
            value={filters.priority}
            onChange={(e) => {
              setFilters({ ...filters, priority: e.target.value });
              setPage(1);
            }}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">Всі пріоритети</MenuItem>
            <MenuItem value="low">Низький</MenuItem>
            <MenuItem value="medium">Середній</MenuItem>
            <MenuItem value="high">Високий</MenuItem>
            <MenuItem value="urgent">Терміново</MenuItem>
          </TextField>

          <Button
            variant="outlined"
            onClick={() => {
              setFilters({
                type: '',
                status: '',
                priority: '',
                search: '',
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
                  <TableCell>Тип</TableCell>
                  <TableCell>Тема</TableCell>
                  <TableCell>Статус</TableCell>
                  <TableCell>Пріоритет</TableCell>
                  <TableCell>Дата створення</TableCell>
                  <TableCell align="right">Дії</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {feedbacks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="textSecondary" sx={{ py: 3 }}>
                        Звернення не знайдено
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  feedbacks.map((feedback) => (
                    <TableRow key={feedback._id} hover>
                      <TableCell>
                        {feedback.user ? (
                          <Typography variant="body2">
                            {feedback.user.firstName} {feedback.user.lastName}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            Анонімний
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip label={getTypeLabel(feedback.type)} size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                          {feedback.subject || feedback.message?.substring(0, 50) + '...'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(feedback.status)}
                          size="small"
                          color={getStatusColor(feedback.status)}
                        />
                      </TableCell>
                      <TableCell>
                        {feedback.priority && (
                          <Chip
                            label={getPriorityLabel(feedback.priority)}
                            size="small"
                            color={getPriorityColor(feedback.priority)}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDate(feedback.createdAt)}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(feedback)}
                          color="primary"
                        >
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenReply(feedback)}
                          color="success"
                        >
                          <ReplyIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(feedback._id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
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
        </>
      )}

      {/* Діалог деталей */}
      <Dialog
        open={openDetailsDialog}
        onClose={() => setOpenDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Деталі звернення
        </DialogTitle>
        <DialogContent>
          {selectedFeedback && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Користувач
                </Typography>
                <Typography variant="body1">
                  {selectedFeedback.user
                    ? `${selectedFeedback.user.firstName} ${selectedFeedback.user.lastName} (${selectedFeedback.user.login})`
                    : 'Анонімний'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Тип
                </Typography>
                <Chip label={getTypeLabel(selectedFeedback.type)} size="small" />
              </Box>

              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Тема
                </Typography>
                <Typography variant="body1">
                  {selectedFeedback.subject || 'Без теми'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Повідомлення
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body2" whiteSpace="pre-wrap">
                    {selectedFeedback.message}
                  </Typography>
                </Paper>
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Статус
                  </Typography>
                  <Chip
                    label={getStatusLabel(selectedFeedback.status)}
                    size="small"
                    color={getStatusColor(selectedFeedback.status)}
                  />
                </Box>
                {selectedFeedback.priority && (
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">
                      Пріоритет
                    </Typography>
                    <Chip
                      label={getPriorityLabel(selectedFeedback.priority)}
                      size="small"
                      color={getPriorityColor(selectedFeedback.priority)}
                    />
                  </Box>
                )}
              </Box>

              {selectedFeedback.attachments && selectedFeedback.attachments.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Прикріплені файли
                  </Typography>
                  <Grid container spacing={2}>
                    {selectedFeedback.attachments.map((attachment, index) => {
                      const imageUrl = attachment.startsWith('http')
                        ? attachment
                        : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${attachment}`;
                      return (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                          <Box
                            sx={{
                              position: 'relative',
                              width: '100%',
                              paddingTop: '75%', // 4:3 aspect ratio
                              borderRadius: 1,
                              overflow: 'hidden',
                              border: '1px solid #e0e0e0',
                              cursor: 'pointer',
                              '&:hover': {
                                opacity: 0.8,
                              },
                            }}
                            onClick={() => window.open(imageUrl, '_blank')}
                          >
                            <Box
                              component="img"
                              src={imageUrl}
                              alt={`Прикріплення ${index + 1}`}
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = `
                                  <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; color: #999;">
                                    <span style="font-size: 48px;">📎</span>
                                    <div style="font-size: 12px; margin-top: 8px;">Файл</div>
                                  </div>
                                `;
                              }}
                            />
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              )}

              {selectedFeedback.response && (
                <Box>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Відповідь адміна
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'primary.50' }}>
                    <Typography variant="body2" whiteSpace="pre-wrap">
                      {selectedFeedback.response.text}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
                      {selectedFeedback.response.respondedBy
                        ? `Відповів: ${selectedFeedback.response.respondedBy.firstName} ${selectedFeedback.response.respondedBy.lastName}`
                        : ''}
                      {' • '}
                      {formatDate(selectedFeedback.response.respondedAt)}
                    </Typography>
                  </Paper>
                </Box>
              )}

              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Дата створення
                </Typography>
                <Typography variant="body2">
                  {formatDate(selectedFeedback.createdAt)}
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailsDialog(false)}>Закрити</Button>
          {selectedFeedback && (
            <>
              <TextField
                select
                size="small"
                value={selectedFeedback.status}
                onChange={(e) => {
                  handleUpdateStatus(selectedFeedback._id, e.target.value);
                  setSelectedFeedback({ ...selectedFeedback, status: e.target.value });
                }}
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="new">Нове</MenuItem>
                <MenuItem value="in_progress">В роботі</MenuItem>
                <MenuItem value="resolved">Вирішено</MenuItem>
                <MenuItem value="closed">Закрито</MenuItem>
              </TextField>
              <TextField
                select
                size="small"
                value={selectedFeedback.priority || 'medium'}
                onChange={(e) => {
                  handleUpdatePriority(selectedFeedback._id, e.target.value);
                  setSelectedFeedback({ ...selectedFeedback, priority: e.target.value });
                }}
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="low">Низький</MenuItem>
                <MenuItem value="medium">Середній</MenuItem>
                <MenuItem value="high">Високий</MenuItem>
                <MenuItem value="urgent">Терміново</MenuItem>
              </TextField>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Діалог відповіді */}
      <Dialog
        open={openReplyDialog}
        onClose={() => {
          setOpenReplyDialog(false);
          setReplyText('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Відповісти на звернення
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {selectedFeedback && (
              <>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Повідомлення користувача
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50', mb: 2 }}>
                    <Typography variant="body2" whiteSpace="pre-wrap">
                      {selectedFeedback.message}
                    </Typography>
                  </Paper>
                </Box>
              </>
            )}
            <TextField
              label="Відповідь"
              fullWidth
              multiline
              rows={6}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Введіть відповідь на звернення..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenReplyDialog(false);
              setReplyText('');
            }}
          >
            Скасувати
          </Button>
          <Button onClick={handleReply} variant="contained" color="primary">
            Відправити відповідь
          </Button>
        </DialogActions>
      </Dialog>

      {/* Таб зі статистикою */}
      {activeTab === 1 && (
        <>
          {statsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : detailedStats ? (
            <>
              {/* Загальна статистика */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Звернення по типах
                      </Typography>
                      {detailedStats.byType && detailedStats.byType.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={detailedStats.byType.map(item => ({
                                name: getTypeLabel(item.type),
                                value: item.count
                              }))}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {detailedStats.byType.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82CA9D'][index % 6]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <Typography color="textSecondary">Немає даних</Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Середній час відповіді
                      </Typography>
                      {detailedStats.avgResponseTime ? (
                        <Box>
                          <Typography variant="h3" color="primary.main">
                            {parseFloat(detailedStats.avgResponseTime.days) < 1
                              ? `${detailedStats.avgResponseTime.hours} год`
                              : `${detailedStats.avgResponseTime.days} дн`}
                          </Typography>
                          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                            {parseFloat(detailedStats.avgResponseTime.days) >= 1
                              ? `(${detailedStats.avgResponseTime.hours} годин)`
                              : ''}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography color="textSecondary">Немає даних</Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Статуси звернень
                      </Typography>
                      {detailedStats.byStatus && detailedStats.byStatus.length > 0 ? (
                        <Stack spacing={1}>
                          {detailedStats.byStatus.map((item) => (
                            <Box key={item.status} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2">
                                {getStatusLabel(item.status)}
                              </Typography>
                              <Chip
                                label={item.count}
                                size="small"
                                color={getStatusColor(item.status)}
                              />
                            </Box>
                          ))}
                        </Stack>
                      ) : (
                        <Typography color="textSecondary">Немає даних</Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Графік по періодах */}
              {detailedStats.dailyStats && detailedStats.dailyStats.length > 0 && (
                <Paper sx={{ p: 2, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Звернення по періодах
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={detailedStats.dailyStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="total" stroke="#8884d8" name="Всього" />
                    </LineChart>
                  </ResponsiveContainer>
                </Paper>
              )}

              {/* Найчастіші проблеми */}
              {detailedStats.commonIssues && detailedStats.commonIssues.length > 0 && (
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Найчастіші проблеми
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Тема</TableCell>
                          <TableCell align="right">Кількість</TableCell>
                          <TableCell>Типи</TableCell>
                          <TableCell>Статуси</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {detailedStats.commonIssues.map((issue, index) => (
                          <TableRow key={index} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {issue.subject}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Chip label={issue.count} size="small" color="primary" />
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                {issue.types.map((type, i) => (
                                  <Chip
                                    key={i}
                                    label={getTypeLabel(type)}
                                    size="small"
                                    variant="outlined"
                                  />
                                ))}
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                {issue.statuses.map((status, i) => (
                                  <Chip
                                    key={i}
                                    label={getStatusLabel(status)}
                                    size="small"
                                    color={getStatusColor(status)}
                                  />
                                ))}
                              </Stack>
                            </TableCell>
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
    </Box>
  );
};

export default FeedbackPage;

