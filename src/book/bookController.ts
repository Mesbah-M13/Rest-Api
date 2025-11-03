import type { NextFunction, Request, Response } from 'express';
import cloudinary from '../config/cloudinary.js';
import * as path from 'path';
import { fileURLToPath } from 'url';
import createHttpError from 'http-errors';

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

	const bookFileName = files.file[0].filename;
	const bookFilePath = path.resolve(__dirname, '../../public/data/uploads', bookFileName);

	try {
		const bookFileUploadResult = await cloudinary.uploader.upload(bookFilePath, {
			resource_type: 'raw',
			filename_override: bookFileName,
			folder: 'book-pdfs',
			format: 'pdf',
		});

		console.log('bookFileUploadResult', bookFileUploadResult);

		console.log('UploadResult', uploadResult);

		res.json({});
	} catch (err) {
		console.log(err);
		return next(createHttpError(500, 'Error while uploading the files.'));
	}
};

export { createBook };
