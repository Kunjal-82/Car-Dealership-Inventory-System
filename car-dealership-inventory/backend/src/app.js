const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/purchases', require('./routes/purchases'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

module.exports = app;
