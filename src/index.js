import dotenv from "dotenv";
import connectToDB from "./db/index.js";
import app from "./server/index.js";
import chalk from "chalk";

// Load environment variables from .env file
dotenv.config();

// Assert required environment variables are present before booting
if (!process.env.DB_STRING) {
  console.error(
    chalk.red(
      "FATAL ERROR: DB_STRING is not defined in environment variables.",
    ),
  );
  process.exit(1);
}

// Determine the port number from environment variables, fallback to 3000
const PORT_NUMBER = process.env.PORT || 3000;

/**
 * Starts the application server.
 * First connects to the database, then starts listening for HTTP requests.
 */
async function startServer() {
  try {
    console.log(chalk.blue("Starting Server..."));

    // Connect to MongoDB
    await connectToDB();

    // Start listening on the specified port
    app.listen(PORT_NUMBER, (e) => {
      if (e) throw e;
      console.log(
        chalk.bgGreen(`Server running on http://localhost:${PORT_NUMBER}`),
      );
    });
  } catch (e) {
    console.log(chalk.red("Failed to start server", e));
    process.exit(1);
  }
}

// Execute server startup flow
startServer();
