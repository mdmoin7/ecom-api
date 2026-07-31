import chalk from "chalk";
import mongoose from "mongoose";

/**
 * Connects to MongoDB database using Mongoose.
 * Uses the connection string specified in environmental variables (DB_STRING).
 * Returns a promise resolving on success or rejecting on failure.
 */
async function connectToDB() {
  try {
    console.log(chalk.yellow("Attempting to connect to DB..."));

    // Connect to database using environment string
    await mongoose.connect(process.env.DB_STRING);

    console.log(chalk.green("Database connected successfully"));
    return Promise.resolve();
  } catch (e) {
    console.log(chalk.red("Error connecting to DB:", e));
    return Promise.reject("DB connection failed");
  }
}

export default connectToDB;
