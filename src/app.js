const express = require('express');
const cors = require('cors');
const apiRouter = require('./routes/api');

const app = express();

// Render (and any other host) puts a proxy in front of the app: without this
// req.ip is the proxy's address, so every visitor would share one rate-limit
// bucket and a handful of people typing city names would lock out everyone
app.set('trust proxy', 1);

// a comma-separated allowlist, e.g. "https://cosmogram.app,http://localhost:3000".
// Left unset, every origin is allowed — fine for local dev, so it never
// blocks a fresh clone, but production should always set it
const allowedOrigins = process.env.CORS_ORIGINS?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors(allowedOrigins?.length ? { origin: allowedOrigins } : undefined));
app.use(express.json());

app.use('/api', apiRouter);

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

app.use((err, req, res, next) => {
  const { status = 500 } = err;

  // a 4xx message is written for the client; a 5xx one comes from Mongo, a
  // library or a bug, and can leak internals — log it here, send a generic one
  if (status >= 500) {
    console.error(err);
    res.status(status).json({ message: 'Server error' });
    return;
  }

  res.status(status).json({ message: err.message });
});

module.exports = app;
