import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import StoreManagers from './pages/StoreManagers';
import Roles from './pages/Roles';
import Reviews from './pages/Reviews';
import Orders from './pages/Orders';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import LoyaltyDiscounts from './pages/LoyaltyDiscounts';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="customers" element={<Customers />} />
            <Route path="store-managers" element={<StoreManagers />} />
            <Route path="roles" element={<Roles />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="orders" element={<Orders />} />
            <Route path="loyalty-discounts" element={<LoyaltyDiscounts />} />
            <Route path="loyalty" element={<LoyaltyDiscounts />} />
            <Route path="discounts" element={<LoyaltyDiscounts />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
