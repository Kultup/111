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
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import api from '../services/api';

const ACHIEVEMENT_TYPES = [
  { value: 'correct_answers', label: 'Правильні відповіді' },
  { value: 'test_streak', label: 'Серія тестів' },
  { value: 'total_tests', label: 'Всього тестів' },
  { value: 'perfect_score', label: 'Ідеальний результат' },
  { value: 'category_master', label: 'Майстер категорії' },
  { value: 'custom', label: 'Кастомна' },
];

const RARITY_OPTIONS = [
  { value: 'common', label: 'Звичайна', color: 'default' },
  { value: 'rare', label: 'Рідкісна', color: 'primary' },
  { value: 'epic', label: 'Епічна', color: 'secondary' },
  { value: 'legendary', label: 'Легендарна', color: 'warning' },
];

const AchievementsPage = () => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    type: 'correct_answers',
    condition: {},
    reward: { coins: 0, title: '' },
    rarity: 'common',
    isActive: true,
  });

  useEffect(() => {
    loadAchievements();
    if (activeTab === 1) {
      loadStats();
    }
  }, [activeTab]);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/achievements');
      setAchievements(response.data.data || []);
    } catch (error) {
      console.error('Error loading achievements:', error);
      setError('Помилка завантаження ачівок');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const response = await api.get('/achievements/stats');
      setStats(response.data.data || []);
    } catch (error) {
      console.error('Error loading achievement stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      name: '',
      description: '',
      icon: '',
      type: 'correct_answers',
      condition: {},
      reward: { coins: 0, title: '' },
      rarity: 'common',
      isActive: true,
    });
    setEditingAchievement(null);
    setOpenDialog(true);
  };

  const handleEdit = (achievement) => {
    setFormData({
      name: achievement.name || '',
      description: achievement.description || '',
      icon: achievement.icon || '',
      type: achievement.type || 'correct_answers',
      condition: achievement.condition || {},
      reward: achievement.reward || { coins: 0, title: '' },
      rarity: achievement.rarity || 'common',
      isActive: achievement.isActive !== undefined ? achievement.isActive : true,
    });
    setEditingAchievement(achievement);
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/achievements/${id}`);
      loadAchievements();
      setDeleteDialog({ open: false, id: null });
    } catch (error) {
      console.error('Error deleting achievement:', error);
      setError(
        error.response?.data?.message || 'Помилка видалення ачівки'
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Назва ачівки обов\'язкова');
      return;
    }

    if (!formData.description.trim()) {
      setError('Опис ачівки обов\'язковий');
      return;
    }

    // Валідація умов залежно від типу
    if (!validateCondition()) {
      return;
    }

    try {
      if (editingAchievement) {
        await api.put(`/achievements/${editingAchievement._id}`, formData);
      } else {
        await api.post('/achievements', formData);
      }
      setOpenDialog(false);
      setEditingAchievement(null);
      loadAchievements();
    } catch (error) {
      console.error('Error saving achievement:', error);
      setError(
        error.response?.data?.message || 'Помилка збереження ачівки'
      );
    }
  };

  const validateCondition = () => {
    const { type, condition } = formData;

    switch (type) {
      case 'correct_answers':
        if (!condition.correctAnswers || condition.correctAnswers <= 0) {
          setError('Вкажіть кількість правильних відповідей');
          return false;
        }
        break;
      case 'test_streak':
        if (!condition.streak || condition.streak <= 0) {
          setError('Вкажіть кількість днів серії');
          return false;
        }
        break;
      case 'total_tests':
        if (!condition.totalTests || condition.totalTests <= 0) {
          setError('Вкажіть кількість тестів');
          return false;
        }
        break;
      case 'perfect_score':
        if (!condition.perfectScore || condition.perfectScore <= 0) {
          setError('Вкажіть кількість тестів з ідеальним результатом');
          return false;
        }
        break;
      case 'category_master':
        if (!condition.category || !condition.correctAnswers || condition.correctAnswers <= 0) {
          setError('Вкажіть категорію та кількість правильних відповідей');
          return false;
        }
        break;
    }
    return true;
  };

  const handleConditionChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      condition: { ...prev.condition, [field]: value },
    }));
  };

  const handleRewardChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      reward: { ...prev.reward, [field]: value },
    }));
  };

  const getConditionLabel = (type, condition) => {
    switch (type) {
      case 'correct_answers':
        return `${condition.correctAnswers || 0} правильних відповідей`;
      case 'test_streak':
        return `${condition.streak || 0} днів підряд`;
      case 'total_tests':
        return `${condition.totalTests || 0} тестів`;
      case 'perfect_score':
        return `${condition.perfectScore || 0} тестів з ідеальним результатом`;
      case 'category_master':
        return `Категорія: ${condition.category || '-'}, ${condition.correctAnswers || 0} правильних`;
      default:
        return 'Кастомна умова';
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setEditingAchievement(null);
    setFormData({
      name: '',
      description: '',
      icon: '',
      type: 'correct_answers',
      condition: {},
      reward: { coins: 0, title: '' },
      rarity: 'common',
      isActive: true,
    });
    setError(null);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Ачівки
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          Додати ачівку
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Список ачівок" />
          <Tab label="Статистика отримання" />
        </Tabs>
      </Paper>

      {activeTab === 0 && loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Іконка</TableCell>
                <TableCell>Назва</TableCell>
                <TableCell>Тип</TableCell>
                <TableCell>Умова</TableCell>
                <TableCell>Рідкісність</TableCell>
                <TableCell>Нагорода</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell align="right">Дії</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {achievements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="textSecondary" sx={{ py: 3 }}>
                      Ачівки не знайдено
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                achievements.map((achievement) => (
                  <TableRow key={achievement._id} hover>
                    <TableCell>
                      <Typography variant="h5">
                        {achievement.icon || '🏆'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {achievement.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {achievement.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {ACHIEVEMENT_TYPES.find(t => t.value === achievement.type)?.label || achievement.type}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {getConditionLabel(achievement.type, achievement.condition)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={RARITY_OPTIONS.find(r => r.value === achievement.rarity)?.label || achievement.rarity}
                        size="small"
                        color={RARITY_OPTIONS.find(r => r.value === achievement.rarity)?.color || 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      {achievement.reward?.coins > 0 && (
                        <Typography variant="body2">
                          {achievement.reward.coins} 🪙
                        </Typography>
                      )}
                      {achievement.reward?.title && (
                        <Typography variant="body2" color="textSecondary">
                          {achievement.reward.title}
                        </Typography>
                      )}
                      {!achievement.reward?.coins && !achievement.reward?.title && '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={achievement.isActive ? 'Активна' : 'Неактивна'}
                        size="small"
                        color={achievement.isActive ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(achievement)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => setDeleteDialog({ open: true, id: achievement._id })}
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
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Іконка</TableCell>
                    <TableCell>Назва</TableCell>
                    <TableCell>Рідкісність</TableCell>
                    <TableCell>Отримали користувачів</TableCell>
                    <TableCell>Відсоток</TableCell>
                    <TableCell>Прогрес</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography color="textSecondary" sx={{ py: 3 }}>
                          Статистика не знайдена
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    stats.map((stat) => {
                      const rarityOption = RARITY_OPTIONS.find(r => r.value === stat.achievement.rarity);
                      return (
                        <TableRow key={stat.achievement._id} hover>
                          <TableCell>
                            {stat.achievement.icon ? (
                              <Typography variant="h5">{stat.achievement.icon}</Typography>
                            ) : (
                              <Typography variant="body2" color="textSecondary">-</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body1" fontWeight="medium">
                              {stat.achievement.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {stat.achievement.description}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={rarityOption?.label || stat.achievement.rarity}
                              color={rarityOption?.color || 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body1" fontWeight="medium">
                              {stat.earnedCount} / {stat.totalUsers}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body1" fontWeight="medium">
                              {stat.percentage.toFixed(1)}%
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ width: '100%', minWidth: 150 }}>
                              <LinearProgress
                                variant="determinate"
                                value={stat.percentage}
                                sx={{ height: 8, borderRadius: 4 }}
                              />
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
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
            {editingAchievement ? 'Редагувати ачівку' : 'Створити ачівку'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              {error && (
                <Alert severity="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              <TextField
                label="Назва ачівки"
                fullWidth
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />

              <TextField
                label="Опис"
                fullWidth
                required
                multiline
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />

              <TextField
                label="Іконка (емодзі або URL)"
                fullWidth
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                helperText="Наприклад: 🏆 або URL до зображення"
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  select
                  label="Тип ачівки"
                  fullWidth
                  required
                  value={formData.type}
                  onChange={(e) => {
                    setFormData({ ...formData, type: e.target.value, condition: {} });
                  }}
                >
                  {ACHIEVEMENT_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  label="Рідкісність"
                  fullWidth
                  value={formData.rarity}
                  onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}
                >
                  {RARITY_OPTIONS.map((rarity) => (
                    <MenuItem key={rarity.value} value={rarity.value}>
                      {rarity.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              {/* Умови залежно від типу */}
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Умови отримання
                </Typography>
                {formData.type === 'correct_answers' && (
                  <TextField
                    label="Кількість правильних відповідей"
                    type="number"
                    fullWidth
                    value={formData.condition.correctAnswers || ''}
                    onChange={(e) => handleConditionChange('correctAnswers', parseInt(e.target.value) || 0)}
                    sx={{ mt: 1 }}
                  />
                )}
                {formData.type === 'test_streak' && (
                  <TextField
                    label="Кількість днів підряд"
                    type="number"
                    fullWidth
                    value={formData.condition.streak || ''}
                    onChange={(e) => handleConditionChange('streak', parseInt(e.target.value) || 0)}
                    sx={{ mt: 1 }}
                  />
                )}
                {formData.type === 'total_tests' && (
                  <TextField
                    label="Кількість тестів"
                    type="number"
                    fullWidth
                    value={formData.condition.totalTests || ''}
                    onChange={(e) => handleConditionChange('totalTests', parseInt(e.target.value) || 0)}
                    sx={{ mt: 1 }}
                  />
                )}
                {formData.type === 'perfect_score' && (
                  <TextField
                    label="Кількість тестів з ідеальним результатом"
                    type="number"
                    fullWidth
                    value={formData.condition.perfectScore || ''}
                    onChange={(e) => handleConditionChange('perfectScore', parseInt(e.target.value) || 0)}
                    sx={{ mt: 1 }}
                  />
                )}
                {formData.type === 'category_master' && (
                  <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField
                      label="ID категорії"
                      fullWidth
                      value={formData.condition.category || ''}
                      onChange={(e) => handleConditionChange('category', e.target.value)}
                      helperText="Вкажіть ID категорії"
                    />
                    <TextField
                      label="Кількість правильних відповідей"
                      type="number"
                      fullWidth
                      value={formData.condition.correctAnswers || ''}
                      onChange={(e) => handleConditionChange('correctAnswers', parseInt(e.target.value) || 0)}
                    />
                  </Stack>
                )}
              </Box>

              {/* Нагорода */}
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Нагорода
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6}>
                    <TextField
                      label="Монети"
                      type="number"
                      fullWidth
                      value={formData.reward.coins || 0}
                      onChange={(e) => handleRewardChange('coins', parseInt(e.target.value) || 0)}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Титул (опціонально)"
                      fullWidth
                      value={formData.reward.title || ''}
                      onChange={(e) => handleRewardChange('title', e.target.value)}
                    />
                  </Grid>
                </Grid>
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Активна ачівка"
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose}>Скасувати</Button>
            <Button type="submit" variant="contained">
              {editingAchievement ? 'Оновити' : 'Створити'}
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
            Ви впевнені, що хочете видалити цю ачівку?
            {achievements.find(a => a._id === deleteDialog.id) && (
              <Box component="span" fontWeight="bold" sx={{ ml: 1 }}>
                "{achievements.find(a => a._id === deleteDialog.id).name}"
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

export default AchievementsPage;

