import type { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import userModel from './userModel.js';

const createUser = async (req: Request, res: Response, next: NextFunction) => {
	// Validation
	const { name, email, password } = req.body;

	if (!name || !email || !password) {
		const error = createHttpError(400, 'All fields are required');

		return next(error);
	}

	// Database Call
	const user = await userModel.findOne({ email: email });

	if (user) {
		const error = createHttpError(400, 'User already exist in this email');
		return next(error);
	}
	// Process

	// Response

	res.json({ message: 'User created' });
};

export { createUser };
