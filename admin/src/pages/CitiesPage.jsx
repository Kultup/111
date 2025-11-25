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

const CitiesPage = () => {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCity, setEditingCity] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);
  const [selectedCities, setSelectedCities] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    isActive: true,
  });

  useEffect(() => {
    loadCities();
  }, [search]);

  const loadCities = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = search ? { search } : {};
      const response = await api.get('/cities', { params });
      setCities(response.data.data || []);
    } catch (error) {
      console.error('Error loading cities:', error);
      setError('Помилка завантаження міст');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({ name: '', isActive: true });
    setEditingCity(null);
    setOpenDialog(true);
  };

  const handleEdit = (city) => {
    setFormData({
      name: city.name || '',
      isActive: city.isActive !== undefined ? city.isActive : true,
    });
    setEditingCity(city);
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/cities/${id}`);
      loadCities();
      setDeleteDialog({ open: false, id: null });
      setSelectedCities([]);
    } catch (error) {
      console.error('Error deleting city:', error);
      setError(
        error.response?.data?.message || 'Помилка видалення міста'
      );
    }
  };

  const handleBulkUpdate = async (isActive) => {
    try {
      setLoading(true);
      await api.post('/cities/bulk-update', {
        cityIds: selectedCities,
        isActive
      });
      setError(null);
      setSelectedCities([]);
      loadCities();
    } catch (error) {
      console.error('Error bulk updating cities:', error);
      setError(
        error.response?.data?.message || 'Помилка масового оновлення міст'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCity = (cityId) => {
    setSelectedCities(prev =>
      prev.includes(cityId)
        ? prev.filter(id => id !== cityId)
        : [...prev, cityId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCities.length === cities.length) {
      setSelectedCities([]);
    } else {
      setSelectedCities(cities.map(city => city._id));
    }
  };

  const exportToExcel = async () => {
    try {
      // Завантажити всі міста
      const response = await api.get('/cities');
      const allCities = response.data.data || [];

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Міста');

      worksheet.columns = [
        { header: 'Назва', key: 'name', width: 30 },
        { header: 'Статус', key: 'status', width: 15 },
        { header: 'Дата створення', key: 'createdAt', width: 20 },
      ];

      allCities.forEach((city) => {
        worksheet.addRow({
          name: city.name,
          status: city.isActive ? 'Активне' : 'Неактивне',
          createdAt: city.createdAt ? new Date(city.createdAt).toLocaleDateString('uk-UA') : '-',
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
      const fileName = `Міста_${new Date().toISOString().split('T')[0]}.xlsx`;
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
      setError('Назва міста обов\'язкова');
      return;
    }

    try {
      if (editingCity) {
        await api.put(`/cities/${editingCity._id}`, formData);
      } else {
        await api.post('/cities', formData);
      }
      setOpenDialog(false);
      setEditingCity(null);
      loadCities();
    } catch (error) {
      console.error('Error saving city:', error);
      setError(
        error.response?.data?.message || 'Помилка збереження міста'
      );
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setEditingCity(null);
    setFormData({ name: '', isActive: true });
    setError(null);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Міста
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
            Додати місто
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
      {selectedCities.length > 0 && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
          <Toolbar disableGutters>
            <Typography variant="body1" sx={{ flexGrow: 1 }}>
              Вибрано: {selectedCities.length} міст
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
                onClick={() => setSelectedCities([])}
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
                    indeterminate={selectedCities.length > 0 && selectedCities.length < cities.length}
                    checked={cities.length > 0 && selectedCities.length === cities.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>Назва</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell align="right">Дії</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography color="textSecondary" sx={{ py: 3 }}>
                      Міста не знайдено
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                cities.map((city) => (
                  <TableRow key={city._id} hover selected={selectedCities.includes(city._id)}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedCities.includes(city._id)}
                        onChange={() => handleSelectCity(city._id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {city.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={city.isActive ? 'Активне' : 'Неактивне'}
                        size="small"
                        color={city.isActive ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(city)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => setDeleteDialog({ open: true, id: city._id })}
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
            {editingCity ? 'Редагувати місто' : 'Створити місто'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              {error && (
                <Alert severity="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              <TextField
                label="Назва міста"
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
                label="Активне місто"
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose}>Скасувати</Button>
            <Button type="submit" variant="contained">
              {editingCity ? 'Оновити' : 'Створити'}
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
            Ви впевнені, що хочете видалити це місто?
            {cities.find(c => c._id === deleteDialog.id) && (
              <Box component="span" fontWeight="bold" sx={{ ml: 1 }}>
                "{cities.find(c => c._id === deleteDialog.id).name}"
              </Box>
            )}
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Увага: якщо в місті є користувачі, видалення може бути неможливим.
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

export default CitiesPage;
