import express, { type NextFunction, type Request, type Response } from 'express';
import type { HttpError } from 'http-errors';
import { config } from './config/config.js';
import createHttpError from 'http-errors';

const app = express();

app.get('/', (req, res, next) => {
	const error = createHttpError(400, 'Something went wrong');
	throw error;
	res.json({ message: 'Welcome to e-libray APIS' });
});

// global error handlers -- it has 4 parameters
// use() --> use to register middlewares
app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
	const statusCode = err.statusCode || 500;

	return res.status(statusCode).json({
		message: err.message,
		errorStack: config.env === 'development' ? err.stack : '',
	});
});
export default app;
