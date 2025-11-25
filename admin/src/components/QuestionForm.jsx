import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  MenuItem,
  Typography,
  IconButton,
  Paper,
  Stack,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  Image as ImageIcon,
  Crop as CropIcon,
} from '@mui/icons-material';
import api from '../services/api';
import ImageCropDialog from './ImageCropDialog';
import { blobToFile } from '../utils/imageUtils';

const QuestionForm = ({ question, categories, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    text: '',
    category: '',
    difficulty: 3,
    explanation: '',
    answers: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ],
    isActive: true,
    positions: [],
  });
  const [positions, setPositions] = useState([]);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageForCrop, setImageForCrop] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Діагностичний useEffect для відстеження змін answers
  useEffect(() => {
    console.log('formData.answers changed:', formData.answers.map((a, i) => ({ 
      index: i, 
      text: a.text, 
      isCorrect: a.isCorrect,
      isCorrectType: typeof a.isCorrect 
    })));
  }, [formData.answers]);

  useEffect(() => {
    // Завантажити посади
    const loadPositions = async () => {
      try {
        const response = await api.get('/positions');
        setPositions(response.data.data || []);
      } catch (error) {
        console.error('Error loading positions:', error);
      }
    };
    loadPositions();
  }, []);

  useEffect(() => {
    if (question) {
      // Завжди завантажуємо повні дані питання з API для отримання правильних відповідей
      const loadFullQuestion = async () => {
        try {
          // Завантажити повні дані питання з API (з cache-busting для уникнення кешування)
          const response = await api.get(`/questions/${question._id}`, {
            params: { _: Date.now() } // Додати timestamp для уникнення кешування
          });
          const fullQuestion = response.data.data;
          
          console.log('=== Loading Question for Edit ===');
          console.log('Question ID:', question._id);
          console.log('Full question data:', fullQuestion);
          console.log('Raw answers:', fullQuestion.answers);
          console.log('Answers with isCorrect:', fullQuestion.answers?.map(a => ({ 
            text: a.text, 
            isCorrect: a.isCorrect,
            isCorrectType: typeof a.isCorrect,
            isCorrectValue: a.isCorrect
          })));
          
          const existingAnswers = fullQuestion.answers?.map((a, index) => {
            // Різні способи перевірки isCorrect
            let isCorrect = false;
            if (a.isCorrect === true) {
              isCorrect = true;
            } else if (a.isCorrect === 'true') {
              isCorrect = true;
            } else if (String(a.isCorrect) === 'true') {
              isCorrect = true;
            } else if (a.isCorrect === 1) {
              isCorrect = true;
            }
            
            console.log(`Answer ${index}: text="${a.text}", raw isCorrect=${a.isCorrect} (${typeof a.isCorrect}), processed=${isCorrect}`);
            return {
              text: a.text || '',
              isCorrect: isCorrect,
            };
          }) || [];
          
          console.log('Processed answers:', existingAnswers);
          console.log('Answers that should be checked:', existingAnswers.filter(a => a.isCorrect).map((a, i) => i));
          
          // Додаємо порожні відповіді до 4, якщо їх менше
          while (existingAnswers.length < 4) {
            existingAnswers.push({ text: '', isCorrect: false });
          }
          
          const newFormData = {
            text: fullQuestion.text || '',
            category: fullQuestion.category?._id || fullQuestion.category || '',
            difficulty: fullQuestion.difficulty || 3,
            explanation: fullQuestion.explanation || '',
            answers: existingAnswers,
            isActive: fullQuestion.isActive !== undefined ? fullQuestion.isActive : true,
            positions: fullQuestion.positions?.map(p => p._id || p) || [],
          };
          
          console.log('Setting formData:', newFormData);
          console.log('Answers in formData:', newFormData.answers.map((a, i) => ({ index: i, text: a.text, isCorrect: a.isCorrect })));
          setFormData(newFormData);
          
          if (fullQuestion.image) {
            setImagePreview(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${fullQuestion.image}`);
          }
        } catch (error) {
          console.error('Error loading full question:', error);
          setError('Помилка завантаження даних питання');
        }
      };
      
      loadFullQuestion();
    } else {
      // Якщо створюємо нове питання, скинути форму
      setFormData({
        text: '',
        category: '',
        difficulty: 3,
        explanation: '',
        answers: [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
        ],
        isActive: true,
        positions: [],
      });
      setImagePreview(null);
      setImage(null);
    }
  }, [question]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAnswerChange = (index, field, value) => {
    console.log(`handleAnswerChange: index=${index}, field=${field}, value=${value}`);
    const newAnswers = [...formData.answers];
    newAnswers[index] = { ...newAnswers[index], [field]: value };
    
    // Якщо встановлюємо правильну відповідь, знімаємо з інших
    if (field === 'isCorrect' && value) {
      newAnswers.forEach((answer, i) => {
        if (i !== index) {
          newAnswers[i] = { ...newAnswers[i], isCorrect: false };
        }
      });
    }
    
    console.log('New answers after change:', newAnswers);
    setFormData(prev => ({ ...prev, answers: newAnswers }));
  };

  const handleAddAnswer = () => {
    setFormData(prev => ({
      ...prev,
      answers: [...prev.answers, { text: '', isCorrect: false }],
    }));
  };

  const handleRemoveAnswer = (index) => {
    if (formData.answers.length <= 4) {
      setError('Має бути мінімум 4 варіанти відповідей');
      return;
    }
    setFormData(prev => ({
      ...prev,
      answers: prev.answers.filter((_, i) => i !== index),
    }));
  };

  const handleImageChange = (e) => {
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
      setImage(croppedFile);
      
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
    setImage(null);
    setImagePreview(null);
    if (question?.image) {
      // Встановлюємо спеціальне значення для видалення зображення
      setFormData(prev => ({ ...prev, removeImage: true }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Валідація
    if (!formData.text.trim()) {
      setError('Текст питання обов\'язковий');
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

    if (formData.answers.length < 4) {
      setError('Має бути мінімум 4 варіанти відповідей');
      return;
    }

    const correctAnswers = formData.answers.filter(a => a.isCorrect);
    if (correctAnswers.length !== 1) {
      setError('Має бути рівно одна правильна відповідь');
      return;
    }

    const emptyAnswers = formData.answers.some(a => !a.text.trim());
    if (emptyAnswers) {
      setError('Всі варіанти відповідей мають бути заповнені');
      return;
    }

    try {
      setLoading(true);

      const submitData = new FormData();
      submitData.append('text', formData.text);
      submitData.append('category', formData.category);
      submitData.append('difficulty', formData.difficulty);
      submitData.append('explanation', formData.explanation || '');
      submitData.append('isActive', formData.isActive);
      submitData.append('answers', JSON.stringify(formData.answers));
      submitData.append('positions', JSON.stringify(formData.positions));

      if (image) {
        submitData.append('image', image);
      }

      if (question) {
        // Оновлення
        if (formData.removeImage) {
          submitData.append('removeImage', 'true');
        }
        await api.put(`/questions/${question._id}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        // Створення
        await api.post('/questions', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving question:', error);
      setError(
        error.response?.data?.message ||
        'Помилка збереження питання'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Stack spacing={3}>
        <TextField
          label="Текст питання"
          fullWidth
          required
          multiline
          rows={3}
          value={formData.text}
          onChange={(e) => handleChange('text', e.target.value)}
        />

        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            select
            label="Категорія"
            fullWidth
            required
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
          >
            {categories.map((cat) => (
              <MenuItem key={cat._id} value={cat._id}>
                {cat.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Складність"
            sx={{ minWidth: 150 }}
            value={formData.difficulty}
            onChange={(e) => handleChange('difficulty', parseInt(e.target.value))}
          >
            {[1, 2, 3, 4, 5].map((level) => (
              <MenuItem key={level} value={level}>
                {level}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Варіанти відповідей
          </Typography>
          {formData.answers.map((answer, index) => {
            const isChecked = Boolean(answer?.isCorrect);
            console.log(`Rendering answer ${index}:`, { text: answer?.text, isCorrect: answer?.isCorrect, isChecked });
            return (
              <Paper key={`answer-${index}-${isChecked}`} sx={{ p: 2, mb: 2 }}>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <TextField
                    label={`Варіант ${index + 1}`}
                    fullWidth
                    required
                    value={answer?.text || ''}
                    onChange={(e) => handleAnswerChange(index, 'text', e.target.value)}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isChecked}
                        onChange={(e) => {
                          console.log(`Changing answer ${index} isCorrect from ${isChecked} to:`, e.target.checked);
                          handleAnswerChange(index, 'isCorrect', e.target.checked);
                        }}
                      />
                    }
                    label="Правильна"
                  />
                  <IconButton
                    color="error"
                    onClick={() => handleRemoveAnswer(index)}
                    disabled={formData.answers.length <= 2}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              </Paper>
            );
          })}
          <Button
            startIcon={<AddIcon />}
            onClick={handleAddAnswer}
            variant="outlined"
          >
            Додати варіант
          </Button>
        </Box>

        <TextField
          label="Пояснення (опціонально)"
          fullWidth
          multiline
          rows={2}
          value={formData.explanation}
          onChange={(e) => handleChange('explanation', e.target.value)}
          helperText="Показується користувачу при неправильній відповіді"
        />

        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Посади <span style={{ color: 'red' }}>*</span>
          </Typography>
          <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 1 }}>
            Обов'язково виберіть хоча б одну посаду, для якої буде доступне це питання
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
              onChange: (e) => handleChange('positions', e.target.value),
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
          <Typography variant="subtitle1" gutterBottom>
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
              <Button
                startIcon={<DeleteIcon />}
                onClick={handleRemoveImage}
                color="error"
                size="small"
              >
                Видалити зображення
              </Button>
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
            <Checkbox
              checked={formData.isActive}
              onChange={(e) => handleChange('isActive', e.target.checked)}
            />
          }
          label="Активне питання"
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2 }}>
          <Button onClick={onCancel} disabled={loading}>
            Скасувати
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Збереження...' : question ? 'Оновити' : 'Створити'}
          </Button>
        </Box>
      </Stack>

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
    </Box>
  );
};

export default QuestionForm;

