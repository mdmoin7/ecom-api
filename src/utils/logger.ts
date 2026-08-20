import winston from "winston";

const transports: winston.transport[] = [
  new winston.transports.Console(),
];

// Vercel functions use an ephemeral filesystem. Keep persistent file logging
// for local/traditional Node deployments and use console logging on Vercel.
if (!process.env.VERCEL) {
  transports.push(
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
    }),
  );
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports,
});

export default logger;
