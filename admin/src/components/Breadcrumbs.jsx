import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Breadcrumbs as MuiBreadcrumbs, Typography, Box } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

const routeLabels = {
  '': 'Головна',
  'users': 'Користувачі',
  'questions': 'Питання',
  'categories': 'Категорії',
  'cities': 'Міста',
  'positions': 'Посади',
  'stats': 'Статистика',
  'achievements': 'Ачівки',
  'shop': 'Магазин',
  'approvals': 'Підтвердження',
  'coins': 'Монети',
  'knowledge-base': 'База знань',
  'daily-tests': 'Щоденні тести',
  'feedback': 'Звернення',
  'settings': 'Налаштування',
};

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <Box sx={{ mb: 2 }}>
      <MuiBreadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
      >
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Головна
        </Link>
        {pathnames.map((name, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const label = routeLabels[name] || name;

          // Якщо це ID (ObjectId), показуємо "Деталі" або "Редагування"
          if (name.match(/^[0-9a-fA-F]{24}$/)) {
            const prevName = pathnames[index - 1];
            if (prevName === 'users') {
              if (pathnames[index + 1] === 'edit') {
                return (
                  <Typography key={name} color="text.primary">
                    Редагування користувача
                  </Typography>
                );
              }
              return (
                <Typography key={name} color="text.primary">
                  Деталі користувача
                </Typography>
              );
            }
            return (
              <Typography key={name} color="text.primary">
                Деталі
              </Typography>
            );
          }

          // Якщо це "edit", показуємо "Редагування"
          if (name === 'edit') {
            return (
              <Typography key={name} color="text.primary">
                Редагування
              </Typography>
            );
          }

          // Якщо це "manual", показуємо "Ручні операції"
          if (name === 'manual') {
            return (
              <Typography key={name} color="text.primary">
                Ручні операції
              </Typography>
            );
          }

          return isLast ? (
            <Typography key={name} color="text.primary">
              {label}
            </Typography>
          ) : (
            <Link
              key={name}
              to={routeTo}
              style={{
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              {label}
            </Link>
          );
        })}
      </MuiBreadcrumbs>
    </Box>
  );
};

export default Breadcrumbs;

