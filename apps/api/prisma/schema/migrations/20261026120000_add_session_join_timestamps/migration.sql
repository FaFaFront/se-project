-- First successful join per participant. Existing sessions stay NULL (nobody joined).
ALTER TABLE "meet_sessions" ADD COLUMN "tutorJoinedAt" TIMESTAMP(3);
ALTER TABLE "meet_sessions" ADD COLUMN "studentJoinedAt" TIMESTAMP(3);
