import { useEffect, useState } from 'react';
import { metricsService, type ConsumoPorTipo } from '../../services/metricsService';
import MetricCard from './MetricCard';
import './ConsumoTipoChart.css';

function ConsumoTipoChart() {
  const [data, setData] = useState<ConsumoPorTipo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const result = await metricsService.getConsumoPorTipo();
      setData(result);
    } catch (error) {
      console.error('Error cargando consumo por tipo:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <MetricCard title="Consumo por tipo de empleado"><p>Cargando...</p></MetricCard>;

  const totalConsumos = data.reduce((sum, item) => sum + item.total_consumos, 0);
  const totalCosto = data.reduce((sum, item) => sum + Number(item.costo_estimado || 0), 0);

  return (
    <MetricCard title="Consumo por tipo de empleado">
      <div className="consumo-container">
        <div className="consumo-cards">
          {data.map((item) => {
            const porcentaje = totalConsumos > 0 ? (item.total_consumos / totalConsumos) * 100 : 0;

            return (
              <div key={item.tipo} className={`consumo-card consumo-${item.tipo}`}>
                <div className="consumo-header">
                  <h3>{item.tipo === 'interno' ? 'Internos' : 'Externos'}</h3>
                  <div className="consumo-icon">
                    {item.tipo === 'interno' }
                  </div>
                </div>

                <div className="consumo-stats">
                  <div className="stat">
                    <div className="stat-label">Consumos</div>
                    <div className="stat-value">{item.total_consumos}</div>
                  </div>

                  <div className="stat">
                    <div className="stat-label">Costo estimado</div>
                    <div className="stat-value">${Number(item.costo_estimado || 0).toLocaleString()}</div>
                  </div>

                  <div className="stat">
                    <div className="stat-label">% del total</div>
                    <div className="stat-value">{porcentaje.toFixed(1)}%</div>
                  </div>
                </div>

                <div className="consumo-bar">
                  <div
                    className="consumo-bar-fill"
                    style={{ width: `${porcentaje}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="consumo-total">
          <div className="total-item">
            <span className="total-label">Total consumos:</span>
            <span className="total-value">{totalConsumos}</span>
          </div>
          <div className="total-item">
            <span className="total-label">Costo total estimado:</span>
            <span className="total-value">${totalCosto.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </MetricCard>
  );
}

export default ConsumoTipoChart;
