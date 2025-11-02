import { v2 as cloudinary } from 'cloudinary';
import { config } from './config.js';

// Configuration
const { cloudinaryCloud, cloudinaryApiKey, cloudinarySecret } = config;

if (!cloudinaryCloud || !cloudinaryApiKey || !cloudinarySecret) {
	throw new Error(
		'Missing Cloudinary configuration: ensure cloudinaryCloud, cloudinaryApiKey and cloudinarySecret are set.'
	);
}

cloudinary.config({
	cloud_name: cloudinaryCloud,
	api_key: cloudinaryApiKey,
	api_secret: cloudinarySecret, // Click 'View API Keys' above to copy your API secret
});

export default cloudinary;
