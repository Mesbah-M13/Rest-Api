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
		res.status(201).json({ accessToken: token });
	} catch (err) {
		return next(createHttpError(500, 'Error while signing the JWT token'));
	}
};

const loginUser = async (req: Request, res: Response, next: NextFunction) => {
	const { email, password } = req.body;

	// validation
	if (!email || !password) {
		return next(createHttpError(400, 'All fields are required'));
	}

	let user;

	try {
		user = await userModel.findOne({ email: email });
		if (!user) {
			return next(createHttpError(404, 'User not found'));
		}
	} catch (err) {
		return next(createHttpError(400, 'Invalid Email'));
	}

	// password matching
	const isMatch = await bcrypt.compare(password, user.password);
	// console.log(user);
	if (!isMatch) {
		return next(createHttpError(400, 'Username or password is incorrect! '));
	}
	try {
		// create accesstoken
		const token = jwt.sign({ sub: user._id }, config.jwtSecret as string, {
			expiresIn: '7d',
			algorithm: 'HS256',
		});
		res.status(201).json({ accessToken: token });
	} catch (err) {
		return next(createHttpError(400, 'Invalid token'));
	}
};

export { createUser, loginUser };
