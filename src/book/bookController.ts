import type { NextFunction, Request, Response } from 'express';
import cloudinary from '../config/cloudinary.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createBook = async (req: Request, res: Response, next: NextFunction) => {
	// const {} = req.body;

	console.log('files', req.files);

	const files = req.files as { [fieldname: string]: Express.Multer.File[] };

	const coverImageMimeType = files.coverImage[0].mimetype.split('/').at(-1);
	const fileName = files.coverImage[0].filename;

	const filePath = path.resolve(__dirname, '../../public/data/uploads', fileName);

	const uploadResult = await cloudinary.uploader.upload(filePath, {
		filename_override: fileName,
		folder: 'book-covers',
		format: coverImageMimeType,
	});

	console.log('UploadResult', uploadResult);

	res.json({});
};

export { createBook };
