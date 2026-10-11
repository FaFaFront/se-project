import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.subject.createMany({
    data: [{ name: "Mathematics" }, { name: "English" }, { name: "Physics" }],
    skipDuplicates: true,
  });

  const hash = await bcrypt.hash("password123", 12);

  const student = await prisma.user.upsert({
    where: { email: "student@test.com" },
    update: {},
    create: {
      email: "student@test.com",
      passwordHash: hash,
      role: "student",
      name: "Alice Student",
      profileComplete: true,
      gradeLevel: "Grade 10",
      goals: "Improve math skills",
    },
  });

  const tutor = await prisma.user.upsert({
    where: { email: "tutor@test.com" },
    update: {},
    create: {
      email: "tutor@test.com",
      passwordHash: hash,
      role: "tutor",
      name: "Bob Tutor",
      profileComplete: true,
      hourlyRate: 50,
    },
  });

  const conversation = await prisma.conversation.upsert({
    where: {
      participantAId_participantBId: { participantAId: student.id, participantBId: tutor.id },
    },
    update: {},
    create: { participantAId: student.id, participantBId: tutor.id },
  });

  const existingMessages = await prisma.message.count({
    where: { conversationId: conversation.id },
  });
  if (existingMessages === 0) {
    await prisma.message.createMany({
      data: [
        {
          conversationId: conversation.id,
          senderId: student.id,
          text: "Hi, I need help with calculus.",
          createdAt: new Date("2026-10-10T10:00:00Z"),
        },
        {
          conversationId: conversation.id,
          senderId: tutor.id,
          text: "Sure! What topic specifically?",
          createdAt: new Date("2026-10-10T10:05:00Z"),
        },
        {
          conversationId: conversation.id,
          senderId: student.id,
          text: "Derivatives and chain rule.",
          createdAt: new Date("2026-10-10T10:10:00Z"),
        },
      ],
    });
  }

  console.log("Seeded: subjects, student@test.com, tutor@test.com, 1 conversation, 3 messages");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
