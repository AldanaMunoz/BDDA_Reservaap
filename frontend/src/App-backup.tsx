import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeMenu from './pages/EmployeeMenu';
import type { ReactNode } from 'react';

interface PrivateRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

function PrivateRoute({ children, allowedRoles }: PrivateRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.some(role => user.roles?.includes(role))) {

    if (user.roles?.includes('Administrador')) {
      return <Navigate to="/reportes" />;
    }
    return <Navigate to="/menu" />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Rutas de Administrador */}
          <Route
            path="/reportes"
            element={
              <PrivateRoute allowedRoles={['Administrador']}>
                <AdminDashboard />
              </PrivateRoute>
            }
          />

          {/* Rutas de Empleado */}
          <Route
            path="/menu"
            element={
              <PrivateRoute allowedRoles={['Empleado']}>
                <EmployeeMenu />
              </PrivateRoute>
            }
          />

          {/* Redirección por default */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <RoleBasedRedirect />
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}


function RoleBasedRedirect() {
  const { user } = useAuth();

  if (user?.roles?.includes('Administrador')) {
    return <Navigate to="/reportes" />;
  }

  return <Navigate to="/menu" />;
}

export default App;