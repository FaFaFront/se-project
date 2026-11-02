-- Commit the enum addition before the following migration uses it in an UPDATE.
ALTER TYPE "MeetSessionStatus" ADD VALUE IF NOT EXISTS 'missed';
