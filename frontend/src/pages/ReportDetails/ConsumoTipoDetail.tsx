import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from '../../components/Layout/Sidebar';
import Breadcrumbs from '../../components/Common/Breadcrumbs';
import { metricsService, type ConsumoTipoTemporada, type ConsumoTipoMes, type ConsumoTipoDia } from '../../services/metricsService';
import './ConsumoTipoDetail.css';

type ViewLevel = 'temporada' | 'mes' | 'dia';

// Helper para formatear fechas sin problemas de timezone
const formatDateLocal = (dateString: string) => {
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

function ConsumoTipoDetail() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [viewLevel, setViewLevel] = useState<ViewLevel>('temporada');
  const [loading, setLoading] = useState(true);

  // Datos por nivel
  const [dataTemporada, setDataTemporada] = useState<ConsumoTipoTemporada | null>(null);
  const [dataMes, setDataMes] = useState<ConsumoTipoMes | null>(null);
  const [dataDia, setDataDia] = useState<ConsumoTipoDia | null>(null);

  // Parámetros de navegación
  const [selectedAnio, setSelectedAnio] = useState<number | null>(null);
  const [selectedMes, setSelectedMes] = useState<number | null>(null);
  const [selectedFecha, setSelectedFecha] = useState<string | null>(null);

  useEffect(() => {
    const nivel = searchParams.get('nivel') as ViewLevel || 'temporada';
    const anio = searchParams.get('anio');
    const mes = searchParams.get('mes');
    const fecha = searchParams.get('fecha');

    setViewLevel(nivel);

    if (anio) setSelectedAnio(parseInt(anio));
    if (mes) setSelectedMes(parseInt(mes));
    if (fecha) setSelectedFecha(fecha);

    loadData(nivel, anio, mes, fecha);
  }, [searchParams]);

  const loadData = async (
    nivel: ViewLevel,
    anio: string | null,
    mes: string | null,
    fecha: string | null
  ) => {
    try {
      setLoading(true);

      if (nivel === 'temporada') {
        const data = await metricsService.getConsumoTipoTemporada();
        setDataTemporada(data);
      } else if (nivel === 'mes' && anio && mes) {
        const data = await metricsService.getConsumoTipoMes(parseInt(anio), parseInt(mes));
        setDataMes(data);
      } else if (nivel === 'dia' && fecha) {
        const data = await metricsService.getConsumoTipoDia(fecha);
        setDataDia(data);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateToMes = (anio: number, mes: number) => {
    setSearchParams({
      nivel: 'mes',
      anio: anio.toString(),
      mes: mes.toString()
    });
  };

  const navigateToDia = (fecha: string) => {
    setSearchParams({
      nivel: 'dia',
      fecha: fecha
    });
  };

  const goBack = () => {
    if (viewLevel === 'dia') {
      setSearchParams({
        nivel: 'mes',
        anio: selectedAnio!.toString(),
        mes: selectedMes!.toString()
      });
    } else if (viewLevel === 'mes') {
      setSearchParams({ nivel: 'temporada' });
    } else {
      navigate('/reportes');
    }
  };

  const getBreadcrumbs = () => {
    const items = [
      { label: 'Reportes', path: '/reportes' }
    ];

    if (viewLevel === 'temporada') {
      items.push({ label: 'Consumo por Tipo de Empleado' });
    } else if (viewLevel === 'mes' && dataMes) {
      items.push({ label: 'Consumo por Tipo de Empleado', path: '/reportes/consumo-tipo' });
      items.push({ label: `${dataMes.mes.nombre_mes} ${dataMes.mes.anio}` });
    } else if (viewLevel === 'dia' && selectedFecha) {
      items.push({ label: 'Consumo por Tipo de Empleado', path: '/reportes/consumo-tipo' });
      if (selectedAnio && selectedMes) {
        items.push({
          label: `Mes`,
          path: `/reportes/consumo-tipo?nivel=mes&anio=${selectedAnio}&mes=${selectedMes}`
        });
      }
      items.push({ label: formatDateLocal(selectedFecha) });
    }

    return items;
  };

  const getColorForTipo = (tipo: string) => {
    return tipo === 'interno' ? '#709176' : '#FF9800';
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
        <button className="back-button" onClick={goBack}>
          ← Volver
        </button>

        <Breadcrumbs items={getBreadcrumbs()} />

        <div className="detail-header">
          <h1>Consumo mensual por tipo de empleado</h1>
        </div>

        {/* NIVEL 1: Vista de Temporada */}
        {viewLevel === 'temporada' && dataTemporada && (
          <>
            <div className="info-card">
              <h3>📊 {dataTemporada.temporada.nombre}</h3>
              <p>
                Del {new Date(dataTemporada.temporada.fecha_inicio).toLocaleDateString('es-AR')} al{' '}
                {new Date(dataTemporada.temporada.fecha_fin).toLocaleDateString('es-AR')}
              </p>
            </div>

            <div className="consumo-card">
              <h3 className="section-title">Distribución de consumo en la temporada</h3>

              <div className="consumo-bars">
                {dataTemporada.consumo.map((item) => (
                  <div key={item.tipo_empleado} className="consumo-bar-item">
                    <div className="consumo-info-row">
                      <span className="consumo-label">
                        {item.tipo_empleado === 'interno' ? 'Empleados Internos' : 'Empleados Externos'}
                      </span>
                      <span className="consumo-stats">
                        <strong>{item.total_reservas}</strong> reservas
                        <span className="consumo-percentage">({Number(item.porcentaje || 0).toFixed(1)}%)</span>
                      </span>
                    </div>
                    <div className="consumo-bar-bg">
                      <div
                        className="consumo-bar-fill"
                        style={{
                          width: `${item.porcentaje}%`,
                          backgroundColor: getColorForTipo(item.tipo_empleado)
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="meses-grid">
              <h3 className="section-title">Explorar por mes</h3>
              <div className="meses-list">
                {dataTemporada.meses.map((mes, index) => (
                  <div
                    key={index}
                    className="mes-card clickable"
                    onClick={() => navigateToMes(mes.anio, mes.mes)}
                  >
                    <div className="mes-nombre">{mes.nombre_mes}</div>
                    <div className="mes-anio">{mes.anio}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* NIVEL 2: Vista de Mes */}
        {viewLevel === 'mes' && dataMes && (
          <>
            <div className="info-card">
              <h3>📅 {dataMes.mes.nombre_mes} {dataMes.mes.anio}</h3>
            </div>

            <div className="consumo-card">
              <h3 className="section-title">Distribución de consumo en el mes</h3>

              <div className="consumo-bars">
                {dataMes.consumo.map((item) => (
                  <div key={item.tipo_empleado} className="consumo-bar-item">
                    <div className="consumo-info-row">
                      <span className="consumo-label">
                        {item.tipo_empleado === 'interno' ? 'Empleados Internos' : 'Empleados Externos'}
                      </span>
                      <span className="consumo-stats">
                        <strong>{item.total_reservas}</strong> reservas
                        <span className="consumo-percentage">({Number(item.porcentaje || 0).toFixed(1)}%)</span>
                      </span>
                    </div>
                    <div className="consumo-bar-bg">
                      <div
                        className="consumo-bar-fill"
                        style={{
                          width: `${item.porcentaje}%`,
                          backgroundColor: getColorForTipo(item.tipo_empleado)
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="detail-table-section">
              <h3 className="section-title">Días del mes</h3>

              <div className="clickable-table">
                <div className="table-header-row">
                  <span>Fecha</span>
                  <span>Día</span>
                </div>

                {dataMes.dias.map((dia, index) => (
                  <div
                    key={index}
                    className="table-data-row clickable"
                    onClick={() => navigateToDia(dia.fecha)}
                  >
                    <span className="highlight">
                      {formatDateLocal(dia.fecha)}
                    </span>
                    <span>{dia.dia_semana}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* NIVEL 3: Vista de Día */}
        {viewLevel === 'dia' && dataDia && selectedFecha && (
          <>
            <div className="info-card">
              <h3>
                📋 {dataDia.dia_semana} {formatDateLocal(selectedFecha)}
              </h3>
              <p>Total de comidas servidas: {dataDia.detalle_comidas.length}</p>
            </div>

            <div className="consumo-card">
              <h3 className="section-title">Distribución de consumo del día</h3>

              <div className="consumo-bars">
                {dataDia.consumo.map((item) => (
                  <div key={item.tipo_empleado} className="consumo-bar-item">
                    <div className="consumo-info-row">
                      <span className="consumo-label">
                        {item.tipo_empleado === 'interno' ? 'Empleados Internos' : 'Empleados Externos'}
                      </span>
                      <span className="consumo-stats">
                        <strong>{item.total_reservas}</strong> reservas
                        <span className="consumo-percentage">({Number(item.porcentaje || 0).toFixed(1)}%)</span>
                      </span>
                    </div>
                    <div className="consumo-bar-bg">
                      <div
                        className="consumo-bar-fill"
                        style={{
                          width: `${item.porcentaje}%`,
                          backgroundColor: getColorForTipo(item.tipo_empleado)
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="detail-table-section">
              <h3 className="section-title">Detalle de comidas servidas</h3>

              <div className="detail-table">
                <div className="table-header-row-wide">
                  <span>Usuario</span>
                  <span>Tipo</span>
                  <span>Entrada</span>
                  <span>Plato Principal</span>
                  <span>Postre</span>
                  <span>Bebida</span>
                  <span>Restricciones</span>
                </div>

                {dataDia.detalle_comidas.map((comida, index) => (
                  <div key={index} className="table-data-row-wide">
                    <span className="bold">{comida.nombre_usuario}</span>
                    <span>
                      <span
                        className={`tipo-badge ${comida.tipo_empleado === 'interno' ? 'tipo-interno' : 'tipo-externo'}`}
                      >
                        {comida.tipo_empleado === 'interno' ? 'Interno' : 'Externo'}
                      </span>
                    </span>
                    <span className="food-item">{comida.entrada || '-'}</span>
                    <span className="food-item bold">{comida.plato_principal}</span>
                    <span className="food-item">{comida.postre || '-'}</span>
                    <span className="food-item">{comida.bebida}</span>
                    <span className="restrictions">{comida.restricciones || 'Ninguna'}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ConsumoTipoDetail;
