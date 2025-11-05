import type { NextFunction, Request, Response } from 'express';
import fs from 'node:fs';
import cloudinary from '../config/cloudinary.js';
import { fileURLToPath } from 'url';
import path from 'path';
import createHttpError from 'http-errors';
import bookModel from './bookModel.js';
import { globalIgnores } from 'eslint/config';
import type { AuthRequest } from '../middlewares/authenticate.js';
import mongoose from 'mongoose';

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

		// console.log('Trying to delete:', filePath, bookFilePath);
		// console.log('user id: ', req.userId);
		const _req = req as AuthRequest;

		const newBook = await bookModel.create({
			title,
			genre,
			author: _req.userId,
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

const updateBook = async (req: Request, res: Response, next: NextFunction) => {
	const { title, description, genre } = req.body;
	const bookId = req.params.bookId;

	const book = await bookModel.findOne({ _id: bookId });

	if (!book) {
		return next(createHttpError(404, 'Book not found'));
	}
	// Check access
	const _req = req as AuthRequest;
	if (book.author.toString() !== _req.userId) {
		return next(createHttpError(403, 'You can not update others book.'));
	}

	// check if image field is exists.

	const files = req.files as { [fieldname: string]: Express.Multer.File[] };
	let completeCoverImage = '';
	if (files.coverImage) {
		// *** --- Delete old image from Cloudinary first ---

		try {
			const oldCoverParts = book.coverImage.split('/');
			const oldCoverPublicId =
				oldCoverParts.at(-2) + '/' + oldCoverParts.at(-1)?.split('.').at(-2);
			await cloudinary.uploader.destroy(oldCoverPublicId);
			console.log('🧹 Old cover image deleted');
		} catch (err) {
			console.warn('⚠️ Failed to delete old cover image:', err.message);
		}

		// --- Upload new one ---

		const filename = files.coverImage[0].filename;
		const converMimeType = files.coverImage[0].mimetype.split('/').at(-1);
		// send files to cloudinary
		const filePath = path.resolve(__dirname, '../../public/data/uploads/' + filename);
		completeCoverImage = filename;
		const uploadResult = await cloudinary.uploader.upload(filePath, {
			filename_override: completeCoverImage,
			folder: 'book-covers',
			format: converMimeType,
		});

		completeCoverImage = uploadResult.secure_url;
		await fs.promises.unlink(filePath);
	}

	// check if file field is exists.
	let completeFileName = '';
	if (files.file) {
		// *** --- Delete old book file from Cloudinary first ---
		try {
			const oldFileParts = book.file.split('/');
			const oldFilePublicId = oldFileParts.at(-2) + '/' + oldFileParts.at(-1);
			await cloudinary.uploader.destroy(oldFilePublicId, { resource_type: 'raw' });
			console.log('🧹 Old book file deleted');
		} catch (err) {
			console.warn('⚠️ Failed to delete old book file:', err.message);
		}

		// --- Upload new file ---

		const bookFilePath = path.resolve(
			__dirname,
			'../../public/data/uploads/' + files.file[0].filename
		);

		const bookFileName = files.file[0].filename;
		completeFileName = bookFileName;

		const uploadResultPdf = await cloudinary.uploader.upload(bookFilePath, {
			resource_type: 'raw',
			filename_override: completeFileName,
			folder: 'book-pdfs',
			format: 'pdf',
		});

		completeFileName = uploadResultPdf.secure_url;
		await fs.promises.unlink(bookFilePath);
	}

	// ✅ Finally, update book info

	const updatedBook = await bookModel.findOneAndUpdate(
		{
			_id: bookId,
		},
		{
			title: title,
			description: description,
			genre: genre,
			coverImage: completeCoverImage ? completeCoverImage : book.coverImage,
			file: completeFileName ? completeFileName : book.file,
		},
		{ new: true }
	);

	res.json({ updatedBook });
};

const listBooks = async (req: Request, res: Response, next: NextFunction) => {
	// const sleep = await new Promise((resolve) => setTimeout(resolve, 5000));

	try {
		// todo: add pagination.
		const book = await bookModel.find();
		res.json(book);
	} catch (err) {
		return next(createHttpError(500, '🏗️ Error while getting a book'));
	}
};

const getSingleBook = async (req: Request, res: Response, next: NextFunction) => {
	const bookId = req.params.bookId;

	// ✅ Step 1: validate ObjectId format before querying
	// if (!mongoose.Types.ObjectId.isValid(bookId)) {
	// 	return next(createHttpError(400, 'Invalid book ID format'));
	// }
	try {
		const book = await bookModel.findOne({
			_id: bookId,
		});
		if (!book) {
			return next(createHttpError(404, 'Book not found'));
		}

		return res.json(book);
	} catch (err) {
		return next(createHttpError(500, 'Error while trying to get 🔖 Signle book info '));
	}
};

const deleteBook = async (req: Request, res: Response, next: NextFunction) => {
	const bookId = req.params.bookId;

	const book = await bookModel.findOne({
		_id: bookId,
	});
	if (!book) {
		return createHttpError(404, '⚔️Book not found');
	}

	// Check access
	const _req = req as AuthRequest;
	if (book.author.toString() !== _req.userId) {
		return next(createHttpError(403, 'You can not delete the book.'));
	}

	// book-covers/kd8mpa0dqxknj45jma9j
	// https://res.cloudinary.com/dambdugfp/image/upload/v1762232392/book-covers/kd8mpa0dqxknj45jma9j.jpg
	const coverFileSplits = book?.coverImage.split('/');
	const coverImagePublicId =
		coverFileSplits.at(-2) + '/' + coverFileSplits.at(-1)?.split('.').at(-2);

	console.log('coverImagePublicId', coverImagePublicId);

	const bookFileSplits = book.file.split('/');
	const bookFilePublicId = bookFileSplits.at(-2) + '/' + bookFileSplits.at(-1);
	console.log('bookFilePublicId', bookFilePublicId);

	// todo: add try error block
	// await cloudinary.uploader.destroy(coverImagePublicId);
	// await cloudinary.uploader.destroy(bookFilePublicId, {
	// 	resource_type: 'raw',
	// });

	try {
		await cloudinary.uploader.destroy(coverImagePublicId);
		await cloudinary.uploader.destroy(bookFilePublicId, { resource_type: 'raw' });
	} catch (err) {
		console.warn('⚠️ Could not delete some Cloudinary files:', err.message);
	}

	await bookModel.deleteOne({ _id: bookId });
	// await cloudinary.uploader.destroy()
	return res.sendStatus(204);
};
export { createBook, updateBook, listBooks, getSingleBook, deleteBook };
