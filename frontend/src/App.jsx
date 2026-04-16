import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import Layout from './components/common/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ForceChangePassword from './pages/ForceChangePassword';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Roles from './pages/Roles';
import Leads from './pages/Leads';
import Contacts from './pages/Contacts';
import Tickets from './pages/Tickets';
import Tasks from './pages/Tasks';
import Deals from './pages/Deals';
import Accounts from './pages/Accounts';
import ActivitiesPage from './pages/ActivitiesPage';
import Projects from './pages/Projects';
import EmailTemplates from './pages/EmailTemplates';
import Calendar from './pages/Calendar';
import VersionHistory from './pages/VersionHistory';
import PrivateRoute from './components/common/PrivateRoute';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <SocketProvider>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/force-change-password" element={
                  <PrivateRoute><ForceChangePassword /></PrivateRoute>
                } />

                {/* Protected app routes */}
                <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<PrivateRoute screen="dashboard"><Dashboard /></PrivateRoute>} />
                  <Route path="users" element={<PrivateRoute screen="users"><Users /></PrivateRoute>} />
                  <Route path="roles" element={<PrivateRoute screen="roles"><Roles /></PrivateRoute>} />
                  <Route path="leads" element={<PrivateRoute screen="leads"><Leads /></PrivateRoute>} />
                  <Route path="contacts" element={<PrivateRoute screen="contacts"><Contacts /></PrivateRoute>} />
                  <Route path="tickets" element={<PrivateRoute screen="tickets"><Tickets /></PrivateRoute>} />
                  <Route path="tasks" element={<PrivateRoute screen="tasks"><Tasks /></PrivateRoute>} />
                  <Route path="deals" element={<PrivateRoute screen="deals"><Deals /></PrivateRoute>} />
                  <Route path="accounts" element={<PrivateRoute screen="accounts"><Accounts /></PrivateRoute>} />
                  <Route path="calls" element={<PrivateRoute screen="calls"><ActivitiesPage type="call" /></PrivateRoute>} />
                  <Route path="emails" element={<PrivateRoute screen="emails"><ActivitiesPage type="email" /></PrivateRoute>} />
                  <Route path="meetings" element={<PrivateRoute screen="meetings"><ActivitiesPage type="meeting" /></PrivateRoute>} />
                  <Route path="employees" element={<Navigate to="/users" replace />} />
                  <Route path="projects" element={<PrivateRoute screen="projects"><Projects /></PrivateRoute>} />
                  <Route path="calendar" element={<PrivateRoute screen="calendar"><Calendar /></PrivateRoute>} />
                  <Route path="email-templates" element={<PrivateRoute screen="email-templates"><EmailTemplates /></PrivateRoute>} />
                  <Route path="version-history" element={<PrivateRoute><VersionHistory /></PrivateRoute>} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </SocketProvider>
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
