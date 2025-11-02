const bcrypt = require('bcrypt');
const db = require('../src/config/database');

// Nombres y apellidos argentinos realistas
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

// Distribución de reservas por día de la semana
const distribucionDias = {
  1: 0.75,  // Lunes - 75%
  2: 0.90,  // Martes - 90%
  3: 0.92,  // Miércoles - 92%
  4: 0.90,  // Jueves - 90%
  5: 0.65   // Viernes - 65%
};

async function seedDataRealistic() {
  try {
    console.log('🌱 Iniciando población de datos realistas...');

    // 1. Crear usuarios empleados con nombres realistas
    const usuarios = [];
    const hashedPassword = await bcrypt.hash('Test123!', 10);
    
    console.log('Creando 800 usuarios con nombres realistas...');
    for (let i = 1; i <= 800; i++) {
      const nombre = nombres[Math.floor(Math.random() * nombres.length)];
      const apellido = apellidos[Math.floor(Math.random() * apellidos.length)];
      const email = `${nombre.toLowerCase()}.${apellido.toLowerCase()}${i}@reservapp.com`;
      const firebaseUID = `empl_${Date.now()}_${i}`;
      
      const [userResult] = await db.query(
        'INSERT INTO usuarios (email, password, firebaseUID, activo) VALUES (?, ?, ?, 1)',
        [email, hashedPassword, firebaseUID]
      );
      
      const userId = userResult.insertId;
      
      const [personaResult] = await db.query(
        'INSERT INTO personas (id_usuario, nombre, apellido, activo) VALUES (?, ?, ?, 1)',
        [userId, nombre, apellido]
      );
      
      const personaId = personaResult.insertId;
      
      const turnos = ['manana', 'tarde', 'noche'];
      const tipos = ['interno', 'externo'];
      
      await db.query(
        'INSERT INTO empleados (id_persona, turno, tipo) VALUES (?, ?, ?)',
        [personaId, turnos[i % 3], tipos[i % 2]]
      );
      
      await db.query(
        'INSERT INTO usuarios_roles (id_usuario, id_rol) VALUES (?, 1)',
        [userId]
      );
      
      usuarios.push(userId);
      
      if (i % 100 === 0) {
        console.log(`  ${i}/800 usuarios creados...`);
      }
    }
    
    console.log(`✅ ${usuarios.length} usuarios empleados creados`);

    // 2. Obtener IDs de comidas por tipo
    const [entradas] = await db.query('SELECT id FROM comidas WHERE id_comida_tipo = 1 AND activa = 1');
    const [principales] = await db.query('SELECT id FROM comidas WHERE id_comida_tipo = 2 AND activa = 1');
    const [alternativos] = await db.query('SELECT id FROM comidas WHERE id_comida_tipo = 3 AND activa = 1');
    const [vegetarianos] = await db.query('SELECT id FROM comidas WHERE id_comida_tipo = 4 AND activa = 1');
    const [bebidas] = await db.query('SELECT id FROM comidas WHERE id_comida_tipo = 5 AND activa = 1');
    const [postres] = await db.query('SELECT id FROM comidas WHERE id_comida_tipo = 6 AND activa = 1');

    console.log('✅ Comidas obtenidas de la base de datos');
    console.log(`   Entradas: ${entradas.length}, Principales: ${principales.length}`);
    console.log(`   Alternativos: ${alternativos.length}, Vegetarianos: ${vegetarianos.length}`);
    console.log(`   Bebidas: ${bebidas.length}, Postres: ${postres.length}`);

    // 3. Crear reservas para 2 meses con distribución realista
    console.log('\nCreando reservas para 2 meses con patrón realista...');
    const hoy = new Date();
    let reservasCreadas = 0;
    let diasProcesados = 0;
    const estadisticasDias = {
      'Lunes': { total: 0, count: 0 },
      'Martes': { total: 0, count: 0 },
      'Miércoles': { total: 0, count: 0 },
      'Jueves': { total: 0, count: 0 },
      'Viernes': { total: 0, count: 0 }
    };

    // Generar reservas para los últimos 60 días
    for (let dia = 60; dia >= 0; dia--) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() - dia);
      
      // SOLO días laborables (lunes=1 a viernes=5)
      const diaSemana = fecha.getDay();
      if (diaSemana === 0 || diaSemana === 6) continue; // Saltar sábados y domingos

      diasProcesados++;
      const fechaStr = fecha.toISOString().split('T')[0];
      const nombreDia = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][diaSemana];

      // Aplicar distribución según el día de la semana
      const porcentajeBase = distribucionDias[diaSemana];
      // Agregar variación aleatoria ±5%
      const variacion = (Math.random() * 0.1) - 0.05;
      const porcentajeReal = Math.min(0.95, Math.max(0.50, porcentajeBase + variacion));
      
      const cantidadReservas = Math.floor(usuarios.length * porcentajeReal);
      const usuariosDelDia = [...usuarios].sort(() => Math.random() - 0.5).slice(0, cantidadReservas);

      for (const userId of usuariosDelDia) {
        // Seleccionar comidas
        const entrada = Math.random() > 0.4 ? entradas[Math.floor(Math.random() * entradas.length)].id : null;
        
        // Plato principal con probabilidades realistas
        // 55% principal, 25% alternativo, 20% vegetariano (aunque no tenga restricción)
        let platoPrincipal;
        const tipoPlatoRand = Math.random();
        if (tipoPlatoRand < 0.55) {
          platoPrincipal = principales[Math.floor(Math.random() * principales.length)].id;
        } else if (tipoPlatoRand < 0.80) {
          platoPrincipal = alternativos[Math.floor(Math.random() * alternativos.length)].id;
        } else {
          platoPrincipal = vegetarianos[Math.floor(Math.random() * vegetarianos.length)].id;
        }
        
        const bebida = bebidas[Math.floor(Math.random() * bebidas.length)].id;
        const postre = Math.random() > 0.3 ? postres[Math.floor(Math.random() * postres.length)].id : null;

        // Generar código QR único
        const codigoQR = `QR-${userId}-${fechaStr}-${Math.random().toString(36).substr(2, 9)}`;

        // Estado: 90% confirmadas, 7% no-show, 3% canceladas
        let estadoReserva = 'confirmada';
        const estadoRand = Math.random();
        if (estadoRand > 0.97) {
          estadoReserva = 'cancelada';
        } else if (estadoRand > 0.90) {
          estadoReserva = 'noshow';
        }

        await db.query(`
          INSERT INTO reservas 
          (id_usuario, fecha_reservada, id_comida_entrada, id_comida_principal, 
           id_comida_postre, id_comida_bebida, codigo_qr, estado_reserva)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [userId, fechaStr, entrada, platoPrincipal, postre, bebida, codigoQR, estadoReserva]);

        reservasCreadas++;
      }
      
      // Guardar estadísticas
      if (estadisticasDias[nombreDia]) {
        estadisticasDias[nombreDia].total += cantidadReservas;
        estadisticasDias[nombreDia].count += 1;
      }
      
      console.log(`  ${fechaStr} (${nombreDia}): ${cantidadReservas} reservas (${(porcentajeReal * 100).toFixed(1)}%)`);
    }

    console.log(`\n✅ ${reservasCreadas} reservas creadas en ${diasProcesados} días laborables`);
    console.log(`   Promedio: ${Math.round(reservasCreadas / diasProcesados)} reservas por día`);
    
    console.log('\n📊 Estadísticas por día de la semana:');
    for (const [dia, stats] of Object.entries(estadisticasDias)) {
      const promedio = stats.count > 0 ? Math.round(stats.total / stats.count) : 0;
      const porcentaje = ((promedio / usuarios.length) * 100).toFixed(1);
      console.log(`   ${dia}: ${promedio} reservas promedio (${porcentaje}%)`);
    }

    // 4. Crear restricciones alimenticias (15% vegetarianos, 10% sin TACC)
    console.log('\nAsignando restricciones alimenticias...');
    const restriccionesIds = [1, 2]; // Sin TACC=1, Vegetariano=2
    let restriccionesCreadas = 0;

    // Crear tabla si no existe
    await db.query(`
      CREATE TABLE IF NOT EXISTS usuario_restricciones (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        id_usuario INT UNSIGNED NOT NULL,
        id_restriccion INT UNSIGNED NOT NULL,
        UNIQUE KEY uk_usuario_restriccion (id_usuario, id_restriccion),
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
        FOREIGN KEY (id_restriccion) REFERENCES comidas_restricciones(id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    for (const userId of usuarios) {
      const random = Math.random();
      
      // 15% vegetarianos
      if (random < 0.15) {
        try {
          await db.query(
            'INSERT INTO usuario_restricciones (id_usuario, id_restriccion) VALUES (?, ?)',
            [userId, 2] // Vegetariano
          );
          restriccionesCreadas++;
        } catch (err) {
          // Ignorar duplicados
        }
      }
      // 10% sin TACC (sin superposición con vegetarianos para simplicidad)
      else if (random >= 0.15 && random < 0.25) {
        try {
          await db.query(
            'INSERT INTO usuario_restricciones (id_usuario, id_restriccion) VALUES (?, ?)',
            [userId, 1] // Sin TACC
          );
          restriccionesCreadas++;
        } catch (err) {
          // Ignorar duplicados
        }
      }
    }

    console.log(`✅ ${restriccionesCreadas} restricciones alimenticias asignadas (${Math.round((restriccionesCreadas/usuarios.length)*100)}%)`);

    // 5. Crear temporada de 2 meses
    const inicioTemporada = new Date(hoy);
    inicioTemporada.setDate(hoy.getDate() - 60);
    const finTemporada = new Date(hoy);
    finTemporada.setDate(hoy.getDate() + 1);

    // Verificar si existe la estación
    const [estaciones] = await db.query(`SELECT id FROM estaciones WHERE nombre = 'Temporada Verano 2025'`);
    let estacionId;
    
    if (estaciones.length === 0) {
      const [estacionResult] = await db.query(`INSERT INTO estaciones (nombre) VALUES ('Temporada Verano 2025')`);
      estacionId = estacionResult.insertId;
    } else {
      estacionId = estaciones[0].id;
    }

    const [temporadaResult] = await db.query(`
      INSERT INTO temporadas (id_estacion, anio, fecha_inicio, fecha_fin)
      VALUES (?, ?, ?, ?)
    `, [estacionId, hoy.getFullYear(), inicioTemporada.toISOString().split('T')[0], finTemporada.toISOString().split('T')[0]]);

    console.log(`✅ Temporada creada (ID: ${temporadaResult.insertId})`);
    console.log(`   Desde: ${inicioTemporada.toISOString().split('T')[0]}`);
    console.log(`   Hasta: ${finTemporada.toISOString().split('T')[0]}`);

    console.log('\n🎉 ¡Datos realistas creados exitosamente!');
    console.log('\n📊 Resumen Final:');
    console.log(`   - ${usuarios.length} usuarios con nombres argentinos`);
    console.log(`   - ${reservasCreadas} reservas en ${diasProcesados} días laborables (2 meses)`);
    console.log(`   - Patrón realista: Mar/Mié/Jue > Lun > Vie`);
    console.log(`   - ${restriccionesCreadas} usuarios con restricciones alimenticias`);
    console.log(`   - 20% de usuarios eligen plato vegetariano (incluso sin restricción)`);
    console.log(`   - 1 temporada de 2 meses`);
    console.log('\n💡 Credenciales de prueba:');
    console.log('   Email: [nombre].[apellido][N]@reservapp.com');
    console.log('   Ejemplo: juan.gonzalez1@reservapp.com');
    console.log('   Password: Test123!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al poblar datos:', error);
    process.exit(1);
  }
}

seedDataRealistic();