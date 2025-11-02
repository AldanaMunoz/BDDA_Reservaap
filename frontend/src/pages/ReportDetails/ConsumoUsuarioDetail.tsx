import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from '../../components/Layout/Sidebar';
import { metricsService, type ConsumoPorUsuario } from '../../services/metricsService';
import './ConsumoUsuarioDetail.css';

function ConsumoUsuarioDetail() {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ConsumoPorUsuario | null>(null);
  
  // Filtros
  const [mesSeleccionado, setMesSeleccionado] = useState<number>(10); // Octubre por defecto
  const [anioSeleccionado] = useState<number>(2025);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>('');
  const [modoFiltro, setModoFiltro] = useState<'mes' | 'fecha'>('mes');

  const meses = [
    { valor: 9, nombre: 'Septiembre' },
    { valor: 10, nombre: 'Octubre' },
    { valor: 11, nombre: 'Noviembre' }
  ];

  useEffect(() => {
    loadData();
  }, [mesSeleccionado, anioSeleccionado, fechaSeleccionada, modoFiltro]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      let result;
      if (modoFiltro === 'fecha' && fechaSeleccionada) {
        result = await metricsService.getConsumoPorUsuario(undefined, undefined, fechaSeleccionada);
      } else {
        result = await metricsService.getConsumoPorUsuario(mesSeleccionado, anioSeleccionado);
      }
      
      setData(result);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMesChange = (mes: number) => {
    setMesSeleccionado(mes);
    setModoFiltro('mes');
  };

  const handleFechaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fecha = e.target.value;
    setFechaSeleccionada(fecha);
    setModoFiltro('fecha');
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <Sidebar />
        <div className="main-content-detail">
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content-detail">
        <button className="back-button" onClick={() => navigate('/reportes')}>
          ← Volver a Reportes
        </button>

        <div className="detail-header">
          <h1>Reportes</h1>
        </div>

        <div className="filtros-container">
          {/* Selector de Mes */}
          <div className="filtro-mes">
            <h3>Mes</h3>
            <div className="radio-group">
              {meses.map(mes => (
                <label key={mes.valor} className="radio-label">
                  <input
                    type="radio"
                    name="mes"
                    value={mes.valor}
                    checked={modoFiltro === 'mes' && mesSeleccionado === mes.valor}
                    onChange={() => handleMesChange(mes.valor)}
                  />
                  <span>{mes.nombre}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Selector de Fecha */}
          <div className="filtro-fecha">
            <label>Date</label>
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={handleFechaChange}
              min="2025-09-01"
              max="2025-11-21"
            />
            <span className="date-format">MM/DD/YYYY</span>
          </div>
        </div>

        {/* Tabla de usuarios */}
        {data && (
          <div className="usuarios-table-section">
            <div className="table-info">
              <p>
                {modoFiltro === 'fecha' 
                  ? `Mostrando datos del ${new Date(fechaSeleccionada).toLocaleDateString('es-AR')}`
                  : `Mostrando datos de ${meses.find(m => m.valor === mesSeleccionado)?.nombre} ${anioSeleccionado}`
                }
              </p>
              <p>Días laborables: {data.filtro.dias_disponibles}</p>
            </div>

            <div className="usuarios-table">
              <div className="table-header-row">
                <span>Nombre y apellido</span>
                <span>Tipo Empleado</span>
                <span>Porcentaje de consumo</span>
              </div>

              {data.usuarios.map((usuario, index) => {
                const porcentaje = Number(usuario.porcentaje_consumo || 0);
                return (
                  <div key={index} className="table-data-row">
                    <span>{usuario.nombre_completo}</span>
                    <span>{usuario.tipo_empleado === 'interno' ? 'Interno' : 'Externo'}</span>
                    <span className="porcentaje-cell">
                      <div className="porcentaje-bar-container">
                        <div
                          className={`porcentaje-bar ${getPorcentajeColor(porcentaje)}`}
                          style={{ width: `${Math.min(porcentaje, 100)}%` }}
                        >
                          <span className="porcentaje-text">{porcentaje.toFixed(1)}%</span>
                        </div>
                      </div>
                      <span className="reservas-count">({usuario.total_reservas} reservas)</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const getPorcentajeColor = (porcentaje: number): string => {
  if (porcentaje >= 80) return 'verde';
  if (porcentaje >= 50) return 'amarillo';
  return 'rojo';
};

export default ConsumoUsuarioDetail;