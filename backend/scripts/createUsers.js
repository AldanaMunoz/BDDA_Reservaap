const bcrypt = require('bcrypt');
const db = require('../src/config/database');

async function createUsers() {
  try {
    // Usuario Admin
    const adminEmail = 'munozbaldana+admin@gmail.com';
    const adminPassword = 'Admin123!';
    const adminHashedPassword = await bcrypt.hash(adminPassword, 10);
    const adminFirebaseUID = `admin_${Date.now()}`;

    const [adminUserResult] = await db.query(
      'INSERT INTO usuarios (email, password, firebaseUID, activo) VALUES (?, ?, ?, 1)',
      [adminEmail, adminHashedPassword, adminFirebaseUID]
    );
    const adminUserId = adminUserResult.insertId;

    const [adminPersonaResult] = await db.query(
      'INSERT INTO personas (id_usuario, nombre, apellido, activo) VALUES (?, ?, ?, 1)',
      [adminUserId, 'Aldana', 'Admin']
    );
    const adminPersonaId = adminPersonaResult.insertId;

    await db.query(
      'INSERT INTO empleados (id_persona, turno, tipo) VALUES (?, ?, ?)',
      [adminPersonaId, 'manana', 'interno']
    );

    // Asignar rol administrador (id=2)
    await db.query(
      'INSERT INTO usuarios_roles (id_usuario, id_rol) VALUES (?, 2)',
      [adminUserId]
    );

    console.log('✅ Usuario Administrador creado:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);

    // Usuario Empleado
    const empleEmail = 'munozbaldana+emple@gmail.com';
    const emplePassword = 'Emple123!';
    const empleHashedPassword = await bcrypt.hash(emplePassword, 10);
    const empleFirebaseUID = `emple_${Date.now()}`;

    const [empleUserResult] = await db.query(
      'INSERT INTO usuarios (email, password, firebaseUID, activo) VALUES (?, ?, ?, 1)',
      [empleEmail, empleHashedPassword, empleFirebaseUID]
    );
    const empleUserId = empleUserResult.insertId;

    const [emplePersonaResult] = await db.query(
      'INSERT INTO personas (id_usuario, nombre, apellido, activo) VALUES (?, ?, ?, 1)',
      [empleUserId, 'Aldana', 'Emple']
    );
    const emplePersonaId = emplePersonaResult.insertId;

    await db.query(
      'INSERT INTO empleados (id_persona, turno, tipo) VALUES (?, ?, ?)',
      [emplePersonaId, 'manana', 'interno']
    );

    // Asignar rol empleado (id=1)
    await db.query(
      'INSERT INTO usuarios_roles (id_usuario, id_rol) VALUES (?, 1)',
      [empleUserId]
    );

    console.log('\n✅ Usuario Empleado creado:');
    console.log(`   Email: ${empleEmail}`);
    console.log(`   Password: ${emplePassword}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createUsers();