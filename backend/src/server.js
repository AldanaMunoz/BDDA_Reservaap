const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const metricsRoutes = require('./routes/metricsRoutes');

const app = express();


app.use(cors());
app.use(express.json());


app.use('/api/auth', authRoutes);
app.use('/api/metrics', metricsRoutes);


app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend funcionando correctamente' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});