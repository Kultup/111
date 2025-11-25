import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Card,
  CardContent,
  Grid,
  Checkbox,
  Toolbar,
  MenuItem,
  Autocomplete,
  Pagination,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import api from '../services/api';
import { useToast } from '../components/ToastProvider';

const PendingApprovalsPage = () => {
  const [activeTab, setActiveTab] = useState(0); // 0 - покупки, 1 - транзакції
  const [viewMode, setViewMode] = useState(0); // 0 - на підтвердження, 1 - історія
  const [purchases, setPurchases] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rejectDialog, setRejectDialog] = useState({ open: false, id: null, type: null, reason: '' });
  const [selectedPurchases, setSelectedPurchases] = useState([]);
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [bulkRejectDialog, setBulkRejectDialog] = useState({ open: false, type: null, reason: '' });
  
  // Фільтри для історії
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    userId: null,
    startDate: null,
    endDate: null,
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  const toast = useToast();

  useEffect(() => {
    if (viewMode === 0) {
      // Режим на підтвердження
      loadPendingData();
    } else {
      // Режим історії
      loadHistoryData();
    }
    // Очистити вибір при зміні табу
    setSelectedPurchases([]);
    setSelectedTransactions([]);
  }, [activeTab, viewMode, filters, page]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await api.get('/users?limit=1000');
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadPendingData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeTab === 0) {
        const response = await api.get('/shop/purchases/pending');
        setPurchases(response.data.data || []);
      } else {
        const response = await api.get('/coins/pending');
        setTransactions(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading pending approvals:', error);
      setError('Помилка завантаження операцій на підтвердження');
    } finally {
      setLoading(false);
    }
  };

  const loadHistoryData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        limit: 50,
        ...(filters.status && { status: filters.status }),
        ...(filters.type && { type: filters.type }),
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.startDate && { startDate: filters.startDate.toISOString().split('T')[0] }),
        ...(filters.endDate && { endDate: filters.endDate.toISOString().split('T')[0] }),
      };

      if (activeTab === 0) {
        const response = await api.get('/shop/purchases/all', { params });
        setPurchases(response.data.data || []);
        setTotalPages(response.data.pages || 1);
        setTotal(response.data.total || 0);
      } else {
        const response = await api.get('/coins/transactions/all', { params });
        setTransactions(response.data.data || []);
        setTotalPages(response.data.pages || 1);
        setTotal(response.data.total || 0);
      }
    } catch (error) {
      console.error('Error loading history:', error);
      setError('Помилка завантаження історії операцій');
    } finally {
      setLoading(false);
    }
  };

  const loadData = viewMode === 0 ? loadPendingData : loadHistoryData;

  const handleApprovePurchase = async (id) => {
    try {
      await api.post(`/shop/purchases/${id}/approve`);
      toast.success('Покупку успішно підтверджено');
      loadData();
    } catch (error) {
      console.error('Error approving purchase:', error);
      const errorMsg = error.response?.data?.message || 'Помилка підтвердження покупки';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleRejectPurchase = async (id, reason) => {
    try {
      await api.post(`/shop/purchases/${id}/reject`, { reason });
      toast.success('Покупку успішно відхилено');
      setRejectDialog({ open: false, id: null, type: null, reason: '' });
      loadData();
    } catch (error) {
      console.error('Error rejecting purchase:', error);
      const errorMsg = error.response?.data?.message || 'Помилка відхилення покупки';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleApproveTransaction = async (id) => {
    try {
      await api.post(`/coins/transactions/${id}/approve`);
      toast.success('Транзакцію успішно підтверджено');
      loadData();
    } catch (error) {
      console.error('Error approving transaction:', error);
      const errorMsg = error.response?.data?.message || 'Помилка підтвердження транзакції';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleRejectTransaction = async (id, reason) => {
    try {
      await api.post(`/coins/transactions/${id}/reject`, { reason });
      toast.success('Транзакцію успішно відхилено');
      setRejectDialog({ open: false, id: null, type: null, reason: '' });
      loadData();
    } catch (error) {
      console.error('Error rejecting transaction:', error);
      const errorMsg = error.response?.data?.message || 'Помилка відхилення транзакції';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  // Масові операції
  const handleSelectPurchase = (id) => {
    setSelectedPurchases(prev => 
      prev.includes(id) 
        ? prev.filter(p => p !== id)
        : [...prev, id]
    );
  };

  const handleSelectAllPurchases = () => {
    if (selectedPurchases.length === purchases.length) {
      setSelectedPurchases([]);
    } else {
      setSelectedPurchases(purchases.map(p => p._id));
    }
  };

  const handleSelectTransaction = (id) => {
    setSelectedTransactions(prev => 
      prev.includes(id) 
        ? prev.filter(t => t !== id)
        : [...prev, id]
    );
  };

  const handleSelectAllTransactions = () => {
    if (selectedTransactions.length === transactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(transactions.map(t => t._id));
    }
  };

  const handleBulkApprovePurchases = async () => {
    if (selectedPurchases.length === 0) {
      toast.warning('Виберіть хоча б одну покупку');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/shop/purchases/bulk-approve', {
        purchaseIds: selectedPurchases
      });
      toast.success(response.data.message);
      setSelectedPurchases([]);
      loadData();
    } catch (error) {
      console.error('Error bulk approving purchases:', error);
      const errorMsg = error.response?.data?.message || 'Помилка масового підтвердження покупок';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkRejectPurchases = async () => {
    if (selectedPurchases.length === 0) {
      toast.warning('Виберіть хоча б одну покупку');
      return;
    }

    setBulkRejectDialog({ open: true, type: 'purchase', reason: '' });
  };

  const handleBulkRejectPurchasesSubmit = async () => {
    try {
      setLoading(true);
      const response = await api.post('/shop/purchases/bulk-reject', {
        purchaseIds: selectedPurchases,
        reason: bulkRejectDialog.reason
      });
      toast.success(response.data.message);
      setSelectedPurchases([]);
      setBulkRejectDialog({ open: false, type: null, reason: '' });
      loadData();
    } catch (error) {
      console.error('Error bulk rejecting purchases:', error);
      const errorMsg = error.response?.data?.message || 'Помилка масового відхилення покупок';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkApproveTransactions = async () => {
    if (selectedTransactions.length === 0) {
      toast.warning('Виберіть хоча б одну транзакцію');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/coins/transactions/bulk-approve', {
        transactionIds: selectedTransactions
      });
      toast.success(response.data.message);
      setSelectedTransactions([]);
      loadData();
    } catch (error) {
      console.error('Error bulk approving transactions:', error);
      const errorMsg = error.response?.data?.message || 'Помилка масового підтвердження транзакцій';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkRejectTransactions = async () => {
    if (selectedTransactions.length === 0) {
      toast.warning('Виберіть хоча б одну транзакцію');
      return;
    }

    setBulkRejectDialog({ open: true, type: 'transaction', reason: '' });
  };

  const handleBulkRejectTransactionsSubmit = async () => {
    try {
      setLoading(true);
      const response = await api.post('/coins/transactions/bulk-reject', {
        transactionIds: selectedTransactions,
        reason: bulkRejectDialog.reason
      });
      toast.success(response.data.message);
      setSelectedTransactions([]);
      setBulkRejectDialog({ open: false, type: null, reason: '' });
      loadData();
    } catch (error) {
      console.error('Error bulk rejecting transactions:', error);
      const errorMsg = error.response?.data?.message || 'Помилка масового відхилення транзакцій';
      setError(errorMsg);
      toast.error(errorMsg);
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
    if (!user) return 'Невідомий';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.login || 'Невідомий';
  };

  const handleRejectSubmit = () => {
    if (rejectDialog.type === 'purchase') {
      handleRejectPurchase(rejectDialog.id, rejectDialog.reason);
    } else if (rejectDialog.type === 'transaction') {
      handleRejectTransaction(rejectDialog.id, rejectDialog.reason);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1); // Скинути на першу сторінку при зміні фільтрів
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      type: '',
      userId: null,
      startDate: null,
      endDate: null,
    });
    setPage(1);
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      pending: { label: 'Очікує', color: 'warning' },
      approved: { label: 'Підтверджено', color: 'success' },
      rejected: { label: 'Відхилено', color: 'error' },
      completed: { label: 'Завершено', color: 'success' },
    };
    const config = statusConfig[status] || { label: status, color: 'default' };
    return <Chip label={config.label} size="small" color={config.color} />;
  };

  const getTransactionTypeLabel = (type) => {
    const typeConfig = {
      manual_add: 'Нарахування',
      manual_subtract: 'Списання',
      earned: 'Зароблено',
      spent: 'Витрачено',
      refund: 'Повернення',
    };
    return typeConfig[type] || type;
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Операції на підтвердження
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
          <Tab label={viewMode === 0 ? `Покупки (${purchases.length})` : `Покупки (${total})`} />
          <Tab label={viewMode === 0 ? `Транзакції (${transactions.length})` : `Транзакції (${total})`} />
        </Tabs>
        <Tabs value={viewMode} onChange={(e, newValue) => setViewMode(newValue)} sx={{ borderTop: 1, borderColor: 'divider' }}>
          <Tab label="На підтвердження" />
          <Tab label="Історія" />
        </Tabs>
      </Paper>

      {/* Фільтри для історії */}
      {viewMode === 1 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <TextField
              select
              label="Статус"
              size="small"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">Всі статуси</MenuItem>
              <MenuItem value="pending">Очікує</MenuItem>
              <MenuItem value="approved">Підтверджено</MenuItem>
              <MenuItem value="rejected">Відхилено</MenuItem>
              <MenuItem value="completed">Завершено</MenuItem>
            </TextField>

            {activeTab === 1 && (
              <TextField
                select
                label="Тип транзакції"
                size="small"
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                sx={{ minWidth: 180 }}
              >
                <MenuItem value="">Всі типи</MenuItem>
                <MenuItem value="manual_add">Нарахування</MenuItem>
                <MenuItem value="manual_subtract">Списання</MenuItem>
                <MenuItem value="earned">Зароблено</MenuItem>
                <MenuItem value="spent">Витрачено</MenuItem>
                <MenuItem value="refund">Повернення</MenuItem>
              </TextField>
            )}

            <Autocomplete
              options={users}
              getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.login})`}
              isOptionEqualToValue={(option, value) => option._id === value?._id}
              value={filters.userId ? users.find(u => u._id === filters.userId) || null : null}
              onChange={(event, newValue) => handleFilterChange('userId', newValue?._id || null)}
              renderInput={(params) => <TextField {...params} label="Користувач" size="small" sx={{ minWidth: 250 }} />}
            />

            <TextField
              label="Дата від"
              type="date"
              size="small"
              value={filters.startDate ? filters.startDate.toISOString().split('T')[0] : ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value ? new Date(e.target.value) : null)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 150 }}
            />
            <TextField
              label="Дата до"
              type="date"
              size="small"
              value={filters.endDate ? filters.endDate.toISOString().split('T')[0] : ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value ? new Date(e.target.value) : null)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 150 }}
            />

            <Button
              variant="outlined"
              onClick={clearFilters}
              disabled={!filters.status && !filters.type && !filters.userId && !filters.startDate && !filters.endDate}
            >
              Очистити
            </Button>
          </Stack>
        </Paper>
      )}

      {/* Панель масових операцій */}
      {(activeTab === 0 && selectedPurchases.length > 0) || (activeTab === 1 && selectedTransactions.length > 0) ? (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
          <Toolbar disableGutters>
            <Typography variant="body1" sx={{ flexGrow: 1 }}>
              Вибрано: {activeTab === 0 ? selectedPurchases.length : selectedTransactions.length}
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckIcon />}
                onClick={activeTab === 0 ? handleBulkApprovePurchases : handleBulkApproveTransactions}
                disabled={loading}
              >
                Підтвердити всі
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<CloseIcon />}
                onClick={activeTab === 0 ? handleBulkRejectPurchases : handleBulkRejectTransactions}
                disabled={loading}
              >
                Відхилити всі
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setSelectedPurchases([]);
                  setSelectedTransactions([]);
                }}
              >
                Скасувати вибір
              </Button>
            </Stack>
          </Toolbar>
        </Paper>
      ) : null}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Покупки */}
          {activeTab === 0 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    {viewMode === 0 && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          indeterminate={selectedPurchases.length > 0 && selectedPurchases.length < purchases.length}
                          checked={purchases.length > 0 && selectedPurchases.length === purchases.length}
                          onChange={handleSelectAllPurchases}
                        />
                      </TableCell>
                    )}
                    <TableCell>Користувач</TableCell>
                    <TableCell>Товар</TableCell>
                    <TableCell>Тип</TableCell>
                    <TableCell>Ціна</TableCell>
                    {viewMode === 1 && <TableCell>Статус</TableCell>}
                    <TableCell>Дата</TableCell>
                    <TableCell align="right">Дії</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {purchases.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={viewMode === 0 ? 7 : 7} align="center">
                        <Typography color="textSecondary" sx={{ py: 3 }}>
                          {viewMode === 0 ? 'Немає покупок на підтвердження' : 'Покупки не знайдено'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    purchases.map((purchase) => (
                      <TableRow key={purchase._id} hover selected={viewMode === 0 && selectedPurchases.includes(purchase._id)}>
                        {viewMode === 0 && (
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedPurchases.includes(purchase._id)}
                              onChange={() => handleSelectPurchase(purchase._id)}
                            />
                          </TableCell>
                        )}
                        <TableCell>
                          <Typography variant="body1" fontWeight="medium">
                            {getUserFullName(purchase.user)}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {purchase.user?.login}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body1" fontWeight="medium">
                            {purchase.item?.name || '-'}
                          </Typography>
                          {purchase.item?.description && (
                            <Typography variant="caption" color="textSecondary">
                              {purchase.item.description}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {purchase.item?.type || '-'}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body1" fontWeight="medium">
                            {purchase.price || purchase.item?.price || 0} 🪙
                          </Typography>
                        </TableCell>
                        {viewMode === 1 && (
                          <TableCell>
                            {getStatusChip(purchase.status)}
                          </TableCell>
                        )}
                        <TableCell>
                          {formatDate(purchase.createdAt)}
                          {viewMode === 1 && purchase.approvedAt && (
                            <Typography variant="caption" color="textSecondary" display="block">
                              Підтверджено: {formatDate(purchase.approvedAt)}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {viewMode === 0 ? (
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                startIcon={<CheckIcon />}
                                onClick={() => handleApprovePurchase(purchase._id)}
                              >
                                Підтвердити
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<CloseIcon />}
                                onClick={() => setRejectDialog({ open: true, id: purchase._id, type: 'purchase', reason: '' })}
                              >
                                Відхилити
                              </Button>
                            </Stack>
                          ) : (
                            <Typography variant="caption" color="textSecondary">
                              {purchase.approvedBy ? `Підтвердив: ${purchase.approvedBy?.firstName || ''} ${purchase.approvedBy?.lastName || ''}` : '-'}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Транзакції монет */}
          {activeTab === 1 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    {viewMode === 0 && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          indeterminate={selectedTransactions.length > 0 && selectedTransactions.length < transactions.length}
                          checked={transactions.length > 0 && selectedTransactions.length === transactions.length}
                          onChange={handleSelectAllTransactions}
                        />
                      </TableCell>
                    )}
                    <TableCell>Користувач</TableCell>
                    <TableCell>Тип</TableCell>
                    <TableCell>Сума</TableCell>
                    <TableCell>Причина</TableCell>
                    {viewMode === 1 && <TableCell>Статус</TableCell>}
                    <TableCell>Дата</TableCell>
                    <TableCell align="right">Дії</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={viewMode === 0 ? 7 : 7} align="center">
                        <Typography color="textSecondary" sx={{ py: 3 }}>
                          {viewMode === 0 ? 'Немає транзакцій на підтвердження' : 'Транзакції не знайдено'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((transaction) => (
                      <TableRow key={transaction._id} hover selected={viewMode === 0 && selectedTransactions.includes(transaction._id)}>
                        {viewMode === 0 && (
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedTransactions.includes(transaction._id)}
                              onChange={() => handleSelectTransaction(transaction._id)}
                            />
                          </TableCell>
                        )}
                        <TableCell>
                          <Typography variant="body1" fontWeight="medium">
                            {getUserFullName(transaction.user)}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {transaction.user?.login}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getTransactionTypeLabel(transaction.type)}
                            size="small"
                            color={transaction.type === 'manual_add' || transaction.type === 'earned' || transaction.type === 'refund' ? 'success' : 'error'}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body1"
                            fontWeight="medium"
                            color={transaction.amount > 0 ? 'success.main' : 'error.main'}
                          >
                            {transaction.amount > 0 ? '+' : ''}{transaction.amount} 🪙
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {transaction.reason || transaction.description || '-'}
                          </Typography>
                        </TableCell>
                        {viewMode === 1 && (
                          <TableCell>
                            {getStatusChip(transaction.status)}
                          </TableCell>
                        )}
                        <TableCell>
                          {formatDate(transaction.createdAt)}
                          {viewMode === 1 && transaction.approvedAt && (
                            <Typography variant="caption" color="textSecondary" display="block">
                              Підтверджено: {formatDate(transaction.approvedAt)}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {viewMode === 0 ? (
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                startIcon={<CheckIcon />}
                                onClick={() => handleApproveTransaction(transaction._id)}
                              >
                                Підтвердити
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<CloseIcon />}
                                onClick={() => setRejectDialog({ open: true, id: transaction._id, type: 'transaction', reason: '' })}
                              >
                                Відхилити
                              </Button>
                            </Stack>
                          ) : (
                            <Typography variant="caption" color="textSecondary">
                              {transaction.approvedBy ? `Підтвердив: ${transaction.approvedBy?.firstName || ''} ${transaction.approvedBy?.lastName || ''}` : '-'}
                            </Typography>
                          )}
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

      {/* Пагінація для історії */}
      {viewMode === 1 && totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(e, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}

      {/* Діалог відхилення */}
      <Dialog
        open={rejectDialog.open}
        onClose={() => setRejectDialog({ open: false, id: null, type: null, reason: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Відхилити операцію</DialogTitle>
        <DialogContent>
          <TextField
            label="Причина відхилення"
            fullWidth
            multiline
            rows={3}
            value={rejectDialog.reason}
            onChange={(e) => setRejectDialog({ ...rejectDialog, reason: e.target.value })}
            sx={{ mt: 2 }}
            helperText="Вкажіть причину відхилення операції"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog({ open: false, id: null, type: null, reason: '' })}>
            Скасувати
          </Button>
          <Button
            onClick={handleRejectSubmit}
            color="error"
            variant="contained"
          >
            Відхилити
          </Button>
        </DialogActions>
      </Dialog>

      {/* Діалог масового відхилення */}
      <Dialog
        open={bulkRejectDialog.open}
        onClose={() => setBulkRejectDialog({ open: false, type: null, reason: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Відхилити {activeTab === 0 ? `${selectedPurchases.length} покупок` : `${selectedTransactions.length} транзакцій`}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Причина відхилення"
            fullWidth
            multiline
            rows={3}
            value={bulkRejectDialog.reason}
            onChange={(e) => setBulkRejectDialog({ ...bulkRejectDialog, reason: e.target.value })}
            sx={{ mt: 2 }}
            helperText="Вкажіть причину відхилення (буде застосовано до всіх вибраних операцій)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkRejectDialog({ open: false, type: null, reason: '' })}>
            Скасувати
          </Button>
          <Button
            onClick={bulkRejectDialog.type === 'purchase' ? handleBulkRejectPurchasesSubmit : handleBulkRejectTransactionsSubmit}
            color="error"
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Відхилити всі'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PendingApprovalsPage;
