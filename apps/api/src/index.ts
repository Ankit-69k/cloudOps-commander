import dotenv from 'dotenv';
dotenv.config();

import app from './server/server';

export default app;

if (process.env.NODE_ENV !== 'production') {
  const port = Number(process.env.PORT) || 8080;

  app
    .listen({ port, host: '0.0.0.0' })
    .then(() => {
      console.log(`Server is running on http://localhost:${port}`);
    })
    .catch((err) => {
      app.log.error(err);
      process.exit(1);
    });
}
