import express from 'express';
import { createBook } from './bookController.js';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import authenticate from '../middlewares/authenticate.js';

const bookRouter = express.Router();

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename);

// file store local
const upload = multer({
	dest: path.resolve(__dirname, '../../public/data/uploads'),
	limits: { fileSize: 10 * 1024 * 1024 }, // 3e7 = 30 MB = 30*1024*1024 MB
});
// routes  -->   /api/books
bookRouter.post(
	'/',
	authenticate,
	upload.fields([
		{ name: 'coverImage', maxCount: 1 },
		{ name: 'file', maxCount: 1 },
	]),
	createBook
);

export default bookRouter;
