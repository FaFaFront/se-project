import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

const conversationFixture = {
  userA: {
    id: "11111111-1111-4111-8111-111111111111",
    name: "User A Student",
    email: "student.a@example.com",
    password: "TestStudentA123!",
  },
  userB: {
    id: "22222222-2222-4222-8222-222222222222",
    name: "User B Tutor",
    email: "tutor.b@example.com",
    password: "TestTutorB123!",
  },
  conversationId: "33333333-3333-4333-8333-333333333333",
} as const;

async function main() {
  await prisma.subject.createMany({
    data: [{ name: "Mathematics" }, { name: "English" }, { name: "Physics" }],
    skipDuplicates: true,
  });

  const [userAPasswordHash, userBPasswordHash] = await Promise.all([
    bcrypt.hash(conversationFixture.userA.password, SALT_ROUNDS),
    bcrypt.hash(conversationFixture.userB.password, SALT_ROUNDS),
  ]);

  const userA = await prisma.user.upsert({
    where: { email: conversationFixture.userA.email },
    update: {
      name: conversationFixture.userA.name,
      passwordHash: userAPasswordHash,
      role: Role.student,
      accountStatus: "ACTIVE",
      gradeLevel: "Grade 10",
      goals: "Improve mathematics and prepare for final examinations.",
      hourlyRate: null,
      profileComplete: true,
    },
    create: {
      id: conversationFixture.userA.id,
      name: conversationFixture.userA.name,
      email: conversationFixture.userA.email,
      passwordHash: userAPasswordHash,
      role: Role.student,
      gradeLevel: "Grade 10",
      goals: "Improve mathematics and prepare for final examinations.",
      profileComplete: true,
    },
  });

  const userB = await prisma.user.upsert({
    where: { email: conversationFixture.userB.email },
    update: {
      name: conversationFixture.userB.name,
      passwordHash: userBPasswordHash,
      role: Role.tutor,
      accountStatus: "ACTIVE",
      hourlyRate: 35,
      gradeLevel: null,
      goals: null,
      profileComplete: true,
    },
    create: {
      id: conversationFixture.userB.id,
      name: conversationFixture.userB.name,
      email: conversationFixture.userB.email,
      passwordHash: userBPasswordHash,
      role: Role.tutor,
      hourlyRate: 35,
      profileComplete: true,
    },
  });

  const conversation = await prisma.conversation.upsert({
    where: {
      participantAId_participantBId: {
        participantAId: userA.id,
        participantBId: userB.id,
      },
    },
    update: {},
    create: {
      id: conversationFixture.conversationId,
      participantAId: userA.id,
      participantBId: userB.id,
      createdAt: new Date("2026-10-14T08:00:00.000Z"),
    },
  });

  const messages = [
    {
      id: "44444444-4444-4444-8444-444444444444",
      senderId: userA.id,
      text: "Hi! Are you available for a mathematics lesson tomorrow?",
      createdAt: new Date("2026-10-14T08:30:00.000Z"),
    },
    {
      id: "55555555-5555-4555-8555-555555555555",
      senderId: userB.id,
      text: "Yes, I am available after 4 PM.",
      createdAt: new Date("2026-10-14T08:31:00.000Z"),
    },
    {
      id: "66666666-6666-4666-8666-666666666666",
      senderId: userA.id,
      text: "Great, 5 PM works for me. Thank you!",
      createdAt: new Date("2026-10-14T08:32:00.000Z"),
    },
  ];

  await prisma.$transaction(
    messages.map((message) =>
      prisma.message.upsert({
        where: { id: message.id },
        update: {
          conversationId: conversation.id,
          senderId: message.senderId,
          text: message.text,
          createdAt: message.createdAt,
        },
        create: {
          ...message,
          conversationId: conversation.id,
        },
      })
    )
  );

  console.log("Conversation test data is ready:");
  console.table([
    {
      user: "User A (student)",
      email: conversationFixture.userA.email,
      password: conversationFixture.userA.password,
    },
    {
      user: "User B (tutor)",
      email: conversationFixture.userB.email,
      password: conversationFixture.userB.password,
    },
  ]);
  console.log(`Conversation ID: ${conversation.id}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
