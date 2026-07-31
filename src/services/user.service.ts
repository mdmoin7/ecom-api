import { v4 as UUID } from "uuid";
import bcrypt from "bcrypt";
import { SignupValidator } from "../validations/user.validation.js";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/errors.js";
import UserRepository from "../repos/user.repository.js";

class UserService {
  userRepository: UserRepository;
  constructor(repository: UserRepository) {
    this.userRepository = repository;
  }

  async signUp(email: string, password: string, confirmPassword: string) {
    const data = await SignupValidator.validateAsync({
      email,
      password,
      confirmPassword,
    });

    data.userId = UUID();
    data.password = await this.hashPassword(data.password);
    delete data["confirmPassword"];

    try {
      const user = await this.userRepository.create(data);
      return this.sanitizeUser(user);
    } catch (err) {
      // Mongo duplicate key error (unique email/userId collision)
      if (err.code === 11000) {
        throw new AppError(409, "An account with this email already exists");
      }
      throw err;
    }
  }

  hashPassword(password: string) {
    return bcrypt.hash(password, 10);
  }

  async signIn(email: string, password: string) {
    const user = await this.userRepository.findByEmail(email);

    // Same error for "no such user" and "wrong password" — prevents
    // leaking which emails are registered (user enumeration).
    if (!user) {
      throw new AppError(401, "Invalid email or password");
    }

    const validPassword = await this.comparePassword(password, user.password);
    if (!validPassword) {
      throw new AppError(401, "Invalid email or password");
    }

    return this.generateToken(user);
  }

  comparePassword(password: string, hash: string) {
    return bcrypt.compare(password, hash);
  }

  /**
   * Signs a JWT carrying the claims downstream auth middleware relies on
   * (role for authorize(), userId for lookups). Previously only 'email'
   * was signed, which silently broke role-based route protection.
   */
  generateToken(user: any) {
    return jwt.sign(
      { sub: user.userId, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );
  }

  /**
   * Strips sensitive fields before a user document is returned to a client.
   */
  sanitizeUser(user: any) {
    const obj = user.toObject ? user.toObject() : { ...user };
    delete obj.password;
    delete obj.__v;
    return obj;
  }
}

export default UserService;
