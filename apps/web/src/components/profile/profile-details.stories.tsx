import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ProfileDetails } from "./profile-details";
import type { UserProfile } from "@/types/user";

const studentProfile: UserProfile = {
  id: "0f7d4b9a-6b6a-4a1f-9a5c-2b8f2f0c1d11",
  name: "Mali Chen",
  email: "mali@example.com",
  role: "student",
  profileUrl: null,
  bio: "Year 11 student aiming for a science scholarship.",
  hourlyRate: null,
  gradeLevel: "Grade 11",
  goals: "Get comfortable with calculus before my final exam in March.",
  walletBalance: 120.5,
  createdAt: "2026-01-15T08:30:00.000Z",
  subjects: [],
};

const tutorProfile: UserProfile = {
  id: "2c1e8f3d-7a45-4f2b-9c31-77c5d0a9e402",
  name: "Alex Rivera",
  email: "alex@example.com",
  role: "tutor",
  profileUrl: null,
  bio: "Ten years teaching physics and maths, mostly to exam-year students.",
  hourlyRate: 25,
  gradeLevel: null,
  goals: null,
  walletBalance: 1840,
  createdAt: "2025-09-02T08:30:00.000Z",
  subjects: [
    { id: "s1", name: "Mathematics" },
    { id: "s2", name: "Physics" },
  ],
};

const meta = {
  title: "Profile/ProfileDetails",
  component: ProfileDetails,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Renders the signed-in user's profile. The panel owns the data, so this " +
          "component only displays what it is given — which fields appear depends on " +
          "whether the profile belongs to a student or a tutor.",
      },
    },
  },
  tags: ["autodocs"],
  args: {
    profile: studentProfile,
  },
} satisfies Meta<typeof ProfileDetails>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A student: grade level and learning goals, no rate or subjects. */
export const Student: Story = {};

/** A tutor: hourly rate and the subject list replace the student fields. */
export const Tutor: Story = {
  args: { profile: tutorProfile },
};

/** Everything optional left unset — each field falls back to a muted placeholder. */
export const EmptyProfile: Story = {
  args: {
    profile: {
      ...studentProfile,
      name: null,
      bio: null,
      gradeLevel: null,
      goals: null,
      walletBalance: 0,
    },
  },
};

/** With a photo — the avatar renders the linked image instead of the placeholder. */
export const WithPhoto: Story = {
  args: {
    profile: {
      ...tutorProfile,
      profileUrl: "https://placecats.com/224/224",
    },
  },
};
