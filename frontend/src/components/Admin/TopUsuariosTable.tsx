import { useEffect, useState } from 'react';
import { metricsService, type TopUsuario } from '../../services/metricsService';
import MetricCard from './MetricCard';
import SemaforoIndicator from './SemaforoIndicator';
import './TopUsuariosTable.css';

function TopUsuariosTable() {
  const [data, setData] = useState<TopUsuario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const result = await metricsService.getTopUsuarios();
      setData(result);
    } catch (error) {
      console.error('Error cargando top usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <MetricCard title="Historial de consumo por usuario"><p>Cargando...</p></MetricCard>;

  return (
    <MetricCard title="Historial de consumo por usuario en temporada (últimos 30 días)">
      <div className="top-usuarios-table">
        <div className="table-header">
          <span>Usuario</span>
          <span>Reservas</span>
          <span>Uso %</span>
          <span>Estado</span>
        </div>
        
        {data.map((usuario, index) => (
          <div key={index} className="table-row">
            <span className="usuario-nombre">{usuario.usuario}</span>
            <span className="usuario-reservas">{usuario.total_reservas}</span>
            <span className="usuario-porcentaje">{Number(usuario.porcentaje_uso || 0).toFixed(1)}%</span>
            <span className="usuario-semaforo">
              <SemaforoIndicator status={usuario.semaforo} size="small" />
            </span>
          </div>
        ))}
      </div>
    </MetricCard>
  );
}

export default TopUsuariosTable;