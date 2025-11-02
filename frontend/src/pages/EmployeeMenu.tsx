import Sidebar from '../components/Layout/Sidebar';
import './EmployeeMenu.css';

function EmployeeMenu() {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <h1>Menú del día</h1>
          <p className="subtitle">No reservado</p>
          <button className="reserve-btn">Reservar</button>
        </div>

        <div className="content-area">
          <p className="placeholder-text">
            Selección de menú en desarrollo
          </p>
        </div>
      </div>
    </div>
  );
}

export default EmployeeMenu;