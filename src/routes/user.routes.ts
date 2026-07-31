import express from "express";
import UserRepository from "../repos/user.repository.js";
import UserService from "../services/user.service.js";
import UserController from "../controller/user.controller.js";

const Router = express.Router();

const repo = new UserRepository();
const service = new UserService(repo);
const controller = new UserController(service);

Router.post("/register", (req, res, next) =>
  controller.register(req, res, next),
);
Router.post("/login", (req, res, next) => controller.login(req, res, next));

export default Router;
