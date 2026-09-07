import { Role, User, Prisma } from "@prisma/client";
import { userRepository } from "../repository/user.repository.js";
import { NotFoundError, BadRequestError, ConflictError, UnauthorizedError } from "../common/errors/app-error.js";

type ProfileData = {
  gradeLevel?: string;
  goals?: string;
  hourlyRate?: number;
};

type ProfileUpdateData = ProfileData & {
  name: string;
  profileUrl: string;
  bio: string | null;
};

export const userService = {
  async completeProfile(userId: string, role: Role, data: ProfileData) {
    let updateData: Partial<User> = { profileComplete: true };

    if (role === "student") {
      if (!data.gradeLevel || !data.goals) {
        throw new BadRequestError("Grade level and goals are required for students");
      }
      updateData = { ...updateData, gradeLevel: data.gradeLevel, goals: data.goals };
    } else if (role === "tutor") {
      if (!data.hourlyRate) {
        throw new BadRequestError("Hourly rate is required for tutors");
      }
      updateData = { ...updateData, hourlyRate: new Prisma.Decimal(data.hourlyRate) };
    } else {
      throw new BadRequestError("Invalid user role");
    }

    return userRepository.updateProfile(userId, updateData);
  },

  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileUrl: user.profileUrl,
      bio: user.bio,
      hourlyRate: user.hourlyRate ? Number(user.hourlyRate) : null,
      gradeLevel: user.gradeLevel,
      goals: user.goals,
      walletBalance: Number(user.walletBalance),
      createdAt: user.createdAt,
      subjects: user.tutorSubjects.map((ts) => ts.subject),
    };
  },

  async updateProfile(userId: string, role: Role, data: ProfileUpdateData) {
    const profileOwner = await userRepository.findProfileOwnerById(userId);

    if (!profileOwner) {
      throw new UnauthorizedError("Authenticated user no longer exists");
    }

    if (profileOwner.role !== role) {
      throw new UnauthorizedError("Authentication role does not match the user account");
    }

    if (!profileOwner.profileComplete) {
      throw new ConflictError("Initial profile completion is required before updating the profile");
    }

    const commonData = {
      name: data.name,
      profileUrl: data.profileUrl,
      bio: data.bio,
    };

    let updateData;
    if (role === Role.student) {
      if (!data.gradeLevel || !data.goals) {
        throw new BadRequestError("Grade level and goals are required for students");
      }
      updateData = {
        ...commonData,
        gradeLevel: data.gradeLevel,
        goals: data.goals,
      };
    } else if (role === Role.tutor) {
      if (data.hourlyRate === undefined) {
        throw new BadRequestError("Hourly rate is required for tutors");
      }
      updateData = {
        ...commonData,
        hourlyRate: new Prisma.Decimal(data.hourlyRate),
      };
    } else {
      throw new UnauthorizedError("Invalid authentication role");
    }

    try {
      return await userRepository.updateExistingProfile(userId, updateData);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new UnauthorizedError("Authenticated user no longer exists");
      }
      throw error;
    }
  },
};
