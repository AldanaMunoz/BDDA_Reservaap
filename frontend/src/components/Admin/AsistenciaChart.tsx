import { useEffect, useState } from 'react';
import { metricsService, type AsistenciaData } from '../../services/metricsService';
import MetricCard from './MetricCard';
import SemaforoIndicator from './SemaforoIndicator';
import './AsistenciaChart.css';

function AsistenciaChart() {
  const [data, setData] = useState<AsistenciaData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const result = await metricsService.getAsistencia();
      setData(result);
    } catch (error) {
      console.error('Error cargando asistencia:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <MetricCard title="Porcentaje de asistencia"><p>Cargando...</p></MetricCard>;
  if (!data) return <MetricCard title="Porcentaje de asistencia"><p>No hay datos disponibles</p></MetricCard>;

  const total = data.reservas_confirmadas + data.no_show + data.canceladas;

  return (
    <MetricCard title="Porcentaje de asistencia">
      <div className="asistencia-container">
        <div className="asistencia-main">
          <SemaforoIndicator status={data.semaforo} size="large" />
          <div className="asistencia-percentage">
            {Number(data.porcentaje_asistencia || 0).toFixed(1)}%
          </div>
          <p className="asistencia-label">Tasa de asistencia</p>
        </div>

        <div className="asistencia-stats">
          <div className="stat-item confirmadas">
            <div className="stat-value">{data.reservas_confirmadas}</div>
            <div className="stat-label">Confirmadas</div>
            <div className="stat-percent">
              {total > 0 ? ((data.reservas_confirmadas / total) * 100).toFixed(1) : 0}%
            </div>
          </div>

          <div className="stat-item noshow">
            <div className="stat-value">{data.no_show}</div>
            <div className="stat-label">No Show</div>
            <div className="stat-percent">
              {total > 0 ? ((data.no_show / total) * 100).toFixed(1) : 0}%
            </div>
          </div>

          <div className="stat-item canceladas">
            <div className="stat-value">{data.canceladas}</div>
            <div className="stat-label">Canceladas</div>
            <div className="stat-percent">
              {total > 0 ? ((data.canceladas / total) * 100).toFixed(1) : 0}%
            </div>
          </div>
        </div>
      </div>

    </MetricCard>
  );
}

export default AsistenciaChart;
