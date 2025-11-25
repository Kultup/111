import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  MenuItem,
  Stack,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';
import api from '../services/api';

const ManualCoinsPage = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userBalance, setUserBalance] = useState(null);
  const [operationType, setOperationType] = useState('add'); // 'add' or 'subtract'
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, data: null });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadUserBalance();
    } else {
      setUserBalance(null);
    }
  }, [selectedUser]);

  const loadUsers = async () => {
    try {
      const response = await api.get('/users?limit=1000');
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadUserBalance = async () => {
    if (!selectedUser) return;
    try {
      setLoadingUser(true);
      const response = await api.get(`/users/${selectedUser._id || selectedUser}`);
      setUserBalance(response.data.data?.coins || 0);
    } catch (error) {
      console.error('Error loading user balance:', error);
      setUserBalance(null);
    } finally {
      setLoadingUser(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedUser) {
      setError('Виберіть користувача');
      return;
    }

    const amountNum = parseFloat(amount);
    if (!amount || amountNum <= 0) {
      setError('Вкажіть суму більше 0');
      return;
    }

    if (operationType === 'subtract' && userBalance !== null && amountNum > userBalance) {
      setError(`Недостатньо монет у користувача. Поточний баланс: ${userBalance} 🪙`);
      return;
    }

    if (!reason.trim()) {
      setError('Вкажіть причину операції');
      return;
    }

    setConfirmDialog({
      open: true,
      data: {
        userId: selectedUser._id || selectedUser,
        userName: getUserFullName(selectedUser),
        type: operationType,
        amount: amountNum,
        reason: reason.trim(),
      },
    });
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const endpoint = operationType === 'add' ? '/coins/manual-add' : '/coins/manual-subtract';
      await api.post(endpoint, {
        userId: confirmDialog.data.userId,
        amount: confirmDialog.data.amount,
        reason: confirmDialog.data.reason,
      });

      setSuccess(
        operationType === 'add'
          ? `Монети нараховано. Транзакція створена та очікує підтвердження.`
          : `Монети списано. Транзакція створена та очікує підтвердження.`
      );

      setConfirmDialog({ open: false, data: null });
      setSelectedUser(null);
      setAmount('');
      setReason('');
      setUserBalance(null);
    } catch (error) {
      console.error('Error performing coin operation:', error);
      setError(error.response?.data?.message || 'Помилка виконання операції');
    } finally {
      setLoading(false);
    }
  };

  const getUserFullName = (user) => {
    if (!user) return '';
    if (typeof user === 'string') return user;
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.login || 'Невідомий';
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Ручне нарахування/списання монет
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <Autocomplete
                  options={users}
                  getOptionLabel={(option) => getUserFullName(option)}
                  value={selectedUser}
                  onChange={(e, newValue) => setSelectedUser(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Виберіть користувача"
                      required
                      helperText="Почніть вводити ім'я або логін користувача"
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <Box>
                        <Typography variant="body1">
                          {getUserFullName(option)}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {option.login} • {option.city?.name || '-'} • {option.position?.name || '-'}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                />

                {selectedUser && userBalance !== null && (
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Поточний баланс користувача
                      </Typography>
                      <Typography variant="h4" color="primary">
                        {userBalance} 🪙
                      </Typography>
                    </CardContent>
                  </Card>
                )}

                <TextField
                  select
                  label="Тип операції"
                  fullWidth
                  required
                  value={operationType}
                  onChange={(e) => setOperationType(e.target.value)}
                >
                  <MenuItem value="add">Нарахування монет</MenuItem>
                  <MenuItem value="subtract">Списання монет</MenuItem>
                </TextField>

                <TextField
                  label="Сума монет"
                  type="number"
                  fullWidth
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputProps={{ min: 0.01, step: 0.01 }}
                  helperText={
                    operationType === 'subtract' && userBalance !== null
                      ? `Максимально можна списати: ${userBalance} 🪙`
                      : 'Вкажіть суму монет'
                  }
                />

                <TextField
                  label="Причина операції"
                  fullWidth
                  required
                  multiline
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  helperText="Обов'язково вкажіть причину нарахування/списання монет"
                />

                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setSelectedUser(null);
                      setAmount('');
                      setReason('');
                      setUserBalance(null);
                      setError(null);
                      setSuccess(null);
                    }}
                  >
                    Очистити
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={operationType === 'add' ? <AddIcon /> : <RemoveIcon />}
                    disabled={loading || loadingUser}
                  >
                    {operationType === 'add' ? 'Нарахувати' : 'Списати'}
                  </Button>
                </Stack>
              </Stack>
            </form>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Інформація
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Нарахування монет
                </Typography>
                <Typography variant="body2">
                  Монети будуть додані до балансу користувача. Транзакція потребує підтвердження іншого адміна.
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Списання монет
                </Typography>
                <Typography variant="body2">
                  Монети будуть відняті від балансу користувача. Переконайтеся, що у користувача достатньо монет. Транзакція потребує підтвердження іншого адміна.
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Підтвердження
                </Typography>
                <Typography variant="body2">
                  Всі ручні операції з монетами потребують підтвердження. Переглянути та підтвердити операції можна в розділі "Підтвердження".
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Діалог підтвердження */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, data: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Підтвердження операції</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box>
              <Typography variant="body2" color="textSecondary">
                Користувач
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {confirmDialog.data?.userName}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="textSecondary">
                Тип операції
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {confirmDialog.data?.type === 'add' ? 'Нарахування' : 'Списання'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="textSecondary">
                Сума
              </Typography>
              <Typography
                variant="h6"
                color={confirmDialog.data?.type === 'add' ? 'success.main' : 'error.main'}
              >
                {confirmDialog.data?.type === 'add' ? '+' : '-'}
                {confirmDialog.data?.amount} 🪙
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="textSecondary">
                Причина
              </Typography>
              <Typography variant="body1">
                {confirmDialog.data?.reason}
              </Typography>
            </Box>
            {confirmDialog.data?.type === 'subtract' && userBalance !== null && (
              <Alert severity="info">
                Баланс після операції: {userBalance - confirmDialog.data.amount} 🪙
              </Alert>
            )}
            {confirmDialog.data?.type === 'add' && userBalance !== null && (
              <Alert severity="info">
                Баланс після операції: {userBalance + confirmDialog.data.amount} 🪙
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, data: null })}>
            Скасувати
          </Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            color={confirmDialog.data?.type === 'add' ? 'success' : 'error'}
            disabled={loading}
          >
            {loading ? 'Виконання...' : 'Підтвердити'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManualCoinsPage;

