import { useEffect, useState } from 'react';
import { metricsService, type ConsumoPorTipo } from '../../services/metricsService';
import MetricCard from './MetricCard';
import './ConsumoPorTipoChart.css';

function ConsumoPorTipoChart() {
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

  if (loading) return <MetricCard title="Consumo mensual por tipo de empleado"><p>Cargando...</p></MetricCard>;

  const total = data.reduce((sum, item) => sum + item.total_consumos, 0);

  return (
    <MetricCard title="Consumo mensual por tipo de empleado">
      <div className="consumo-container">
        {data.map((item) => {
          const porcentaje = total > 0 ? (item.total_consumos / total) * 100 : 0;
          
          return (
            <div key={item.tipo} className="consumo-item">
              <div className="consumo-header">
                <span className="consumo-tipo">
                  {item.tipo === 'interno' ? '👤 Interno' : '🏢 Externo'}
                </span>
                <span className="consumo-cantidad">{item.total_consumos}</span>
              </div>
              
              <div className="consumo-bar">
                <div 
                  className={`consumo-fill ${item.tipo}`}
                  style={{ width: `${porcentaje}%` }}
                />
              </div>
              
              <div className="consumo-stats">
                <span className="consumo-porcentaje">{porcentaje.toFixed(1)}%</span>
                <span className="consumo-costo">
                  ${item.costo_estimado.toLocaleString('es-AR')}
                </span>
              </div>
            </div>
          );
        })}
        
        <div className="consumo-total">
          <span>Total mensual</span>
          <span className="total-value">
            ${data.reduce((sum, item) => sum + item.costo_estimado, 0).toLocaleString('es-AR')}
          </span>
        </div>
      </div>
    </MetricCard>
  );
}

export default ConsumoPorTipoChart;