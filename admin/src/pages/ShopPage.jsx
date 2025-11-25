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
  Switch,
  FormControlLabel,
  Grid,
  Tabs,
  Tab,
  Card,
  CardContent,
  Checkbox,
  Toolbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import api from '../services/api';

const ITEM_TYPES = [
  { value: 'physical', label: 'Фізичний товар' },
  { value: 'digital', label: 'Цифровий товар' },
  { value: 'service', label: 'Послуга' },
  { value: 'badge', label: 'Значок' },
  { value: 'other', label: 'Інше' },
];

const ShopPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [error, setError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [image, setImage] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    type: 'other',
    image: '',
    stock: -1,
    requiresApproval: true,
    isActive: true,
  });

  useEffect(() => {
    loadItems();
    if (activeTab === 1) {
      loadStats();
    }
  }, [activeTab]);

  const loadItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/shop/items');
      setItems(response.data.data || []);
    } catch (error) {
      console.error('Error loading shop items:', error);
      setError('Помилка завантаження товарів');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const response = await api.get('/shop/stats');
      setStats(response.data.data || null);
    } catch (error) {
      console.error('Error loading shop stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      type: 'other',
      image: '',
      stock: -1,
      requiresApproval: true,
      isActive: true,
    });
    setImagePreview(null);
    setImage(null);
    setEditingItem(null);
    setOpenDialog(true);
  };

  const handleEdit = (item) => {
    setFormData({
      name: item.name || '',
      description: item.description || '',
      price: item.price || 0,
      type: item.type || 'other',
      image: item.image || '',
      stock: item.stock !== undefined ? item.stock : -1,
      requiresApproval: item.requiresApproval !== undefined ? item.requiresApproval : true,
      isActive: item.isActive !== undefined ? item.isActive : true,
    });
    if (item.image) {
      // Якщо це URL (починається з http), використовуємо як є
      // Якщо це шлях на сервері, додаємо базовий URL
      const imageUrl = item.image.startsWith('http') 
        ? item.image 
        : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${item.image}`;
      setImagePreview(imageUrl);
    } else {
      setImagePreview(null);
    }
    setImage(null); // Очищаємо файл при редагуванні
    setEditingItem(item);
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/shop/items/${id}`);
      loadItems();
      setDeleteDialog({ open: false, id: null });
      setSelectedItems([]);
    } catch (error) {
      console.error('Error deleting item:', error);
      setError(
        error.response?.data?.message || 'Помилка видалення товару'
      );
    }
  };

  const handleBulkUpdate = async (isActive) => {
    try {
      setLoading(true);
      await api.post('/shop/items/bulk-update', {
        itemIds: selectedItems,
        isActive
      });
      setError(null);
      setSelectedItems([]);
      loadItems();
    } catch (error) {
      console.error('Error bulk updating items:', error);
      setError(
        error.response?.data?.message || 'Помилка масового оновлення товарів'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectItem = (itemId) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(item => item._id));
    }
  };

  const handleImageUrlChange = (e) => {
    const url = e.target.value;
    setFormData(prev => ({ ...prev, image: url }));
    if (url) {
      setImagePreview(url);
    } else {
      setImagePreview(null);
    }
    // Якщо встановлюємо URL, очищаємо файл
    setImage(null);
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Валідація типу файлу
    if (!file.type.startsWith('image/')) {
      setError('Файл має бути зображенням');
      return;
    }

    // Валідація розміру (макс 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Розмір зображення не повинен перевищувати 5MB');
      return;
    }

    setError(null);
    setImage(file);
    
    // Очищаємо URL, якщо був встановлений
    setFormData(prev => ({ ...prev, image: '' }));
    
    // Створюємо preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, image: '' }));
    setImagePreview(null);
    setImage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Назва товару обов\'язкова');
      return;
    }

    if (formData.price < 0) {
      setError('Ціна не може бути від\'ємною');
      return;
    }

    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('description', formData.description || '');
      submitData.append('price', formData.price);
      submitData.append('type', formData.type);
      submitData.append('stock', formData.stock === -1 ? -1 : formData.stock);
      submitData.append('requiresApproval', formData.requiresApproval);
      submitData.append('isActive', formData.isActive);
      
      // Якщо є файл, додаємо його; інакше додаємо URL
      if (image) {
        submitData.append('image', image);
      } else if (formData.image) {
        submitData.append('image', formData.image);
      }

      if (editingItem) {
        await api.put(`/shop/items/${editingItem._id}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/shop/items', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      setOpenDialog(false);
      setEditingItem(null);
      setImage(null);
      loadItems();
    } catch (error) {
      console.error('Error saving item:', error);
      setError(
        error.response?.data?.message || 'Помилка збереження товару'
      );
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      type: 'other',
      image: '',
      stock: -1,
      requiresApproval: true,
      isActive: true,
    });
    setImagePreview(null);
    setError(null);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Магазин
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          Додати товар
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Товари" />
          <Tab label="Статистика покупок" />
        </Tabs>
      </Paper>

      {/* Панель масових операцій */}
      {activeTab === 0 && selectedItems.length > 0 && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
          <Toolbar disableGutters>
            <Typography variant="body1" sx={{ flexGrow: 1 }}>
              Вибрано: {selectedItems.length} товарів
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
                onClick={() => setSelectedItems([])}
              >
                Скасувати вибір
              </Button>
            </Stack>
          </Toolbar>
        </Paper>
      )}

      {activeTab === 0 && loading ? (
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
                    indeterminate={selectedItems.length > 0 && selectedItems.length < items.length}
                    checked={items.length > 0 && selectedItems.length === items.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>Зображення</TableCell>
                <TableCell>Назва</TableCell>
                <TableCell>Тип</TableCell>
                <TableCell>Ціна</TableCell>
                <TableCell>Наявність</TableCell>
                <TableCell>Підтвердження</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell align="right">Дії</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography color="textSecondary" sx={{ py: 3 }}>
                      Товари не знайдено
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item._id} hover selected={selectedItems.includes(item._id)}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedItems.includes(item._id)}
                        onChange={() => handleSelectItem(item._id)}
                      />
                    </TableCell>
                    <TableCell>
                      {item.image ? (
                        <Box
                          component="img"
                          src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${item.image}`}
                          alt={item.name}
                          sx={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 1 }}
                        />
                      ) : (
                        <ImageIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {item.name}
                      </Typography>
                      {item.description && (
                        <Typography variant="caption" color="textSecondary">
                          {item.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {ITEM_TYPES.find(t => t.value === item.type)?.label || item.type}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {item.price} 🪙
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {item.stock === -1 ? (
                        <Typography variant="body2" color="textSecondary">
                          Необмежено
                        </Typography>
                      ) : (
                        <Typography variant="body2">
                          {item.stock} шт.
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.requiresApproval ? 'Потрібно' : 'Не потрібно'}
                        size="small"
                        color={item.requiresApproval ? 'warning' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.isActive ? 'Активний' : 'Неактивний'}
                        size="small"
                        color={item.isActive ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(item)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => setDeleteDialog({ open: true, id: item._id })}
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

      {activeTab === 1 && (
        <>
          {statsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : stats ? (
            <>
              {/* Загальна статистика */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="textSecondary" gutterBottom>
                        Всього покупок
                      </Typography>
                      <Typography variant="h4">
                        {stats.summary?.totalPurchases || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="textSecondary" gutterBottom>
                        Підтверджено
                      </Typography>
                      <Typography variant="h4" color="success.main">
                        {stats.summary?.approvedPurchases || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="textSecondary" gutterBottom>
                        Очікує підтвердження
                      </Typography>
                      <Typography variant="h4" color="warning.main">
                        {stats.summary?.pendingPurchases || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="textSecondary" gutterBottom>
                        Загальний дохід
                      </Typography>
                      <Typography variant="h4" color="primary.main">
                        {stats.summary?.totalRevenueCoins?.toLocaleString() || 0} 🪙
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Топ товарів */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Найпопулярніші товари
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Товар</TableCell>
                        <TableCell>Тип</TableCell>
                        <TableCell align="right">Кількість покупок</TableCell>
                        <TableCell align="right">Підтверджено</TableCell>
                        <TableCell align="right">Завершено</TableCell>
                        <TableCell align="right">Загальний дохід</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.topItems && stats.topItems.length > 0 ? (
                        stats.topItems.map((stat) => (
                          <TableRow key={stat.item?._id} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                {stat.item?.image ? (
                                  <Box
                                    component="img"
                                    src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${stat.item.image}`}
                                    alt={stat.item.name}
                                    sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 1 }}
                                  />
                                ) : (
                                  <ImageIcon sx={{ fontSize: 30, color: 'text.secondary' }} />
                                )}
                                <Box>
                                  <Typography variant="body1" fontWeight="medium">
                                    {stat.item?.name || 'Невідомий товар'}
                                  </Typography>
                                  {stat.item?.description && (
                                    <Typography variant="caption" color="textSecondary">
                                      {stat.item.description}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              {stat.item ? (
                                ITEM_TYPES.find(t => t.value === stat.item.type)?.label || stat.item.type
                              ) : '-'}
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body1" fontWeight="medium">
                                {stat.purchaseCount}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                label={stat.approvedCount}
                                size="small"
                                color="success"
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                label={stat.completedCount}
                                size="small"
                                color="primary"
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body1" fontWeight="medium" color="primary.main">
                                {stat.totalRevenue?.toLocaleString() || 0} 🪙
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            <Typography color="textSecondary" sx={{ py: 3 }}>
                              Немає даних про покупки
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </>
          ) : (
            <Paper sx={{ p: 3 }}>
              <Typography color="textSecondary" align="center">
                Статистика недоступна
              </Typography>
            </Paper>
          )}
        </>
      )}

      {/* Діалог створення/редагування */}
      <Dialog
        open={openDialog}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingItem ? 'Редагувати товар' : 'Створити товар'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              {error && (
                <Alert severity="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              <TextField
                label="Назва товару"
                fullWidth
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />

              <TextField
                label="Опис"
                fullWidth
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Ціна (монети)"
                  type="number"
                  fullWidth
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  inputProps={{ min: 0 }}
                />

                <TextField
                  select
                  label="Тип товару"
                  fullWidth
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  {ITEM_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Наявність"
                  type="number"
                  fullWidth
                  value={formData.stock === -1 ? '' : formData.stock}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, stock: value === '' ? -1 : parseInt(value) || 0 });
                  }}
                  helperText="Залиште порожнім для необмеженої кількості"
                  inputProps={{ min: -1 }}
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Зображення товару
                </Typography>
                
                {/* Завантаження файлу */}
                <Box sx={{ mb: 2 }}>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="image-file-input"
                    type="file"
                    onChange={handleImageFileChange}
                  />
                  <label htmlFor="image-file-input">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<CloudUploadIcon />}
                      fullWidth
                      sx={{ mb: 2 }}
                    >
                      Завантажити зображення з комп'ютера
                    </Button>
                  </label>
                </Box>

                {/* Або URL */}
                <TextField
                  label="Або вкажіть URL зображення"
                  fullWidth
                  value={formData.image}
                  onChange={handleImageUrlChange}
                  helperText="Вкажіть URL до зображення товару"
                  sx={{ mb: 2 }}
                />

                {/* Preview */}
                {imagePreview && (
                  <Box sx={{ mb: 2 }}>
                    <Box
                      component="img"
                      src={imagePreview}
                      alt="Preview"
                      sx={{
                        maxWidth: '100%',
                        maxHeight: 200,
                        borderRadius: 1,
                        mb: 1,
                      }}
                    />
                    <Button
                      startIcon={<DeleteIcon />}
                      onClick={handleRemoveImage}
                      color="error"
                      size="small"
                    >
                      Видалити зображення
                    </Button>
                  </Box>
                )}
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.requiresApproval}
                    onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.checked })}
                  />
                }
                label="Потребує підтвердження адміна"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Активний товар"
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose}>Скасувати</Button>
            <Button type="submit" variant="contained">
              {editingItem ? 'Оновити' : 'Створити'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Діалог підтвердження видалення */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null })}
      >
        <DialogTitle>Підтвердження видалення</DialogTitle>
        <DialogContent>
          <Typography>
            Ви впевнені, що хочете видалити цей товар?
            {items.find(i => i._id === deleteDialog.id) && (
              <Box component="span" fontWeight="bold" sx={{ ml: 1 }}>
                "{items.find(i => i._id === deleteDialog.id).name}"
              </Box>
            )}
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

export default ShopPage;

