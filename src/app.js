import 'dotenv/config';
import express from 'express';
import Youch from 'youch';
import cors from 'cors';

import routes from './routes.js';
import './database/index.js';
import formatResponseMiddleware from './app/middlewares/formatResponseMiddleware.js';
import { startScheduler } from './app/services/Scheduler.js';

class App {
  constructor() {
    this.server = express();
    this.middlewares();
    this.routes();
    this.exceptionHandler();
    startScheduler();
  }

  middlewares() {
    this.server.use(express.json());
    this.server.use(cors());
    this.server.use(formatResponseMiddleware);
  }

  routes() {
    this.server.use(routes);
  }

  exceptionHandler() {
    this.server.use(async (err, req, res, next) => {
      if (process.env.NODE_ENV === 'development') {
        const errors = await new Youch(err, req).toJSON();
        return res.status(500).json(errors);
      }
      return res.status(500).json({ error: 'Internal Server Error' });
    });
  }
}

export default new App().server;