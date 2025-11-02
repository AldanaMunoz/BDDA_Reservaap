import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';

interface MenuItem {
  path: string;
  label: string;
  roles: string[];
}

const menuItems: MenuItem[] = [
  // menu empleados
  { path: '/menu', label: 'Menú del día', roles: ['Empleado'] },
  { path: '/reserva', label: 'Reserva del día', roles: ['Empleado'] },
  { path: '/historial', label: 'Historial de reservas', roles: ['Empleado'] },
  
  // menu admin
  { path: '/reservas-dia', label: 'Reservas del día', roles: ['Administrador'] },
  { path: '/gestion-comida', label: 'Gestión de comida', roles: ['Administrador'] },
  { path: '/planificacion', label: 'Planificación por temporada', roles: ['Administrador'] },
  { path: '/reportes', label: 'Reportes', roles: ['Administrador'] },
];

function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userRoles = user?.roles || [];
  const filteredMenuItems = menuItems.filter(item => 
    item.roles.some(role => userRoles.includes(role))
  );

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>ReservApp</h2>
      </div>

      <nav className="sidebar-nav">
        {filteredMenuItems.map((item) => (
          <button
            key={item.path}
            className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <span className="user-icon">👤</span>
          <div className="user-details">
            <span className="user-name">
              {user?.nombre} ({user?.roles?.[0]})
            </span>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}

export default Sidebar;