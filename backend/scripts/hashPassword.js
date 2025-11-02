const bcrypt = require('bcrypt');

async function hashPassword() {
  const password = 'Test123!';
  const hash = await bcrypt.hash(password, 10);
  console.log('Hash para Test123!:');
  console.log(hash);
}

hashPassword();