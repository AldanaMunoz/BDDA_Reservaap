import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.roles?.includes('Administrador')) {
      navigate('/reportes');
    } else {
      navigate('/menu');
    }
  }, [user, navigate]);

  return <div>Redirigiendo...</div>;
}

export default Home;