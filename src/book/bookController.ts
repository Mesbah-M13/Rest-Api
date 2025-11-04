import type { NextFunction, Request, Response } from 'express';
import fs from 'node:fs';
import cloudinary from '../config/cloudinary.js';
import { fileURLToPath } from 'url';
import path from 'path';
import createHttpError from 'http-errors';
import bookModel from './bookModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createBook = async (req: Request, res: Response, next: NextFunction) => {
	const { title, genre } = req.body;

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

	try {
		const bookFileName = files.file[0].filename;
		const bookFilePath = path.resolve(__dirname, '../../public/data/uploads', bookFileName);

		const bookFileUploadResult = await cloudinary.uploader.upload(bookFilePath, {
			resource_type: 'raw',
			filename_override: bookFileName,
			folder: 'book-pdfs',
			format: 'pdf',
		});

		// console.log('bookFileUploadResult', bookFileUploadResult);
		// console.log('UploadResult', uploadResult);

		console.log('Trying to delete:', filePath, bookFilePath);

		const newBook = await bookModel.create({
			title,
			genre,
			author: '690537df68c9d401eb53455b',
			coverImage: uploadResult.secure_url,
			file: bookFileUploadResult.secure_url,
		});

		// Delete temp.files

		// try {
		// 	await fs.promises.unlink(filePath);
		// 	await fs.promises.unlink(bookFilePath);
		// } catch (err) {
		// 	console.warn('⚠️ Failed to delete one or more temporary files:', err);
		// 	// Don’t throw here — since file deletion is cleanup, not a critical failure
		// }

		try {
			console.log('Deleting temp files...');
			console.log('filePath:', filePath);
			console.log('bookFilePath:', bookFilePath);

			await fs.promises.unlink(filePath);
			await fs.promises.unlink(bookFilePath);

			console.log('✅ Temp files deleted successfully');
		} catch (err) {
			console.error('❌ Failed to delete temp files:', err.message);
		}

		res.status(201).json({ id: newBook._id });
	} catch (err) {
		console.log(err);
		return next(createHttpError(500, '🪫Error while uploading the files.'));
	}
};

export { createBook };
