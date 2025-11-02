const bcrypt = require('bcrypt');
const db = require('../src/config/database');

// Nombres y apellidos argentinos
const nombres = [
  'Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Laura', 'Diego', 'Sofía',
  'Martín', 'Valentina', 'Santiago', 'Camila', 'Mateo', 'Lucía', 'Nicolás',
  'Victoria', 'Facundo', 'Florencia', 'Rodrigo', 'Emilia', 'Agustín', 'Catalina',
  'Tomás', 'Julia', 'Franco', 'Micaela', 'Ignacio', 'Paula', 'Maximiliano', 'Gabriela',
  'Federico', 'Carolina', 'Pablo', 'Natalia', 'Sebastián', 'Adriana', 'Alejandro', 'Daniela',
  'Gustavo', 'Mariana', 'Fernando', 'Verónica', 'Marcelo', 'Silvia', 'Javier', 'Cecilia',
  'Ricardo', 'Patricia', 'Eduardo', 'Claudia', 'Andrés', 'Mónica', 'Germán', 'Beatriz',
  'Hernán', 'Lorena', 'Cristian', 'Sandra', 'Oscar', 'Roxana', 'Sergio', 'Viviana',
  'Roberto', 'Alejandra', 'Miguel', 'Susana', 'Jorge', 'Elena', 'Raúl', 'Isabel',
  'Alberto', 'Teresa', 'Daniel', 'Rosa', 'Víctor', 'Carmen', 'Rubén', 'Liliana'
];

const apellidos = [
  'González', 'Rodríguez', 'Fernández', 'López', 'Martínez', 'García', 'Pérez', 'Álvarez',
  'Sánchez', 'Romero', 'Díaz', 'Torres', 'Ramírez', 'Flores', 'Benítez', 'Acosta',
  'Medina', 'Silva', 'Castro', 'Rojas', 'Morales', 'Ortiz', 'Núñez', 'Cabrera',
  'Gutiérrez', 'Herrera', 'Vega', 'Molina', 'Ríos', 'Giménez', 'Domínguez', 'Navarro',
  'Ruiz', 'Vargas', 'Luna', 'Campos', 'Mendoza', 'Aguilar', 'Ramos', 'Cruz',
  'Figueroa', 'Miranda', 'Sosa', 'Pereyra', 'Ponce', 'Suárez', 'Vera', 'Aguirre',
  'Cardoso', 'Maldonado', 'Arias', 'Cortez', 'Espinoza', 'Carrizo', 'Ledesma', 'Godoy',
  'Bravo', 'Cáceres', 'Mercado', 'Valdez', 'Quiroga', 'Montero', 'Salazar', 'Coronel'
];

// Distribución de reservas por día
const distribucionDias = {
  1: 0.67,  // Lunes - 65-70%
  2: 0.91,  // Martes - 90-92%
  3: 0.89,  // Miércoles - 88-90%
  4: 0.92,  // Jueves - 91-93%
  5: 0.55   // Viernes - 50-60%
};

// Planificación semanal (4 semanas que se repiten)
const planificacionSemanal = [
  // SEMANA 1
  { semana: 1, dia: 'Monday', entrada: 'Pasqualina', principal: 'Carne a la mostaza con puré de berenjena', vegetariano: 'Fajitas de verdura', alternativo: 'Pastel de jamón y queso' },
  { semana: 1, dia: 'Tuesday', entrada: 'Pizza napolitana', principal: 'Medallón de pollo con arroz amarillo', vegetariano: 'Tarta de calabaza, cebolla caramelizada y queso azul', alternativo: 'Ñoquis a la mediterránea' },
  { semana: 1, dia: 'Wednesday', entrada: 'Mayonesa de ave', principal: 'Filet de merluza con revuelto de verdura', vegetariano: 'Pizeta vegetariana', alternativo: 'Empanadas de choclo' },
  { semana: 1, dia: 'Thursday', entrada: 'Soufflé de calabaza', principal: 'Milanesa de ternera', vegetariano: 'Risotto de hongos', alternativo: 'Torre de panqueques' },
  { semana: 1, dia: 'Friday', entrada: 'Tomate relleno', principal: 'Tarta de pollo con zanahoria glaseada', vegetariano: 'Pad thai', alternativo: 'Omelette de aceitunas y queso' },
  
  // SEMANA 2
  { semana: 2, dia: 'Monday', entrada: 'Tortilla verde', principal: 'Ensalada fría de carne a lo fideos al verdeo', vegetariano: 'Hamburguesa de soja', alternativo: 'Pizza especial' },
  { semana: 2, dia: 'Tuesday', entrada: 'Budín de queso azul', principal: 'Albóndigas con tuco napolitana con puré', vegetariano: 'Albóndigas de espinaca y arroz', alternativo: 'Pastel de pollo' },
  { semana: 2, dia: 'Wednesday', entrada: 'Paquetitos caprese', principal: 'Pollo al limón con arroz amarillo', vegetariano: 'Quinoa cremosa con espinaca', alternativo: 'Strudel de pescado' },
  { semana: 2, dia: 'Thursday', entrada: 'Tarta de choclo', principal: 'Hamburguesa con ensalada rusa', vegetariano: 'Canastitas de cebolla y queso', alternativo: 'Omelette de jamón y chorizo' },
  { semana: 2, dia: 'Friday', entrada: 'Pionono primavera', principal: 'Filet de pollo con acelga salteada', vegetariano: 'Tortilla de repollo', alternativo: 'Canelones de calabaza y verdura' },
  
  // SEMANA 3
  { semana: 3, dia: 'Monday', entrada: 'Arroz aromatizado con atún', principal: 'Carne agridulce con papas fritas', vegetariano: 'Omelette verde', alternativo: 'Milanesa de zucchini a la napolitana' },
  { semana: 3, dia: 'Tuesday', entrada: 'Soufflé de coles', principal: 'Pollo con calabaza al romero', vegetariano: 'Pizza integral de hongos y queso', alternativo: 'Empanadas al verdeo' },
  { semana: 3, dia: 'Wednesday', entrada: 'Pizza de aceituna y queso', principal: 'Pan de carne con jardinera', vegetariano: 'Risotto cremoso de verduras', alternativo: 'Tarta gallega' },
  { semana: 3, dia: 'Thursday', entrada: 'Fiambre', principal: 'Suprema con verduras', vegetariano: 'Torre de berenjenas', alternativo: 'Ravioles con salsa blanca' },
  { semana: 3, dia: 'Friday', entrada: 'Torrejas mixtas', principal: 'Bife a la criolla con papas', vegetariano: 'Brochette de vegetales', alternativo: 'Ensalada César' },
  
  // SEMANA 4
  { semana: 4, dia: 'Monday', entrada: 'Tortilla de papa', principal: 'Carne rellena con puré de calabaza', vegetariano: 'Wok caprese', alternativo: 'Tarta de jamón y queso' },
  { semana: 4, dia: 'Tuesday', entrada: 'Frankfurt', principal: 'Milanesa de merluza con arroz al perejil', vegetariano: 'Medallón de garbanzos', alternativo: 'Pizza fugazza' },
  { semana: 4, dia: 'Wednesday', entrada: 'Vitel toné', principal: 'Pastel de papa', vegetariano: 'Tarta de mediterránea', alternativo: 'Fajitas de pollo' },
  { semana: 4, dia: 'Thursday', entrada: 'Budín de queso azul', principal: 'Pollo marinado con chop suey de vegetales', vegetariano: 'Calabaza relleno de choclo y queso', alternativo: 'Arroz con calamares' },
  { semana: 4, dia: 'Friday', entrada: 'Bomba de papa', principal: 'Masa base de tarta colchón de arvejas', vegetariano: 'Riso al latte', alternativo: 'Fideos al pesto' }
];

// Bebidas y postres fijos
const bebidas = ['Agua', 'Gaseosa', 'Jugo'];
const postres = ['Gelatina', 'Budín', 'Postre vainilla', 'Chocotorta', 'Fruta'];

// Platos sin TACC (marcados manualmente)
const platosSinTacc = [
  'Fajitas de verdura',
  'Tarta de calabaza, cebolla caramelizada y queso azul',
  'Risotto de hongos',
  'Hamburguesa de soja',
  'Quinoa cremosa con espinaca',
  'Omelette verde',
  'Pizza integral de hongos y queso',
  'Risotto cremoso de verduras',
  'Torre de berenjenas',
  'Wok caprese',
  'Medallón de garbanzos',
  'Calabaza relleno de choclo y queso'
];

async function resetAndLoadData() {
  try {
    console.log('🧹 Iniciando limpieza y carga de datos para Primavera 2025...\n');

    // ==========================================
    // 1. LIMPIAR DATOS EXISTENTES
    // ==========================================
    console.log('📋 PASO 1: Limpiando datos existentes...');
    
    await db.query('DELETE FROM reservas WHERE id > 0');
    console.log('   ✅ Reservas eliminadas');
    
    await db.query('DELETE FROM comidas_planificacion_semanal WHERE id > 0');
    console.log('   ✅ Planificaciones semanales eliminadas');
    
    await db.query('DELETE FROM planificaciones_semanales WHERE id > 0');
    console.log('   ✅ Planificaciones eliminadas');
    
    await db.query('DELETE FROM temporadas WHERE id > 0');
    console.log('   ✅ Temporadas eliminadas');
    
    await db.query('DELETE FROM comida_tiene_restriccion WHERE id > 0');
    console.log('   ✅ Restricciones de comidas eliminadas');
    
    await db.query('DELETE FROM comidas WHERE id > 0');
    console.log('   ✅ Comidas eliminadas');
    
    await db.query('ALTER TABLE reservas AUTO_INCREMENT = 1');
    await db.query('ALTER TABLE comidas AUTO_INCREMENT = 1');
    await db.query('ALTER TABLE planificaciones_semanales AUTO_INCREMENT = 1');
    await db.query('ALTER TABLE comidas_planificacion_semanal AUTO_INCREMENT = 1');
    await db.query('ALTER TABLE temporadas AUTO_INCREMENT = 1');
    
    // ==========================================
    // 2. ACTUALIZAR EMPLEADOS (20% externos)
    // ==========================================
    console.log('\n📋 PASO 2: Actualizando tipos de empleados...');
    
    // Primero, todos internos
    await db.query('UPDATE empleados SET tipo = "interno"');
    
    // Luego, 20% aleatorios a externos
    const [empleados] = await db.query('SELECT id FROM empleados ORDER BY RAND()');
    const cantidadExternos = Math.floor(empleados.length * 0.20);
    
    for (let i = 0; i < cantidadExternos; i++) {
      await db.query('UPDATE empleados SET tipo = "externo" WHERE id = ?', [empleados[i].id]);
    }
    
    console.log(`   ✅ ${empleados.length - cantidadExternos} empleados internos (80%)`);
    console.log(`   ✅ ${cantidadExternos} empleados externos (20%)`);

    // ==========================================
    // 3. CREAR COMIDAS
    // ==========================================
    console.log('\n📋 PASO 3: Creando comidas...');
    
    const comidasMap = new Map();
    
    // Obtener IDs de tipos de comida
    const [tiposComida] = await db.query('SELECT id, nombre FROM comidas_tipos');
    console.log('   Tipos de comida encontrados:', tiposComida.map(t => t.nombre).join(', '));
    
    // Mapear los nombres reales de tu BD
    let tipoEntrada = tiposComida.find(t => 
      t.nombre.toLowerCase().includes('entrada') || 
      t.nombre === 'Entrada'
    );
    let tipoPrincipal = tiposComida.find(t => 
      t.nombre.toLowerCase().includes('principal') || 
      t.nombre === 'Principal'
    );
    let tipoAlternativo = tiposComida.find(t => 
      t.nombre.toLowerCase().includes('alternativo') || 
      t.nombre === 'Alternativo'
    );
    let tipoVegetariano = tiposComida.find(t => 
      t.nombre.toLowerCase().includes('vegetariano') || 
      t.nombre === 'Vegetariano'
    );
    let tipoBebida = tiposComida.find(t => 
      t.nombre.toLowerCase().includes('bebida') || 
      t.nombre === 'Bebida'
    );
    let tipoPostre = tiposComida.find(t => 
      t.nombre.toLowerCase().includes('postre') || 
      t.nombre === 'Postre'
    );
    
    console.log('   ✅ Tipos mapeados correctamente:');
    console.log(`      - Entrada: ${tipoEntrada?.nombre} (ID: ${tipoEntrada?.id})`);
    console.log(`      - Principal: ${tipoPrincipal?.nombre} (ID: ${tipoPrincipal?.id})`);
    console.log(`      - Alternativo: ${tipoAlternativo?.nombre} (ID: ${tipoAlternativo?.id})`);
    console.log(`      - Vegetariano: ${tipoVegetariano?.nombre} (ID: ${tipoVegetariano?.id})`);
    console.log(`      - Bebida: ${tipoBebida?.nombre} (ID: ${tipoBebida?.id})`);
    console.log(`      - Postre: ${tipoPostre?.nombre} (ID: ${tipoPostre?.id})`);
    
    // Obtener ID de restricción Sin TACC o Vegetariano
    const [restricciones] = await db.query('SELECT id, nombre FROM comidas_restricciones');
    console.log('   Restricciones encontradas:', restricciones.map(r => r.nombre).join(', '));
    
    let restriccionSinTacc = restricciones.find(r => 
      r.nombre.toLowerCase().includes('tacc') || 
      r.nombre.toLowerCase().includes('gluten')
    );
    
    if (!restriccionSinTacc) {
      console.log('   📝 Creando restricción "Sin TACC"...');
      const [result] = await db.query(
        'INSERT INTO comidas_restricciones (nombre, descripcion) VALUES (?, ?)',
        ['Sin TACC', 'Productos sin gluten']
      );
      restriccionSinTacc = { id: result.insertId, nombre: 'Sin TACC' };
      console.log('   ✅ Restricción "Sin TACC" creada');
    }
    
    const restriccionSinTaccId = restriccionSinTacc.id;
    console.log(`   ✅ Restricción Sin TACC: ${restriccionSinTacc.nombre} (ID: ${restriccionSinTaccId})`);
    
    // Insertar todas las comidas únicas
    const comidasUnicas = new Set();
    
    planificacionSemanal.forEach(plan => {
      comidasUnicas.add(JSON.stringify({ nombre: plan.entrada, tipo: tipoEntrada.id }));
      comidasUnicas.add(JSON.stringify({ nombre: plan.principal, tipo: tipoPrincipal.id }));
      comidasUnicas.add(JSON.stringify({ nombre: plan.vegetariano, tipo: tipoVegetariano.id }));
      comidasUnicas.add(JSON.stringify({ nombre: plan.alternativo, tipo: tipoAlternativo.id }));
    });
    
    console.log(`   📝 Insertando ${comidasUnicas.size} comidas únicas...`);
    
    for (const comidaStr of comidasUnicas) {
      const comida = JSON.parse(comidaStr);
      const [result] = await db.query(
        'INSERT INTO comidas (id_comida_tipo, nombre, es_especial, activa) VALUES (?, ?, 0, 1)',
        [comida.tipo, comida.nombre]
      );
      comidasMap.set(comida.nombre, result.insertId);
      
      // Asignar restricción Sin TACC si corresponde
      if (platosSinTacc.includes(comida.nombre)) {
        await db.query(
          'INSERT INTO comida_tiene_restriccion (id_comida, id_comida_restriccion) VALUES (?, ?)',
          [result.insertId, restriccionSinTaccId]
        );
      }
    }
    
    console.log(`   ✅ ${comidasUnicas.size} comidas creadas`);
    console.log(`   ✅ ${platosSinTacc.length} platos marcados como sin TACC`);
    
    // Insertar bebidas
    console.log(`   📝 Insertando ${bebidas.length} bebidas...`);
    for (const bebida of bebidas) {
      const [result] = await db.query(
        'INSERT INTO comidas (id_comida_tipo, nombre, es_especial, activa) VALUES (?, ?, 0, 1)',
        [tipoBebida.id, bebida]
      );
      comidasMap.set(bebida, result.insertId);
    }
    console.log(`   ✅ ${bebidas.length} bebidas creadas`);
    
    // Insertar postres
    console.log(`   📝 Insertando ${postres.length} postres...`);
    for (const postre of postres) {
      const [result] = await db.query(
        'INSERT INTO comidas (id_comida_tipo, nombre, es_especial, activa) VALUES (?, ?, 0, 1)',
        [tipoPostre.id, postre]
      );
      comidasMap.set(postre, result.insertId);
    }
    console.log(`   ✅ ${postres.length} postres creados`);

    // ==========================================
    // 4. CREAR TEMPORADA
    // ==========================================
    console.log('\n📋 PASO 4: Creando temporada Primavera 2025...');
    
    // Crear estación si no existe
    await db.query(
      'INSERT INTO estaciones (nombre) VALUES ("Primavera 2025") ON DUPLICATE KEY UPDATE nombre=nombre'
    );
    const [estaciones] = await db.query('SELECT id FROM estaciones WHERE nombre = "Primavera 2025"');
    const estacionId = estaciones[0].id;
    
    // Crear temporada
    const [temporadaResult] = await db.query(
      'INSERT INTO temporadas (id_estacion, anio, fecha_inicio, fecha_fin) VALUES (?, 2025, "2025-09-01", "2025-11-21")',
      [estacionId]
    );
    const temporadaId = temporadaResult.insertId;
    
    console.log(`   ✅ Temporada creada (ID: ${temporadaId})`);
    console.log('   📅 Desde: 01/09/2025');
    console.log('   📅 Hasta: 21/11/2025');

    // ==========================================
    // 5. CREAR PLANIFICACIÓN SEMANAL
    // ==========================================
    console.log('\n📋 PASO 5: Creando planificación semanal...');
    
    const fechaInicio = new Date('2025-09-01');
    const fechaFin = new Date('2025-11-21');
    let fechaActual = new Date(fechaInicio);
    let planificacionesCreadas = 0;
    
    while (fechaActual <= fechaFin) {
      const diaSemana = fechaActual.getDay();
      
      // Solo días laborables (lunes=1 a viernes=5)
      if (diaSemana >= 1 && diaSemana <= 5) {
        const fechaStr = fechaActual.toISOString().split('T')[0];
        
        // Calcular número de semana (1-4, luego se repite)
        const diasDesdeInicio = Math.floor((fechaActual - fechaInicio) / (1000 * 60 * 60 * 24));
        const numSemana = Math.floor(diasDesdeInicio / 7) % 4 + 1;
        
        // Mapear día de la semana a nombre en inglés
        const diasIngles = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const diaIngles = diasIngles[diaSemana];
        
        // Buscar la planificación correspondiente
        const planDelDia = planificacionSemanal.find(p => p.semana === numSemana && p.dia === diaIngles);
        
        if (planDelDia) {
          // Crear planificación semanal
          const [planResult] = await db.query(
            'INSERT INTO planificaciones_semanales (id_temporada, nro_semana, dia_semana, fecha) VALUES (?, ?, ?, ?)',
            [temporadaId, numSemana, diaSemana, fechaStr]
          );
          
          const planId = planResult.insertId;
          
          // Crear comidas de la planificación
          await db.query(`
            INSERT INTO comidas_planificacion_semanal 
            (id_planificacion_semanal, id_comida_entrada, id_comida_principal, id_comida_alternativo, id_comida_vegetariana)
            VALUES (?, ?, ?, ?, ?)
          `, [
            planId,
            comidasMap.get(planDelDia.entrada),
            comidasMap.get(planDelDia.principal),
            comidasMap.get(planDelDia.alternativo),
            comidasMap.get(planDelDia.vegetariano)
          ]);
          
          planificacionesCreadas++;
        }
      }
      
      // Avanzar al siguiente día
      fechaActual.setDate(fechaActual.getDate() + 1);
    }
    
    console.log(`   ✅ ${planificacionesCreadas} días de planificación creados`);

    // ==========================================
    // 6. CREAR RESERVAS
    // ==========================================
    console.log('\n📋 PASO 6: Generando reservas realistas...');
    
    // Obtener todos los usuarios empleados
    const [usuarios] = await db.query(`
      SELECT u.id, e.tipo, p.id as persona_id
      FROM usuarios u
      JOIN personas p ON p.id_usuario = u.id
      JOIN empleados e ON e.id_persona = p.id
      WHERE u.activo = 1
    `);
    
    console.log(`   👥 ${usuarios.length} empleados disponibles para reservar`);
    
    // Obtener usuarios con restricción vegetariana
    const [vegetarianos] = await db.query(`
      SELECT DISTINCT ur.id_usuario
      FROM usuario_restricciones ur
      WHERE ur.id_restriccion = 2
    `);
    const idsVegetarianos = new Set(vegetarianos.map(v => v.id_usuario));
    
    console.log(`   🌱 ${idsVegetarianos.size} empleados vegetarianos`);
    
    let reservasCreadas = 0;
    let diasProcesados = 0;
    const estadisticasDias = {
      'Lunes': { total: 0, count: 0 },
      'Martes': { total: 0, count: 0 },
      'Miércoles': { total: 0, count: 0 },
      'Jueves': { total: 0, count: 0 },
      'Viernes': { total: 0, count: 0 }
    };
    
    // Resetear fecha para generar reservas
    fechaActual = new Date(fechaInicio);
    
    while (fechaActual <= fechaFin) {
      const diaSemana = fechaActual.getDay();
      
      // Solo días laborables
      if (diaSemana >= 1 && diaSemana <= 5) {
        diasProcesados++;
        const fechaStr = fechaActual.toISOString().split('T')[0];
        const nombreDia = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][diaSemana];
        
        // Obtener planificación del día
        const diasDesdeInicio = Math.floor((fechaActual - fechaInicio) / (1000 * 60 * 60 * 24));
        const numSemana = Math.floor(diasDesdeInicio / 7) % 4 + 1;
        const diasIngles = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const diaIngles = diasIngles[diaSemana];
        const planDelDia = planificacionSemanal.find(p => p.semana === numSemana && p.dia === diaIngles);
        
        if (!planDelDia) {
          fechaActual.setDate(fechaActual.getDate() + 1);
          continue;
        }
        
        // Calcular porcentaje de asistencia con variación
        const porcentajeBase = distribucionDias[diaSemana];
        const variacion = (Math.random() * 0.04) - 0.02; // ±2%
        const porcentajeReal = Math.min(0.95, Math.max(0.45, porcentajeBase + variacion));
        
        const cantidadReservas = Math.floor(usuarios.length * porcentajeReal);
        const usuariosDelDia = [...usuarios].sort(() => Math.random() - 0.5).slice(0, cantidadReservas);
        
        // IDs de comidas del día
        const idEntrada = comidasMap.get(planDelDia.entrada);
        const idPrincipal = comidasMap.get(planDelDia.principal);
        const idVegetariano = comidasMap.get(planDelDia.vegetariano);
        const idAlternativo = comidasMap.get(planDelDia.alternativo);
        
        for (const usuario of usuariosDelDia) {
          // Decidir si elige entrada (60-80% según el plato)
          const porcentajeEntrada = 0.60 + (Math.random() * 0.20);
          const eligeEntrada = Math.random() < porcentajeEntrada;
          
          // Seleccionar plato principal
          let platoPrincipal;
          if (idsVegetarianos.has(usuario.id)) {
            // Vegetarianos SOLO pueden elegir vegetariano
            platoPrincipal = idVegetariano;
          } else {
            // No vegetarianos: 50% principal, 30% alternativo, 20% vegetariano
            const rand = Math.random();
            if (rand < 0.50) {
              platoPrincipal = idPrincipal;
            } else if (rand < 0.80) {
              platoPrincipal = idAlternativo;
            } else {
              platoPrincipal = idVegetariano;
            }
          }
          
          // Seleccionar bebida y postre aleatorios
          const bebidaSeleccionada = comidasMap.get(bebidas[Math.floor(Math.random() * bebidas.length)]);
          const postreSeleccionado = comidasMap.get(postres[Math.floor(Math.random() * postres.length)]);
          
          // Generar código QR
          const codigoQR = `QR-${usuario.id}-${fechaStr}-${Math.random().toString(36).substr(2, 9)}`;
          
          // Estado: 85% confirmada, 10% noshow, 5% cancelada
          let estadoReserva = 'confirmada';
          const estadoRand = Math.random();
          if (estadoRand > 0.95) {
            estadoReserva = 'cancelada';
          } else if (estadoRand > 0.85) {
            estadoReserva = 'noshow';
          }
          
          // Insertar reserva
          await db.query(`
            INSERT INTO reservas 
            (id_usuario, fecha_reservada, id_comida_entrada, id_comida_principal, 
             id_comida_postre, id_comida_bebida, codigo_qr, estado_reserva)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            usuario.id, 
            fechaStr, 
            eligeEntrada ? idEntrada : null, 
            platoPrincipal, 
            postreSeleccionado, 
            bebidaSeleccionada, 
            codigoQR, 
            estadoReserva
          ]);
          
          reservasCreadas++;
        }
        
        // Guardar estadísticas
        if (estadisticasDias[nombreDia]) {
          estadisticasDias[nombreDia].total += cantidadReservas;
          estadisticasDias[nombreDia].count += 1;
        }
        
        if (diasProcesados % 10 === 0) {
          console.log(`   📆 ${diasProcesados} días procesados...`);
        }
      }
      
      fechaActual.setDate(fechaActual.getDate() + 1);
    }
    
    console.log(`\n   ✅ ${reservasCreadas} reservas creadas en ${diasProcesados} días laborables`);
    console.log(`   📊 Promedio: ${Math.round(reservasCreadas / diasProcesados)} reservas por día`);
    
    console.log('\n📊 Estadísticas por día de la semana:');
    for (const [dia, stats] of Object.entries(estadisticasDias)) {
      const promedio = stats.count > 0 ? Math.round(stats.total / stats.count) : 0;
      const porcentaje = ((promedio / usuarios.length) * 100).toFixed(1);
      console.log(`   ${dia}: ${promedio} reservas promedio (${porcentaje}%)`);
    }
    
    console.log('\n🎉 ¡Datos de Primavera 2025 cargados exitosamente!');
    console.log('\n📊 Resumen Final:');
    console.log(`   - ${usuarios.length} empleados (${Math.round(usuarios.length * 0.8)} internos, ${Math.round(usuarios.length * 0.2)} externos)`);
    console.log(`   - ${comidasUnicas.size + bebidas.length + postres.length} comidas totales`);
    console.log(`   - ${platosSinTacc.length} platos sin TACC`);
    console.log(`   - ${planificacionesCreadas} días de planificación`);
    console.log(`   - ${reservasCreadas} reservas generadas`);
    console.log(`   - Temporada: 01/09/2025 - 21/11/2025`);
    console.log(`   - Patrón: Martes/Jueves > Miércoles > Lunes > Viernes`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetAndLoadData();