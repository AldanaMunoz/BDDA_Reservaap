import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from '../../components/Layout/Sidebar';
import Breadcrumbs from '../../components/Common/Breadcrumbs';
import { metricsService, type PreferenciasTemporada, type PreferenciasMes, type PreferenciasDia } from '../../services/metricsService';
import './PreferenciasDetail.css';

type ViewLevel = 'temporada' | 'mes' | 'dia';


const formatDateLocal = (dateString: string) => {
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

function PreferenciasDetail() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [viewLevel, setViewLevel] = useState<ViewLevel>('temporada');
  const [categoriaComida, setCategoriaComida] = useState<string>('principal');
  const [loading, setLoading] = useState(true);


  const [dataTemporada, setDataTemporada] = useState<PreferenciasTemporada | null>(null);
  const [dataMes, setDataMes] = useState<PreferenciasMes | null>(null);
  const [dataDia, setDataDia] = useState<PreferenciasDia | null>(null);


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
        const data = await metricsService.getPreferenciasTemporada();
        setDataTemporada(data);
      } else if (nivel === 'mes' && anio && mes) {
        const data = await metricsService.getPreferenciasMes(parseInt(anio), parseInt(mes));
        setDataMes(data);
      } else if (nivel === 'dia' && fecha) {
        const data = await metricsService.getPreferenciasDia(fecha);
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
      items.push({
          label: 'Preferencias Alimenticias',
          path: ''
      });
    } else if (viewLevel === 'mes' && dataMes) {
      items.push({ label: 'Preferencias Alimenticias', path: '/reportes/preferencias' });
      items.push({
          label: `${dataMes.mes.nombre_mes} ${dataMes.mes.anio}`,
          path: ''
      });
    } else if (viewLevel === 'dia' && selectedFecha) {
      items.push({ label: 'Preferencias Alimenticias', path: '/reportes/preferencias' });
      if (selectedAnio && selectedMes) {
        items.push({
          label: `Mes`,
          path: `/reportes/preferencias?nivel=mes&anio=${selectedAnio}&mes=${selectedMes}`
        });
      }
      items.push({
          label: formatDateLocal(selectedFecha),
          path: ''
      });
    }

    return items;
  };

  const getColorForPreferencia = (index: number) => {
    const colors = ['#8BC34A', '#FFC107', '#FF9800', '#F44336', '#9C27B0', '#3F51B5', '#00BCD4'];
    return colors[index % colors.length];
  };

  const getRankingData = () => {
    if (!dataDia) return [];

    switch (categoriaComida) {
      case 'entrada':
        return dataDia.ranking_entradas || [];
      case 'principal':
        return dataDia.ranking_principales || [];
      case 'postre':
        return dataDia.ranking_postres || [];
      case 'bebida':
        return dataDia.ranking_bebidas || [];
      default:
        return [];
    }
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
          <h1>Preferencias alimenticias más frecuentes</h1>
        </div>

        {/* Vista de Temporada */}
        {viewLevel === 'temporada' && dataTemporada && (
          <>
            <div className="info-card">
              <h3>📊 {dataTemporada.temporada.nombre}</h3>
              <p>
                Del {new Date(dataTemporada.temporada.fecha_inicio).toLocaleDateString('es-AR')} al{' '}
                {new Date(dataTemporada.temporada.fecha_fin).toLocaleDateString('es-AR')}
              </p>
            </div>

            <div className="preferencias-card">
              <h3 className="section-title">Distribución de preferencias en la temporada</h3>

              <div className="preferencias-bars">
                {dataTemporada.preferencias.map((pref, index) => (
                  <div key={pref.restriccion} className="preferencia-bar-item">
                    <div className="preferencia-info-row">
                      <span className="preferencia-label">{pref.restriccion}</span>
                      <span className="preferencia-stats">
                        <strong>{pref.total_selecciones}</strong> selecciones
                        <span className="preferencia-percentage">({Number(pref.porcentaje || 0).toFixed(1)}%)</span>
                      </span>
                    </div>
                    <div className="preferencia-bar-bg">
                      <div
                        className="preferencia-bar-fill"
                        style={{
                          width: `${pref.porcentaje}%`,
                          backgroundColor: getColorForPreferencia(index)
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

        {/* Vista de Mes */}
        {viewLevel === 'mes' && dataMes && (
          <>
            <div className="info-card">
              <h3>📅 {dataMes.mes.nombre_mes} {dataMes.mes.anio}</h3>
            </div>

            <div className="preferencias-card">
              <h3 className="section-title">Distribución de preferencias en el mes</h3>

              <div className="preferencias-bars">
                {dataMes.preferencias.map((pref, index) => (
                  <div key={pref.restriccion} className="preferencia-bar-item">
                    <div className="preferencia-info-row">
                      <span className="preferencia-label">{pref.restriccion}</span>
                      <span className="preferencia-stats">
                        <strong>{pref.total_selecciones}</strong> selecciones
                        <span className="preferencia-percentage">({Number(pref.porcentaje || 0).toFixed(1)}%)</span>
                      </span>
                    </div>
                    <div className="preferencia-bar-bg">
                      <div
                        className="preferencia-bar-fill"
                        style={{
                          width: `${pref.porcentaje}%`,
                          backgroundColor: getColorForPreferencia(index)
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

        {/* Vista de Día */}
        {viewLevel === 'dia' && dataDia && selectedFecha && (
          <>
            <div className="info-card">
              <h3>
                📋 {dataDia.dia_semana} {formatDateLocal(selectedFecha)}
              </h3>
              <p>Total de comidas servidas: {dataDia.total_comidas}</p>
            </div>

            <div className="preferencias-card">
              <h3 className="section-title">Distribución de preferencias del día</h3>

              <div className="preferencias-bars">
                {dataDia.preferencias.map((pref, index) => (
                  <div key={pref.restriccion} className="preferencia-bar-item">
                    <div className="preferencia-info-row">
                      <span className="preferencia-label">{pref.restriccion}</span>
                      <span className="preferencia-stats">
                        <strong>{pref.total_selecciones}</strong> selecciones
                        <span className="preferencia-percentage">({Number(pref.porcentaje || 0).toFixed(1)}%)</span>
                      </span>
                    </div>
                    <div className="preferencia-bar-bg">
                      <div
                        className="preferencia-bar-fill"
                        style={{
                          width: `${pref.porcentaje}%`,
                          backgroundColor: getColorForPreferencia(index)
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Filtro de categoría de comida */}
            <div className="filter-tabs-container">
              <div className="filter-tabs">
                <button
                  className={categoriaComida === 'entrada' ? 'active' : ''}
                  onClick={() => setCategoriaComida('entrada')}
                >
                  Entradas
                </button>
                <button
                  className={categoriaComida === 'principal' ? 'active' : ''}
                  onClick={() => setCategoriaComida('principal')}
                >
                  Platos Principales
                </button>
                <button
                  className={categoriaComida === 'postre' ? 'active' : ''}
                  onClick={() => setCategoriaComida('postre')}
                >
                  Postres
                </button>
                <button
                  className={categoriaComida === 'bebida' ? 'active' : ''}
                  onClick={() => setCategoriaComida('bebida')}
                >
                  Bebidas
                </button>
              </div>
            </div>

            <div className="detail-table-section">
              <h3 className="section-title">
                Ranking de {
                  categoriaComida === 'entrada' ? 'Entradas' :
                  categoriaComida === 'principal' ? 'Platos Principales' :
                  categoriaComida === 'postre' ? 'Postres' : 'Bebidas'
                } más pedidos
              </h3>

              <div className="preferencias-bars">
                {getRankingData().map((item, index) => (
                  <div key={`${categoriaComida}-${item.plato}-${index}`} className="preferencia-bar-item">
                    <div className="preferencia-info-row">
                      <span className="preferencia-label">
                        <strong>#{index + 1}</strong> {item.plato}
                      </span>
                      <span className="preferencia-stats">
                        <strong>{item.total_pedidos}</strong> pedidos
                        <span className="preferencia-percentage">({Number(item.porcentaje || 0).toFixed(1)}%)</span>
                      </span>
                    </div>
                    <div className="preferencia-bar-bg">
                      <div
                        className="preferencia-bar-fill"
                        style={{
                          width: `${item.porcentaje}%`,
                          backgroundColor: '#704e2e'
                        }}
                      />
                    </div>
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

export default PreferenciasDetail;
