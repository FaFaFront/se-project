import { Role, User, Prisma } from "@prisma/client";
import { userRepository } from "../repository/user.repository.js";
import { BadRequestError } from "../common/errors/app-error.js";

type ProfileData = {
  gradeLevel?: string;
  goals?: string;
  hourlyRate?: number;
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
};
