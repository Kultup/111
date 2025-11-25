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
  Pagination,
  Autocomplete,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteImageIcon,
  Crop as CropIcon,
  Preview as PreviewIcon,
} from '@mui/icons-material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import api from '../services/api';
import ImageCropDialog from '../components/ImageCropDialog';
import { blobToFile } from '../utils/imageUtils';

const KnowledgeBasePage = () => {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [previewDialog, setPreviewDialog] = useState({ open: false, article: null });
  const [error, setError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageForCrop, setImageForCrop] = useState(null);
  const [editorTab, setEditorTab] = useState(0); // 0 - редагування, 1 - попередній перегляд
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterActive, setFilterActive] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    tags: [],
    isActive: true,
    positions: [],
  });

  useEffect(() => {
    loadCategories();
    loadPositions();
  }, []);

  useEffect(() => {
    loadArticles();
  }, [page, filterCategory, filterActive, searchQuery]);

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
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

  const loadArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit,
        ...(filterCategory && { category: filterCategory }),
        ...(filterActive && { active: filterActive }),
        ...(searchQuery && { search: searchQuery }),
      };

      const response = await api.get('/knowledge-base', { params });
      setArticles(response.data.data || []);
      setTotalPages(response.data.pages || 1);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Error loading articles:', error);
      setError('Помилка завантаження статей');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      title: '',
      content: '',
      category: '',
      tags: [],
      isActive: true,
      positions: [],
    });
    setImagePreview(null);
    setImageFile(null);
    setEditingArticle(null);
    setOpenDialog(true);
  };

  const handleEdit = (article) => {
    setFormData({
      title: article.title || '',
      content: article.content || '',
      category: article.category?._id || article.category || '',
      tags: article.tags || [],
      isActive: article.isActive !== undefined ? article.isActive : true,
      positions: article.positions?.map(p => p._id || p) || [],
    });
    if (article.image) {
      setImagePreview(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${article.image}`);
    } else {
      setImagePreview(null);
    }
    setImageFile(null);
    setEditingArticle(article);
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/knowledge-base/${id}`);
      loadArticles();
      setDeleteDialog({ open: false, id: null });
    } catch (error) {
      console.error('Error deleting article:', error);
      setError(
        error.response?.data?.message || 'Помилка видалення статті'
      );
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Файл має бути зображенням');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Розмір зображення не повинен перевищувати 5MB');
      return;
    }

    setError(null);

    // Відкрити діалог обрізки
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageForCrop(reader.result);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedBlob) => {
    try {
      // Конвертуємо blob в File
      const croppedFile = blobToFile(croppedBlob, 'cropped-image.jpg');
      setImageFile(croppedFile);
      
      // Створюємо preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(croppedFile);
    } catch (error) {
      console.error('Error processing cropped image:', error);
      setError('Помилка обробки зображення');
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (editingArticle?.image) {
      setFormData(prev => ({ ...prev, deleteImage: true }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) {
      setError('Заголовок обов\'язковий');
      return;
    }

    // Перевірка контенту (видаляємо HTML теги для перевірки)
    const textContent = formData.content.replace(/<[^>]*>/g, '').trim();
    if (!textContent) {
      setError('Контент обов\'язковий');
      return;
    }

    if (!formData.category) {
      setError('Категорія обов\'язкова');
      return;
    }

    if (!formData.positions || formData.positions.length === 0) {
      setError('Необхідно вибрати хоча б одну посаду');
      return;
    }

    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('content', formData.content);
      submitData.append('category', formData.category);
      submitData.append('isActive', formData.isActive);
      submitData.append('tags', JSON.stringify(formData.tags));
      submitData.append('positions', JSON.stringify(formData.positions));

      if (imageFile) {
        submitData.append('image', imageFile);
      }

      if (editingArticle) {
        if (formData.deleteImage) {
          submitData.append('deleteImage', 'true');
        }
        await api.put(`/knowledge-base/${editingArticle._id}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/knowledge-base', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      setOpenDialog(false);
      setEditingArticle(null);
      loadArticles();
    } catch (error) {
      console.error('Error saving article:', error);
      setError(
        error.response?.data?.message || 'Помилка збереження статті'
      );
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setEditingArticle(null);
    setEditorTab(0);
    setFormData({
      title: '',
      content: '',
      category: '',
      tags: [],
      isActive: true,
      positions: [],
    });
    setImagePreview(null);
    setImageFile(null);
    setImageFile(null);
    setError(null);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          База знань
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          Додати статтю
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Фільтри */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <TextField
            label="Пошук"
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            sx={{ minWidth: 200 }}
          />
          <TextField
            select
            label="Категорія"
            size="small"
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setPage(1);
            }}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">Всі категорії</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat._id} value={cat._id}>
                {cat.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Статус"
            size="small"
            value={filterActive}
            onChange={(e) => {
              setFilterActive(e.target.value);
              setPage(1);
            }}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">Всі</MenuItem>
            <MenuItem value="true">Активні</MenuItem>
            <MenuItem value="false">Неактивні</MenuItem>
          </TextField>
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
                  <TableCell>Заголовок</TableCell>
                  <TableCell>Категорія</TableCell>
                  <TableCell>Посади</TableCell>
                  <TableCell>Теги</TableCell>
                  <TableCell>Переглядів</TableCell>
                  <TableCell>Дата створення</TableCell>
                  <TableCell>Статус</TableCell>
                  <TableCell align="right">Дії</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {articles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="textSecondary" sx={{ py: 3 }}>
                        Статті не знайдено
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  articles.map((article) => (
                    <TableRow key={article._id} hover>
                      <TableCell>
                        <Typography variant="body1" fontWeight="medium">
                          {article.title}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {article.category?.name || '-'}
                      </TableCell>
                      <TableCell>
                        {article.positions && article.positions.length > 0 ? (
                          <Stack direction="row" spacing={0.5} flexWrap="wrap">
                            {article.positions.map((pos, index) => (
                              <Chip key={index} label={pos.name || pos} size="small" color="primary" variant="outlined" />
                            ))}
                          </Stack>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {article.tags && article.tags.length > 0 ? (
                          <Stack direction="row" spacing={0.5} flexWrap="wrap">
                            {article.tags.map((tag, index) => (
                              <Chip key={index} label={tag} size="small" />
                            ))}
                          </Stack>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {article.views || 0}
                      </TableCell>
                      <TableCell>
                        {formatDate(article.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={article.isActive ? 'Активна' : 'Неактивна'}
                          size="small"
                          color={article.isActive ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => setPreviewDialog({ open: true, article })}
                          color="info"
                          title="Попередній перегляд"
                        >
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(article)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => setDeleteDialog({ open: true, id: article._id })}
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

      {/* Діалог створення/редагування */}
      <Dialog
        open={openDialog}
        onClose={handleDialogClose}
        maxWidth="lg"
        fullWidth
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingArticle ? 'Редагувати статтю' : 'Створити статтю'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              {error && (
                <Alert severity="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              <TextField
                label="Заголовок"
                fullWidth
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  select
                  label="Категорія"
                  fullWidth
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat._id} value={cat._id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Посади <span style={{ color: 'red' }}>*</span>
                </Typography>
                <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 1 }}>
                  Обов'язково виберіть хоча б одну посаду, для якої буде доступна ця стаття
                </Typography>
                <TextField
                  select
                  fullWidth
                  required
                  error={formData.positions.length === 0}
                  helperText={formData.positions.length === 0 ? 'Необхідно вибрати хоча б одну посаду' : ''}
                  SelectProps={{
                    multiple: true,
                    value: formData.positions,
                    onChange: (e) => setFormData({ ...formData, positions: e.target.value }),
                    renderValue: (selected) => {
                      if (selected.length === 0) return 'Виберіть посади';
                      return selected
                        .map(id => positions.find(p => p._id === id)?.name)
                        .filter(Boolean)
                        .join(', ');
                    }
                  }}
                >
                  {positions.map((position) => (
                    <MenuItem key={position._id} value={position._id}>
                      {position.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <Box>
                <Tabs value={editorTab} onChange={(e, newValue) => setEditorTab(newValue)} sx={{ mb: 2 }}>
                  <Tab label="Редагування" icon={<EditIcon />} iconPosition="start" />
                  <Tab label="Попередній перегляд" icon={<PreviewIcon />} iconPosition="start" />
                </Tabs>

                {editorTab === 0 ? (
                  <Box
                    sx={{
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      '& .quill': {
                        '& .ql-toolbar': {
                          borderTop: 'none',
                          borderLeft: 'none',
                          borderRight: 'none',
                          borderBottom: '1px solid #e0e0e0',
                        },
                        '& .ql-container': {
                          border: 'none',
                          fontSize: '16px',
                          minHeight: '300px',
                        },
                        '& .ql-editor': {
                          minHeight: '300px',
                        },
                      },
                    }}
                  >
                    <ReactQuill
                      theme="snow"
                      value={formData.content}
                      onChange={(value) => setFormData({ ...formData, content: value })}
                      modules={{
                        toolbar: [
                          [{ 'header': [1, 2, 3, false] }],
                          ['bold', 'italic', 'underline', 'strike'],
                          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                          [{ 'color': [] }, { 'background': [] }],
                          [{ 'align': [] }],
                          ['link', 'image'],
                          ['clean']
                        ],
                      }}
                      formats={[
                        'header',
                        'bold', 'italic', 'underline', 'strike',
                        'list', 'bullet',
                        'color', 'background',
                        'align',
                        'link', 'image'
                      ]}
                    />
                  </Box>
                ) : (
                  <Paper
                    sx={{
                      p: 3,
                      minHeight: '300px',
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      '& img': {
                        maxWidth: '100%',
                        height: 'auto',
                      },
                    }}
                  >
                    {formData.content ? (
                      <Box
                        dangerouslySetInnerHTML={{ __html: formData.content }}
                        sx={{
                          '& h1, & h2, & h3': {
                            marginTop: 2,
                            marginBottom: 1,
                          },
                          '& p': {
                            marginBottom: 1,
                          },
                          '& ul, & ol': {
                            marginLeft: 2,
                            marginBottom: 1,
                          },
                        }}
                      />
                    ) : (
                      <Typography color="textSecondary" sx={{ fontStyle: 'italic' }}>
                        Введіть контент для попереднього перегляду
                      </Typography>
                    )}
                  </Paper>
                )}
              </Box>

              <Autocomplete
                multiple
                freeSolo
                options={[]}
                value={formData.tags}
                onChange={(e, newValue) => setFormData({ ...formData, tags: newValue })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Теги"
                    placeholder="Додайте тег та натисніть Enter"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option}
                      {...getTagProps({ index })}
                      key={index}
                    />
                  ))
                }
              />

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Зображення
                </Typography>
                {imagePreview ? (
                  <Box sx={{ mb: 2 }}>
                    <Box
                      component="img"
                      src={imagePreview}
                      alt="Preview"
                      sx={{
                        maxWidth: '100%',
                        maxHeight: 300,
                        borderRadius: 1,
                        mb: 1,
                      }}
                    />
                    <Stack direction="row" spacing={1}>
                      <Button
                        startIcon={<CropIcon />}
                        onClick={() => {
                          if (imagePreview) {
                            setImageForCrop(imagePreview);
                            setCropDialogOpen(true);
                          }
                        }}
                        variant="outlined"
                        size="small"
                      >
                        Обрізати
                      </Button>
                      <Button
                        startIcon={<DeleteImageIcon />}
                        onClick={handleRemoveImage}
                        color="error"
                        size="small"
                      >
                        Видалити
                      </Button>
                    </Stack>
                  </Box>
                ) : (
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<CloudUploadIcon />}
                    sx={{ mb: 2 }}
                  >
                    Завантажити зображення
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </Button>
                )}
                <Typography variant="caption" color="textSecondary" display="block">
                  Максимальний розмір: 5MB. Підтримувані формати: JPG, PNG, GIF
                </Typography>
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Активна стаття"
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose}>Скасувати</Button>
            <Button type="submit" variant="contained">
              {editingArticle ? 'Оновити' : 'Створити'}
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
            Ви впевнені, що хочете видалити цю статтю?
            {articles.find(a => a._id === deleteDialog.id) && (
              <Box component="span" fontWeight="bold" sx={{ ml: 1 }}>
                "{articles.find(a => a._id === deleteDialog.id).title}"
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

      {/* Діалог обрізки зображення */}
      <ImageCropDialog
        open={cropDialogOpen}
        imageSrc={imageForCrop}
        onClose={() => {
          setCropDialogOpen(false);
          setImageForCrop(null);
        }}
        onCropComplete={handleCropComplete}
      />

      {/* Діалог попереднього перегляду статті */}
      <Dialog
        open={previewDialog.open}
        onClose={() => setPreviewDialog({ open: false, article: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {previewDialog.article?.title || 'Попередній перегляд'}
        </DialogTitle>
        <DialogContent>
          {previewDialog.article && (
            <Box sx={{ mt: 2 }}>
              {previewDialog.article.image && (
                <Box
                  component="img"
                  src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${previewDialog.article.image}`}
                  alt={previewDialog.article.title}
                  sx={{
                    width: '100%',
                    maxHeight: 300,
                    objectFit: 'contain',
                    borderRadius: 1,
                    mb: 2,
                  }}
                />
              )}
              <Box
                dangerouslySetInnerHTML={{ __html: previewDialog.article.content || '' }}
                sx={{
                  '& h1, & h2, & h3': {
                    marginTop: 2,
                    marginBottom: 1,
                  },
                  '& p': {
                    marginBottom: 1,
                  },
                  '& ul, & ol': {
                    marginLeft: 2,
                    marginBottom: 1,
                  },
                  '& img': {
                    maxWidth: '100%',
                    height: 'auto',
                  },
                }}
              />
              {previewDialog.article.tags && previewDialog.article.tags.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Теги:
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {previewDialog.article.tags.map((tag, index) => (
                      <Chip key={index} label={tag} size="small" />
                    ))}
                  </Stack>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog({ open: false, article: null })}>
            Закрити
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default KnowledgeBasePage;

