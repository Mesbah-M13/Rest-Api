import type { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import userModel from './userModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';
import type { User } from './userTypes.js';

const createUser = async (req: Request, res: Response, next: NextFunction) => {
	// Validation
	const { name, email, password } = req.body;

	if (!name || !email || !password) {
		const error = createHttpError(400, 'All fields are required');

		return next(error);
	}

	// Database Call
	try {
		const user = await userModel.findOne({ email: email });

		if (user) {
			const error = createHttpError(400, 'User already exist in this email');
			return next(error);
		}
	} catch (err) {
		return next(createHttpError(500, 'Error while getting user'));
	}

	// Password - hashed
	const hashedPassword = await bcrypt.hash(password, 10);
	let newUser: User;
	try {
		newUser = await userModel.create({
			name,
			email,
			password: hashedPassword,
		});
	} catch (err) {
		return next(createHttpError(500, 'Error while creating user'));
	}

	try {
		// Token generation
		const token = jwt.sign({ sub: newUser._id }, config.jwtSecret as string, {
			expiresIn: '7d',
			algorithm: 'HS256',
		});

		// Process

		// Response

		// res.json({ id: newUser._id });
		res.json({ accessToken: token });
	} catch (err) {
		return next(createHttpError(500, 'Error while signing the JWT token'));
	}
};

export { createUser };
