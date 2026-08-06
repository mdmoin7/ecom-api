import UserService from "../services/user.service.js";
import { Request, Response, NextFunction } from "express";

class UserController {
  userService: UserService;
  constructor(service: UserService) {
    this.userService = service;
  }

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, confirmPassword, role } = req.body;
      const user = await this.userService.signUp(
        email,
        password,
        confirmPassword,
        role,
      );
      return res.status(201).json({
        success: true,
        message: "User created successfully",
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const token = await this.userService.signIn(email, password);
      return res.status(200).json({
        success: true,
        message: "Login successful",
        token,
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Login failed",
        error: err.message,
      });
    }
  }
}

export default UserController;
