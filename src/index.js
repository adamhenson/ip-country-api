import express from 'express';
import timeout from 'connect-timeout';
import { ApiError, formatResult } from './services/api-client.js';
import bindRoutes from './routes/index.js';
import packageJson from '../package.json' assert { type: 'json' };

const app = express();

// enforce a 1 minute timeout
app.use(timeout(60000));

bindRoutes(app);

// 404 errors
app.use((_, res) => {
  const result = formatResult({
    error: new ApiError('404 Not Found', { status: 404 }),
  });
  res.status(result.meta.status).json(result);
});

// 500 errors (uncaught exception)
app.use((error, req, res, __) => {
  console.error(error);
  const status = !req.timedout ? 500 : 408;
  const result = formatResult({
    error: new ApiError(error.message, { status }),
  });
  res.status(result.meta.status).json(result);
});

const port = process.env.COUNTRY_API_PORT || 3000;

app.listen(port, () => {
  console.log(
    `${packageJson.name}@${packageJson.version} running on port ${port} 💻`
  );
});
