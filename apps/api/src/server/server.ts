import express from 'express';
import type { Express } from 'express';
import dotenv from 'dotenv';
dotenv.config();

const app: Express = express();

app.get('/', (_, res) => {
  res.json({
    message: 'hello world',
  });
});

export default app;
