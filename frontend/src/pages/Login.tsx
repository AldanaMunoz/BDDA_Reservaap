import { useState, type FormEvent, type ChangeEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { type RegisterData } from '../services/authService';
import './Login.css';

interface FormData extends RegisterData {
  email: string;
  password: string;
}

function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    nombre: '',
    apellido: '',
    turno: 'manana',
    tipo: 'interno'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register(formData);
        alert('Registro exitoso. Ahora puedes iniciar sesión');
        setIsRegister(false);
        setFormData({ 
          ...formData, 
          nombre: '', 
          apellido: '', 
          turno: 'manana', 
          tipo: 'interno' 
        });
      } else {
        const response = await login({ email: formData.email, password: formData.password });
        // Redirigir según el rol del usuario
        if (response.user.roles?.includes('Administrador')) {
          navigate('/reportes');
        } else {
          navigate('/menu');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error en la operación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>ReservApp</h1>
        <h2>{isRegister ? 'Registro' : 'Iniciar Sesión'}</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <input
                type="text"
                name="nombre"
                placeholder="Nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="apellido"
                placeholder="Apellido"
                value={formData.apellido}
                onChange={handleChange}
                required
              />
              <select 
                name="turno" 
                value={formData.turno} 
                onChange={handleChange}
              >
                <option value="manana">Mañana</option>
                <option value="tarde">Tarde</option>
                <option value="noche">Noche</option>
              </select>
              <select 
                name="tipo" 
                value={formData.tipo} 
                onChange={handleChange}
              >
                <option value="interno">Interno</option>
                <option value="externo">Externo</option>
              </select>
            </>
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? 'Procesando...' : (isRegister ? 'Registrarse' : 'Ingresar')}
          </button>
        </form>

        <button 
          className="toggle-button" 
          onClick={() => setIsRegister(!isRegister)}
        >
          {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
        </button>
      </div>
    </div>
  );
}

export default Login;