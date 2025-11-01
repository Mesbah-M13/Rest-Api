import type { User } from '../user/userTypes.js';

export interface Book {
	_id: string;
	title: string;
	description: string;
	author: User;
	genre: string;
	coverImage: string;
	file: string;
	createdAt: Date;
	updatedAt: Date;
}
