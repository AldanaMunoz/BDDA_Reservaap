import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeMenu from './pages/EmployeeMenu';
import ReservasPorDiaDetail from './pages/ReportDetails/ReservasPorDiaDetail';
import AsistenciaDetail from './pages/ReportDetails/AsistenciaDetail';
import PreferenciasDetail from './pages/ReportDetails/PreferenciasDetail';
import ConsumoTipoDetail from './pages/ReportDetails/ConsumoTipoDetail';
import HistorialUsuariosDetail from './pages/ReportDetails/HistorialUsuariosDetail';
import type { ReactNode } from 'react';
import ConsumoUsuarioDetail from './pages/ReportDetails/ConsumoUsuarioDetail';

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
          <Route 
            path="/reportes/reservas-por-dia" 
            element={
              <PrivateRoute allowedRoles={['Administrador']}>
                <ReservasPorDiaDetail />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/reportes/asistencia" 
            element={
              <PrivateRoute allowedRoles={['Administrador']}>
                <AsistenciaDetail />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/reportes/preferencias" 
            element={
              <PrivateRoute allowedRoles={['Administrador']}>
                <PreferenciasDetail />
              </PrivateRoute>
            } 
          />
          <Route
            path="/reportes/consumo-tipo"
            element={
              <PrivateRoute allowedRoles={['Administrador']}>
                <ConsumoTipoDetail />
              </PrivateRoute>
            }
          />
          <Route 
            path="/reportes/historial-usuarios" 
            element={
              <PrivateRoute allowedRoles={['Administrador']}>
                <HistorialUsuariosDetail />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/reportes/consumo-usuario" 
            element={
              <PrivateRoute allowedRoles={['Administrador']}>
                <ConsumoUsuarioDetail />
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
          
          {/* Redirección por defecto */}
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