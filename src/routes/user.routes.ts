import express from "express";
import UserRepository from "../repos/user.repository.js";
import UserService from "../services/user.service.js";
import UserController from "../controller/user.controller.js";

const Router = express.Router();

const repo = new UserRepository();
const service = new UserService(repo);
const controller = new UserController(service);

/**
 * @swagger
 * /user/register:
 *   post:
 *     summary: User registration
 *     tags: [User]
 *     servers:
 *       - url: /
 *     responses:
 *       200:
 *         description: The API process is running
 */
Router.post("/register", (req, res, next) =>
  controller.register(req, res, next),
);
/**
 * @swagger
 * /user/login:
 *   post:
 *     summary: User login
 *     tags: [User]
 *     servers:
 *       - url: /
 *     responses:
 *       200:
 *         description: The API process is running
 */
Router.post("/login", (req, res, next) => controller.login(req, res, next));

export default Router;
