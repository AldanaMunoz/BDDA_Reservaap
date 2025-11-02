const express = require('express');
const router = express.Router();
const metricsController = require('../controllers/metricsController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/reservas-por-dia', authenticateToken, metricsController.getReservasPorDia);
router.get('/reservas-por-dia/temporada', authenticateToken, metricsController.getReservasPorDiaTemporada);
router.get('/reservas-por-dia/detalle', authenticateToken, metricsController.getReservasPorDiaDetalle);
router.get('/reservas-por-dia/fecha', authenticateToken, metricsController.getReservasFechaEspecifica);
router.get('/asistencia', authenticateToken, metricsController.getPorcentajeAsistencia);
router.get('/asistencia/temporada', authenticateToken, metricsController.getAsistenciaTemporada);
router.get('/asistencia/mes', authenticateToken, metricsController.getAsistenciaMes);
router.get('/asistencia/dia', authenticateToken, metricsController.getAsistenciaDia);
router.get('/asistencia/exportar', authenticateToken, metricsController.exportarAsistencia);
router.get('/preferencias', authenticateToken, metricsController.getPreferenciasAlimenticias);
router.get('/preferencias/temporada', authenticateToken, metricsController.getPreferenciasTemporada);
router.get('/preferencias/mes', authenticateToken, metricsController.getPreferenciasMes);
router.get('/preferencias/dia', authenticateToken, metricsController.getPreferenciasDia);
router.get('/consumo-tipo', authenticateToken, metricsController.getConsumoPorTipo);
router.get('/consumo-tipo/temporada', authenticateToken, metricsController.getConsumoTipoTemporada);
router.get('/consumo-tipo/mes', authenticateToken, metricsController.getConsumoTipoMes);
router.get('/consumo-tipo/dia', authenticateToken, metricsController.getConsumoTipoDia);
router.get('/top-usuarios', authenticateToken, metricsController.getTopUsuarios);
router.get('/detalle-asistencia', authenticateToken, metricsController.getDetalleAsistencia);
router.get('/consumo-usuario', authenticateToken, metricsController.getConsumoPorUsuario);

module.exports = router;