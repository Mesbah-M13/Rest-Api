import express from 'express';
import createHttpError from 'http-errors';
import globalErrorHandler from './middlewares/globalErrorHandler.js';
import userRouter from './user/userRouter.js';

const app = express();

app.use('/api/users', userRouter);

// global error handlers
app.get('/', (req, res, next) => {
	const error = createHttpError(400, 'Something went wrong');
	throw error;
	res.json({ message: 'Welcome to e-libray APIS' });
});

app.use(globalErrorHandler);

export default app;
