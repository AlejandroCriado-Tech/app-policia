const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Rutas
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const alumnosRoutes = require('./routes/alumnos');
app.use('/api/alumnos', alumnosRoutes);

const retosRoutes = require('./routes/retos');
app.use('/api/retos', retosRoutes);

const preguntasRoutes = require('./routes/preguntas');
app.use('/api/preguntas', preguntasRoutes);

const iaRoutes = require('./routes/ia');
app.use('/api/ia', iaRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});