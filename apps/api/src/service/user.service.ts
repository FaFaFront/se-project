import { Role, User, Prisma } from "@prisma/client";
import {
  userRepository,
  type ExistingProfileUpdate,
  type UserProfileRow,
} from "../repository/user.repository.js";
import { subjectRepository } from "../repository/subject.repository.js";
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
  UnauthorizedError,
} from "../common/errors/app-error.js";

type ProfileData = {
  gradeLevel?: string;
  goals?: string;
  hourlyRate?: number;
};

type CommonProfileUpdateData = {
  name: string;
  profileUrl: string | null;
  bio: string | null;
};

type StudentProfileUpdateData = CommonProfileUpdateData & {
  gradeLevel?: string;
  goals?: string;
  hourlyRate?: never;
  subjectIds?: never;
};

type TutorProfileUpdateData = CommonProfileUpdateData & {
  hourlyRate?: number;
  subjectIds?: string[];
  gradeLevel?: never;
  goals?: never;
};

type ProfileUpdateRequest =
  | { role: typeof Role.student; data: StudentProfileUpdateData }
  | { role: typeof Role.tutor; data: TutorProfileUpdateData };

function mapProfile(user: UserProfileRow) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    profileUrl: user.profileUrl,
    bio: user.bio,
    hourlyRate: user.hourlyRate === null ? null : Number(user.hourlyRate),
    gradeLevel: user.gradeLevel,
    goals: user.goals,
    walletBalance: Number(user.walletBalance),
    profileComplete: user.profileComplete,
    createdAt: user.createdAt,
    subjects: user.tutorSubjects.map((tutorSubject) => tutorSubject.subject),
  };
}

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

    return mapProfile(user);
  },

  async updateProfile(userId: string, profileUpdate: ProfileUpdateRequest) {
    const { role, data } = profileUpdate;
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

    let updateData: ExistingProfileUpdate;
    let subjectIds: string[] | undefined;
    if (role === Role.student) {
      updateData = {
        ...commonData,
        ...(data.gradeLevel !== undefined && { gradeLevel: data.gradeLevel }),
        ...(data.goals !== undefined && { goals: data.goals }),
      };
    } else if (role === Role.tutor) {
      updateData = {
        ...commonData,
        ...(data.hourlyRate !== undefined && {
          hourlyRate: new Prisma.Decimal(data.hourlyRate),
        }),
      };

      subjectIds = data.subjectIds;
      if (subjectIds !== undefined) {
        const existingSubjects = await subjectRepository.findByIds(subjectIds);
        const existingSubjectIds = new Set(existingSubjects.map((subject) => subject.id));
        const unknownSubjectIds = subjectIds.filter(
          (subjectId) => !existingSubjectIds.has(subjectId)
        );

        if (unknownSubjectIds.length > 0) {
          throw new BadRequestError(`Unknown subject IDs: ${unknownSubjectIds.join(", ")}`);
        }
      }
    } else {
      throw new UnauthorizedError("Invalid authentication role");
    }

    try {
      const updatedUser = await userRepository.updateExistingProfile(
        userId,
        updateData,
        subjectIds
      );
      return mapProfile(updatedUser);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new UnauthorizedError("Authenticated user no longer exists");
      }
      throw error;
    }
  },
};
