import * as express from 'express';
import { bookRoutes } from './book';
import { userRoutes } from './user';

export const routerV1 = express.Router();

routerV1.use('/book', bookRoutes);
routerV1.use('/user', userRoutes);
