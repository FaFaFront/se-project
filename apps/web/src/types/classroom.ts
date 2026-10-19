export type ClassroomStatus = "active" | "completed";

export type Classroom = {
  id: string;
  tutorId: string;
  studentId: string;
  subjectId: string;
  pricePerHour: number;
  status: ClassroomStatus;
  createdAt: string;
};

export type CreateClassroomRequest = {
  conversationId: string;
  subjectId: string;
  pricePerHour?: number;
};
