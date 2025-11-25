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
  Chip,
  Stack,
  CircularProgress,
  Alert,
  Switch,
  FormControlLabel,
  Checkbox,
  Toolbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import api from '../services/api';

const PositionsPage = () => {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPosition, setEditingPosition] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);
  const [selectedPositions, setSelectedPositions] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    isActive: true,
  });

  useEffect(() => {
    loadPositions();
  }, [search]);

  const loadPositions = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = search ? { search } : {};
      const response = await api.get('/positions', { params });
      setPositions(response.data.data || []);
    } catch (error) {
      console.error('Error loading positions:', error);
      setError('Помилка завантаження посад');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({ name: '', isActive: true });
    setEditingPosition(null);
    setOpenDialog(true);
  };

  const handleEdit = (position) => {
    setFormData({
      name: position.name || '',
      isActive: position.isActive !== undefined ? position.isActive : true,
    });
    setEditingPosition(position);
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/positions/${id}`);
      loadPositions();
      setDeleteDialog({ open: false, id: null });
      setSelectedPositions([]);
    } catch (error) {
      console.error('Error deleting position:', error);
      setError(
        error.response?.data?.message || 'Помилка видалення посади'
      );
    }
  };

  const handleBulkUpdate = async (isActive) => {
    try {
      setLoading(true);
      await api.post('/positions/bulk-update', {
        positionIds: selectedPositions,
        isActive
      });
      setError(null);
      setSelectedPositions([]);
      loadPositions();
    } catch (error) {
      console.error('Error bulk updating positions:', error);
      setError(
        error.response?.data?.message || 'Помилка масового оновлення посад'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPosition = (positionId) => {
    setSelectedPositions(prev =>
      prev.includes(positionId)
        ? prev.filter(id => id !== positionId)
        : [...prev, positionId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPositions.length === positions.length) {
      setSelectedPositions([]);
    } else {
      setSelectedPositions(positions.map(position => position._id));
    }
  };

  const exportToExcel = async () => {
    try {
      // Завантажити всі посади
      const response = await api.get('/positions');
      const allPositions = response.data.data || [];

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Посади');

      worksheet.columns = [
        { header: 'Назва', key: 'name', width: 30 },
        { header: 'Статус', key: 'status', width: 15 },
        { header: 'Дата створення', key: 'createdAt', width: 20 },
      ];

      allPositions.forEach((position) => {
        worksheet.addRow({
          name: position.name,
          status: position.isActive ? 'Активна' : 'Неактивна',
          createdAt: position.createdAt ? new Date(position.createdAt).toLocaleDateString('uk-UA') : '-',
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
      const fileName = `Посади_${new Date().toISOString().split('T')[0]}.xlsx`;
      saveAs(blob, fileName);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      setError('Помилка при експорті в Excel');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Назва посади обов\'язкова');
      return;
    }

    try {
      if (editingPosition) {
        await api.put(`/positions/${editingPosition._id}`, formData);
      } else {
        await api.post('/positions', formData);
      }
      setOpenDialog(false);
      setEditingPosition(null);
      loadPositions();
    } catch (error) {
      console.error('Error saving position:', error);
      setError(
        error.response?.data?.message || 'Помилка збереження посади'
      );
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setEditingPosition(null);
    setFormData({ name: '', isActive: true });
    setError(null);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Посади
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportToExcel}
            disabled={loading}
          >
            Експорт в Excel
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
          >
            Додати посаду
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 2 }}>
        <TextField
          label="Пошук"
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 300 }}
        />
      </Box>

      {/* Панель масових операцій */}
      {selectedPositions.length > 0 && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
          <Toolbar disableGutters>
            <Typography variant="body1" sx={{ flexGrow: 1 }}>
              Вибрано: {selectedPositions.length} посад
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={() => handleBulkUpdate(true)}
                disabled={loading}
              >
                Активувати
              </Button>
              <Button
                variant="contained"
                color="warning"
                startIcon={<BlockIcon />}
                onClick={() => handleBulkUpdate(false)}
                disabled={loading}
              >
                Деактивувати
              </Button>
              <Button
                variant="outlined"
                onClick={() => setSelectedPositions([])}
              >
                Скасувати вибір
              </Button>
            </Stack>
          </Toolbar>
        </Paper>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedPositions.length > 0 && selectedPositions.length < positions.length}
                    checked={positions.length > 0 && selectedPositions.length === positions.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>Назва</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell align="right">Дії</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {positions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography color="textSecondary" sx={{ py: 3 }}>
                      Посади не знайдено
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                positions.map((position) => (
                  <TableRow key={position._id} hover selected={selectedPositions.includes(position._id)}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedPositions.includes(position._id)}
                        onChange={() => handleSelectPosition(position._id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {position.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={position.isActive ? 'Активна' : 'Неактивна'}
                        size="small"
                        color={position.isActive ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(position)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => setDeleteDialog({ open: true, id: position._id })}
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
      )}

      <Dialog
        open={openDialog}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingPosition ? 'Редагувати посаду' : 'Створити посаду'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              {error && (
                <Alert severity="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              <TextField
                label="Назва посади"
                fullWidth
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Активна посада"
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose}>Скасувати</Button>
            <Button type="submit" variant="contained">
              {editingPosition ? 'Оновити' : 'Створити'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null })}
      >
        <DialogTitle>Підтвердження видалення</DialogTitle>
        <DialogContent>
          <Typography>
            Ви впевнені, що хочете видалити цю посаду?
            {positions.find(p => p._id === deleteDialog.id) && (
              <Box component="span" fontWeight="bold" sx={{ ml: 1 }}>
                "{positions.find(p => p._id === deleteDialog.id).name}"
              </Box>
            )}
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Увага: якщо на посаді є користувачі або питання, видалення може бути неможливим.
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
    </Box>
  );
};

export default PositionsPage;
