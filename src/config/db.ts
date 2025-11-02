import mongoose from 'mongoose';
import { config } from './config.js';
import chalk from 'chalk';

const connectDB = async () => {
	try {
		// here register 1st
		mongoose.connection.on('connected', () => {
			console.log(chalk.cyanBright('Connected to database successfully'));
		});

		mongoose.connection.on('error', (err) => {
			console.log('Error in connecting to database.', err);
		});

		await mongoose.connect(config.databaseUrl as string);
	} catch (err) {
		console.error('Failed to connect to database.', err);
		process.exit(1);
	}
};

export default connectDB;
