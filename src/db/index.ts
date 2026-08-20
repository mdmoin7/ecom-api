import chalk from "chalk";
import mongoose from "mongoose";

let connectionPromise: Promise<typeof mongoose> | null = null;

/**
 * Connects to MongoDB using a reusable connection/promise.
 * This prevents a new connection from being established for every
 * Vercel serverless invocation while preserving the existing local flow.
 */
async function connectToDB(): Promise<void> {
  if (!process.env.DB_STRING) {
    throw new Error("DB_STRING is not defined in environment variables.");
  }

  // Reuse an already established connection.
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // If a previous connection was closed, allow a new connection attempt.
  if (mongoose.connection.readyState === 0) {
    connectionPromise = null;
  }

  // Reuse an in-flight connection attempt when multiple requests arrive
  // concurrently on the same serverless instance.
  if (!connectionPromise) {
    console.log(chalk.yellow("Attempting to connect to DB..."));

    connectionPromise = mongoose.connect(process.env.DB_STRING).catch((error) => {
      connectionPromise = null;
      console.error(chalk.red("Error connecting to DB:"), error);
      throw error;
    });
  }

  await connectionPromise;
  console.log(chalk.green("Database connected successfully"));
}

export default connectToDB;
