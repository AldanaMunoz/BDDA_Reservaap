import { useEffect, useState } from 'react';
import { metricsService, type PreferenciaAlimenticia } from '../../services/metricsService';
import MetricCard from './MetricCard';
import './PreferenciasChart.css';

function PreferenciasChart() {
  const [data, setData] = useState<PreferenciaAlimenticia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const result = await metricsService.getPreferencias();
      setData(result);
    } catch (error) {
      console.error('Error cargando preferencias:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <MetricCard title="Preferencias alimenticias"><p>Cargando...</p></MetricCard>;

  const maxCantidad = Math.max(...data.map(d => d.cantidad_usuarios));

  return (
    <MetricCard title="Preferencias alimenticias">
      <div className="preferencias-chart">
        {data.map((pref) => {
          const altura = maxCantidad > 0 ? (pref.cantidad_usuarios / maxCantidad) * 100 : 0;

          return (
            <div key={pref.restriccion} className="preferencia-item">
              <div className="preferencia-bar-container">
                <div
                  className="preferencia-bar"
                  style={{ height: `${altura}%` }}
                >
                  <span className="preferencia-value">{pref.cantidad_usuarios}</span>
                </div>
              </div>
              <div className="preferencia-info">
                <span className="preferencia-nombre">{pref.restriccion}</span>
                <span className="preferencia-porcentaje">
                  {Number(pref.porcentaje || 0).toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </MetricCard>
  );
}

export default PreferenciasChart;
