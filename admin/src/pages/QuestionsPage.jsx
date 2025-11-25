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
  Pagination,
  Stack,
  CircularProgress,
  Alert,
  Checkbox,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  FileDownload as FileDownloadIcon,
} from '@mui/icons-material';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import api from '../services/api';
import QuestionForm from '../components/QuestionForm';

const QuestionsPage = () => {
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [error, setError] = useState(null);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [importDialog, setImportDialog] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);

  useEffect(() => {
    loadCategories();
    loadQuestions();
  }, [page, search, categoryFilter]);

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit: 10,
        ...(search && { search }),
        ...(categoryFilter && { category: categoryFilter }),
      };
      const response = await api.get('/questions', { params });
      setQuestions(response.data.data || []);
      setTotalPages(response.data.pages || 1);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Error loading questions:', error);
      setError('Помилка завантаження питань');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingQuestion(null);
    setOpenDialog(true);
  };

  const handleEdit = (question) => {
    setEditingQuestion(question);
    setOpenDialog(true);
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      // Отримуємо всі питання з поточними фільтрами
      const response = await api.get('/questions', {
        params: {
          ...(search && { search }),
          ...(categoryFilter && { category: categoryFilter }),
          limit: total || 1000,
          page: 1,
        },
      });
      const allQuestions = response.data.data || [];

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Питання');

      worksheet.columns = [
        { header: 'ID', key: 'id', width: 30 },
        { header: 'Текст питання', key: 'text', width: 50 },
        { header: 'Категорія', key: 'category', width: 20 },
        { header: 'Складність', key: 'difficulty', width: 15 },
        { header: 'Варіант 1', key: 'answer1', width: 30 },
        { header: 'Варіант 2', key: 'answer2', width: 30 },
        { header: 'Варіант 3', key: 'answer3', width: 30 },
        { header: 'Варіант 4', key: 'answer4', width: 30 },
        { header: 'Правильна відповідь', key: 'correctAnswer', width: 20 },
        { header: 'Пояснення', key: 'explanation', width: 50 },
        { header: 'Посади', key: 'positions', width: 30 },
        { header: 'Активне', key: 'isActive', width: 15 },
        { header: 'Дата створення', key: 'createdAt', width: 20 },
      ];

      allQuestions.forEach((question) => {
        const correctAnswerIndex = question.answers.findIndex(a => a.isCorrect);
        const correctAnswer = correctAnswerIndex >= 0 
          ? question.answers[correctAnswerIndex].text 
          : 'Не вказано';

        worksheet.addRow({
          id: question._id,
          text: question.text,
          category: question.category?.name || '-',
          difficulty: question.difficulty,
          answer1: question.answers[0]?.text || '-',
          answer2: question.answers[1]?.text || '-',
          answer3: question.answers[2]?.text || '-',
          answer4: question.answers[3]?.text || '-',
          correctAnswer: correctAnswer,
          explanation: question.explanation || '-',
          positions: question.positions?.map(p => p.name || p).join(', ') || '-',
          isActive: question.isActive ? 'Так' : 'Ні',
          createdAt: question.createdAt 
            ? new Date(question.createdAt).toLocaleString('uk-UA')
            : '-',
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
      saveAs(blob, `Питання_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Error exporting questions:', error);
      setError('Помилка при експорті питань');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/questions/${id}`);
      loadQuestions();
      setDeleteDialog({ open: false, id: null });
    } catch (error) {
      console.error('Error deleting question:', error);
      setError('Помилка видалення питання');
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setEditingQuestion(null);
    loadQuestions();
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedQuestions(questions.map(q => q._id));
    } else {
      setSelectedQuestions([]);
    }
  };

  const handleSelectQuestion = (id) => {
    setSelectedQuestions(prev =>
      prev.includes(id)
        ? prev.filter(qId => qId !== id)
        : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedQuestions.length === 0) return;
    
    if (!window.confirm(`Видалити ${selectedQuestions.length} питань?`)) return;

    try {
      await Promise.all(
        selectedQuestions.map(id => api.delete(`/questions/${id}`))
      );
      setSelectedQuestions([]);
      loadQuestions();
    } catch (error) {
      console.error('Error bulk deleting:', error);
      setError('Помилка масового видалення');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/questions/import/template', {
        responseType: 'blob',
      });
      
      // Створити URL для blob
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      
      // Створити посилання для завантаження
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'questions_template.xlsx');
      document.body.appendChild(link);
      link.click();
      
      // Очистити
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading template:', error);
      setError('Помилка завантаження шаблону');
    }
  };

  const handleImportFile = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImportFile(file);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      setError('Виберіть файл для імпорту');
      return;
    }

    try {
      setImporting(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('file', importFile);

      const response = await api.post('/questions/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Отримати результати з правильної структури відповіді
      const results = response.data.results || {
        imported: response.data.results?.imported || 0,
        errors: response.data.results?.errors || 0,
        details: response.data.results?.details || {
          success: [],
          errors: []
        }
      };
      
      setImportResults({
        imported: results.imported || results.details?.success?.length || 0,
        errorsCount: results.errors || results.details?.errors?.length || 0,
        success: results.details?.success || [],
        errors: results.details?.errors || []
      });
      setImportFile(null);
      loadQuestions();
      
      // Закрити діалог через 3 секунди, якщо все успішно
      const errorsCount = results.errors || results.details?.errors?.length || 0;
      if (errorsCount === 0) {
        setTimeout(() => {
          setImportDialog(false);
          setImportResults(null);
        }, 3000);
      }
    } catch (error) {
      console.error('Error importing questions:', error);
      setError(error.response?.data?.message || 'Помилка імпорту питань');
    } finally {
      setImporting(false);
    }
  };

  const handleCloseImportDialog = () => {
    setImportDialog(false);
    setImportFile(null);
    setImportResults(null);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
        Питання
      </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleDownloadTemplate}
            disabled={loading}
          >
            Завантажити шаблон
          </Button>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => setImportDialog(true)}
            disabled={loading}
          >
            Імпортувати з Excel
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={loading}
          >
            Експорт в Excel
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
          >
            Додати питання
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
        <TextField
          label="Пошук"
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          sx={{ flexGrow: 1 }}
        />
        <TextField
          select
          label="Категорія"
          variant="outlined"
          size="small"
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
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
        {selectedQuestions.length > 0 && (
          <Button
            variant="outlined"
            color="error"
            onClick={handleBulkDelete}
          >
            Видалити вибрані ({selectedQuestions.length})
          </Button>
        )}
      </Box>

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
                      indeterminate={selectedQuestions.length > 0 && selectedQuestions.length < questions.length}
                      checked={questions.length > 0 && selectedQuestions.length === questions.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>Текст питання</TableCell>
                      <TableCell>Категорія</TableCell>
                      <TableCell>Посади</TableCell>
                      <TableCell>Складність</TableCell>
                      <TableCell>Зображення</TableCell>
                      <TableCell>Статус</TableCell>
                  <TableCell align="right">Дії</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {questions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="textSecondary" sx={{ py: 3 }}>
                        Питання не знайдено
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  questions.map((question) => (
                    <TableRow key={question._id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedQuestions.includes(question._id)}
                          onChange={() => handleSelectQuestion(question._id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 400 }}>
                          {question.text}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {question.category?.name || '-'}
                      </TableCell>
                      <TableCell>
                        {question.positions?.length > 0
                          ? question.positions.map(p => p.name).join(', ')
                          : 'Всі посади'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={question.difficulty || 3}
                          size="small"
                          color={question.difficulty >= 4 ? 'error' : question.difficulty >= 3 ? 'warning' : 'success'}
                        />
                      </TableCell>
                      <TableCell>
                        {question.image ? (
                          <ImageIcon color="primary" />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={question.isActive ? 'Активне' : 'Неактивне'}
                          size="small"
                          color={question.isActive ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(question)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => setDeleteDialog({ open: true, id: question._id })}
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
            <Stack spacing={2} sx={{ mt: 2, alignItems: 'center' }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, value) => setPage(value)}
                color="primary"
              />
            </Stack>
          )}
        </>
      )}

      <Dialog
        open={openDialog}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingQuestion ? 'Редагувати питання' : 'Створити питання'}
        </DialogTitle>
        <DialogContent>
          <QuestionForm
            question={editingQuestion}
            categories={categories}
            onSuccess={handleDialogClose}
            onCancel={handleDialogClose}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null })}
      >
        <DialogTitle>Підтвердження видалення</DialogTitle>
        <DialogContent>
          <Typography>Ви впевнені, що хочете видалити це питання?</Typography>
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

      <Dialog
        open={importDialog}
        onClose={handleCloseImportDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Імпорт питань з Excel</DialogTitle>
        <DialogContent>
          {!importResults ? (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Завантажте Excel файл з питаннями. Формат файлу має відповідати шаблону.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={handleDownloadTemplate}
                sx={{ mb: 2 }}
              >
                Завантажити шаблон
              </Button>
              <Box sx={{ mt: 2 }}>
                <input
                  accept=".xlsx,.xls"
                  style={{ display: 'none' }}
                  id="import-file-input"
                  type="file"
                  onChange={handleImportFile}
                />
                <label htmlFor="import-file-input">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<UploadIcon />}
                    fullWidth
                  >
                    {importFile ? importFile.name : 'Виберіть Excel файл'}
                  </Button>
                </label>
                {importFile && (
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Файл: {importFile.name} ({(importFile.size / 1024).toFixed(2)} KB)
                  </Typography>
                )}
              </Box>
            </Box>
          ) : (
            <Box sx={{ pt: 2 }}>
              <Alert 
                severity={importResults.errorsCount === 0 ? 'success' : 'warning'}
                sx={{ mb: 2 }}
              >
                <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Імпорт завершено!
                </Typography>
                <Typography variant="body2">
                  Успішно імпортовано: <strong>{importResults.imported}</strong> питань
                  {importResults.errorsCount > 0 && (
                    <> | Помилок: <strong>{importResults.errorsCount}</strong></>
                  )}
                </Typography>
              </Alert>
              
              {(importResults.errorsCount > 0 || (importResults.errors && importResults.errors.length > 0)) && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                    Помилки імпорту:
                  </Typography>
                  <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                    {(importResults.errors || []).map((err, index) => (
                      <Alert key={index} severity="error" sx={{ mb: 1 }}>
                        Рядок {err.row}: {err.error}
                      </Alert>
                    ))}
                  </Box>
                </Box>
              )}

              {importResults.success && importResults.success.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                    Успішно імпортовано ({importResults.success.length}):
                  </Typography>
                  <Box sx={{ maxHeight: 200, overflow: 'auto', bgcolor: 'background.paper', p: 1, borderRadius: 1 }}>
                    {importResults.success.map((item, index) => (
                      <Typography key={index} variant="body2" sx={{ mb: 0.5, color: 'success.main' }}>
                        ✓ Рядок {item.row}: {item.text}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {!importResults ? (
            <>
              <Button onClick={handleCloseImportDialog}>
                Скасувати
              </Button>
              <Button
                onClick={handleImport}
                variant="contained"
                disabled={!importFile || importing}
                startIcon={importing ? <CircularProgress size={20} /> : <UploadIcon />}
              >
                {importing ? 'Імпорт...' : 'Імпортувати'}
              </Button>
            </>
          ) : (
            <Button onClick={handleCloseImportDialog} variant="contained">
              Закрити
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuestionsPage;
