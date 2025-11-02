const bcrypt = require('bcrypt');
const db = require('../src/config/database');

async function seedData() {
  try {
    console.log('Iniciando población de datos...');

    // 1. Crear usuarios empleados (necesitamos ~800 para tener 500-700 reservas diarias)
    const usuarios = [];
    const hashedPassword = await bcrypt.hash('Test123!', 10);
    
    console.log('Creando 800 usuarios empleados...');
    for (let i = 1; i <= 800; i++) {
      const email = `empleado${i}@reservapp.com`;
      const firebaseUID = `empl_${Date.now()}_${i}`;
      
      const [userResult] = await db.query(
        'INSERT INTO usuarios (email, password, firebaseUID, activo) VALUES (?, ?, ?, 1)',
        [email, hashedPassword, firebaseUID]
      );
      
      const userId = userResult.insertId;
      
      const [personaResult] = await db.query(
        'INSERT INTO personas (id_usuario, nombre, apellido, activo) VALUES (?, ?, ?, 1)',
        [userId, `Empleado${i}`, `Apellido${i}`]
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

    console.log('Comidas obtenidas de la base de datos');
    console.log(`   Entradas: ${entradas.length}, Principales: ${principales.length}`);
    console.log(`   Alternativos: ${alternativos.length}, Vegetarianos: ${vegetarianos.length}`);
    console.log(`   Bebidas: ${bebidas.length}, Postres: ${postres.length}`);

    // 3. Crear reservas SOLO para días laborables (lunes a viernes) del último mes
    console.log('\nCreando reservas para días laborables del último mes...');
    const hoy = new Date();
    let reservasCreadas = 0;
    let diasProcesados = 0;

    for (let dia = 30; dia >= 0; dia--) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() - dia);
      
      // SOLO días laborables (lunes=1 a viernes=5)
      const diaSemana = fecha.getDay();
      if (diaSemana === 0 || diaSemana === 6) continue; // Saltar sábados y domingos

      diasProcesados++;
      const fechaStr = fecha.toISOString().split('T')[0];

      // Entre 500-700 empleados reservan por día (62.5% a 87.5% de 800)
      const porcentajeReserva = 0.625 + (Math.random() * 0.25); // 62.5% - 87.5%
      const cantidadReservas = Math.floor(usuarios.length * porcentajeReserva);
      const usuariosDelDia = [...usuarios].sort(() => Math.random() - 0.5).slice(0, cantidadReservas);

      for (const userId of usuariosDelDia) {
        // Seleccionar comidas aleatorias
        const entrada = Math.random() > 0.4 ? entradas[Math.floor(Math.random() * entradas.length)].id : null;
        
        // Plato principal (60% principal, 25% alternativo, 15% vegetariano)
        let platoPrincipal;
        const tipoPlatoRand = Math.random();
        if (tipoPlatoRand < 0.6) {
          platoPrincipal = principales[Math.floor(Math.random() * principales.length)].id;
        } else if (tipoPlatoRand < 0.85) {
          platoPrincipal = alternativos[Math.floor(Math.random() * alternativos.length)].id;
        } else {
          platoPrincipal = vegetarianos[Math.floor(Math.random() * vegetarianos.length)].id;
        }
        
        const bebida = bebidas[Math.floor(Math.random() * bebidas.length)].id;
        const postre = Math.random() > 0.3 ? postres[Math.floor(Math.random() * postres.length)].id : null;

        // Generar código QR único
        const codigoQR = `QR-${userId}-${fechaStr}-${Math.random().toString(36).substr(2, 9)}`;

        // Estado: 85% confirmadas, 10% no-show, 5% canceladas
        let estadoReserva = 'confirmada';
        const estadoRand = Math.random();
        if (estadoRand > 0.95) {
          estadoReserva = 'cancelada';
        } else if (estadoRand > 0.85) {
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
      
      console.log(`  ${fechaStr}: ${cantidadReservas} reservas creadas`);
    }

    console.log(`\n✅ ${reservasCreadas} reservas creadas en ${diasProcesados} días laborables`);
    console.log(`   Promedio: ${Math.round(reservasCreadas / diasProcesados)} reservas por día`);

    // 4. Crear restricciones alimenticias OPCIONALES (solo 20% de usuarios tienen restricciones)
    console.log('\nAsignando restricciones alimenticias...');
    const restriccionesIds = [1, 2]; // Sin TACC, Vegetariano
    let restriccionesCreadas = 0;

    // Crear tabla de relación usuario-restricciones si no existe
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
      // Solo 20% de usuarios tienen alguna restricción
      if (Math.random() < 0.20) {
        const restriccionId = restriccionesIds[Math.floor(Math.random() * restriccionesIds.length)];
        
        try {
          await db.query(
            'INSERT INTO usuario_restricciones (id_usuario, id_restriccion) VALUES (?, ?)',
            [userId, restriccionId]
          );
          restriccionesCreadas++;
        } catch (err) {
          // Ignorar duplicados
        }
      }
    }

    console.log(`${restriccionesCreadas} restricciones alimenticias asignadas (${Math.round((restriccionesCreadas/usuarios.length)*100)}% de usuarios)`);

    // 5. Crear una temporada activa (4 semanas)
    const inicioTemporada = new Date(hoy);
    inicioTemporada.setDate(hoy.getDate() - 27); // Hace 4 semanas
    const finTemporada = new Date(hoy);
    finTemporada.setDate(hoy.getDate() + 1);

    const [temporadaResult] = await db.query(`
      INSERT INTO temporadas (id_estacion, anio, fecha_inicio, fecha_fin)
      VALUES (?, ?, ?, ?)
    `, [1, hoy.getFullYear(), inicioTemporada.toISOString().split('T')[0], finTemporada.toISOString().split('T')[0]]);

    console.log(`Temporada creada (ID: ${temporadaResult.insertId})`);
    console.log(`   Desde: ${inicioTemporada.toISOString().split('T')[0]}`);
    console.log(`   Hasta: ${finTemporada.toISOString().split('T')[0]}`);

    console.log('\n¡Datos de prueba creados exitosamente!');
    console.log('\n Resumen Final:');
    console.log(`   - ${usuarios.length} usuarios empleados`);
    console.log(`   - ${reservasCreadas} reservas en ${diasProcesados} días laborables`);
    console.log(`   - Promedio: ${Math.round(reservasCreadas / diasProcesados)} reservas/día (objetivo: 500-700)`);
    console.log(`   - ${restriccionesCreadas} usuarios con restricciones (${Math.round((restriccionesCreadas/usuarios.length)*100)}%)`);
    console.log(`   - ${usuarios.length - restriccionesCreadas} usuarios sin restricciones (${Math.round(((usuarios.length - restriccionesCreadas)/usuarios.length)*100)}%)`);
    console.log(`   - 1 temporada activa de 4 semanas`);
    console.log('\n Credenciales de prueba:');
    console.log('   Email: empleado1@reservapp.com hasta empleado800@reservapp.com');
    console.log('   Password: Test123!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error al poblar datos:', error);
    process.exit(1);
  }
}

seedData();