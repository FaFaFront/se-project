import { Prisma, type Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ConflictError, UnauthorizedError } from "../common/errors/app-error.js";
import { env } from "../config/env.js";
import { authRepository } from "../repository/auth.repository.js";

const SALT_ROUNDS = 12;

export const authService = {
  async register(name: string, email: string, password: string, role: Role, profileUrl: string) {
    const existingUser = await authRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError("An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    try {
      const user = await authRepository.create(name, email, passwordHash, role, profileUrl);
      const token = jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, {
        expiresIn: "7d",
      });

      return {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileUrl: user.profileUrl,
        },
      };
    } catch (error) {
      // The database constraint protects against two simultaneous registrations.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictError("An account with this email already exists");
      }
      throw error;
    }
  },
  async login(email: string, password: string) {
    const user = await authRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const token = jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileUrl: user.profileUrl,
      },
    };
  },
};
