import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const db = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'reservapp',
  charset: 'utf8mb4'
});

async function seedData() {
  try {
    console.log('Iniciando población de datos...');

    // 0. Crear usuario administrador
    console.log('Creando usuario administrador...');
    const adminPassword = await bcrypt.hash('Admin123!', 10);

    const [adminResult] = await db.query(
      'INSERT INTO usuarios (email, password, firebaseUID, activo) VALUES (?, ?, ?, 1)',
      ['admin@reservapp.com', adminPassword, `admin_${Date.now()}`]
    );

    const adminUserId = adminResult.insertId;

    await db.query(
      'INSERT INTO personas (id_usuario, nombre, apellido, activo) VALUES (?, ?, ?, 1)',
      [adminUserId, 'Admin', 'Sistema']
    );

    await db.query(
      'INSERT INTO usuarios_roles (id_usuario, id_rol) VALUES (?, 1)',
      [adminUserId]
    );

    console.log('✅ Usuario administrador creado');
    console.log('   Email: admin@reservapp.com');
    console.log('   Password: Admin123!');

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

    // 2. Crear comidas básicas
    console.log('\nCreando comidas...');

    // 2. Obtener IDs de tipos de comida
    const [tiposComida] = await db.query('SELECT id, nombre FROM comidas_tipos');
    const tipoEntrada = tiposComida.find(t => t.nombre === 'Entrada').id;
    const tipoPrincipal = tiposComida.find(t => t.nombre === 'Principal').id;
    const tipoAlternativo = tiposComida.find(t => t.nombre === 'Alternativo').id;
    const tipoVegetariano = tiposComida.find(t => t.nombre === 'Vegetariano').id;
    const tipoBebida = tiposComida.find(t => t.nombre === 'Bebida').id;
    const tipoPostre = tiposComida.find(t => t.nombre === 'Postre').id;

    // Obtener IDs de comidas por tipo
    const [entradas] = await db.query('SELECT id FROM comidas WHERE id_comida_tipo = ? AND activa = 1', [tipoEntrada]);
    const [principales] = await db.query('SELECT id FROM comidas WHERE id_comida_tipo = ? AND activa = 1', [tipoPrincipal]);
    const [alternativos] = await db.query('SELECT id FROM comidas WHERE id_comida_tipo = ? AND activa = 1', [tipoAlternativo]);
    const [vegetarianos] = await db.query('SELECT id FROM comidas WHERE id_comida_tipo = ? AND activa = 1', [tipoVegetariano]);
    const [bebidas] = await db.query('SELECT id FROM comidas WHERE id_comida_tipo = ? AND activa = 1', [tipoBebida]);
    const [postres] = await db.query('SELECT id FROM comidas WHERE id_comida_tipo = ? AND activa = 1', [tipoPostre]);

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

    // Obtener IDs de restricciones
    const [restricciones] = await db.query('SELECT id, nombre FROM comidas_restricciones');
    const restriccionVegetariano = restricciones.find(r => r.nombre === 'Vegetariano')?.id;
    const restriccionSinTacc = restricciones.find(r => r.nombre === 'Sin TACC')?.id;
    const restriccionesIds = [restriccionVegetariano, restriccionSinTacc].filter(id => id);

    let restriccionesCreadas = 0;

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

    console.log('\n🎉 ¡Datos de prueba creados exitosamente!');
    console.log('\n📊 Resumen Final:');
    console.log(`   - 1 usuario administrador`);
    console.log(`   - ${usuarios.length} usuarios empleados`);
    console.log(`   - ${reservasCreadas} reservas en ${diasProcesados} días laborables`);
    console.log(`   - Promedio: ${Math.round(reservasCreadas / diasProcesados)} reservas/día (objetivo: 500-700)`);
    console.log(`   - ${restriccionesCreadas} usuarios con restricciones (${Math.round((restriccionesCreadas/usuarios.length)*100)}%)`);
    console.log(`   - ${usuarios.length - restriccionesCreadas} usuarios sin restricciones (${Math.round(((usuarios.length - restriccionesCreadas)/usuarios.length)*100)}%)`);
    console.log(`   - 1 temporada activa de 4 semanas`);
    console.log('\n🔐 Credenciales de acceso:');
    console.log('   👤 Admin:');
    console.log('      Email: admin@reservapp.com');
    console.log('      Password: Admin123!');
    console.log('   👥 Empleados:');
    console.log('      Email: empleado1@reservapp.com hasta empleado800@reservapp.com');
    console.log('      Password: Test123!');

    await db.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al poblar datos:', error);
    await db.end();
    process.exit(1);
  }
}

seedData();