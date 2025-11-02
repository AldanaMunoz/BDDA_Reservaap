const db = require('../config/database');


exports.getAsistenciaTemporada = async (req, res) => {
  try {
    console.log('getAsistenciaTemporada - Iniciando...');
    const { id_temporada, tipo_empleado } = req.query;
    console.log('Tipo empleado:', tipo_empleado);

    let temporadaQuery = `
      SELECT t.id, e.nombre as temporada_nombre, t.fecha_inicio, t.fecha_fin
      FROM temporadas t
      JOIN estaciones e ON e.id = t.id_estacion
      WHERE CURDATE() BETWEEN t.fecha_inicio AND t.fecha_fin
      LIMIT 1
    `;

    if (id_temporada) {
      temporadaQuery = `
        SELECT t.id, e.nombre as temporada_nombre, t.fecha_inicio, t.fecha_fin
        FROM temporadas t
        JOIN estaciones e ON e.id = t.id_estacion
        WHERE t.id = ?
      `;
    }

    console.log('Ejecutando query temporada...');
    const [temporada] = id_temporada
      ? await db.query(temporadaQuery, [id_temporada])
      : await db.query(temporadaQuery);

    console.log('Resultado temporada:', temporada);

    if (!temporada || temporada.length === 0) {
      console.log('No se encontró temporada activa');
      return res.status(404).json({ error: 'No hay temporada activa' });
    }

    const temp = temporada[0];
    console.log('Temporada seleccionada:', temp);

    let tipoFilter = '';
    let statsParams = [temp.fecha_inicio, temp.fecha_fin];

    if (tipo_empleado && tipo_empleado !== 'todos') {
      tipoFilter = 'AND e.tipo = ?';
      statsParams.push(tipo_empleado);
    }

    const [stats] = await db.query(`
      SELECT
        COUNT(CASE WHEN r.estado_reserva = 'confirmada' THEN 1 END) as confirmadas,
        COUNT(CASE WHEN r.estado_reserva = 'noshow' THEN 1 END) as no_show,
        COUNT(CASE WHEN r.estado_reserva = 'cancelada' THEN 1 END) as canceladas,
        COUNT(*) as total,
        ROUND((COUNT(CASE WHEN r.estado_reserva = 'confirmada' THEN 1 END) / COUNT(*)) * 100, 2) as porcentaje_asistencia,
        CASE
          WHEN (COUNT(CASE WHEN r.estado_reserva = 'confirmada' THEN 1 END) / COUNT(*)) * 100 >= 90 THEN 'verde'
          WHEN (COUNT(CASE WHEN r.estado_reserva = 'confirmada' THEN 1 END) / COUNT(*)) * 100 >= 75 THEN 'amarillo'
          ELSE 'rojo'
        END as semaforo
      FROM reservas r
      JOIN usuarios u ON u.id = r.id_usuario
      JOIN personas p ON p.id_usuario = u.id
      JOIN empleados e ON e.id_persona = p.id
      WHERE r.fecha_reservada BETWEEN ? AND ?
      ${tipoFilter}
    `, statsParams);
    
    //POR MES
    const [meses] = await db.query(`
      SELECT
        YEAR(r.fecha_reservada) as anio,
        MONTH(r.fecha_reservada) as mes,
        ANY_VALUE(CASE MONTH(r.fecha_reservada)
          WHEN 1 THEN 'Enero'
          WHEN 2 THEN 'Febrero'
          WHEN 3 THEN 'Marzo'
          WHEN 4 THEN 'Abril'
          WHEN 5 THEN 'Mayo'
          WHEN 6 THEN 'Junio'
          WHEN 7 THEN 'Julio'
          WHEN 8 THEN 'Agosto'
          WHEN 9 THEN 'Septiembre'
          WHEN 10 THEN 'Octubre'
          WHEN 11 THEN 'Noviembre'
          WHEN 12 THEN 'Diciembre'
        END) as nombre_mes,
        COUNT(CASE WHEN r.estado_reserva = 'confirmada' THEN 1 END) as confirmadas,
        COUNT(CASE WHEN r.estado_reserva = 'noshow' THEN 1 END) as no_show,
        COUNT(CASE WHEN r.estado_reserva = 'cancelada' THEN 1 END) as canceladas,
        ROUND((COUNT(CASE WHEN r.estado_reserva = 'confirmada' THEN 1 END) / COUNT(*)) * 100, 2) as porcentaje
      FROM reservas r
      JOIN usuarios u ON u.id = r.id_usuario
      JOIN personas p ON p.id_usuario = u.id
      JOIN empleados e ON e.id_persona = p.id
      WHERE r.fecha_reservada BETWEEN ? AND ?
      ${tipoFilter}
      GROUP BY YEAR(r.fecha_reservada), MONTH(r.fecha_reservada)
      ORDER BY anio, mes
    `, statsParams);
    
    res.json({
      temporada: {
        id: temp.id,
        nombre: temp.temporada_nombre,
        fecha_inicio: temp.fecha_inicio,
        fecha_fin: temp.fecha_fin
      },
      estadisticas: stats[0],
      meses: meses
    });
  } catch (error) {
    console.error('Error en getAsistenciaTemporada:', error);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
};

exports.getAsistenciaMes = async (req, res) => {
  try {
    const { anio, mes, tipo_empleado } = req.query;
    console.log('getAsistenciaMes - Año:', anio, 'Mes:', mes, 'Tipo:', tipo_empleado);

    if (!anio || !mes) {
      return res.status(400).json({ error: 'Se requiere año y mes' });
    }
    
    let tipoFilter = '';
    let params = [anio, mes];
    
    if (tipo_empleado && tipo_empleado !== 'todos') {
      tipoFilter = 'AND e.tipo = ?';
      params.push(tipo_empleado);
    }
    
    const [stats] = await db.query(`
      SELECT 
        COUNT(CASE WHEN r.estado_reserva = 'confirmada' THEN 1 END) as confirmadas,
        COUNT(CASE WHEN r.estado_reserva = 'noshow' THEN 1 END) as no_show,
        COUNT(CASE WHEN r.estado_reserva = 'cancelada' THEN 1 END) as canceladas,
        ROUND((COUNT(CASE WHEN r.estado_reserva = 'confirmada' THEN 1 END) / COUNT(*)) * 100, 2) as porcentaje_asistencia,
        CASE 
          WHEN (COUNT(CASE WHEN r.estado_reserva = 'confirmada' THEN 1 END) / COUNT(*)) * 100 >= 90 THEN 'verde'
          WHEN (COUNT(CASE WHEN r.estado_reserva = 'confirmada' THEN 1 END) / COUNT(*)) * 100 >= 75 THEN 'amarillo'
          ELSE 'rojo'
        END as semaforo
      FROM reservas r
      JOIN usuarios u ON u.id = r.id_usuario
      JOIN personas p ON p.id_usuario = u.id
      JOIN empleados e ON e.id_persona = p.id
      WHERE YEAR(r.fecha_reservada) = ? 
        AND MONTH(r.fecha_reservada) = ?
        ${tipoFilter}
    `, params);
    
    // Desglose por día
    const [dias] = await db.query(`
      SELECT
        DATE(r.fecha_reservada) as fecha_date,
        ANY_VALUE(DATE_FORMAT(r.fecha_reservada, '%Y-%m-%d')) as fecha,
        ANY_VALUE(CASE DAYOFWEEK(r.fecha_reservada)
          WHEN 1 THEN 'Domingo'
          WHEN 2 THEN 'Lunes'
          WHEN 3 THEN 'Martes'
          WHEN 4 THEN 'Miércoles'
          WHEN 5 THEN 'Jueves'
          WHEN 6 THEN 'Viernes'
          WHEN 7 THEN 'Sábado'
        END) as dia_semana,
        COUNT(CASE WHEN r.estado_reserva = 'confirmada' THEN 1 END) as confirmadas,
        COUNT(CASE WHEN r.estado_reserva = 'noshow' THEN 1 END) as no_show,
        COUNT(CASE WHEN r.estado_reserva = 'cancelada' THEN 1 END) as canceladas,
        ROUND((COUNT(CASE WHEN r.estado_reserva = 'confirmada' THEN 1 END) / COUNT(*)) * 100, 2) as porcentaje
      FROM reservas r
      JOIN usuarios u ON u.id = r.id_usuario
      JOIN personas p ON p.id_usuario = u.id
      JOIN empleados e ON e.id_persona = p.id
      WHERE YEAR(r.fecha_reservada) = ?
        AND MONTH(r.fecha_reservada) = ?
        ${tipoFilter}
      GROUP BY fecha_date
      ORDER BY fecha_date
    `, params);
    
    res.json({
      mes: {
        anio: parseInt(anio),
        mes: parseInt(mes),
        tipo_empleado: tipo_empleado || 'todos'
      },
      estadisticas: stats[0],
      dias: dias
    });
  } catch (error) {
    console.error('Error en getAsistenciaMes:', error);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
};

exports.getAsistenciaDia = async (req, res) => {
  try {
    const { fecha, tipo_empleado, estados, page = 1, limit = 25 } = req.query;
    console.log('getAsistenciaDia - Fecha:', fecha, 'Tipo:', tipo_empleado, 'Estados:', estados);

    if (!fecha) {
      return res.status(400).json({ error: 'Se requiere fecha' });
    }

    const offset = (page - 1) * limit;

    let tipoFilter = '';
    let estadoFilter = '';
    let params = [fecha];

    if (tipo_empleado && tipo_empleado !== 'todos') {
      tipoFilter = 'AND e.tipo = ?';
      params.push(tipo_empleado);
    }

    if (estados) {
      const estadosArray = estados.split(',');
      const placeholders = estadosArray.map(() => '?').join(',');
      estadoFilter = `AND r.estado_reserva IN (${placeholders})`;
      params.push(...estadosArray);
    }
    
    const [countResult] = await db.query(`
      SELECT COUNT(*) as total
      FROM reservas r
      JOIN usuarios u ON u.id = r.id_usuario
      JOIN personas p ON p.id_usuario = u.id
      JOIN empleados e ON e.id_persona = p.id
      WHERE DATE(r.fecha_reservada) = ?
        ${tipoFilter}
        ${estadoFilter}
    `, params);

    const total = countResult[0].total;

    params.push(parseInt(limit), offset);

    const [reservas] = await db.query(`
      SELECT
        CONCAT(p.nombre, ' ', p.apellido) as nombre_completo,
        r.fecha_reservada,
        r.estado_reserva,
        e.tipo as tipo_empleado,
        e.turno,
        r.codigo_qr
      FROM reservas r
      JOIN usuarios u ON u.id = r.id_usuario
      JOIN personas p ON p.id_usuario = u.id
      JOIN empleados e ON e.id_persona = p.id
      WHERE DATE(r.fecha_reservada) = ?
        ${tipoFilter}
        ${estadoFilter}
      ORDER BY p.apellido, p.nombre
      LIMIT ? OFFSET ?
    `, params);
    
    res.json({
      fecha: fecha,
      tipo_empleado: tipo_empleado || 'todos',
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        total_pages: Math.ceil(total / limit)
      },
      reservas: reservas
    });
  } catch (error) {
    console.error('Error en getAsistenciaDia:', error);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
};

exports.getReservasPorDia = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        DAYNAME(fecha_reservada) as dia_semana,
        DAYOFWEEK(fecha_reservada) as dia_numero,
        COUNT(*) as total_reservas,
        ROUND((COUNT(*) / 200) * 100, 2) as porcentaje_ocupacion,
        CASE 
          WHEN (COUNT(*) / 200) * 100 >= 80 AND (COUNT(*) / 200) * 100 <= 100 THEN 'verde'
          WHEN (COUNT(*) / 200) * 100 >= 50 THEN 'amarillo'
          ELSE 'rojo'
        END as semaforo
      FROM reservas
      WHERE estado_reserva = 'confirmada'
        AND fecha_reservada >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DAYNAME(fecha_reservada), DAYOFWEEK(fecha_reservada)
      ORDER BY dia_numero
    `);

    res.json(rows);
  } catch (error) {
    console.error('Error en getReservasPorDia:', error);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
};

exports.exportarAsistencia = async (req, res) => {
  try {
    const { fecha, tipo_empleado, formato } = req.query;
    
    if (!fecha) {
      return res.status(400).json({ error: 'Se requiere fecha' });
    }
    
    let tipoFilter = '';
    let params = [fecha];
    
    if (tipo_empleado && tipo_empleado !== 'todos') {
      tipoFilter = 'AND e.tipo = ?';
      params.push(tipo_empleado);
    }
    
    const [reservas] = await db.query(`
      SELECT 
        CONCAT(p.nombre, ' ', p.apellido) as 'Nombre y Apellido',
        DATE_FORMAT(r.fecha_reservada, '%d/%m/%Y') as 'Fecha',
        CASE 
          WHEN r.estado_reserva = 'confirmada' THEN 'Confirmada'
          WHEN r.estado_reserva = 'noshow' THEN 'No Show'
          WHEN r.estado_reserva = 'cancelada' THEN 'Cancelada'
        END as 'Estado',
        CASE 
          WHEN e.tipo = 'interno' THEN 'Interno'
          WHEN e.tipo = 'externo' THEN 'Externo'
        END as 'Tipo Empleado',
        e.turno as 'Turno',
        r.codigo_qr as 'Código QR'
      FROM reservas r
      JOIN usuarios u ON u.id = r.id_usuario
      JOIN personas p ON p.id_usuario = u.id
      JOIN empleados e ON e.id_persona = p.id
      WHERE DATE(r.fecha_reservada) = ?
        ${tipoFilter}
      ORDER BY p.apellido, p.nombre
    `, params);
    
    if (formato === 'csv') {
      // GENERA CSV
      const headers = Object.keys(reservas[0] || {});
      const csvRows = [headers.join(',')];
      
      reservas.forEach(row => {
        const values = headers.map(header => {
          const escaped = ('' + row[header]).replace(/"/g, '\\"');
          return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
      });
      
      const csvContent = csvRows.join('\n');
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=asistencia_${fecha}.csv`);
      res.send('\uFEFF' + csvContent); 
    } else {
      res.json(reservas);
    }
  } catch (error) {
    console.error('Error en exportarAsistencia:', error);
    res.status(500).json({ error: 'Error al exportar datos' });
  }
};

exports.getPorcentajeAsistencia = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        COUNT(CASE WHEN estado_reserva = 'confirmada' THEN 1 END) as reservas_confirmadas,
        COUNT(CASE WHEN estado_reserva = 'noshow' THEN 1 END) as no_show,
        COUNT(CASE WHEN estado_reserva = 'cancelada' THEN 1 END) as canceladas,
        ROUND((COUNT(CASE WHEN estado_reserva = 'confirmada' THEN 1 END) / 
               COUNT(*)) * 100, 2) as porcentaje_asistencia,
        CASE 
          WHEN (COUNT(CASE WHEN estado_reserva = 'confirmada' THEN 1 END) / COUNT(*)) * 100 >= 90 THEN 'verde'
          WHEN (COUNT(CASE WHEN estado_reserva = 'confirmada' THEN 1 END) / COUNT(*)) * 100 >= 75 THEN 'amarillo'
          ELSE 'rojo'
        END as semaforo
      FROM reservas
      WHERE fecha_reservada >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `);

    res.json(rows[0]);
  } catch (error) {
    console.error('Error en getPorcentajeAsistencia:', error);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
};

exports.getPreferenciasAlimenticias = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        COALESCE(cr.nombre, 'Sin restricción') as restriccion,
        COUNT(DISTINCT u.id) as cantidad_usuarios,
        ROUND((COUNT(DISTINCT u.id) / (SELECT COUNT(*) FROM usuarios WHERE activo = 1)) * 100, 2) as porcentaje
      FROM usuarios u
      LEFT JOIN usuario_restricciones ur ON ur.id_usuario = u.id
      LEFT JOIN comidas_restricciones cr ON cr.id = ur.id_restriccion
      WHERE u.activo = 1
      GROUP BY cr.nombre
      ORDER BY cantidad_usuarios DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error('Error en getPreferenciasAlimenticias:', error);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
};

exports.getConsumoPorTipo = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        e.tipo,
        COUNT(r.id) as total_consumos,
        CASE 
          WHEN e.tipo = 'interno' THEN COUNT(r.id) * 1500
          WHEN e.tipo = 'externo' THEN COUNT(r.id) * 2500
        END as costo_estimado
      FROM reservas r
      JOIN usuarios u ON u.id = r.id_usuario
      JOIN personas p ON p.id_usuario = u.id
      JOIN empleados e ON e.id_persona = p.id
      WHERE MONTH(r.fecha_reservada) = MONTH(CURDATE())
        AND YEAR(r.fecha_reservada) = YEAR(CURDATE())
        AND r.estado_reserva = 'confirmada'
      GROUP BY e.tipo
    `);

    res.json(rows);
  } catch (error) {
    console.error('Error en getConsumoPorTipo:', error);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
};

exports.getTopUsuarios = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        CONCAT(p.nombre, ' ', p.apellido) as usuario,
        COUNT(r.id) as total_reservas,
        ROUND((COUNT(r.id) / 20) * 100, 2) as porcentaje_uso,
        CASE 
          WHEN (COUNT(r.id) / 20) * 100 > 80 THEN 'verde'
          WHEN (COUNT(r.id) / 20) * 100 >= 50 THEN 'amarillo'
          ELSE 'rojo'
        END as semaforo
      FROM usuarios u
      JOIN personas p ON p.id_usuario = u.id
      LEFT JOIN reservas r ON r.id_usuario = u.id 
        AND r.fecha_reservada >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      WHERE u.activo = 1
      GROUP BY u.id, p.nombre, p.apellido
      ORDER BY total_reservas DESC
      LIMIT 10
    `);

    res.json(rows);
  } catch (error) {
    console.error('Error en getTopUsuarios:', error);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
};


exports.getDetalleAsistencia = async (req, res) => {
  try {
    const { fecha, tipo_empleado } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (fecha) {
      whereClause += ' AND DATE(r.fecha_reservada) = ?';
      params.push(fecha);
    }

    if (tipo_empleado && tipo_empleado !== 'todos') {
      whereClause += ' AND e.tipo = ?';
      params.push(tipo_empleado);
    }

    const [rows] = await db.query(`
      SELECT
        p.nombre,
        p.apellido,
        r.fecha_reservada as dia_reserva,
        r.estado_reserva as estado,
        e.tipo as tipo_empleado
      FROM reservas r
      JOIN usuarios u ON u.id = r.id_usuario
      JOIN personas p ON p.id_usuario = u.id
      JOIN empleados e ON e.id_persona = p.id
      ${whereClause}
      ORDER BY r.fecha_reservada DESC, p.apellido, p.nombre
    `, params);

    res.json(rows);
  } catch (error) {
    console.error('Error en getDetalleAsistencia:', error);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
};

exports.getReservasPorDiaTemporada = async (req, res) => {
  try {
    const { id_temporada } = req.query;
    
    let temporadaQuery = `
      SELECT t.id, e.nombre as temporada_nombre, t.fecha_inicio, t.fecha_fin 
      FROM temporadas t
      JOIN estaciones e ON e.id = t.id_estacion
      WHERE CURDATE() BETWEEN t.fecha_inicio AND t.fecha_fin
      LIMIT 1
    `;
    
    if (id_temporada) {
      temporadaQuery = `
        SELECT t.id, e.nombre as temporada_nombre, t.fecha_inicio, t.fecha_fin 
        FROM temporadas t
        JOIN estaciones e ON e.id = t.id_estacion
        WHERE t.id = ?
      `;
    }
    
    const [temporada] = id_temporada 
      ? await db.query(temporadaQuery, [id_temporada])
      : await db.query(temporadaQuery);
    
    if (!temporada || temporada.length === 0) {
      return res.status(404).json({ error: 'No hay temporada activa' });
    }
    
    const temp = temporada[0];
    const capacidadMaxima = 800;
    
    const [diasSemana] = await db.query(`
      SELECT 
        DAYNAME(fecha_reservada) as dia_semana,
        DAYOFWEEK(fecha_reservada) as dia_numero,
        COUNT(*) as total_reservas,
        ROUND((COUNT(*) / ?) * 100, 2) as porcentaje_ocupacion,
        CASE 
          WHEN (COUNT(*) / ?) * 100 >= 80 AND (COUNT(*) / ?) * 100 <= 100 THEN 'verde'
          WHEN (COUNT(*) / ?) * 100 >= 50 THEN 'amarillo'
          ELSE 'rojo'
        END as semaforo
      FROM reservas
      WHERE fecha_reservada BETWEEN ? AND ?
        AND estado_reserva = 'confirmada'
        AND DAYOFWEEK(fecha_reservada) BETWEEN 2 AND 6
      GROUP BY DAYNAME(fecha_reservada), DAYOFWEEK(fecha_reservada)
      ORDER BY dia_numero
    `, [capacidadMaxima, capacidadMaxima, capacidadMaxima, capacidadMaxima, temp.fecha_inicio, temp.fecha_fin]);
    
    // PROMEDIO 
    const diasConPromedio = diasSemana.map(dia => {
      return {
        ...dia,
        promedio_reservas: Math.round(dia.total_reservas)
      };
    });
    
    res.json({
      temporada: {
        id: temp.id,
        nombre: temp.temporada_nombre,
        fecha_inicio: temp.fecha_inicio,
        fecha_fin: temp.fecha_fin
      },
      capacidad_maxima: capacidadMaxima,
      dias_semana: diasConPromedio
    });
  } catch (error) {
    console.error('Error en getReservasPorDiaTemporada:', error);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
};

exports.getReservasPorDiaDetalle = async (req, res) => {
  try {
    const { dia_semana } = req.query;
    
    if (!dia_semana) {
      return res.status(400).json({ error: 'Se requiere dia_semana' });
    }
    
    
    const [temporada] = await db.query(`
      SELECT t.id, e.nombre as temporada_nombre, t.fecha_inicio, t.fecha_fin 
      FROM temporadas t
      JOIN estaciones e ON e.id = t.id_estacion
      WHERE CURDATE() BETWEEN t.fecha_inicio AND t.fecha_fin
      LIMIT 1
    `);
    
    if (!temporada || temporada.length === 0) {
      return res.status(404).json({ error: 'No hay temporada activa' });
    }
    
    const temp = temporada[0];
    const capacidadMaxima = 800;
    

    const [fechas] = await db.query(`
      SELECT 
        DATE(fecha_reservada) as fecha,
        COUNT(*) as total_reservas,
        ROUND((COUNT(*) / ?) * 100, 2) as porcentaje_ocupacion,
        CASE 
          WHEN (COUNT(*) / ?) * 100 >= 80 AND (COUNT(*) / ?) * 100 <= 100 THEN 'verde'
          WHEN (COUNT(*) / ?) * 100 >= 50 THEN 'amarillo'
          ELSE 'rojo'
        END as semaforo
      FROM reservas
      WHERE fecha_reservada BETWEEN ? AND ?
        AND DAYNAME(fecha_reservada) = ?
        AND estado_reserva = 'confirmada'
        AND DAYOFWEEK(fecha_reservada) BETWEEN 2 AND 6
      GROUP BY DATE(fecha_reservada)
      ORDER BY fecha DESC
    `, [capacidadMaxima, capacidadMaxima, capacidadMaxima, capacidadMaxima, temp.fecha_inicio, temp.fecha_fin, dia_semana]);
    
    console.log(`Encontradas ${fechas.length} fechas`);
    
    res.json({
      temporada: {
        id: temp.id,
        nombre: temp.temporada_nombre,
        fecha_inicio: temp.fecha_inicio,
        fecha_fin: temp.fecha_fin
      },
      dia_semana: dia_semana,
      capacidad_maxima: capacidadMaxima,
      fechas: fechas
    });
  } catch (error) {
    console.error('Error en getReservasPorDiaDetalle:', error);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
};

exports.getReservasFechaEspecifica = async (req, res) => {
  try {
    const { fecha, page = 1, limit = 25 } = req.query;
    
    if (!fecha) {
      return res.status(400).json({ error: 'Se requiere fecha' });
    }
    
    
    const offset = (page - 1) * limit;
    
    const [countResult] = await db.query(`
      SELECT COUNT(*) as total
      FROM reservas r
      WHERE DATE(r.fecha_reservada) = ?
        AND r.estado_reserva = 'confirmada'
    `, [fecha]);
    
    const total = countResult[0].total;
    
    
    const [reservas] = await db.query(`
      SELECT 
        CONCAT(p.nombre, ' ', p.apellido) as nombre_completo,
        e.tipo as tipo_empleado,
        e.turno,
        ce.nombre as entrada,
        cp.nombre as plato_principal,
        cpo.nombre as postre,
        cb.nombre as bebida,
        r.codigo_qr
      FROM reservas r
      JOIN usuarios u ON u.id = r.id_usuario
      JOIN personas p ON p.id_usuario = u.id
      JOIN empleados e ON e.id_persona = p.id
      LEFT JOIN comidas ce ON ce.id = r.id_comida_entrada
      LEFT JOIN comidas cp ON cp.id = r.id_comida_principal
      LEFT JOIN comidas cpo ON cpo.id = r.id_comida_postre
      LEFT JOIN comidas cb ON cb.id = r.id_comida_bebida
      WHERE DATE(r.fecha_reservada) = ?
        AND r.estado_reserva = 'confirmada'
      ORDER BY p.apellido, p.nombre
      LIMIT ? OFFSET ?
    `, [fecha, parseInt(limit), offset]);
        
    res.json({
      fecha: fecha,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        total_pages: Math.ceil(total / limit)
      },
      reservas: reservas
    });
  } catch (error) {
    console.error('Error en getReservasFechaEspecifica:', error);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
};

// PREFERENCIAS ALIMENTICIAS 

exports.getPreferenciasTemporada = async (req, res) => {
  try {
    const { id_temporada } = req.query;
    
    let temporadaQuery = `
      SELECT t.id, e.nombre as temporada_nombre, t.fecha_inicio, t.fecha_fin
      FROM temporadas t
      JOIN estaciones e ON e.id = t.id_estacion
      WHERE CURDATE() BETWEEN t.fecha_inicio AND t.fecha_fin
      LIMIT 1
    `;

    if (id_temporada) {
      temporadaQuery = `
        SELECT t.id, e.nombre as temporada_nombre, t.fecha_inicio, t.fecha_fin
        FROM temporadas t
        JOIN estaciones e ON e.id = t.id_estacion
        WHERE t.id = ?
      `;
    }

    const [temporada] = id_temporada
      ? await db.query(temporadaQuery, [id_temporada])
      : await db.query(temporadaQuery);

    if (!temporada || temporada.length === 0) {
      return res.status(404).json({ error: 'No hay temporada activa' });
    }

    const temp = temporada[0];

    const [preferencias] = await db.query(`
      SELECT
        COALESCE(cr.nombre, 'Sin restricción') as restriccion,
        COUNT(*) as total_selecciones,
        ROUND((COUNT(*) / (SELECT COUNT(*) FROM reservas WHERE fecha_reservada BETWEEN ? AND ?)) * 100, 2) as porcentaje
      FROM reservas r
      JOIN usuarios u ON u.id = r.id_usuario
      LEFT JOIN usuario_restricciones ur ON ur.id_usuario = u.id
      LEFT JOIN comidas_restricciones cr ON cr.id = ur.id_restriccion
      WHERE r.fecha_reservada BETWEEN ? AND ?
      GROUP BY cr.nombre
      ORDER BY total_selecciones DESC
    `, [temp.fecha_inicio, temp.fecha_fin, temp.fecha_inicio, temp.fecha_fin]);

    const [meses] = await db.query(`
      SELECT DISTINCT
        YEAR(fecha_reservada) as anio,
        MONTH(fecha_reservada) as mes,
        ANY_VALUE(CASE MONTH(fecha_reservada)
          WHEN 1 THEN 'Enero'
          WHEN 2 THEN 'Febrero'
          WHEN 3 THEN 'Marzo'
          WHEN 4 THEN 'Abril'
          WHEN 5 THEN 'Mayo'
          WHEN 6 THEN 'Junio'
          WHEN 7 THEN 'Julio'
          WHEN 8 THEN 'Agosto'
          WHEN 9 THEN 'Septiembre'
          WHEN 10 THEN 'Octubre'
          WHEN 11 THEN 'Noviembre'
          WHEN 12 THEN 'Diciembre'
        END) as nombre_mes
      FROM reservas
      WHERE fecha_reservada BETWEEN ? AND ?
      GROUP BY YEAR(fecha_reservada), MONTH(fecha_reservada)
      ORDER BY anio, mes
    `, [temp.fecha_inicio, temp.fecha_fin]);

    res.json({
      temporada: {
        id: temp.id,
        nombre: temp.temporada_nombre,
        fecha_inicio: temp.fecha_inicio,
        fecha_fin: temp.fecha_fin
      },
      preferencias: preferencias,
      meses: meses
    });
  } catch (error) {
    console.error('Error en getPreferenciasTemporada:', error);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
};


exports.getPreferenciasMes = async (req, res) => {
  try {
    const { anio, mes } = req.query;

    if (!anio || !mes) {
      return res.status(400).json({ error: 'Se requiere año y mes' });
    }


    const [preferencias] = await db.query(`
      SELECT
        COALESCE(cr.nombre, 'Sin restricción') as restriccion,
        COUNT(*) as total_selecciones,
        ROUND((COUNT(*) / (SELECT COUNT(*) FROM reservas WHERE YEAR(fecha_reservada) = ? AND MONTH(fecha_reservada) = ?)) * 100, 2) as porcentaje
      FROM reservas r
      JOIN usuarios u ON u.id = r.id_usuario
      LEFT JOIN usuario_restricciones ur ON ur.id_usuario = u.id
      LEFT JOIN comidas_restricciones cr ON cr.id = ur.id_restriccion
      WHERE YEAR(r.fecha_reservada) = ? AND MONTH(r.fecha_reservada) = ?
      GROUP BY cr.nombre
      ORDER BY total_selecciones DESC
    `, [anio, mes, anio, mes]);

 
    const [dias] = await db.query(`
      SELECT DISTINCT
        DATE(fecha_reservada) as fecha_date,
        ANY_VALUE(DATE_FORMAT(fecha_reservada, '%Y-%m-%d')) as fecha,
        ANY_VALUE(CASE DAYOFWEEK(fecha_reservada)
          WHEN 1 THEN 'Domingo'
          WHEN 2 THEN 'Lunes'
          WHEN 3 THEN 'Martes'
          WHEN 4 THEN 'Miércoles'
          WHEN 5 THEN 'Jueves'
          WHEN 6 THEN 'Viernes'
          WHEN 7 THEN 'Sábado'
        END) as dia_semana
      FROM reservas
      WHERE YEAR(fecha_reservada) = ? AND MONTH(fecha_reservada) = ?
      GROUP BY fecha_date
      ORDER BY fecha_date
    `, [anio, mes]);

    const nombreMes = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                       'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][parseInt(mes) - 1];

    res.json({
      mes: {
        anio: parseInt(anio),
        mes: parseInt(mes),
        nombre_mes: nombreMes
      },
      preferencias: preferencias,
      dias: dias
    });
  } catch (error) {
    console.error('Error en getPreferenciasMes:', error);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
};


exports.getPreferenciasDia = async (req, res) => {
  try {
    const { fecha } = req.query;
    console.log('🔍 getPreferenciasDia - Fecha recibida:', fecha);

    if (!fecha) {
      return res.status(400).json({ error: 'Se requiere fecha' });
    }


    const [preferencias] = await db.query(`
      SELECT
        COALESCE(cr.nombre, 'Sin restricción') as restriccion,
        COUNT(*) as total_selecciones,
        ROUND((COUNT(*) / (SELECT COUNT(*) FROM reservas WHERE DATE_FORMAT(fecha_reservada, '%Y-%m-%d') = ?)) * 100, 2) as porcentaje
      FROM reservas r
      JOIN usuarios u ON u.id = r.id_usuario
      LEFT JOIN usuario_restricciones ur ON ur.id_usuario = u.id
      LEFT JOIN comidas_restricciones cr ON cr.id = ur.id_restriccion
      WHERE DATE_FORMAT(r.fecha_reservada, '%Y-%m-%d') = ?
      GROUP BY cr.nombre
      ORDER BY total_selecciones DESC
    `, [fecha, fecha]);


    const [rankingEntradas] = await db.query(`
      SELECT
        c.nombre as plato,
        COUNT(*) as total_pedidos,
        ROUND((COUNT(*) / (SELECT COUNT(*) FROM reservas WHERE DATE_FORMAT(fecha_reservada, '%Y-%m-%d') = ? AND id_comida_entrada IS NOT NULL)) * 100, 2) as porcentaje
      FROM reservas r
      JOIN comidas c ON c.id = r.id_comida_entrada
      WHERE DATE_FORMAT(r.fecha_reservada, '%Y-%m-%d') = ?
      GROUP BY c.id, c.nombre
      ORDER BY total_pedidos DESC
    `, [fecha, fecha]);


    const [rankingPrincipales] = await db.query(`
      SELECT
        c.nombre as plato,
        COUNT(*) as total_pedidos,
        ROUND((COUNT(*) / (SELECT COUNT(*) FROM reservas WHERE DATE_FORMAT(fecha_reservada, '%Y-%m-%d') = ? AND id_comida_principal IS NOT NULL)) * 100, 2) as porcentaje
      FROM reservas r
      JOIN comidas c ON c.id = r.id_comida_principal
      WHERE DATE_FORMAT(r.fecha_reservada, '%Y-%m-%d') = ?
      GROUP BY c.id, c.nombre
      ORDER BY total_pedidos DESC
    `, [fecha, fecha]);


    const [rankingPostres] = await db.query(`
      SELECT
        c.nombre as plato,
        COUNT(*) as total_pedidos,
        ROUND((COUNT(*) / (SELECT COUNT(*) FROM reservas WHERE DATE_FORMAT(fecha_reservada, '%Y-%m-%d') = ? AND id_comida_postre IS NOT NULL)) * 100, 2) as porcentaje
      FROM reservas r
      JOIN comidas c ON c.id = r.id_comida_postre
      WHERE DATE_FORMAT(r.fecha_reservada, '%Y-%m-%d') = ?
      GROUP BY c.id, c.nombre
      ORDER BY total_pedidos DESC
    `, [fecha, fecha]);


    const [rankingBebidas] = await db.query(`
      SELECT
        c.nombre as plato,
        COUNT(*) as total_pedidos,
        ROUND((COUNT(*) / (SELECT COUNT(*) FROM reservas WHERE DATE_FORMAT(fecha_reservada, '%Y-%m-%d') = ? AND id_comida_bebida IS NOT NULL)) * 100, 2) as porcentaje
      FROM reservas r
      JOIN comidas c ON c.id = r.id_comida_bebida
      WHERE DATE_FORMAT(r.fecha_reservada, '%Y-%m-%d') = ?
      GROUP BY c.id, c.nombre
      ORDER BY total_pedidos DESC
    `, [fecha, fecha]);


    const [totalComidas] = await db.query(`
      SELECT COUNT(*) as total
      FROM reservas
      WHERE DATE_FORMAT(fecha_reservada, '%Y-%m-%d') = ?
    `, [fecha]);

    const [diaSemana] = await db.query(`
      SELECT
        CASE DAYOFWEEK(?)
          WHEN 1 THEN 'Domingo'
          WHEN 2 THEN 'Lunes'
          WHEN 3 THEN 'Martes'
          WHEN 4 THEN 'Miércoles'
          WHEN 5 THEN 'Jueves'
          WHEN 6 THEN 'Viernes'
          WHEN 7 THEN 'Sábado'
        END as dia_semana
    `, [fecha]);

    res.json({
      fecha: fecha,
      dia_semana: diaSemana[0].dia_semana,
      total_comidas: totalComidas[0].total,
      preferencias: preferencias,
      ranking_entradas: rankingEntradas,
      ranking_principales: rankingPrincipales,
      ranking_postres: rankingPostres,
      ranking_bebidas: rankingBebidas
    });
  } catch (error) {
    console.error('Error en getPreferenciasDia:', error);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
};

//CONSUMO EMPLEADOS
exports.getConsumoTipoTemporada = async (req, res) => {
  try {
    const { id_temporada } = req.query;

    let temporadaQuery = `
      SELECT t.id, e.nombre as nombre, t.fecha_inicio, t.fecha_fin
      FROM temporadas t
      JOIN estaciones e ON e.id = t.id_estacion
      WHERE CURDATE() BETWEEN t.fecha_inicio AND t.fecha_fin
      LIMIT 1
    `;

    if (id_temporada) {
      temporadaQuery = `
        SELECT t.id, e.nombre as nombre, t.fecha_inicio, t.fecha_fin
        FROM temporadas t
        JOIN estaciones e ON e.id = t.id_estacion
        WHERE t.id = ?
      `;
    }

    const [temporada] = id_temporada
      ? await db.query(temporadaQuery, [id_temporada])
      : await db.query(temporadaQuery);

    if (!temporada || temporada.length === 0) {
      return res.status(404).json({ error: 'No hay temporada activa' });
    }

    const temp = temporada[0];

    const [consumo] = await db.query(`
      SELECT
        emp.tipo as tipo_empleado,
        COUNT(*) as total_reservas,
        ROUND((COUNT(*) / (
          SELECT COUNT(*) FROM reservas r
          JOIN usuarios u ON u.id = r.id_usuario
          JOIN personas p ON p.id_usuario = u.id
          JOIN empleados e ON e.id_persona = p.id
          WHERE r.fecha_reservada BETWEEN ? AND ?
        )) * 100, 2) as porcentaje
      FROM reservas r
      JOIN usuarios u ON u.id = r.id_usuario
      JOIN personas p ON p.id_usuario = u.id
      JOIN empleados emp ON emp.id_persona = p.id
      WHERE r.fecha_reservada BETWEEN ? AND ?
      GROUP BY emp.tipo
      ORDER BY total_reservas DESC
    `, [temp.fecha_inicio, temp.fecha_fin, temp.fecha_inicio, temp.fecha_fin]);

    const [meses] = await db.query(`
      SELECT DISTINCT
        YEAR(r.fecha_reservada) as anio,
        MONTH(r.fecha_reservada) as mes,
        ANY_VALUE(CASE MONTH(r.fecha_reservada)
          WHEN 1 THEN 'Enero'
          WHEN 2 THEN 'Febrero'
          WHEN 3 THEN 'Marzo'
          WHEN 4 THEN 'Abril'
          WHEN 5 THEN 'Mayo'
          WHEN 6 THEN 'Junio'
          WHEN 7 THEN 'Julio'
          WHEN 8 THEN 'Agosto'
          WHEN 9 THEN 'Septiembre'
          WHEN 10 THEN 'Octubre'
          WHEN 11 THEN 'Noviembre'
          WHEN 12 THEN 'Diciembre'
        END) as nombre_mes
      FROM reservas r
      WHERE r.fecha_reservada BETWEEN ? AND ?
      GROUP BY YEAR(r.fecha_reservada), MONTH(r.fecha_reservada)
      ORDER BY anio DESC, mes DESC
    `, [temp.fecha_inicio, temp.fecha_fin]);

    res.json({
      temporada: {
        id: temp.id,
        nombre: temp.nombre,
        fecha_inicio: temp.fecha_inicio,
        fecha_fin: temp.fecha_fin
      },
      consumo: consumo,
      meses: meses
    });
  } catch (error) {
    console.error('Error en getConsumoTipoTemporada:', error);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
};

exports.getConsumoTipoMes = async (req, res) => {
  try {
    const { anio, mes } = req.query;

    if (!anio || !mes) {
      return res.status(400).json({ error: 'Se requiere año y mes' });
    }

    // Nombre del mes
    const [nombreMes] = await db.query(`
      SELECT
        CASE ?
          WHEN 1 THEN 'Enero'
          WHEN 2 THEN 'Febrero'
          WHEN 3 THEN 'Marzo'
          WHEN 4 THEN 'Abril'
          WHEN 5 THEN 'Mayo'
          WHEN 6 THEN 'Junio'
          WHEN 7 THEN 'Julio'
          WHEN 8 THEN 'Agosto'
          WHEN 9 THEN 'Septiembre'
          WHEN 10 THEN 'Octubre'
          WHEN 11 THEN 'Noviembre'
          WHEN 12 THEN 'Diciembre'
        END as nombre_mes
    `, [mes]);

    const [consumo] = await db.query(`
      SELECT
        emp.tipo as tipo_empleado,
        COUNT(*) as total_reservas,
        ROUND((COUNT(*) / (
          SELECT COUNT(*) FROM reservas r
          JOIN usuarios u ON u.id = r.id_usuario
          JOIN personas p ON p.id_usuario = u.id
          JOIN empleados e ON e.id_persona = p.id
          WHERE YEAR(r.fecha_reservada) = ? AND MONTH(r.fecha_reservada) = ?
        )) * 100, 2) as porcentaje
      FROM reservas r
      JOIN usuarios u ON u.id = r.id_usuario
      JOIN personas p ON p.id_usuario = u.id
      JOIN empleados emp ON emp.id_persona = p.id
      WHERE YEAR(r.fecha_reservada) = ? AND MONTH(r.fecha_reservada) = ?
      GROUP BY emp.tipo
      ORDER BY total_reservas DESC
    `, [anio, mes, anio, mes]);

    const [dias] = await db.query(`
      SELECT DISTINCT
        DATE(r.fecha_reservada) as fecha_date,
        ANY_VALUE(DATE_FORMAT(r.fecha_reservada, '%Y-%m-%d')) as fecha,
        ANY_VALUE(CASE DAYOFWEEK(r.fecha_reservada)
          WHEN 1 THEN 'Domingo'
          WHEN 2 THEN 'Lunes'
          WHEN 3 THEN 'Martes'
          WHEN 4 THEN 'Miércoles'
          WHEN 5 THEN 'Jueves'
          WHEN 6 THEN 'Viernes'
          WHEN 7 THEN 'Sábado'
        END) as dia_semana
      FROM reservas r
      WHERE YEAR(r.fecha_reservada) = ? AND MONTH(r.fecha_reservada) = ?
      GROUP BY fecha_date
      ORDER BY fecha_date DESC
    `, [anio, mes]);

    res.json({
      mes: {
        anio: parseInt(anio),
        mes: parseInt(mes),
        nombre_mes: nombreMes[0].nombre_mes
      },
      consumo: consumo,
      dias: dias
    });
  } catch (error) {
    console.error('Error en getConsumoTipoMes:', error);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
};

exports.getConsumoTipoDia = async (req, res) => {
  try {
    const { fecha } = req.query;
    console.log('🔍 getConsumoTipoDia - Fecha recibida:', fecha);

    if (!fecha) {
      return res.status(400).json({ error: 'Se requiere fecha' });
    }

    const [consumo] = await db.query(`
      SELECT
        emp.tipo as tipo_empleado,
        COUNT(*) as total_reservas,
        ROUND((COUNT(*) / (
          SELECT COUNT(*) FROM reservas r
          JOIN usuarios u ON u.id = r.id_usuario
          JOIN personas p ON p.id_usuario = u.id
          JOIN empleados e ON e.id_persona = p.id
          WHERE DATE_FORMAT(r.fecha_reservada, '%Y-%m-%d') = ?
        )) * 100, 2) as porcentaje
      FROM reservas r
      JOIN usuarios u ON u.id = r.id_usuario
      JOIN personas p ON p.id_usuario = u.id
      JOIN empleados emp ON emp.id_persona = p.id
      WHERE DATE_FORMAT(r.fecha_reservada, '%Y-%m-%d') = ?
      GROUP BY emp.tipo
      ORDER BY total_reservas DESC
    `, [fecha, fecha]);

    const [detalleComidas] = await db.query(`
      SELECT
        CONCAT(p.nombre, ' ', p.apellido) as nombre_usuario,
        emp.tipo as tipo_empleado,
        c1.nombre as entrada,
        c2.nombre as plato_principal,
        c3.nombre as postre,
        c4.nombre as bebida,
        GROUP_CONCAT(DISTINCT cr.nombre SEPARATOR ', ') as restricciones
      FROM reservas r
      JOIN usuarios u ON u.id = r.id_usuario
      JOIN personas p ON p.id_usuario = u.id
      JOIN empleados emp ON emp.id_persona = p.id
      LEFT JOIN comidas c1 ON c1.id = r.id_comida_entrada
      LEFT JOIN comidas c2 ON c2.id = r.id_comida_principal
      LEFT JOIN comidas c3 ON c3.id = r.id_comida_postre
      LEFT JOIN comidas c4 ON c4.id = r.id_comida_bebida
      LEFT JOIN usuario_restricciones ur ON ur.id_usuario = u.id
      LEFT JOIN comidas_restricciones cr ON cr.id = ur.id_restriccion
      WHERE DATE_FORMAT(r.fecha_reservada, '%Y-%m-%d') = ?
      GROUP BY r.id, p.nombre, p.apellido, emp.tipo, c1.nombre, c2.nombre, c3.nombre, c4.nombre
      ORDER BY emp.tipo, p.apellido, p.nombre
    `, [fecha]);

    const [diaSemana] = await db.query(`
      SELECT
        CASE DAYOFWEEK(?)
          WHEN 1 THEN 'Domingo'
          WHEN 2 THEN 'Lunes'
          WHEN 3 THEN 'Martes'
          WHEN 4 THEN 'Miércoles'
          WHEN 5 THEN 'Jueves'
          WHEN 6 THEN 'Viernes'
          WHEN 7 THEN 'Sábado'
        END as dia_semana
    `, [fecha]);

    res.json({
      fecha: fecha,
      dia_semana: diaSemana[0].dia_semana,
      consumo: consumo,
      detalle_comidas: detalleComidas
    });
  } catch (error) {
    console.error('Error en getConsumoTipoDia:', error);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
};

// CONSUMO POR USUARIO 
exports.getConsumoPorUsuario = async (req, res) => {
  try {
    const { mes, anio, fecha } = req.query;
    
    let fechaInicio, fechaFin, diasDisponibles;
    
    if (fecha) {
      fechaInicio = fecha;
      fechaFin = fecha;
      diasDisponibles = 1;
    } else if (mes && anio) {
      const mesNum = parseInt(mes);
      const anioNum = parseInt(anio);
      
      fechaInicio = new Date(anioNum, mesNum - 1, 1).toISOString().split('T')[0];
      
      fechaFin = new Date(anioNum, mesNum, 0).toISOString().split('T')[0];
      
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      diasDisponibles = 0;
      
      let fechaActual = new Date(inicio);
      while (fechaActual <= fin) {
        const diaSemana = fechaActual.getDay();
        if (diaSemana >= 1 && diaSemana <= 5) {
          diasDisponibles++;
        }
        fechaActual.setDate(fechaActual.getDate() + 1);
      }
    } else {
      return res.status(400).json({ error: 'Se requiere mes/anio o fecha' });
    }

    const [usuarios] = await db.query(`
      SELECT 
        u.id,
        CONCAT(p.nombre, ' ', p.apellido) as nombre_completo,
        e.tipo as tipo_empleado,
        COUNT(r.id) as total_reservas,
        ROUND((COUNT(r.id) / ?) * 100, 2) as porcentaje_consumo
      FROM usuarios u
      JOIN personas p ON p.id_usuario = u.id
      JOIN empleados e ON e.id_persona = p.id
      LEFT JOIN reservas r ON r.id_usuario = u.id 
        AND r.fecha_reservada BETWEEN ? AND ?
        AND r.estado_reserva = 'confirmada'
      WHERE u.activo = 1
      GROUP BY u.id, p.nombre, p.apellido, e.tipo
      ORDER BY porcentaje_consumo DESC, p.apellido, p.nombre
    `, [diasDisponibles, fechaInicio, fechaFin]);
    
    res.json({
      filtro: {
        mes: mes ? parseInt(mes) : null,
        anio: anio ? parseInt(anio) : null,
        fecha: fecha || null,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        dias_disponibles: diasDisponibles
      },
      usuarios: usuarios
    });
  } catch (error) {
    console.error('Error en getConsumoPorUsuario:', error);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
};
