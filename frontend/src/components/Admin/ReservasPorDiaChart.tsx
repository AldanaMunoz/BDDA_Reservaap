import { useEffect, useState } from 'react';
import { metricsService, type ReservaPorDia } from '../../services/metricsService';
import MetricCard from './MetricCard';
import SemaforoIndicator from './SemaforoIndicator';
import './ReservasPorDiaChart.css';

function ReservasPorDiaChart() {
  const [data, setData] = useState<ReservaPorDia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const result = await metricsService.getReservasPorDia();
      setData(result);
    } catch (error) {
      console.error('Error cargando reservas por día:', error);
    } finally {
      setLoading(false);
    }
  };

  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  if (loading) return <MetricCard title="Reservas por día de la semana"><p>Cargando...</p></MetricCard>;

  const maxReservas = Math.max(...data.map(d => d.total_reservas));

  return (
    <MetricCard title="Cantidad de menús reservados por día de la semana">
      <div className="reservas-chart">
        {diasSemana.map((dia, index) => {
          const diaData = data.find(d => d.dia_numero === index + 2); // DB: domingo=1, lunes=2
          const reservas = diaData?.total_reservas || 0;
          const porcentaje = Number(diaData?.porcentaje_ocupacion || 0);
          const semaforo = diaData?.semaforo || 'rojo';
          const altura = maxReservas > 0 ? (reservas / maxReservas) * 100 : 0;

          return (
            <div key={dia} className="dia-column">
              <div className="bar-container">
                <div 
                  className={`bar bar-${semaforo}`}
                  style={{ height: `${altura}%` }}
                >
                  <span className="bar-value">{reservas}</span>
                </div>
              </div>
              <div className="dia-info">
                <span className="dia-nombre">{dia}</span>
                <div className="dia-stats">
                  <SemaforoIndicator status={semaforo} size="small" />
                  <span className="porcentaje">{porcentaje.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          );
        })}
      
      </div>
    </MetricCard>
  );
}

export default ReservasPorDiaChart;