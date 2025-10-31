import type { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import userModel from './userModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';

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

	// Password - hashed
	const hashedPassword = await bcrypt.hash(password, 10);

	const newUser = await userModel.create({
		name,
		email,
		password: hashedPassword,
	});

	// Token generation
	const token = jwt.sign({ sub: newUser._id }, config.jwtSecret as string, { expiresIn: '7d' });

	// Process

	// Response

	// res.json({ id: newUser._id });
	res.json({ accessToken: token });
};

export { createUser };
