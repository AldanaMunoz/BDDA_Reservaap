const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Registrar usuario
exports.register = async (req, res) => {
  const { email, password, nombre, apellido, turno, tipo, restricciones } = req.body;

  try {
    // Verificar si el usuario ya existe
    const [existingUser] = await db.query(
      'SELECT id FROM usuarios WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generar firebaseUID temporal (en producción usarías Firebase real)
    const firebaseUID = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Insertar usuario
    const [userResult] = await db.query(
      'INSERT INTO usuarios (email, password, firebaseUID, activo) VALUES (?, ?, ?, 1)',
      [email, hashedPassword, firebaseUID]
    );

    const userId = userResult.insertId;

    // Insertar persona
    const [personaResult] = await db.query(
      'INSERT INTO personas (id_usuario, nombre, apellido, activo) VALUES (?, ?, ?, 1)',
      [userId, nombre, apellido]
    );

    const personaId = personaResult.insertId;

    // Insertar empleado
    await db.query(
      'INSERT INTO empleados (id_persona, turno, tipo) VALUES (?, ?, ?)',
      [personaId, turno, tipo]
    );

    // Asignar rol de empleado por defecto
    await db.query(
      'INSERT INTO usuarios_roles (id_usuario, id_rol) VALUES (?, 1)',
      [userId]
    );

    res.status(201).json({ 
      message: 'Usuario registrado exitosamente',
      userId 
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

// Login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Buscar usuario con sus datos completos
    const [users] = await db.query(`
      SELECT 
        u.id, 
        u.email, 
        u.password, 
        u.activo,
        p.nombre,
        p.apellido,
        e.turno,
        e.tipo,
        GROUP_CONCAT(r.nombre) as roles
      FROM usuarios u
      LEFT JOIN personas p ON p.id_usuario = u.id
      LEFT JOIN empleados e ON e.id_persona = p.id
      LEFT JOIN usuarios_roles ur ON ur.id_usuario = u.id
      LEFT JOIN roles r ON r.id = ur.id_rol
      WHERE u.email = ?
      GROUP BY u.id, u.email, u.password, u.activo, p.nombre, p.apellido, e.turno, e.tipo
    `, [email]);

    if (users.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = users[0];

    // Verificar si está activo
    if (!user.activo) {
      return res.status(403).json({ error: 'Usuario inactivo' });
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        roles: user.roles ? user.roles.split(',') : []
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido,
        turno: user.turno,
        tipo: user.tipo,
        roles: user.roles ? user.roles.split(',') : []
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

// Verificar token
exports.verifyToken = async (req, res) => {
  res.json({ 
    valid: true, 
    user: req.user 
  });
};