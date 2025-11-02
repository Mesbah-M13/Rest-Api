import { type NextFunction, type Request, type Response } from 'express';
import type { HttpError } from 'http-errors';
import { config } from '../config/config.js';

// global error handlers -- it has 4 parameters
// use() --> use to register middlewares
const globalErrorHandler = (err: HttpError, req: Request, res: Response, next: NextFunction) => {
	const statusCode = err.statusCode || 500;

	return res.status(statusCode).json({
		message: err.message,
		errorStack: config.env === 'development' ? err.stack : '',
	});
};

export default globalErrorHandler;
