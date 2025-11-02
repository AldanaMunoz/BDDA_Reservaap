import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from '../../components/Layout/Sidebar';
import TopUsuariosTable from '../../components/Admin/TopUsuariosTable';
import './ReportDetail.css';

function HistorialUsuariosDetail() {
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState('30-dias');
  const [ordenamiento, setOrdenamiento] = useState('mas-reservas');
  const [filtroSemaforo, setFiltroSemaforo] = useState('todos');

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <button className="back-button" onClick={() => navigate('/reportes')}>
          ← Volver a Reportes
        </button>
        
        <div className="page-header">
          <h1>Historial de consumo por usuario</h1>
          <p className="subtitle">Patrones de uso del comedor</p>
        </div>

        <div className="filters-bar">
          <div className="filter-group">
            <label>Período</label>
            <select value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
              <option value="7-dias">Últimos 7 días</option>
              <option value="30-dias">Últimos 30 días</option>
              <option value="temporada-actual">Temporada actual (4 semanas)</option>
              <option value="trimestre">Último trimestre</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Ordenar por</label>
            <select value={ordenamiento} onChange={(e) => setOrdenamiento(e.target.value)}>
              <option value="mas-reservas">Más reservas</option>
              <option value="menos-reservas">Menos reservas</option>
              <option value="mayor-uso">Mayor % de uso</option>
              <option value="menor-uso">Menor % de uso</option>
              <option value="alfabetico">Orden alfabético</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Filtrar por estado</label>
            <select value={filtroSemaforo} onChange={(e) => setFiltroSemaforo(e.target.value)}>
              <option value="todos">Todos</option>
              <option value="verde">🟢 Usuarios frecuentes (&gt;80%)</option>
              <option value="amarillo">🟡 Usuarios moderados (50-80%)</option>
              <option value="rojo">🔴 Usuarios esporádicos (&lt;50%)</option>
            </select>
          </div>
        </div>

        <div className="report-detail-content">
          <TopUsuariosTable />
        </div>
      </div>
    </div>
  );
}

export default HistorialUsuariosDetail;