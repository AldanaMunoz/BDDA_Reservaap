import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from '../../components/Layout/Sidebar';
import Breadcrumbs from '../../components/Common/Breadcrumbs';
import SemaforoIndicator from '../../components/Admin/SemaforoIndicator';
import { metricsService, type AsistenciaTemporada, type AsistenciaMes, type AsistenciaDia } from '../../services/metricsService';
import './AsistenciaDetail.css';

type ViewLevel = 'temporada' | 'mes' | 'dia';

// Helper para formatear fechas sin problemas de timezone
const formatDateLocal = (dateString: string) => {
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

function AsistenciaDetail() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Estado para determinar el nivel de vista
  const [viewLevel, setViewLevel] = useState<ViewLevel>('temporada');
  const [tipoEmpleado, setTipoEmpleado] = useState('todos');
  const [estadosSeleccionados, setEstadosSeleccionados] = useState<string[]>(['confirmada', 'noshow', 'cancelada']);
  const [loading, setLoading] = useState(true);
  
  // Datos por nivel
  const [dataTemporada, setDataTemporada] = useState<AsistenciaTemporada | null>(null);
  const [dataMes, setDataMes] = useState<AsistenciaMes | null>(null);
  const [dataDia, setDataDia] = useState<AsistenciaDia | null>(null);
  
  // Parámetros de navegación
  const [selectedAnio, setSelectedAnio] = useState<number | null>(null);
  const [selectedMes, setSelectedMes] = useState<number | null>(null);
  const [selectedFecha, setSelectedFecha] = useState<string | null>(null);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  useEffect(() => {
    // Leer parámetros de URL
    const nivel = searchParams.get('nivel') as ViewLevel || 'temporada';
    const anio = searchParams.get('anio');
    const mes = searchParams.get('mes');
    const fecha = searchParams.get('fecha');
    const tipo = searchParams.get('tipo') || 'todos';
    const estados = searchParams.get('estados') || 'confirmada,noshow,cancelada';
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '25';

    setViewLevel(nivel);
    setTipoEmpleado(tipo);
    setEstadosSeleccionados(estados.split(','));
    setCurrentPage(parseInt(page));
    setItemsPerPage(parseInt(limit));
    
    if (anio) setSelectedAnio(parseInt(anio));
    if (mes) setSelectedMes(parseInt(mes));
    if (fecha) setSelectedFecha(fecha);
    
    loadData(nivel, anio, mes, fecha, tipo, estados, parseInt(page), parseInt(limit));
  }, [searchParams]);

  const loadData = async (
    nivel: ViewLevel,
    anio: string | null,
    mes: string | null,
    fecha: string | null,
    tipo: string,
    estado: string,
    page: number,
    limit: number
  ) => {
    try {
      setLoading(true);

      if (nivel === 'temporada') {
        const data = await metricsService.getAsistenciaTemporada(undefined, tipo);
        setDataTemporada(data);
      } else if (nivel === 'mes' && anio && mes) {
        const data = await metricsService.getAsistenciaMes(parseInt(anio), parseInt(mes), tipo);
        setDataMes(data);
      } else if (nivel === 'dia' && fecha) {
        const data = await metricsService.getAsistenciaDia(fecha, tipo, estado, page, limit);
        setDataDia(data);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Navegación entre niveles
  const navigateToMes = (anio: number, mes: number) => {
    setSearchParams({
      nivel: 'mes',
      anio: anio.toString(),
      mes: mes.toString(),
      tipo: tipoEmpleado
    });
  };

  const navigateToDia = (fecha: string) => {
    setSearchParams({
      nivel: 'dia',
      fecha: fecha,
      tipo: tipoEmpleado,
      page: '1',
      limit: itemsPerPage.toString()
    });
  };

  const goBack = () => {
    if (viewLevel === 'dia') {
      setSearchParams({
        nivel: 'mes',
        anio: selectedAnio!.toString(),
        mes: selectedMes!.toString(),
        tipo: tipoEmpleado
      });
    } else if (viewLevel === 'mes') {
      setSearchParams({ nivel: 'temporada', tipo: tipoEmpleado });
    } else {
      navigate('/reportes');
    }
  };

  const handleTipoChange = (tipo: string) => {
    const newParams: any = { ...Object.fromEntries(searchParams), tipo };
    if (viewLevel === 'dia') {
      newParams.page = '1'; // Reset pagination
    }
    setSearchParams(newParams);
  };

  const handleEstadoToggle = (estado: string) => {
    let newEstados: string[];
    if (estadosSeleccionados.includes(estado)) {
      newEstados = estadosSeleccionados.filter(e => e !== estado);
      if (newEstados.length === 0) {
        newEstados = [estado];
      }
    } else {
      newEstados = [...estadosSeleccionados, estado];
    }
    const newParams: any = { ...Object.fromEntries(searchParams), estados: newEstados.join(','), page: '1' };
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams({
      ...Object.fromEntries(searchParams),
      page: newPage.toString()
    });
  };

  const handleLimitChange = (newLimit: number) => {
    setSearchParams({
      ...Object.fromEntries(searchParams),
      page: '1',
      limit: newLimit.toString()
    });
  };

  const handleExport = async (formato: 'csv' | 'excel') => {
    if (!selectedFecha) return;
    try {
      await metricsService.exportarAsistencia(selectedFecha, tipoEmpleado, formato);
    } catch (error) {
      console.error('Error exportando:', error);
    }
  };

  const getBreadcrumbs = () => {
    const items = [
      { label: 'Reportes', path: '/reportes' }
    ];

    if (viewLevel === 'temporada') {
      items.push({
          label: 'Asistencia',
          path: ''
      });
    } else if (viewLevel === 'mes' && selectedAnio && selectedMes) {
      items.push({ label: 'Asistencia', path: '/reportes/asistencia' });
      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                     'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      items.push({
          label: `${meses[selectedMes - 1]} ${selectedAnio}`,
          path: ''
      });
    } else if (viewLevel === 'dia' && selectedFecha) {
      items.push({ label: 'Asistencia', path: '/reportes/asistencia' });
      if (selectedAnio && selectedMes) {
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                       'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        items.push({
          label: `${meses[selectedMes - 1]} ${selectedAnio}`,
          path: `/reportes/asistencia?nivel=mes&anio=${selectedAnio}&mes=${selectedMes}&tipo=${tipoEmpleado}`
        });
      }
      items.push({
          label: formatDateLocal(selectedFecha),
          path: ''
      });
    }

    return items;
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
          <h1>Porcentaje de asistencias</h1>
        </div>

        {/* Filtro de tipo de empleado */}
        <div className="filter-tabs-container">
          <div className="filter-tabs">
            <button 
              className={tipoEmpleado === 'todos' ? 'active' : ''}
              onClick={() => handleTipoChange('todos')}
            >
              Todos
            </button>
            <button 
              className={tipoEmpleado === 'interno' ? 'active' : ''}
              onClick={() => handleTipoChange('interno')}
            >
              Interno
            </button>
            <button 
              className={tipoEmpleado === 'externo' ? 'active' : ''}
              onClick={() => handleTipoChange('externo')}
            >
              Externo
            </button>
          </div>
        </div>

        {/* NIVEL 1: Vista de Temporada */}
        {viewLevel === 'temporada' && dataTemporada && (
          <>
            <div className="metric-main-card">
              <h3 className="metric-card-title">
                {dataTemporada.temporada.nombre} - Porcentaje de asistencia real
              </h3>
              
              <div className="metric-display">
                <div className="metric-value-large">
                  {Number(dataTemporada.estadisticas.porcentaje_asistencia || 0).toFixed(1)}%
                </div>
                <SemaforoIndicator status={dataTemporada.estadisticas.semaforo} size="large" />
              </div>

              <div className="metric-breakdown">
                <div className="breakdown-item">
                  <span className="breakdown-label">Confirmadas</span>
                  <span className="breakdown-value">{dataTemporada.estadisticas.confirmadas}</span>
                  <span className="breakdown-percentage">
                    {((dataTemporada.estadisticas.confirmadas / dataTemporada.estadisticas.total) * 100).toFixed(1)}%
                  </span>
                </div>
                
                <div className="breakdown-item warning">
                  <span className="breakdown-label">No Show</span>
                  <span className="breakdown-value">{dataTemporada.estadisticas.no_show}</span>
                  <span className="breakdown-percentage">
                    {((dataTemporada.estadisticas.no_show / dataTemporada.estadisticas.total) * 100).toFixed(1)}%
                  </span>
                </div>
                
                <div className="breakdown-item">
                  <span className="breakdown-label">Canceladas</span>
                  <span className="breakdown-value">{dataTemporada.estadisticas.canceladas}</span>
                  <span className="breakdown-percentage">
                    {((dataTemporada.estadisticas.canceladas / dataTemporada.estadisticas.total) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="detail-table-section">
              <h3 className="section-title">Desglose por mes</h3>
              <div className="clickable-table">
                <div className="table-header-row">
                  <span>Mes</span>
                  <span>Confirmadas</span>
                  <span>No Show</span>
                  <span>Canceladas</span>
                  <span>% Asistencia</span>
                </div>

                {dataTemporada.meses.map((mes, index) => (
                  <div 
                    key={index} 
                    className="table-data-row clickable"
                    onClick={() => navigateToMes(mes.anio, mes.mes)}
                  >
                    <span className="highlight">{mes.nombre_mes} {mes.anio}</span>
                    <span>{mes.confirmadas}</span>
                    <span className="warning-text">{mes.no_show}</span>
                    <span>{mes.canceladas}</span>
                    <span className="percentage">{Number(mes.porcentaje || 0).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* NIVEL 2: Vista de Mes */}
        {viewLevel === 'mes' && dataMes && (
          <>
            <div className="metric-main-card">
              <h3 className="metric-card-title">Porcentaje de asistencia real</h3>
              
              <div className="metric-display">
                <div className="metric-value-large">
                  {Number(dataMes.estadisticas.porcentaje_asistencia || 0).toFixed(1)}%
                </div>
                <SemaforoIndicator status={dataMes.estadisticas.semaforo} size="large" />
              </div>

              <div className="metric-breakdown">
                <div className="breakdown-item">
                  <span className="breakdown-label">Confirmadas</span>
                  <span className="breakdown-value">{dataMes.estadisticas.confirmadas}</span>
                </div>
                
                <div className="breakdown-item warning">
                  <span className="breakdown-label">No Show</span>
                  <span className="breakdown-value">{dataMes.estadisticas.no_show}</span>
                </div>
                
                <div className="breakdown-item">
                  <span className="breakdown-label">Canceladas</span>
                  <span className="breakdown-value">{dataMes.estadisticas.canceladas}</span>
                </div>
              </div>
            </div>

            <div className="detail-table-section">
              <h3 className="section-title">Desglose por día</h3>
              <div className="clickable-table">
                <div className="table-header-row">
                  <span>Fecha</span>
                  <span>Día</span>
                  <span>Confirmadas</span>
                  <span>No Show</span>
                  <span>Canceladas</span>
                  <span>% Asistencia</span>
                </div>

                {dataMes.dias.map((dia, index) => (
                  <div 
                    key={index} 
                    className="table-data-row clickable"
                    onClick={() => navigateToDia(dia.fecha)}
                  >
                    <span className="highlight">{formatDateLocal(dia.fecha)}</span>
                    <span>{dia.dia_semana}</span>
                    <span>{dia.confirmadas}</span>
                    <span className="warning-text">{dia.no_show}</span>
                    <span>{dia.canceladas}</span>
                    <span className="percentage">{Number(dia.porcentaje || 0).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* NIVEL 3: Vista de Día */}
        {viewLevel === 'dia' && dataDia && (
          <>
            <div className="export-buttons">
              <button className="export-btn" onClick={() => handleExport('csv')}>
                📥 Exportar CSV
              </button>
              <button className="export-btn" onClick={() => handleExport('excel')}>
                📥 Exportar Excel
              </button>
            </div>

            {/* Filtro de estado de reserva */}
            <div className="filter-container">
              <label className="filter-label">Filtrar por estado:</label>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={estadosSeleccionados.includes('confirmada')}
                    onChange={() => handleEstadoToggle('confirmada')}
                  />
                  <span>Confirmadas</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={estadosSeleccionados.includes('noshow')}
                    onChange={() => handleEstadoToggle('noshow')}
                  />
                  <span>No Show</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={estadosSeleccionados.includes('cancelada')}
                    onChange={() => handleEstadoToggle('cancelada')}
                  />
                  <span>Canceladas</span>
                </label>
              </div>
            </div>

            <div className="detail-table-section">
              <h3 className="section-title">
                Detalle de reservas - {formatDateLocal(selectedFecha!)}
              </h3>
              
              <div className="detail-table">
                <div className="table-header-row">
                  <span>Nombre y apellido</span>
                  <span>Estado</span>
                  <span>Tipo Empleado</span>
                  <span>Turno</span>
                </div>

                {dataDia.reservas.map((reserva, index) => {
                  const badge = getEstadoBadge(reserva.estado_reserva);
                  return (
                    <div key={index} className="table-data-row">
                      <span>{reserva.nombre_completo}</span>
                      <span>
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: badge.color }}
                        >
                          {badge.text}
                        </span>
                      </span>
                      <span>{reserva.tipo_empleado === 'interno' ? 'Interno' : 'Externo'}</span>
                      <span className="capitalize">{reserva.turno}</span>
                    </div>
                  );
                })}
              </div>

              {/* Paginación */}
              <div className="pagination-controls">
                <div className="pagination-info">
                  Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, dataDia.pagination.total)} de {dataDia.pagination.total} registros
                </div>
                
                <div className="pagination-options">
                  <span>Por página:</span>
                  {[10, 25, 50, 100].map(limit => (
                    <button
                      key={limit}
                      className={itemsPerPage === limit ? 'active' : ''}
                      onClick={() => handleLimitChange(limit)}
                    >
                      {limit}
                    </button>
                  ))}
                </div>

                <div className="pagination-buttons">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    ← Anterior
                  </button>
                  <span className="page-number">
                    Página {currentPage} de {dataDia.pagination.total_pages}
                  </span>
                  <button 
                    disabled={currentPage === dataDia.pagination.total_pages}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const getEstadoBadge = (estado: string) => {
  const badges = {
    confirmada: { text: 'Confirmada', color: '#4CAF50' },
    noshow: { text: 'No Show', color: '#F44336' },
    cancelada: { text: 'Cancelada', color: '#999' }
  };
  return badges[estado as keyof typeof badges] || badges.confirmada;
};

export default AsistenciaDetail;