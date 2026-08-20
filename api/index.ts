import dotenv from "dotenv";
import mongoose from "mongoose";
import app from "../src/server/index.js";

dotenv.config();

let isConnected = false;

async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  if (!process.env.DB_STRING) {
    throw new Error("DB_STRING is not defined");
  }

  await mongoose.connect(process.env.DB_STRING);
  isConnected = true;
}

export default async function handler(req: any, res: any) {
  await connectDB();
  return app(req, res);
}
