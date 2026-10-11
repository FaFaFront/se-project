export type ClassroomStatus = "active" | "completed";

export type ClassroomParticipant = {
  id: string;
  name: string | null;
  profileUrl: string | null;
};

type ClassroomDetailBase = {
  id: string;
  subject: {
    id: string;
    name: string;
  };
  participant: ClassroomParticipant;
  pricePerHour: number;
  status: ClassroomStatus;
};

export type TutorClassroomDetail = ClassroomDetailBase & {
  viewerRole: "tutor";
  createdAt: string;
};

export type StudentClassroomDetail = ClassroomDetailBase & {
  viewerRole: "student";
};

export type ClassroomDetail = TutorClassroomDetail | StudentClassroomDetail;
