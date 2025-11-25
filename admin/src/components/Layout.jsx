import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Button,
  Collapse,
  Badge,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import QuizIcon from '@mui/icons-material/Quiz';
import CategoryIcon from '@mui/icons-material/Category';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import WorkIcon from '@mui/icons-material/Work';
import BarChartIcon from '@mui/icons-material/BarChart';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ApprovalIcon from '@mui/icons-material/Approval';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AssignmentIcon from '@mui/icons-material/Assignment';
import FeedbackIcon from '@mui/icons-material/Feedback';
import SettingsIcon from '@mui/icons-material/Settings';
import HistoryIcon from '@mui/icons-material/History';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { useAuth } from '../context/AuthContext';
import Breadcrumbs from './Breadcrumbs';
import api from '../services/api';

const drawerWidth = 260;
const drawerWidthCollapsed = 72;

// Логічне групування меню
const menuGroups = [
  {
    title: 'Головна',
    items: [
      { text: 'Дашборд', icon: <DashboardIcon />, path: '/' },
    ],
  },
  {
    title: 'Контент',
    items: [
      { text: 'Питання', icon: <QuizIcon />, path: '/questions' },
      { text: 'Категорії', icon: <CategoryIcon />, path: '/categories' },
      { text: 'Ачівки', icon: <EmojiEventsIcon />, path: '/achievements' },
      { text: 'База знань', icon: <MenuBookIcon />, path: '/knowledge-base' },
    ],
  },
  {
    title: 'Користувачі',
    items: [
      { text: 'Користувачі', icon: <PeopleIcon />, path: '/users' },
      { text: 'Міста', icon: <LocationCityIcon />, path: '/cities' },
      { text: 'Посади', icon: <WorkIcon />, path: '/positions' },
    ],
  },
  {
    title: 'Монети та магазин',
    items: [
      { text: 'Магазин', icon: <ShoppingCartIcon />, path: '/shop' },
      { text: 'Ручні операції', icon: <AttachMoneyIcon />, path: '/coins/manual' },
      { text: 'Підтвердження', icon: <ApprovalIcon />, path: '/approvals' },
    ],
  },
  {
    title: 'Аналітика',
    items: [
      { text: 'Статистика', icon: <BarChartIcon />, path: '/stats' },
      { text: 'Щоденні тести', icon: <AssignmentIcon />, path: '/daily-tests' },
    ],
  },
  {
    title: 'Підтримка',
    items: [
      { text: 'Звернення', icon: <FeedbackIcon />, path: '/feedback' },
    ],
  },
  {
    title: 'Налаштування',
    items: [
      { text: 'Система', icon: <SettingsIcon />, path: '/settings' },
      { text: 'Сповіщення', icon: <NotificationsActiveIcon />, path: '/notifications' },
      { text: 'Логи дій', icon: <HistoryIcon />, path: '/audit-logs' },
    ],
  },
];

const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleCollapseToggle = () => {
    setCollapsed(!collapsed);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Отримати кількість непідтверджених покупок та транзакцій
  const fetchPendingCount = async () => {
    try {
      const [purchasesResponse, transactionsResponse] = await Promise.all([
        api.get('/shop/pending-count'),
        api.get('/coins/pending-count'),
      ]);

      const purchasesCount = purchasesResponse.data.success ? purchasesResponse.data.count : 0;
      const transactionsCount = transactionsResponse.data.success ? transactionsResponse.data.count : 0;
      
      setPendingCount(purchasesCount + transactionsCount);
    } catch (error) {
      console.error('Error fetching pending count:', error);
      // Не встановлювати помилку, щоб не блокувати інтерфейс
    }
  };

  // Оновлювати кількість кожні 10 секунд (real-time)
  useEffect(() => {
    if (user) {
      // Завантажити одразу
      fetchPendingCount();
      
      // Оновлювати кожні 10 секунд
      const interval = setInterval(fetchPendingCount, 10000);
      
      // Оновлювати при фокусі на вікно (коли користувач повертається на вкладку)
      const handleFocus = () => {
        fetchPendingCount();
      };
      
      window.addEventListener('focus', handleFocus);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('focus', handleFocus);
      };
    }
  }, [user]);

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          px: collapsed ? 1 : 2,
        }}
      >
        {!collapsed && (
          <Typography variant="h6" noWrap component="div">
            Адмін панель
          </Typography>
        )}
        <IconButton onClick={handleCollapseToggle} size="small">
          {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Toolbar>
      <Divider />
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {menuGroups.map((group, groupIndex) => (
          <Box key={groupIndex}>
            {!collapsed && (
              <Box sx={{ px: 2, py: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                  }}
                >
                  {group.title}
                </Typography>
              </Box>
            )}
            <List dense={collapsed}>
              {group.items.map((item) => {
                // Додати індикацію для пункту "Підтвердження"
                const showBadge = item.path === '/approvals' && pendingCount > 0;
                
                return (
                  <ListItem key={item.text} disablePadding>
                    <ListItemButton
                      selected={isActive(item.path)}
                      onClick={() => navigate(item.path)}
                      sx={{
                        minHeight: 48,
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        px: collapsed ? 1.5 : 2,
                        '&.Mui-selected': {
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          '&:hover': {
                            bgcolor: 'primary.dark',
                          },
                          '& .MuiListItemIcon-root': {
                            color: 'primary.contrastText',
                          },
                        },
                      }}
                      title={collapsed ? item.text : ''}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: collapsed ? 0 : 40,
                          justifyContent: 'center',
                          color: isActive(item.path) && !collapsed ? 'inherit' : 'inherit',
                        }}
                      >
                        {showBadge ? (
                          <Badge badgeContent={pendingCount} color="error" max={99}>
                            {item.icon}
                          </Badge>
                        ) : (
                          item.icon
                        )}
                      </ListItemIcon>
                      {!collapsed && (
                        <ListItemText 
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <span>{item.text}</span>
                              {showBadge && (
                                <Badge badgeContent={pendingCount} color="error" max={99} />
                              )}
                            </Box>
                          } 
                        />
                      )}
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
            {groupIndex < menuGroups.length - 1 && !collapsed && <Divider sx={{ my: 1 }} />}
          </Box>
        ))}
      </Box>
      {!collapsed && (
        <>
          <Divider />
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="textSecondary" noWrap>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="caption" color="textSecondary" noWrap>
              {user?.login}
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );

  const currentDrawerWidth = collapsed ? drawerWidthCollapsed : drawerWidth;

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${currentDrawerWidth}px)` },
          ml: { sm: `${currentDrawerWidth}px` },
          transition: 'width 0.3s, margin 0.3s',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {user?.firstName} {user?.lastName}
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Вийти
          </Button>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{
          width: { sm: currentDrawerWidth },
          flexShrink: { sm: 0 },
          transition: 'width 0.3s',
        }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: currentDrawerWidth,
              transition: 'width 0.3s',
              overflowX: 'hidden',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${currentDrawerWidth}px)` },
          transition: 'width 0.3s',
        }}
      >
        <Toolbar />
        <Breadcrumbs />
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;

