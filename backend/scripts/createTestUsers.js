import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
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

async function createTestUsers() {
  try {
    console.log('🧑 Creando usuarios de prueba...');

    const hashedPassword = await bcrypt.hash('12345678', 10);
    const turnos = ['manana', 'tarde', 'noche'];
    const nombres = ['Juan', 'María', 'Pedro', 'Ana', 'Luis', 'Carmen', 'José', 'Laura', 'Carlos', 'Sofía',
                     'Miguel', 'Isabel', 'Antonio', 'Elena', 'Francisco', 'Marta', 'Manuel', 'Paula', 'Javier', 'Lucía',
                     'David', 'Beatriz', 'Raúl', 'Cristina', 'Sergio', 'Natalia', 'Alberto', 'Silvia', 'Fernando', 'Andrea',
                     'Roberto', 'Patricia', 'Eduardo', 'Raquel', 'Jorge', 'Teresa', 'Ángel', 'Susana', 'Ramón', 'Pilar',
                     'Víctor', 'Rosa', 'Guillermo', 'Victoria', 'Adrián', 'Inés', 'Pablo', 'Eva', 'Diego', 'Alicia'];

    const apellidos = ['García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín',
                       'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Álvarez', 'Muñoz', 'Romero', 'Alonso', 'Gutiérrez',
                       'Navarro', 'Torres', 'Domínguez', 'Vázquez', 'Ramos', 'Gil', 'Ramírez', 'Serrano', 'Blanco', 'Suárez',
                       'Molina', 'Castro', 'Ortega', 'Rubio', 'Marín', 'Sanz', 'Iglesias', 'Nuñez', 'Medina', 'Garrido',
                       'Santos', 'Castillo', 'Cortés', 'Lozano', 'Guerrero', 'Cano', 'Prieto', 'Méndez', 'Cruz', 'Gallego'];

    let usuariosCreados = 0;
    let empleadosCreados = 0;

    // Crear 100 empleados
    for (let i = 0; i < 100; i++) {
      const nombre = nombres[Math.floor(Math.random() * nombres.length)];
      const apellido = apellidos[Math.floor(Math.random() * apellidos.length)];
      const email = `${nombre.toLowerCase()}.${apellido.toLowerCase()}${i}@empresa.com`;
      const turno = turnos[Math.floor(Math.random() * turnos.length)];

      // Crear usuario
      const [userResult] = await db.query(
        'INSERT INTO usuarios (email, password, activo) VALUES (?, ?, 1)',
        [email, hashedPassword]
      );
      const userId = userResult.insertId;
      usuariosCreados++;

      // Crear persona
      const [personaResult] = await db.query(
        'INSERT INTO personas (id_usuario, nombre, apellido, activo) VALUES (?, ?, ?, 1)',
        [userId, nombre, apellido]
      );
      const personaId = personaResult.insertId;

      // Crear empleado (80% interno, 20% externo)
      const tipo = Math.random() < 0.8 ? 'interno' : 'externo';
      await db.query(
        'INSERT INTO empleados (id_persona, turno, tipo) VALUES (?, ?, ?)',
        [personaId, turno, tipo]
      );
      empleadosCreados++;

      // Asignar rol de empleado
      await db.query(
        'INSERT INTO usuarios_roles (id_usuario, id_rol) VALUES (?, 2)',
        [userId]
      );

      // 10% de empleados son vegetarianos (restricción id = 1)
      if (Math.random() < 0.1) {
        await db.query(
          'INSERT INTO usuario_restricciones (id_usuario, id_restriccion) VALUES (?, 1)',
          [userId]
        );
      }
    }

    // Crear un administrador
    const adminEmail = 'admin@empresa.com';
    const [adminResult] = await db.query(
      'INSERT INTO usuarios (email, password, activo) VALUES (?, ?, 1)',
      [adminEmail, hashedPassword]
    );
    const adminUserId = adminResult.insertId;
    usuariosCreados++;

    const [adminPersonaResult] = await db.query(
      'INSERT INTO personas (id_usuario, nombre, apellido, activo) VALUES (?, ?, ?, 1)',
      [adminUserId, 'Admin', 'Sistema']
    );

    await db.query(
      'INSERT INTO usuarios_roles (id_usuario, id_rol) VALUES (?, 1)',
      [adminUserId]
    );

    console.log(`✅ ${usuariosCreados} usuarios creados`);
    console.log(`✅ ${empleadosCreados} empleados creados`);
    console.log(`✅ 1 administrador creado (${adminEmail} / 12345678)`);
    console.log('\n📊 Resumen:');
    console.log(`   - Email: [nombre].[apellido][numero]@empresa.com`);
    console.log(`   - Contraseña: 12345678`);
    console.log(`   - Admin: ${adminEmail} / 12345678`);

    await db.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await db.end();
    process.exit(1);
  }
}

createTestUsers();
