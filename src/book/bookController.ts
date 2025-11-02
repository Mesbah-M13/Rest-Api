import type { NextFunction, Request, Response } from 'express';

const createBook = (req: Request, res: Response, next: NextFunction) => {
	// const {} = req.body;

	console.log('files', req.files);

	res.json({});
};

export { createBook };
