import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './services/queryClient';
import { AuthProvider } from './auth/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SiteProvider } from './context/SiteContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { ToastProvider } from './context/ToastContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { OverviewPage } from './pages/OverviewPage';
import { LiveVisitorsPage } from './pages/LiveVisitorsPage';
import { PagesPage } from './pages/PagesPage';
import { SourcesPage } from './pages/SourcesPage';
import { DevicesPage } from './pages/DevicesPage';
import { SettingsPage } from './pages/SettingsPage';
import { ContactMessagesPage } from './pages/ContactMessagesPage';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <MotionConfig reducedMotion="user">
          <ThemeProvider>
            <ToastProvider>
              <AuthProvider>
                <WorkspaceProvider>
                  <SiteProvider>
                    <BrowserRouter>
                      <Routes>
                        {/* Public Auth Routes */}
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                        <Route path="/reset-password" element={<ResetPasswordPage />} />

                        {/* Protected Admin Dashboard Routes */}
                        <Route
                          element={
                            <ProtectedRoute>
                              <DashboardLayout />
                            </ProtectedRoute>
                          }
                        >
                          <Route path="/" element={<OverviewPage />} />
                          <Route path="/live" element={<LiveVisitorsPage />} />
                          <Route path="/messages" element={<ContactMessagesPage />} />
                          <Route path="/pages" element={<PagesPage />} />
                          <Route path="/sources" element={<SourcesPage />} />
                          <Route path="/devices" element={<DevicesPage />} />
                          <Route path="/settings" element={<SettingsPage />} />
                        </Route>

                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </BrowserRouter>
                  </SiteProvider>
                </WorkspaceProvider>
              </AuthProvider>
            </ToastProvider>
          </ThemeProvider>
        </MotionConfig>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
