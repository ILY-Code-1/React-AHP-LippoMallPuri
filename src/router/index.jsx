import { createBrowserRouter, Navigate } from 'react-router-dom'
import LoginPage from '../pages/auth/LoginPage'
import MainLayout from '../layouts/MainLayout'
import AdminLayout from '../layouts/AdminLayout'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import DashboardPage from '../pages/dashboard/DashboardPage'
import DataPage from '../pages/dashboard/DataPage'
import DashboardAdminPage from '../pages/admin/DashboardAdminPage'
import DataAdminPage from '../pages/admin/DataAdminPage'
import DetailReportPage from '../pages/admin/DetailReportPage'
import AHPPage from '../pages/admin/master/AHPPage'
import AreaPage from '../pages/admin/master/AreaPage'
import UserPage from '../pages/admin/master/UserPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <LoginPage />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute role="staff">
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'data', element: <DataPage /> },
    ],
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute role="admin">
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <DashboardAdminPage /> },
      { path: 'data', element: <DataAdminPage /> },
      { path: 'master/ahp', element: <AHPPage /> },
      { path: 'master/area', element: <AreaPage /> },
      { path: 'master/user', element: <UserPage /> },
    ],
  },
  {
    // Standalone full-page report (opened in a new tab from the Data page).
    path: '/admin/detail/:month',
    element: (
      <ProtectedRoute role="admin">
        <DetailReportPage />
      </ProtectedRoute>
    ),
  },
])

export default router
