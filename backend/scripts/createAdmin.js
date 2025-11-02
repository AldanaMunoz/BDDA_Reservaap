const bcrypt = require('bcrypt');
const db = require('../src/config/database');

async function createAdmin() {
  try {
    const email = 'admin@reservapp.com';
    const password = 'Admin123!'; 
    const hashedPassword = await bcrypt.hash(password, 10);
    const firebaseUID = `admin_${Date.now()}`;

    // Insertar usuario
    const [userResult] = await db.query(
      'INSERT INTO usuarios (email, password, firebaseUID, activo) VALUES (?, ?, ?, 1)',
      [email, hashedPassword, firebaseUID]
    );
    const userId = userResult.insertId;

    // Insertar persona
    const [personaResult] = await db.query(
      'INSERT INTO personas (id_usuario, nombre, apellido, activo) VALUES (?, ?, ?, 1)',
      [userId, 'Admin', 'Sistema']
    );
    const personaId = personaResult.insertId;

    // Insertar empleado
    await db.query(
      'INSERT INTO empleados (id_persona, turno, tipo) VALUES (?, ?, ?)',
      [personaId, 'manana', 'interno']
    );

    // Asignar rol administrador
    await db.query(
      'INSERT INTO usuarios_roles (id_usuario, id_rol) VALUES (?, 2)',
      [userId]
    );

    console.log('✅ Usuario administrador creado:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createAdmin();