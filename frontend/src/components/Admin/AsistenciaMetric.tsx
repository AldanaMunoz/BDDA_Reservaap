import { useEffect, useState } from 'react';
import { metricsService, type AsistenciaData } from '../../services/metricsService';
import MetricCard from './MetricCard';
import SemaforoIndicator from './SemaforoIndicator';
import './AsistenciaMetric.css';

function AsistenciaMetric() {
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

  if (loading) return <MetricCard title="Porcentaje de asistencia real"><p>Cargando...</p></MetricCard>;
  if (!data) return <MetricCard title="Porcentaje de asistencia real"><p>Sin datos</p></MetricCard>;

  const total = data.reservas_confirmadas + data.no_show + data.canceladas;

  return (
    <MetricCard title="Porcentaje de asistencia real">
      <div className="asistencia-container">
        <div className="asistencia-main">
          <div className="porcentaje-grande">
            {Number(data.porcentaje_asistencia || 0).toFixed(1)}%
          </div>
          <SemaforoIndicator status={data.semaforo} size="large" />
        </div>
        
        <div className="asistencia-desglose">
          <div className="desglose-item">
            <span className="desglose-label">Confirmadas</span>
            <span className="desglose-value">{data.reservas_confirmadas}</span>
            <span className="desglose-porcentaje">
              {((data.reservas_confirmadas / total) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="desglose-item">
            <span className="desglose-label">No Show</span>
            <span className="desglose-value warning">{data.no_show}</span>
            <span className="desglose-porcentaje">
              {((data.no_show / total) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="desglose-item">
            <span className="desglose-label">Canceladas</span>
            <span className="desglose-value">{data.canceladas}</span>
            <span className="desglose-porcentaje">
              {((data.canceladas / total) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </MetricCard>
  );
}

export default AsistenciaMetric;