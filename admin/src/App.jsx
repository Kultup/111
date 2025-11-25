import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/ToastProvider';
import ErrorBoundary from './components/ErrorBoundary';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import UserDetailPage from './pages/UserDetailPage';
import UserEditPage from './pages/UserEditPage';
import QuestionsPage from './pages/QuestionsPage';
import CategoriesPage from './pages/CategoriesPage';
import CitiesPage from './pages/CitiesPage';
import PositionsPage from './pages/PositionsPage';
import StatsPage from './pages/StatsPage';
import AchievementsPage from './pages/AchievementsPage';
import ShopPage from './pages/ShopPage';
import PendingApprovalsPage from './pages/PendingApprovalsPage';
import ManualCoinsPage from './pages/ManualCoinsPage';
import KnowledgeBasePage from './pages/KnowledgeBasePage';
import DailyTestsPage from './pages/DailyTestsPage';
import FeedbackPage from './pages/FeedbackPage';
import SettingsPage from './pages/SettingsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import NotificationsPage from './pages/NotificationsPage';
import Layout from './components/Layout';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Завантаження...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="users/:id" element={<UserDetailPage />} />
        <Route path="users/:id/edit" element={<UserEditPage />} />
        <Route path="questions" element={<QuestionsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="cities" element={<CitiesPage />} />
        <Route path="positions" element={<PositionsPage />} />
        <Route path="stats" element={<StatsPage />} />
        <Route path="achievements" element={<AchievementsPage />} />
        <Route path="shop" element={<ShopPage />} />
        <Route path="approvals" element={<PendingApprovalsPage />} />
        <Route path="coins/manual" element={<ManualCoinsPage />} />
        <Route path="knowledge-base" element={<KnowledgeBasePage />} />
        <Route path="daily-tests" element={<DailyTestsPage />} />
        <Route path="feedback" element={<FeedbackPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

