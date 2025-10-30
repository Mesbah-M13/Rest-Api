import app from "./src/app.js";
import { config } from "./src/config/config.js";
import connectDB from "./src/config/db.js";

const startServer = async () => {
	// connect db
	await connectDB();

	const port = config.port || 4000;

	app.listen(port, () => {
		console.log(`Listening on port: ${port}`);
	});
};

startServer();
