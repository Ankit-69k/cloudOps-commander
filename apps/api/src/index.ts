import dotenv from 'dotenv';
dotenv.config();

import { initializeApp } from './server/server';

export default initializeApp;

if (process.env.NODE_ENV !== 'production') {
  const port = Number(process.env.PORT) || 8080;

  initializeApp()
    .then((app) => app.listen({ port: port }))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
